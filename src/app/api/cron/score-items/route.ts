import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/admin-supabase';
import { computeNvaScores, DEFAULT_WEIGHTS, type ScoringWeights, type MyToolsConfig } from '@/lib/scorer';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CollectedItemRow {
  id: string;
  source_id: string;
  source_tier: 'primary' | 'secondary' | 'tertiary';
  title: string;
  content_summary: string | null;
  engagement_likes: number | null;
  engagement_retweets: number | null;
  engagement_replies: number | null;
  engagement_views: number | null;
  sources: {
    credibility_score: number | null;
    entity_kind: string | null;
  };
}

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

function verifyCronAuth(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

// ---------------------------------------------------------------------------
// Core scoring logic
// ---------------------------------------------------------------------------

async function handleScoreItems(request: NextRequest): Promise<NextResponse> {
  // Auth check
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

  try {
    // 1. Load scoring weights from config
    let weights: ScoringWeights = { ...DEFAULT_WEIGHTS };

    const { data: weightConfig } = await supabase
      .from('scoring_config')
      .select('config_value')
      .eq('config_key', 'nva_weights')
      .single();

    if (weightConfig?.config_value) {
      const w = weightConfig.config_value as Record<string, number>;
      weights = {
        social: w.social ?? DEFAULT_WEIGHTS.social,
        media: w.media ?? DEFAULT_WEIGHTS.media,
        community: w.community ?? DEFAULT_WEIGHTS.community,
        technical: w.technical ?? DEFAULT_WEIGHTS.technical,
        solo_relevance: w.solo_relevance ?? DEFAULT_WEIGHTS.solo_relevance,
      };
    }

    // 1b. Load MyToolsConfig for V2 scoring
    const { data: myToolsConfig } = await supabase
      .from('scoring_config')
      .select('config_value')
      .eq('config_key', 'my_tools')
      .single();

    const myTools = (myToolsConfig?.config_value as MyToolsConfig) ?? null;

    // 2. Fetch items to score
    const rescore = searchParams.get('rescore');
    let query = supabase
      .from('collected_items')
      .select(`
        id,
        source_id,
        source_tier,
        title,
        content_summary,
        engagement_likes,
        engagement_retweets,
        engagement_replies,
        engagement_views,
        sources!inner (
          credibility_score,
          entity_kind
        )
      `)
      .order('collected_at', { ascending: true })
      .limit(limit);

    if (rescore === 'all') {
      // Rescore both new and already-scored items (for V2 migration)
      query = query.in('status', ['new', 'scored']);
    } else {
      query = query.eq('status', 'new');
    }

    const { data: items, error: fetchError } = await query;

    if (fetchError) {
      console.error('[cron/score-items] Fetch error:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({
        message: 'No items to score',
        scored: 0,
        errors: 0,
      });
    }

    // 3. Score each item
    const now = new Date().toISOString();
    let scored = 0;
    let errors = 0;

    for (const item of items as unknown as CollectedItemRow[]) {
      try {
        const credibility = item.sources?.credibility_score ?? 5;

        const engagement = item.engagement_likes != null
          ? {
              likes: item.engagement_likes,
              retweets: item.engagement_retweets,
              replies: item.engagement_replies,
              views: item.engagement_views,
            }
          : undefined;

        const scores = computeNvaScores(
          item.title,
          item.content_summary,
          item.source_tier,
          credibility,
          weights,
          engagement,
          myTools,
        );

        const { error: updateError } = await supabase
          .from('collected_items')
          .update({
            nva_total: scores.nva_total,
            nva_social: scores.nva_social,
            nva_media: scores.nva_media,
            nva_community: scores.nva_community,
            nva_technical: scores.nva_technical,
            nva_solo_relevance: scores.nva_solo_relevance,
            classification: scores.classification,
            classification_confidence: scores.classification_confidence,
            relevance_tags: scores.relevance_tags,
            routing_targets: scores.routing_targets,
            score_reasoning: scores.score_reasoning,
            scored_at: now,
            status: 'scored',
          })
          .eq('id', item.id);

        if (updateError) {
          console.error(
            `[cron/score-items] Update error for ${item.id}:`,
            updateError
          );
          errors++;
        } else {
          scored++;
        }
      } catch (err) {
        console.error(`[cron/score-items] Score error for ${item.id}:`, err);
        errors++;
      }
    }

    return NextResponse.json({
      message: 'Scoring complete',
      total_items: items.length,
      scored,
      errors,
      scoring_version: myTools ? 'V2' : 'V1',
      rescore: rescore === 'all',
      weights_used: weights,
    });
  } catch (error) {
    console.error('[cron/score-items] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Route handlers (GET + POST)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  return handleScoreItems(request);
}

export async function POST(request: NextRequest) {
  return handleScoreItems(request);
}
