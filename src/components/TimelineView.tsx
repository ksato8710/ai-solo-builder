'use client';

import { useMemo, useState } from 'react';
import type { TimelineGroup, TimelineItem, TimelineSource, TimelineCompany } from '@/lib/timeline';

interface TimelineViewProps {
  groups: TimelineGroup[];
  sources: TimelineSource[];
  companies: TimelineCompany[];
}

const ALL_KEY = '__all__';

type TierFilter = typeof ALL_KEY | 'primary' | 'secondary' | 'tertiary';

const TIER_LABELS: { key: TierFilter; label: string }[] = [
  { key: ALL_KEY, label: 'すべて' },
  { key: 'primary', label: '公式' },
  { key: 'secondary', label: 'メディア' },
  { key: 'tertiary', label: 'コミュニティ' },
];

export default function TimelineView({ groups, sources, companies }: TimelineViewProps) {
  const [activeSource, setActiveSource] = useState(ALL_KEY);
  const [activeCompany, setActiveCompany] = useState(ALL_KEY);
  const [activeTier, setActiveTier] = useState<TierFilter>(ALL_KEY);

  // Count items per source
  const sourceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const group of groups) {
      for (const item of group.items) {
        counts.set(item.sourceName, (counts.get(item.sourceName) || 0) + 1);
      }
    }
    return counts;
  }, [groups]);

  // Count items per company
  const companyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const group of groups) {
      for (const item of group.items) {
        if (item.companyId) {
          counts.set(item.companyId, (counts.get(item.companyId) || 0) + 1);
        }
      }
    }
    return counts;
  }, [groups]);

  // Count items per tier
  const tierCounts = useMemo(() => {
    const counts = new Map<TierFilter, number>();
    let total = 0;
    for (const group of groups) {
      for (const item of group.items) {
        counts.set(item.sourceTier, (counts.get(item.sourceTier) || 0) + 1);
        total++;
      }
    }
    counts.set(ALL_KEY, total);
    return counts;
  }, [groups]);

  const totalCount = useMemo(
    () => groups.reduce((sum, g) => sum + g.items.length, 0),
    [groups]
  );

  // 3-axis AND filter (source × company × tier)
  const filteredGroups = useMemo(() => {
    const noFilter = activeSource === ALL_KEY && activeCompany === ALL_KEY && activeTier === ALL_KEY;
    if (noFilter) return groups;

    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => {
          if (activeSource !== ALL_KEY && item.sourceName !== activeSource) return false;
          if (activeCompany !== ALL_KEY && item.companyId !== activeCompany) return false;
          if (activeTier !== ALL_KEY && item.sourceTier !== activeTier) return false;
          return true;
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, activeSource, activeCompany, activeTier]);

  // Sources that actually have items, sorted by count desc
  const activeSources = useMemo(() => {
    return sources
      .filter((s) => sourceCounts.has(s.name))
      .sort((a, b) => (sourceCounts.get(b.name) || 0) - (sourceCounts.get(a.name) || 0));
  }, [sources, sourceCounts]);

  // Companies that actually have items, sorted by count desc
  const activeCompanies = useMemo(() => {
    return companies
      .filter((c) => companyCounts.has(c.id))
      .sort((a, b) => (companyCounts.get(b.id) || 0) - (companyCounts.get(a.id) || 0));
  }, [companies, companyCounts]);

  return (
    <div>
      {/* Source Filter Chips */}
      {activeSources.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] font-semibold text-text-light uppercase tracking-wider mb-2">
            ソース
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              label="すべて"
              count={totalCount}
              isActive={activeSource === ALL_KEY}
              onClick={() => setActiveSource(ALL_KEY)}
            />
            {activeSources.map((source) => (
              <FilterChip
                key={source.id}
                label={source.name}
                count={sourceCounts.get(source.name) || 0}
                isActive={activeSource === source.name}
                onClick={() => setActiveSource(activeSource === source.name ? ALL_KEY : source.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Company Filter Chips */}
      {activeCompanies.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] font-semibold text-text-light uppercase tracking-wider mb-2">
            企業
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              label="すべて"
              count={totalCount}
              isActive={activeCompany === ALL_KEY}
              onClick={() => setActiveCompany(ALL_KEY)}
            />
            {activeCompanies.map((company) => (
              <FilterChip
                key={company.id}
                label={company.name}
                count={companyCounts.get(company.id) || 0}
                isActive={activeCompany === company.id}
                onClick={() => setActiveCompany(activeCompany === company.id ? ALL_KEY : company.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tier Filter Chips */}
      <div className="mb-8">
        <div className="text-[10px] font-semibold text-text-light uppercase tracking-wider mb-2">
          タイプ
        </div>
        <div className="flex flex-wrap gap-2">
          {TIER_LABELS.map(({ key, label }) => (
            <FilterChip
              key={key}
              label={label}
              count={tierCounts.get(key) || 0}
              isActive={activeTier === key}
              onClick={() => setActiveTier(activeTier === key ? ALL_KEY : key)}
            />
          ))}
        </div>
      </div>

      {/* Timeline */}
      {filteredGroups.length > 0 ? (
        <div className="relative">
          {filteredGroups.map((group, groupIdx) => (
            <div key={group.date} className={groupIdx > 0 ? 'mt-8' : ''}>
              {/* Date Marker + Company Summary */}
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-accent-leaf ring-4 ring-bg-cream flex-shrink-0" />
                  <h2 className="font-heading text-base font-bold text-text-deep">
                    {group.displayDate}
                  </h2>
                  <span className="text-xs text-text-light">
                    {group.items.length}件
                  </span>
                </div>
                {/* [Feature 3] Company breakdown summary */}
                <DateGroupSummary items={group.items} companies={companies} />
              </div>

              {/* Items */}
              <div className="ml-1.5 border-l-2 border-accent-sage/30 pl-6 space-y-3">
                {group.items.map((item) => (
                  <TimelineCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-6xl mb-4 opacity-20">📡</p>
          <h3 className="font-heading text-xl font-bold text-text-deep mb-2">
            データがありません
          </h3>
          <p className="text-text-muted text-sm">
            一次ソースからの収集データがまだありません。
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// [Feature 3] Date Group Summary — company breakdown per day
// ---------------------------------------------------------------------------

function DateGroupSummary({ items, companies }: { items: TimelineItem[]; companies: TimelineCompany[] }) {
  const companyMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of companies) map.set(c.id, c.name);
    return map;
  }, [companies]);

  const breakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (item.companyId && item.companyName) {
        counts.set(item.companyName, (counts.get(item.companyName) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [items, companyMap]);

  if (breakdown.length === 0) return null;

  return (
    <div className="ml-6 mt-1 text-[11px] text-text-light">
      {breakdown.map(([name, count], i) => (
        <span key={name}>
          {i > 0 && <span className="mx-1 opacity-40">|</span>}
          {name} <span className="opacity-60">{count}</span>
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter Chip
// ---------------------------------------------------------------------------

function FilterChip({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
        isActive
          ? 'bg-accent-leaf/20 text-accent-moss border border-accent-leaf/40'
          : 'bg-bg-card text-text-muted border border-transparent hover:border-border-hover'
      }`}
    >
      {label}
      <span className="ml-1.5 opacity-60">{count}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true if summary is too similar to title to be worth showing */
function isSimilarToTitle(summary: string, title: string, titleJa: string | null): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[\s\u3000]+/g, '').replace(/[^\w\u3000-\u9fff]/g, '');
  const ns = norm(summary);
  const nt = norm(title);
  const ntj = titleJa ? norm(titleJa) : '';
  // Exact or near-exact match
  if (ns === nt || ns === ntj) return true;
  // One contains the other
  if (ns.length > 0 && nt.length > 0 && (ns.includes(nt) || nt.includes(ns))) return true;
  if (ntj.length > 0 && ns.length > 0 && (ns.includes(ntj) || ntj.includes(ns))) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Timeline Card — with all 5 improvements
// ---------------------------------------------------------------------------

function TimelineCard({ item }: { item: TimelineItem }) {
  const displayTitle = item.titleJa || item.title;
  const effectiveDate = item.publishedAt || item.collectedAt;
  const time = new Date(effectiveDate).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // [Feature 1] NVA-based visual hierarchy (V2: lowered to ≥70)
  const isHighNva = item.nvaTotal != null && item.nvaTotal >= 70;
  const cardBorderClass = isHighNva
    ? 'border-l-[3px] border-l-accent-moss border border-border'
    : 'border border-border';

  // [Feature 4] Language badge — show EN for non-Japanese sources
  const showLangBadge = !item.isJapaneseSource;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-xl ${cardBorderClass} bg-bg-card p-4 transition-all hover:ring-2 hover:ring-accent-leaf/30 hover:border-border-hover group`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Source badge + company + lang + time + classification + article link */}
          <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-leaf/15 text-accent-leaf">
              {item.sourceName}
            </span>
            {item.companyName && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent-sage/10 text-accent-sage">
                {item.companyName}
              </span>
            )}
            {/* [Feature 4] Language badge */}
            {showLangBadge && (
              <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-400 border border-blue-100">
                EN
              </span>
            )}
            {/* Tier badge for community sources */}
            {item.sourceTier === 'tertiary' && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-500 border border-amber-100">
                コミュニティ
              </span>
            )}
            <span className="text-[10px] text-text-light">{time}</span>
            {/* [Feature 1] NVA highlight badge */}
            {isHighNva && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent-moss/15 text-accent-moss">
                注目
              </span>
            )}
            {item.classification && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-bg-warm text-text-muted">
                {item.classification}
              </span>
            )}
            {/* [Feature 5] Internal article link badge */}
            {item.contentSlug && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-nadeshiko/10 text-nadeshiko cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/news/${item.contentSlug}`;
                }}
              >
                記事あり
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className={`font-semibold text-text-deep leading-snug group-hover:text-accent-moss transition-colors ${isHighNva ? 'text-[15px]' : 'text-sm'}`}>
            {displayTitle}
            <span className="inline-block ml-1 text-text-light text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
              ↗
            </span>
          </h3>

          {/* Original title (shown only for non-Japanese sources when translated) */}
          {!item.isJapaneseSource && item.titleJa && item.originalTitle && item.titleJa !== item.originalTitle && (
            <p className="text-[11px] text-text-light leading-snug mt-0.5">
              {item.originalTitle}
            </p>
          )}

          {/* [Feature 2] Content summary — hide if too similar to title */}
          {item.contentSummary && !isSimilarToTitle(item.contentSummary, item.title, item.titleJa) && (
            <p className="text-xs text-text-muted leading-relaxed mt-1 line-clamp-2">
              {item.contentSummary}
            </p>
          )}

          {/* [Feature 4] Source domain */}
          {item.sourceDomain && (
            <span className="text-[10px] text-text-light opacity-60 mt-1 inline-block">
              {item.sourceDomain}
            </span>
          )}
        </div>

        {/* NVA Score */}
        {item.nvaTotal != null && (
          <div className="flex-shrink-0 text-right">
            <div
              className={`text-xs font-bold tabular-nums ${
                item.nvaTotal >= 70
                  ? 'text-accent-moss'
                  : item.nvaTotal >= 50
                  ? 'text-accent-bark'
                  : 'text-text-light'
              }`}
            >
              {item.nvaTotal}
            </div>
            <div className="text-[9px] text-text-light">NVA</div>
          </div>
        )}
      </div>
    </a>
  );
}
