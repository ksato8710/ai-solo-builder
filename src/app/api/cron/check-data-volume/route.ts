import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/admin-supabase';

export const dynamic = 'force-dynamic';

const MAX_TOTAL_ITEMS = 1000;

function verifyCronAuth(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  // Count by tier
  const tiers = ['primary', 'secondary', 'tertiary'] as const;
  const counts: Record<string, number> = {};

  for (const tier of tiers) {
    const { count } = await supabase
      .from('collected_items')
      .select('id', { count: 'exact', head: true })
      .eq('source_tier', tier);
    counts[tier] = count ?? 0;
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const overLimit = total > MAX_TOTAL_ITEMS;

  // If over limit, run cleanup
  let cleaned = false;
  let removedCount = 0;
  if (overLimit) {
    const excess = total - MAX_TOTAL_ITEMS;
    console.warn(`[check-data-volume] Over limit: ${total} items (max ${MAX_TOTAL_ITEMS}). Cleaning ${excess}+ items.`);

    // Strategy: delete oldest primary items with lowest NVA first
    const { data: toDelete } = await supabase
      .from('collected_items')
      .select('id, nva_total, published_at')
      .eq('source_tier', 'primary')
      .is('content_id', null)
      .order('nva_total', { ascending: true, nullsFirst: true })
      .order('published_at', { ascending: true, nullsFirst: true })
      .limit(excess);

    if (toDelete && toDelete.length > 0) {
      const ids = toDelete.map((r: { id: string }) => r.id);
      const { data: deleted } = await supabase
        .from('collected_items')
        .delete()
        .in('id', ids)
        .select('id');
      removedCount = deleted?.length ?? 0;
      cleaned = true;
    }
  }

  // Re-count after cleanup
  let totalAfter = total;
  if (cleaned) {
    const { count } = await supabase
      .from('collected_items')
      .select('id', { count: 'exact', head: true });
    totalAfter = count ?? total;
  }

  return NextResponse.json({
    status: overLimit ? (cleaned ? 'cleaned' : 'over_limit') : 'ok',
    max_items: MAX_TOTAL_ITEMS,
    counts,
    total: cleaned ? totalAfter : total,
    over_limit: overLimit,
    cleaned,
    removed: removedCount,
  });
}
