import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/admin-supabase';

export const dynamic = 'force-dynamic';

interface SourceSummary {
  id: string;
  name: string;
  domain: string | null;
  entity_kind: string | null;
  is_newsletter: boolean | null;
  is_active: boolean | null;
}

interface SourceDeliveryObservation {
  id: string;
  source_id: string;
  collector_inbox: string;
  observed_at: string;
  subject: string;
  from_email: string;
  message_id_header: string | null;
  gmail_thread_id: string | null;
  gmail_message_id: string | null;
  gmail_labels: string[];
  read_online_url: string | null;
  archive_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  source?: SourceSummary | null;
}

interface RawSourceDeliveryObservation extends Omit<SourceDeliveryObservation, 'source'> {
  source?: SourceSummary[] | SourceSummary | null;
}

function toBoolean(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return undefined;
}

function normalizeLabels(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((label) => String(label).trim())
      .filter((label) => label.length > 0);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((label) => label.trim())
      .filter((label) => label.length > 0);
  }

  return [];
}

export async function GET(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({
      observations: [],
      note: 'Database credentials are not configured.',
    });
  }

  const params = request.nextUrl.searchParams;
  const sourceId = params.get('source_id');
  const inbox = params.get('collector_inbox');
  const from = params.get('from');
  const to = params.get('to');
  const newsletterOnly = toBoolean(params.get('newsletter_only'));
  const limit = Number.parseInt(params.get('limit') ?? '200', 10);

  try {
    let query = supabase
      .from('source_delivery_observations')
      .select(`
        id,
        source_id,
        collector_inbox,
        observed_at,
        subject,
        from_email,
        message_id_header,
        gmail_thread_id,
        gmail_message_id,
        gmail_labels,
        read_online_url,
        archive_url,
        notes,
        created_at,
        updated_at,
        source:sources (
          id,
          name,
          domain,
          entity_kind,
          is_newsletter,
          is_active
        )
      `)
      .order('observed_at', { ascending: false })
      .limit(Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 200);

    if (sourceId) query = query.eq('source_id', sourceId);
    if (inbox) query = query.eq('collector_inbox', inbox);
    if (from) query = query.gte('observed_at', from);
    if (to) query = query.lte('observed_at', to);

    const { data, error } = await query;

    if (error) {
      console.error('[admin/source-observations] GET failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const normalized = (((data ?? []) as unknown as RawSourceDeliveryObservation[]) ?? []).map(
      (row): SourceDeliveryObservation => ({
        ...row,
        source: Array.isArray(row.source) ? (row.source[0] ?? null) : (row.source ?? null),
        gmail_labels: normalizeLabels(row.gmail_labels),
      })
    );

    const filtered = normalized.filter((row) => {
      if (newsletterOnly === true && !row.source?.is_newsletter) return false;
      return true;
    });

    return NextResponse.json({ observations: filtered });
  } catch (error) {
    console.error('[admin/source-observations] GET exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database credentials are not configured.' },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as Partial<SourceDeliveryObservation> & {
      gmail_labels?: unknown;
    };

    if (!body.source_id || !body.observed_at || !body.subject || !body.from_email) {
      return NextResponse.json(
        { error: 'source_id, observed_at, subject, from_email are required.' },
        { status: 400 }
      );
    }

    const payload = {
      source_id: body.source_id,
      collector_inbox: body.collector_inbox || 'ktlabworks@gmail.com',
      observed_at: body.observed_at,
      subject: body.subject,
      from_email: body.from_email,
      message_id_header: body.message_id_header ?? null,
      gmail_thread_id: body.gmail_thread_id ?? null,
      gmail_message_id: body.gmail_message_id ?? null,
      gmail_labels: normalizeLabels(body.gmail_labels),
      read_online_url: body.read_online_url ?? null,
      archive_url: body.archive_url ?? null,
      notes: body.notes ?? null,
    };

    const { data, error } = await supabase
      .from('source_delivery_observations')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      console.error('[admin/source-observations] POST failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ observation: data }, { status: 201 });
  } catch (error) {
    console.error('[admin/source-observations] POST exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database credentials are not configured.' },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as Partial<SourceDeliveryObservation> & {
      id?: string;
      gmail_labels?: unknown;
    };

    if (!body.id) {
      return NextResponse.json({ error: 'id is required.' }, { status: 400 });
    }

    const updates = {
      ...(body.source_id !== undefined ? { source_id: body.source_id } : {}),
      ...(body.collector_inbox !== undefined ? { collector_inbox: body.collector_inbox } : {}),
      ...(body.observed_at !== undefined ? { observed_at: body.observed_at } : {}),
      ...(body.subject !== undefined ? { subject: body.subject } : {}),
      ...(body.from_email !== undefined ? { from_email: body.from_email } : {}),
      ...(body.message_id_header !== undefined ? { message_id_header: body.message_id_header } : {}),
      ...(body.gmail_thread_id !== undefined ? { gmail_thread_id: body.gmail_thread_id } : {}),
      ...(body.gmail_message_id !== undefined ? { gmail_message_id: body.gmail_message_id } : {}),
      ...(body.gmail_labels !== undefined ? { gmail_labels: normalizeLabels(body.gmail_labels) } : {}),
      ...(body.read_online_url !== undefined ? { read_online_url: body.read_online_url } : {}),
      ...(body.archive_url !== undefined ? { archive_url: body.archive_url } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    };

    const { data, error } = await supabase
      .from('source_delivery_observations')
      .update(updates)
      .eq('id', body.id)
      .select('*')
      .single();

    if (error) {
      console.error('[admin/source-observations] PUT failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ observation: data });
  } catch (error) {
    console.error('[admin/source-observations] PUT exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database credentials are not configured.' },
      { status: 503 }
    );
  }

  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('source_delivery_observations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[admin/source-observations] DELETE failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/source-observations] DELETE exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
