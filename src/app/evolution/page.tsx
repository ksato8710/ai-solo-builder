import { getTimelineItems, getAllSources, getCompanies } from '@/lib/timeline';
import type { TimelineItem } from '@/lib/timeline';
import EvolutionView from '@/components/EvolutionView';
import type { EvolutionEntry, ProductKey } from '@/components/EvolutionView';

export const revalidate = 300; // ISR 5 minutes

export const metadata = {
  title: 'AI Evolution — Claude・Codex・Gemini・Figma の最新動向 | AI Solo Craft',
  description:
    'Claude, Codex, Gemini, Figma — 主要AIツールの公式アップデートとコミュニティの反応をリアルタイムで追跡',
};

// ---------------------------------------------------------------------------
// Company slug → product key mapping
// ---------------------------------------------------------------------------

const SLUG_TO_PRODUCT: Record<string, ProductKey> = {
  anthropic: 'claude',
  openai: 'codex',
  google: 'gemini',
  figma: 'figma',
};

const TARGET_SLUGS = new Set(Object.keys(SLUG_TO_PRODUCT));

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// ---------------------------------------------------------------------------
// Build evolution entries from timeline data
// ---------------------------------------------------------------------------

// Only feature-related classifications appear on Evolution
const EVOLUTION_CLASSIFICATIONS = new Set(['product-release', 'product-update']);

function buildEntries(allItems: TimelineItem[]): EvolutionEntry[] {
  // Filter to target companies + feature classifications only
  const filtered = allItems.filter(
    (item) =>
      item.companySlug &&
      TARGET_SLUGS.has(item.companySlug) &&
      EVOLUTION_CLASSIFICATIONS.has(item.classification ?? ''),
  );

  // Group by (companySlug + dateKey)
  const groups = new Map<string, TimelineItem[]>();
  for (const item of filtered) {
    const dateKey = (item.publishedAt || item.collectedAt).slice(0, 10);
    const key = `${item.companySlug}::${dateKey}`;
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  }

  // Build entries — pick the best item as main, rest as resources
  const entries: EvolutionEntry[] = [];
  const tierOrder: Record<string, number> = { primary: 0, secondary: 1, tertiary: 2 };

  for (const [, items] of groups) {
    items.sort((a, b) => {
      const td = (tierOrder[a.sourceTier] ?? 2) - (tierOrder[b.sourceTier] ?? 2);
      if (td !== 0) return td;
      return (b.nvaTotal ?? 0) - (a.nvaTotal ?? 0);
    });

    const main = items[0];
    const resources = items.slice(1);
    const dateKey = (main.publishedAt || main.collectedAt).slice(0, 10);
    const d = new Date(dateKey + 'T00:00:00');

    entries.push({
      id: main.id,
      date: dateKey,
      day: d.getDate(),
      month: MONTH_SHORT[d.getMonth()],
      year: String(d.getFullYear()),
      productKey: SLUG_TO_PRODUCT[main.companySlug!],
      mainItem: main,
      resources,
    });
  }

  // Sort by date desc
  entries.sort((a, b) => b.date.localeCompare(a.date));
  return entries;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function EvolutionPage() {
  const [groups] = await Promise.all([getTimelineItems()]);

  const allItems = groups.flatMap((g) => g.items);
  const entries = buildEntries(allItems);

  // Stats
  const totalUpdates = entries.length;
  const totalResources = entries.reduce((sum, e) => sum + e.resources.length, 0);
  const sourceSet = new Set<string>();
  for (const e of entries) {
    sourceSet.add(e.mainItem.sourceName);
    for (const r of e.resources) sourceSet.add(r.sourceName);
  }

  return (
    <EvolutionView
      entries={entries}
      stats={{ updates: totalUpdates, resources: totalResources, sources: sourceSet.size }}
    />
  );
}
