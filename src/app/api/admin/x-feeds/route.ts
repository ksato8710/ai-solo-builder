import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/admin-supabase';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET: X(Twitter) feeds data — accounts or posts
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const params = request.nextUrl.searchParams;
  const section = params.get('section') || 'accounts';

  try {
    if (section === 'accounts') {
      return await getAccounts(supabase);
    }
    if (section === 'posts') {
      return await getPosts(supabase, params);
    }
    return NextResponse.json({ error: 'Invalid section parameter' }, { status: 400 });
  } catch (error) {
    console.error('[admin/x-feeds] GET exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Accounts: source_crawl_configs with twitter URLs
// ---------------------------------------------------------------------------

type SupabaseClient = NonNullable<ReturnType<typeof getAdminSupabaseClient>>;

async function getAccounts(supabase: SupabaseClient) {
  const { data: configs, error: configError } = await supabase
    .from('source_crawl_configs')
    .select('*, sources!inner(id, name, domain, source_type, credibility_score)')
    .or('crawl_url.like.%twitter%,crawl_url.like.%127.0.0.1:1200/twitter%');

  if (configError) {
    console.error('[admin/x-feeds] accounts error:', configError);
    return NextResponse.json({ error: configError.message }, { status: 500 });
  }

  if (!configs || configs.length === 0) {
    return NextResponse.json({ accounts: [] });
  }

  const sourceIds = configs.map((c: Record<string, unknown>) => {
    const sources = c.sources as { id: string } | undefined;
    return sources?.id;
  }).filter(Boolean) as string[];

  // Get latest post + count per source
  const { data: items } = await supabase
    .from('collected_items')
    .select('source_id, collected_at')
    .in('source_id', sourceIds)
    .order('collected_at', { ascending: false });

  const statsMap = new Map<string, { last_collected: string; item_count: number }>();
  for (const item of items || []) {
    const existing = statsMap.get(item.source_id);
    if (existing) {
      existing.item_count += 1;
    } else {
      statsMap.set(item.source_id, {
        last_collected: item.collected_at,
        item_count: 1,
      });
    }
  }

  const accounts = configs.map((config: Record<string, unknown>) => {
    const sources = config.sources as {
      id: string;
      name: string;
      domain: string | null;
      source_type: string;
      credibility_score: number | null;
    };
    const crawlUrl = config.crawl_url as string | null;
    const handle = extractHandle(crawlUrl);
    const stats = statsMap.get(sources.id);

    return {
      source_id: sources.id,
      name: sources.name,
      handle,
      crawl_url: crawlUrl,
      crawl_method: config.crawl_method,
      tier: (config as Record<string, unknown>).source_tier || inferTier(sources.source_type),
      credibility_score: sources.credibility_score,
      is_active: config.is_active,
      last_crawled_at: config.last_crawled_at,
      last_crawl_status: config.last_crawl_status,
      last_collected: stats?.last_collected || null,
      item_count: stats?.item_count || 0,
    };
  });

  return NextResponse.json({ accounts });
}

// ---------------------------------------------------------------------------
// Posts: collected_items from X sources
// ---------------------------------------------------------------------------

async function getPosts(supabase: SupabaseClient, params: URLSearchParams) {
  const limit = Math.min(parseInt(params.get('limit') || '30', 10), 100);
  const offset = parseInt(params.get('offset') || '0', 10);
  const sort = params.get('sort') || 'collected_at';
  const accountFilter = params.get('account');

  // Engagement filters (numeric values)
  const minLikes = parseIntOrNull(params.get('min_likes'));
  const minRetweets = parseIntOrNull(params.get('min_retweets'));
  const minViews = parseIntOrNull(params.get('min_views'));
  const minBookmarks = parseIntOrNull(params.get('min_bookmarks'));

  // First get X source IDs
  const { data: configs } = await supabase
    .from('source_crawl_configs')
    .select('source_id')
    .or('crawl_url.like.%twitter%,crawl_url.like.%127.0.0.1:1200/twitter%');

  if (!configs || configs.length === 0) {
    return NextResponse.json({ posts: [], total: 0, limit, offset });
  }

  const xSourceIds = configs.map((c: { source_id: string }) => c.source_id);

  // Build query
  let query = supabase
    .from('collected_items')
    .select(
      `
      *,
      sources!inner (
        id,
        name,
        domain,
        source_type,
        credibility_score
      )
    `,
      { count: 'exact' }
    );

  if (accountFilter) {
    query = query.eq('source_id', accountFilter);
  } else {
    query = query.in('source_id', xSourceIds);
  }

  // Engagement filters
  if (minLikes !== null) query = query.gte('engagement_likes', minLikes);
  if (minRetweets !== null) query = query.gte('engagement_retweets', minRetweets);
  if (minViews !== null) query = query.gte('engagement_views', minViews);
  if (minBookmarks !== null) query = query.gte('engagement_bookmarks', minBookmarks);

  // Sorting
  const validSorts: Record<string, string> = {
    collected_at: 'collected_at',
    engagement_likes: 'engagement_likes',
    engagement_views: 'engagement_views',
    nva_total: 'nva_total',
  };
  const sortColumn = validSorts[sort] || 'collected_at';

  query = query
    .order(sortColumn, { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[admin/x-feeds] posts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const posts = ((data ?? []) as Record<string, unknown>[]).map((item) => {
    const { sources, ...rest } = item;
    return { ...rest, source: sources };
  });

  return NextResponse.json({ posts, total: count ?? 0, limit, offset });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractHandle(crawlUrl: string | null): string | null {
  if (!crawlUrl) return null;
  // Match /twitter/user/:handle or /twitter/:handle patterns
  const match = crawlUrl.match(/\/twitter\/(?:user\/)?([^/?&]+)/);
  return match ? `@${match[1]}` : null;
}

function parseIntOrNull(value: string | null): number | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

function inferTier(sourceType: string): string {
  switch (sourceType) {
    case 'official':
      return 'primary';
    case 'media':
      return 'secondary';
    case 'community':
    case 'social':
      return 'tertiary';
    default:
      return 'tertiary';
  }
}
