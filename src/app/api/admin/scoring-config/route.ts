import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/admin-supabase';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScoringConfigUpdate {
  config_key: string;
  config_value: unknown;
  description?: string;
}

// ---------------------------------------------------------------------------
// GET: List all scoring configurations
// ---------------------------------------------------------------------------

export async function GET() {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
      .from('scoring_config')
      .select('*')
      .order('config_key', { ascending: true });

    if (error) {
      console.error('[admin/scoring-config] GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ configs: data ?? [] });
  } catch (error) {
    console.error('[admin/scoring-config] GET exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT: Update a scoring configuration by config_key
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = (await request.json()) as ScoringConfigUpdate;

    if (!body.config_key) {
      return NextResponse.json({ error: 'config_key is required' }, { status: 400 });
    }

    if (body.config_value === undefined) {
      return NextResponse.json({ error: 'config_value is required' }, { status: 400 });
    }

    // Validate that the config_key exists
    const { data: existing, error: fetchError } = await supabase
      .from('scoring_config')
      .select('id')
      .eq('config_key', body.config_key)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: `config_key "${body.config_key}" not found` },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {
      config_value: body.config_value,
    };

    if (body.description !== undefined) {
      updates.description = body.description;
    }

    const { data, error } = await supabase
      .from('scoring_config')
      .update(updates)
      .eq('config_key', body.config_key)
      .select('*')
      .single();

    if (error) {
      console.error('[admin/scoring-config] PUT error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ config: data });
  } catch (error) {
    console.error('[admin/scoring-config] PUT exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
