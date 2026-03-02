'use client';

import { useMemo, useState } from 'react';
import type { TimelineGroup, TimelineItem, TimelineSource, TimelineCompany } from '@/lib/timeline';

interface TimelineViewProps {
  groups: TimelineGroup[];
  sources: TimelineSource[];
  companies: TimelineCompany[];
}

const ALL_KEY = '__all__';

export default function TimelineView({ groups, sources, companies }: TimelineViewProps) {
  const [activeSource, setActiveSource] = useState(ALL_KEY);
  const [activeCompany, setActiveCompany] = useState(ALL_KEY);

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

  const totalCount = useMemo(
    () => groups.reduce((sum, g) => sum + g.items.length, 0),
    [groups]
  );

  // 3-axis AND filter
  const filteredGroups = useMemo(() => {
    const noFilter = activeSource === ALL_KEY && activeCompany === ALL_KEY;
    if (noFilter) return groups;

    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => {
          if (activeSource !== ALL_KEY && item.sourceName !== activeSource) return false;
          if (activeCompany !== ALL_KEY && item.companyId !== activeCompany) return false;
          return true;
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, activeSource, activeCompany]);

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
        <div className="mb-8">
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

      {/* Timeline */}
      {filteredGroups.length > 0 ? (
        <div className="relative">
          {filteredGroups.map((group, groupIdx) => (
            <div key={group.date} className={groupIdx > 0 ? 'mt-8' : ''}>
              {/* Date Marker */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-accent-leaf ring-4 ring-bg-cream flex-shrink-0" />
                <h2 className="font-heading text-base font-bold text-text-deep">
                  {group.displayDate}
                </h2>
                <span className="text-xs text-text-light">
                  {group.items.length}件
                </span>
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
// Timeline Card
// ---------------------------------------------------------------------------

function TimelineCard({ item }: { item: TimelineItem }) {
  const displayTitle = item.titleJa || item.title;
  const effectiveDate = item.publishedAt || item.collectedAt;
  const time = new Date(effectiveDate).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-border bg-bg-card p-4 transition-all hover:ring-2 hover:ring-accent-leaf/30 hover:border-border-hover group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Source badge + company + time */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-leaf/15 text-accent-leaf">
              {item.sourceName}
            </span>
            {item.companyName && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent-sage/10 text-accent-sage">
                {item.companyName}
              </span>
            )}
            <span className="text-[10px] text-text-light">{time}</span>
            {item.classification && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-bg-warm text-text-muted">
                {item.classification}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-text-deep leading-snug group-hover:text-accent-moss transition-colors">
            {displayTitle}
            <span className="inline-block ml-1 text-text-light text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
              ↗
            </span>
          </h3>
          {/* Original title (shown when translated) */}
          {item.titleJa && item.originalTitle && item.titleJa !== item.originalTitle && (
            <p className="text-[11px] text-text-light leading-snug mt-0.5">
              {item.originalTitle}
            </p>
          )}
        </div>

        {/* NVA Score */}
        {item.nvaTotal != null && (
          <div className="flex-shrink-0 text-right">
            <div
              className={`text-xs font-bold tabular-nums ${
                item.nvaTotal >= 75
                  ? 'text-accent-moss'
                  : item.nvaTotal >= 60
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
