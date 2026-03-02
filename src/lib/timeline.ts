import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimelineItem {
  id: string;
  title: string;
  titleJa: string | null;
  originalTitle: string;
  url: string;
  publishedAt: string | null;
  collectedAt: string;
  classification: string | null;
  nvaTotal: number | null;
  sourceName: string;
  sourceDomain: string | null;
  companyId: string | null;
  companyName: string | null;
  companySlug: string | null;
}

export interface TimelineGroup {
  date: string;        // "2026-03-02"
  displayDate: string; // "3月2日（日）"
  items: TimelineItem[];
}

export interface TimelineSource {
  id: string;
  name: string;
  domain: string | null;
}

export interface TimelineCompany {
  id: string;
  slug: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Supabase client (same pattern as posts.ts)
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------------------------------------------------------------------------
// Japanese day-of-week helper
// ---------------------------------------------------------------------------

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dow = DAY_NAMES[d.getDay()];
  return `${month}月${day}日（${dow}）`;
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

export async function getTimelineItems(): Promise<TimelineGroup[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('[timeline] DB credentials not configured');
    return [];
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString();

  // Fetch all primary-tier collected items (explicit limit to avoid default 1000 cap).
  // Use OR filter: published_at in last 30 days, or no published_at and collected_at in last 30 days.
  const query: any = supabase
    .from('collected_items')
    .select(`
      id,
      title,
      title_ja,
      url,
      published_at,
      collected_at,
      classification,
      nva_total,
      source_id,
      sources!inner (
        id,
        name,
        domain,
        source_type,
        company_id,
        companies (
          id,
          slug,
          name
        )
      )
    `)
    .eq('sources.source_type', 'primary')
    .or(`published_at.gte.${cutoff},and(published_at.is.null,collected_at.gte.${cutoff})`)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(3000);

  const { data, error } = await query;

  if (error) {
    console.error('[timeline] Query error:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Map to TimelineItem
  const allItems: TimelineItem[] = (data as any[]).map((row) => {
    const source = row.sources;
    const company = source?.companies ?? null;
    return {
      id: row.id,
      title: row.title,
      titleJa: row.title_ja,
      originalTitle: row.title,
      url: row.url,
      publishedAt: row.published_at,
      collectedAt: row.collected_at,
      classification: row.classification,
      nvaTotal: row.nva_total,
      sourceName: source?.name ?? 'Unknown',
      sourceDomain: source?.domain ?? null,
      companyId: company?.id ?? null,
      companyName: company?.name ?? null,
      companySlug: company?.slug ?? null,
    };
  });

  // Deduplicate by (source_id, title) — keep most recent collected_at
  const seen = new Map<string, TimelineItem>();
  for (const item of allItems) {
    const key = `${item.sourceName}::${item.title}`;
    const existing = seen.get(key);
    if (!existing || new Date(item.collectedAt).getTime() > new Date(existing.collectedAt).getTime()) {
      seen.set(key, item);
    }
  }
  const items = Array.from(seen.values());

  // Sort by effective date (published_at if available, otherwise collected_at)
  items.sort((a, b) => {
    const dateA = a.publishedAt || a.collectedAt;
    const dateB = b.publishedAt || b.collectedAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  // Group by date
  const groupMap = new Map<string, TimelineItem[]>();
  for (const item of items) {
    const effectiveDate = item.publishedAt || item.collectedAt;
    const dateKey = effectiveDate.slice(0, 10); // "2026-03-02"
    const group = groupMap.get(dateKey) || [];
    group.push(item);
    groupMap.set(dateKey, group);
  }

  // Convert to sorted array
  const groups: TimelineGroup[] = [...groupMap.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, groupItems]) => ({
      date,
      displayDate: formatDisplayDate(date),
      items: groupItems,
    }));

  return groups;
}

export async function getPrimarySources(): Promise<TimelineSource[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('sources')
    .select('id, name, domain')
    .eq('source_type', 'primary')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('[timeline] Sources query error:', error);
    return [];
  }

  return (data ?? []) as TimelineSource[];
}

export async function getCompanies(): Promise<TimelineCompany[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('companies')
    .select('id, slug, name')
    .order('name');

  if (error) {
    console.error('[timeline] Companies query error:', error);
    return [];
  }

  return (data ?? []) as TimelineCompany[];
}
