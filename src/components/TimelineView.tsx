'use client';

import { useCallback, useMemo, useState } from 'react';
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

// ---------------------------------------------------------------------------
// Platform grouping for engagement filters
// ---------------------------------------------------------------------------

type Platform = 'reddit' | 'x' | 'zenn' | 'qiita' | 'note';

const PLATFORM_DEFS: { key: Platform; label: string; color: string }[] = [
  { key: 'reddit', label: 'Reddit', color: 'text-orange-500' },
  { key: 'x',      label: 'X (Twitter)', color: 'text-sky-500' },
  { key: 'zenn',   label: 'Zenn', color: 'text-blue-500' },
  { key: 'qiita',  label: 'Qiita', color: 'text-emerald-500' },
  { key: 'note',   label: 'note', color: 'text-green-600' },
];

function sourceToPlatform(sourceName: string): Platform | null {
  const lower = sourceName.toLowerCase();
  if (lower.startsWith('reddit')) return 'reddit';
  if (lower.startsWith('x ') || lower.startsWith('x@')) return 'x';
  if (lower === 'zenn') return 'zenn';
  if (lower === 'qiita') return 'qiita';
  if (lower === 'note') return 'note';
  return null;
}

type PlatformThresholds = Record<Platform, number>;

const INITIAL_THRESHOLDS: PlatformThresholds = {
  reddit: 0, x: 0, zenn: 0, qiita: 0, note: 0,
};

export default function TimelineView({ groups, sources, companies }: TimelineViewProps) {
  const [activeSource, setActiveSource] = useState(ALL_KEY);
  const [activeCompany, setActiveCompany] = useState(ALL_KEY);
  const [activeTier, setActiveTier] = useState<TierFilter>(ALL_KEY);
  const [thresholds, setThresholds] = useState<PlatformThresholds>(INITIAL_THRESHOLDS);

  const setThresholdFor = useCallback((platform: Platform, value: number) => {
    setThresholds((prev) => ({ ...prev, [platform]: value }));
  }, []);

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

  // Per-platform engagement stats (max, median, count, log-stops)
  const platformStats = useMemo(() => {
    const byPlatform = new Map<Platform, number[]>();
    for (const group of groups) {
      for (const item of group.items) {
        if (item.sourceTier !== 'tertiary') continue;
        const p = sourceToPlatform(item.sourceName);
        if (!p) continue;
        const score = item.engagementScore ?? 0;
        const arr = byPlatform.get(p) || [];
        arr.push(score);
        byPlatform.set(p, arr);
      }
    }

    const result = new Map<Platform, { max: number; median: number; count: number; stops: number[] }>();
    for (const [platform, scores] of byPlatform) {
      scores.sort((a, b) => a - b);
      const median = scores[Math.floor(scores.length / 2)] ?? 0;
      const max = scores[scores.length - 1] ?? 0;
      const stops = [0];
      const candidates = [1, 5, 10, 25, 50, 100, 200, 500, 1000, 2000, 5000];
      for (const c of candidates) {
        if (c <= max) stops.push(c);
      }
      result.set(platform, { max, median, count: scores.length, stops });
    }
    return result;
  }, [groups]);

  const isCommunityFilter = activeTier === 'tertiary';
  const hasAnyThreshold = Object.values(thresholds).some((v) => v > 0);

  // Reset engagement sliders when switching away from community
  const handleTierChange = (tier: TierFilter) => {
    setActiveTier(activeTier === tier ? ALL_KEY : tier);
    if (tier !== 'tertiary') setThresholds(INITIAL_THRESHOLDS);
  };

  // 4-axis AND filter (source × company × tier × per-platform engagement)
  const filteredGroups = useMemo(() => {
    const noFilter = activeSource === ALL_KEY && activeCompany === ALL_KEY && activeTier === ALL_KEY && !hasAnyThreshold;
    if (noFilter) return groups;

    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => {
          if (activeSource !== ALL_KEY && item.sourceName !== activeSource) return false;
          if (activeCompany !== ALL_KEY && item.companyId !== activeCompany) return false;
          if (activeTier !== ALL_KEY && item.sourceTier !== activeTier) return false;
          if (isCommunityFilter && hasAnyThreshold) {
            const p = sourceToPlatform(item.sourceName);
            if (p) {
              const minForPlatform = thresholds[p];
              if (minForPlatform > 0) {
                const score = item.engagementScore ?? 0;
                if (score < minForPlatform) return false;
              }
            }
          }
          return true;
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, activeSource, activeCompany, activeTier, thresholds, hasAnyThreshold, isCommunityFilter]);

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
      <div className={isCommunityFilter ? 'mb-4' : 'mb-8'}>
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
              onClick={() => handleTierChange(key)}
            />
          ))}
        </div>
      </div>

      {/* Per-platform Engagement Sliders (community tier only) */}
      {isCommunityFilter && platformStats.size > 0 && (
        <div className="mb-8 rounded-xl bg-bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-semibold text-text-light uppercase tracking-wider">
              エンゲージメント フィルタ
            </div>
            <span className="text-xs text-text-muted">
              {filteredGroups.reduce((sum, g) => sum + g.items.length, 0)}件 表示中
            </span>
          </div>
          <div className="space-y-3">
            {PLATFORM_DEFS.filter((d) => platformStats.has(d.key)).map((def) => {
              const st = platformStats.get(def.key)!;
              return (
                <PlatformSlider
                  key={def.key}
                  platform={def}
                  stats={st}
                  value={thresholds[def.key]}
                  onChange={(v) => setThresholdFor(def.key, v)}
                />
              );
            })}
          </div>
        </div>
      )}

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
// Per-platform Engagement Slider
// ---------------------------------------------------------------------------

function PlatformSlider({
  platform,
  stats,
  value,
  onChange,
}: {
  platform: { key: Platform; label: string; color: string };
  stats: { max: number; median: number; count: number; stops: number[] };
  value: number;
  onChange: (v: number) => void;
}) {
  const { stops, max, median, count } = stats;
  const currentStopIdx = stops.findIndex((s) => s >= value);
  const effectiveIdx = currentStopIdx === -1 ? stops.length - 1 : currentStopIdx;

  return (
    <div className="flex items-center gap-3">
      {/* Platform label */}
      <div className="w-20 flex-shrink-0">
        <span className={`text-[11px] font-semibold ${platform.color}`}>{platform.label}</span>
        <div className="text-[9px] text-text-light">
          {count}件 / 中央値 {formatEngagement(median)}
        </div>
      </div>

      {/* Slider */}
      <div className="flex-1 flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={stops.length - 1}
          value={effectiveIdx}
          onChange={(e) => onChange(stops[parseInt(e.target.value, 10)] ?? 0)}
          className="flex-1 h-1.5 appearance-none bg-border rounded-full cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-leaf
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
            [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* Threshold display */}
      <div className="w-16 flex-shrink-0 text-right">
        <span className={`text-[11px] tabular-nums font-semibold ${value > 0 ? 'text-accent-leaf' : 'text-text-light'}`}>
          {value === 0 ? 'すべて' : `${formatEngagement(value)}+`}
        </span>
      </div>
    </div>
  );
}

function formatEngagement(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(0)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
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

  const nva = item.nvaTotal ?? 0;
  // 3-tier card hierarchy: compact (<70), normal (70-79), featured (≥80)
  const tier: 'compact' | 'normal' | 'featured' =
    nva >= 80 ? 'featured' : nva >= 70 ? 'normal' : 'compact';

  const showLangBadge = !item.isJapaneseSource;
  const hasSummary = item.contentSummary && !isSimilarToTitle(item.contentSummary, item.title, item.titleJa);
  const hasOriginalTitle = !item.isJapaneseSource && item.titleJa && item.originalTitle && item.titleJa !== item.originalTitle;

  // ── Compact: single-line row ──
  if (tier === 'compact') {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-lg bg-bg-card/60 px-3 py-2 border border-border/50 transition-all hover:border-border-hover hover:bg-bg-card group"
      >
        <span className="text-[10px] text-text-light tabular-nums flex-shrink-0 w-10">{time}</span>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-accent-leaf/10 text-accent-leaf flex-shrink-0">
          {item.sourceName}
        </span>
        {item.sourceTier === 'tertiary' && (
          <span className="inline-flex items-center px-1 py-0.5 rounded text-[8px] font-medium bg-amber-50 text-amber-500 border border-amber-100 flex-shrink-0">
            コミュニティ
          </span>
        )}
        <span className="text-[13px] text-text-muted truncate group-hover:text-text-deep transition-colors">
          {displayTitle}
        </span>
        {item.engagementScore != null && item.engagementScore > 0 && (
          <span className="text-[10px] text-amber-500 tabular-nums flex-shrink-0 ml-auto" title="エンゲージメント">
            {formatEngagement(item.engagementScore)}
          </span>
        )}
        {item.nvaTotal != null && (
          <span className="text-[10px] text-text-light tabular-nums flex-shrink-0">{item.nvaTotal}</span>
        )}
      </a>
    );
  }

  // ── Featured: large card with emphasis ──
  if (tier === 'featured') {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl border-l-4 border-l-accent-moss border border-accent-moss/20 bg-bg-card p-5 transition-all hover:ring-2 hover:ring-accent-leaf/30 hover:border-border-hover group"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Badges */}
            <div className="flex items-center flex-wrap gap-1.5 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-leaf/15 text-accent-leaf">
                {item.sourceName}
              </span>
              {item.companyName && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent-sage/10 text-accent-sage">
                  {item.companyName}
                </span>
              )}
              {showLangBadge && (
                <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-400 border border-blue-100">
                  EN
                </span>
              )}
              {item.sourceTier === 'tertiary' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-500 border border-amber-100">
                  コミュニティ
                </span>
              )}
              <span className="text-[10px] text-text-light">{time}</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent-moss/15 text-accent-moss">
                注目
              </span>
              {item.classification && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-bg-warm text-text-muted">
                  {item.classification}
                </span>
              )}
              {item.contentSlug && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-nadeshiko/10 text-nadeshiko cursor-pointer"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/news/${item.contentSlug}`; }}
                >
                  記事あり
                </span>
              )}
            </div>

            {/* Title — large */}
            <h3 className="text-base font-bold text-text-deep leading-snug group-hover:text-accent-moss transition-colors">
              {displayTitle}
              <span className="inline-block ml-1 text-text-light text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
            </h3>

            {/* Original title */}
            {hasOriginalTitle && (
              <p className="text-[11px] text-text-light leading-snug mt-0.5">{item.originalTitle}</p>
            )}

            {/* Summary — show up to 3 lines for featured */}
            {hasSummary && (
              <p className="text-sm text-text-muted leading-relaxed mt-2 line-clamp-3">{item.contentSummary}</p>
            )}

            {item.sourceDomain && (
              <span className="text-[10px] text-text-light opacity-60 mt-2 inline-block">{item.sourceDomain}</span>
            )}
          </div>

          {/* NVA Score — larger */}
          {item.nvaTotal != null && (
            <div className="flex-shrink-0 text-right">
              <div className="text-sm font-bold tabular-nums text-accent-moss">{item.nvaTotal}</div>
              <div className="text-[9px] text-text-light">NVA</div>
            </div>
          )}
        </div>
      </a>
    );
  }

  // ── Normal: fixed-height card (NVA 70-79), title wraps ──
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border-l-[3px] border-l-accent-moss border border-border bg-bg-card p-4 h-[88px] overflow-hidden transition-all hover:ring-2 hover:ring-accent-leaf/30 hover:border-border-hover group"
    >
      <div className="flex items-start justify-between gap-3 h-full">
        <div className="min-w-0 flex-1">
          <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-leaf/15 text-accent-leaf">
              {item.sourceName}
            </span>
            {item.companyName && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent-sage/10 text-accent-sage">
                {item.companyName}
              </span>
            )}
            {showLangBadge && (
              <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-400 border border-blue-100">
                EN
              </span>
            )}
            {item.sourceTier === 'tertiary' && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-500 border border-amber-100">
                コミュニティ
              </span>
            )}
            <span className="text-[10px] text-text-light">{time}</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent-moss/15 text-accent-moss">
              注目
            </span>
            {item.classification && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-bg-warm text-text-muted">
                {item.classification}
              </span>
            )}
            {item.contentSlug && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-nadeshiko/10 text-nadeshiko cursor-pointer"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/news/${item.contentSlug}`; }}
              >
                記事あり
              </span>
            )}
          </div>

          <h3 className="text-[15px] font-semibold text-text-deep leading-snug group-hover:text-accent-moss transition-colors line-clamp-2">
            {displayTitle}
            <span className="inline-block ml-1 text-text-light text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
          </h3>
        </div>

        {item.nvaTotal != null && (
          <div className="flex-shrink-0 text-right">
            <div className="text-xs font-bold tabular-nums text-accent-moss">{item.nvaTotal}</div>
            <div className="text-[9px] text-text-light">NVA</div>
          </div>
        )}
      </div>
    </a>
  );
}
