import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/admin-supabase';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CrawlConfigPayload {
  source_id: string;
  crawl_method: 'rss' | 'api' | 'scrape' | 'newsletter' | 'manual';
  crawl_url?: string;
  crawl_config?: Record<string, unknown>;
  crawl_interval_minutes?: number;
  is_active?: boolean;
}

interface CrawlConfigUpdate {
  id: string;
  crawl_method?: string;
  crawl_url?: string;
  crawl_config?: Record<string, unknown>;
  crawl_interval_minutes?: number;
  is_active?: boolean;
}

// ---------------------------------------------------------------------------
// GET: List crawl configurations
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const params = request.nextUrl.searchParams;
  const activeOnly = params.get('active_only') === 'true';
  const method = params.get('method');

  try {
    let query = supabase
      .from('source_crawl_configs')
      .select(`
        *,
        sources!inner (
          id,
          name,
          domain,
          source_type,
          entity_kind,
          credibility_score,
          is_active
        )
      `)
      .order('sources(name)', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    if (method) {
      query = query.eq('crawl_method', method);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[admin/crawl-configs] GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ configs: data ?? [] });
  } catch (error) {
    console.error('[admin/crawl-configs] GET exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST: Create a new crawl configuration
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = (await request.json()) as CrawlConfigPayload;

    if (!body.source_id || !body.crawl_method) {
      return NextResponse.json(
        { error: 'source_id and crawl_method are required' },
        { status: 400 }
      );
    }

    const validMethods = ['rss', 'api', 'scrape', 'newsletter', 'manual'];
    if (!validMethods.includes(body.crawl_method)) {
      return NextResponse.json(
        { error: `crawl_method must be one of: ${validMethods.join(', ')}` },
        { status: 400 }
      );
    }

    const payload = {
      source_id: body.source_id,
      crawl_method: body.crawl_method,
      crawl_url: body.crawl_url || null,
      crawl_config: body.crawl_config || {},
      crawl_interval_minutes: body.crawl_interval_minutes || 240,
      is_active: body.is_active ?? true,
    };

    const { data, error } = await supabase
      .from('source_crawl_configs')
      .insert(payload)
      .select(`
        *,
        sources!inner (
          id,
          name,
          domain,
          source_type,
          entity_kind
        )
      `)
      .single();

    if (error) {
      console.error('[admin/crawl-configs] POST error:', error);

      // Handle unique constraint violation (source_id already has a config)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A crawl config already exists for this source' },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ config: data }, { status: 201 });
  } catch (error) {
    console.error('[admin/crawl-configs] POST exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT: Update an existing crawl configuration
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = (await request.json()) as CrawlConfigUpdate;

    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    if (body.crawl_method !== undefined) {
      const validMethods = ['rss', 'api', 'scrape', 'newsletter', 'manual'];
      if (!validMethods.includes(body.crawl_method)) {
        return NextResponse.json(
          { error: `crawl_method must be one of: ${validMethods.join(', ')}` },
          { status: 400 }
        );
      }
      updates.crawl_method = body.crawl_method;
    }
    if (body.crawl_url !== undefined) updates.crawl_url = body.crawl_url;
    if (body.crawl_config !== undefined) updates.crawl_config = body.crawl_config;
    if (body.crawl_interval_minutes !== undefined)
      updates.crawl_interval_minutes = body.crawl_interval_minutes;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('source_crawl_configs')
      .update(updates)
      .eq('id', body.id)
      .select(`
        *,
        sources!inner (
          id,
          name,
          domain,
          source_type,
          entity_kind
        )
      `)
      .single();

    if (error) {
      console.error('[admin/crawl-configs] PUT error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ config: data });
  } catch (error) {
    console.error('[admin/crawl-configs] PUT exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE: Remove a crawl configuration
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('source_crawl_configs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[admin/crawl-configs] DELETE error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/crawl-configs] DELETE exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
