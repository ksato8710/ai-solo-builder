import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/admin-supabase';
import { collectFromSource, urlHash } from '@/lib/crawler';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CrawlConfig {
  id: string;
  source_id: string;
  crawl_method: string;
  crawl_url: string | null;
  crawl_config: Record<string, unknown>;
  crawl_interval_minutes: number;
  last_crawled_at: string | null;
  is_active: boolean;
  sources: {
    id: string;
    name: string;
    domain: string | null;
    source_type: string;
    entity_kind: string | null;
    credibility_score: number | null;
  };
}

interface SourceResult {
  source_name: string;
  source_id: string;
  method: string;
  collected: number;
  duplicates: number;
  error?: string;
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
// Core collection logic
// ---------------------------------------------------------------------------

async function handleCollectSources(request: NextRequest): Promise<NextResponse> {
  // Auth check
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { searchParams } = request.nextUrl;
  const tierFilter = searchParams.get('tier'); // primary | secondary | tertiary
  const forceAll = searchParams.get('force') === 'true'; // skip interval check

  try {
    // 1. Fetch active crawl configs with source info
    let query = supabase
      .from('source_crawl_configs')
      .select(`
        id,
        source_id,
        crawl_method,
        crawl_url,
        crawl_config,
        crawl_interval_minutes,
        last_crawled_at,
        is_active,
        sources!inner (
          id,
          name,
          domain,
          source_type,
          entity_kind,
          credibility_score
        )
      `)
      .eq('is_active', true);

    // Filter by tier if specified
    if (tierFilter) {
      query = query.eq('sources.source_type', tierFilter);
    }

    const { data: configs, error: configError } = await query;

    if (configError) {
      console.error('[cron/collect-sources] Config fetch error:', configError);
      return NextResponse.json({ error: configError.message }, { status: 500 });
    }

    if (!configs || configs.length === 0) {
      return NextResponse.json({
        message: 'No active crawl configs found',
        tier_filter: tierFilter,
        results: [],
      });
    }

    // 2. Filter by crawl interval (skip sources crawled too recently)
    const now = new Date();
    const eligibleConfigs = (configs as unknown as CrawlConfig[]).filter((cfg) => {
      if (forceAll) return true;
      if (!cfg.last_crawled_at) return true; // Never crawled

      const lastCrawled = new Date(cfg.last_crawled_at);
      const elapsedMinutes = (now.getTime() - lastCrawled.getTime()) / 60_000;
      return elapsedMinutes >= cfg.crawl_interval_minutes;
    });

    if (eligibleConfigs.length === 0) {
      return NextResponse.json({
        message: 'No sources due for crawling',
        total_configs: configs.length,
        tier_filter: tierFilter,
        results: [],
      });
    }

    // 3. Crawl each eligible source
    const results: SourceResult[] = [];

    for (const cfg of eligibleConfigs) {
      const source = cfg.sources;
      const result: SourceResult = {
        source_name: source.name,
        source_id: cfg.source_id,
        method: cfg.crawl_method,
        collected: 0,
        duplicates: 0,
      };

      try {
        // Skip newsletter/manual methods -- they are not automatically crawled
        if (cfg.crawl_method === 'newsletter' || cfg.crawl_method === 'manual') {
          result.error = 'Skipped: newsletter/manual method';
          results.push(result);

          // Still update last_crawled_at to avoid repeated checks
          await supabase
            .from('source_crawl_configs')
            .update({
              last_crawled_at: now.toISOString(),
              last_crawl_status: 'success',
              last_crawl_item_count: 0,
            })
            .eq('id', cfg.id);

          continue;
        }

        const crawlUrl = cfg.crawl_url || '';
        const crawlResult = await collectFromSource(
          cfg.crawl_method,
          crawlUrl,
          cfg.crawl_config
        );

        if (crawlResult.error) {
          result.error = crawlResult.error;
        }

        if (crawlResult.items.length === 0) {
          // Update config status
          await supabase
            .from('source_crawl_configs')
            .update({
              last_crawled_at: now.toISOString(),
              last_crawl_status: crawlResult.error ? 'error' : 'success',
              last_crawl_error: crawlResult.error || null,
              last_crawl_item_count: 0,
            })
            .eq('id', cfg.id);

          results.push(result);
          continue;
        }

        // 4. Deduplicate by url_hash
        const hashes = crawlResult.items.map((item) => urlHash(item.url));

        const { data: existingItems } = await supabase
          .from('collected_items')
          .select('url_hash')
          .in('url_hash', hashes);

        const existingHashes = new Set(
          (existingItems ?? []).map((row: { url_hash: string }) => row.url_hash)
        );

        // Determine source tier from source_type
        const sourceTier = mapSourceType(source.source_type);

        // 5. Insert new items
        const newItems = crawlResult.items.filter(
          (item) => !existingHashes.has(urlHash(item.url))
        );

        result.duplicates = crawlResult.items.length - newItems.length;

        if (newItems.length > 0) {
          const rows = newItems.map((item) => ({
            source_id: cfg.source_id,
            source_tier: sourceTier,
            title: item.title,
            url: item.url,
            url_hash: urlHash(item.url),
            author: item.author || null,
            content_summary: item.content_summary || null,
            raw_content: item.raw_content || null,
            published_at: item.published_at || null,
            collected_at: now.toISOString(),
            status: 'new',
            relevance_tags: [],
          }));

          const { error: insertError } = await supabase
            .from('collected_items')
            .insert(rows);

          if (insertError) {
            console.error(
              `[cron/collect-sources] Insert error for ${source.name}:`,
              insertError
            );
            result.error = (result.error || '') + ` Insert: ${insertError.message}`;
          } else {
            result.collected = newItems.length;
          }
        }

        // 6. Update crawl config
        const crawlStatus =
          crawlResult.error && result.collected > 0
            ? 'partial'
            : crawlResult.error
              ? 'error'
              : 'success';

        await supabase
          .from('source_crawl_configs')
          .update({
            last_crawled_at: now.toISOString(),
            last_crawl_status: crawlStatus,
            last_crawl_error: crawlResult.error || null,
            last_crawl_item_count: result.collected,
          })
          .eq('id', cfg.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        result.error = `Exception: ${message}`;
        console.error(
          `[cron/collect-sources] Exception for ${source.name}:`,
          err
        );

        // Update config with error
        await supabase
          .from('source_crawl_configs')
          .update({
            last_crawled_at: now.toISOString(),
            last_crawl_status: 'error',
            last_crawl_error: message,
            last_crawl_item_count: 0,
          })
          .eq('id', cfg.id);
      }

      results.push(result);
    }

    // 7. Summary
    const totalCollected = results.reduce((sum, r) => sum + r.collected, 0);
    const totalDuplicates = results.reduce((sum, r) => sum + r.duplicates, 0);
    const errorCount = results.filter((r) => r.error).length;

    return NextResponse.json({
      message: 'Collection complete',
      tier_filter: tierFilter,
      sources_processed: results.length,
      total_collected: totalCollected,
      total_duplicates: totalDuplicates,
      errors: errorCount,
      results,
    });
  } catch (error) {
    console.error('[cron/collect-sources] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/** Map source_type enum values to tier for collected_items */
function mapSourceType(sourceType: string): 'primary' | 'secondary' | 'tertiary' {
  switch (sourceType) {
    case 'primary':
    case 'official':
      return 'primary';
    case 'secondary':
    case 'media':
      return 'secondary';
    case 'tertiary':
    case 'community':
    case 'social':
    case 'other':
      return 'tertiary';
    default:
      return 'secondary';
  }
}

// ---------------------------------------------------------------------------
// Route handlers (GET + POST)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  return handleCollectSources(request);
}

export async function POST(request: NextRequest) {
  return handleCollectSources(request);
}
