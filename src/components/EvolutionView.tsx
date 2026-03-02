'use client';

import { useMemo, useState } from 'react';
import type { TimelineItem } from '@/lib/timeline';

// ---------------------------------------------------------------------------
// Public types (shared with page.tsx)
// ---------------------------------------------------------------------------

export type ProductKey = 'claude' | 'codex' | 'gemini' | 'figma';

export interface EvolutionEntry {
  id: string;
  date: string;
  day: number;
  month: string;
  year: string;
  productKey: ProductKey;
  mainItem: TimelineItem;
  resources: TimelineItem[];
}

interface EvolutionViewProps {
  entries: EvolutionEntry[];
  stats: { updates: number; resources: number; sources: number };
}

// ---------------------------------------------------------------------------
// Product definitions
// ---------------------------------------------------------------------------

interface ProductDef {
  key: ProductKey;
  label: string;
  abbr: string;
  companyName: string;
  badge: string;
  badgeActive: string;
  accent: string;
  dot: string;
  gradientFrom: string;
  gradientTo: string;
}

const PRODUCTS: Record<ProductKey, ProductDef> = {
  claude: {
    key: 'claude',
    label: 'Claude',
    abbr: 'CL',
    companyName: 'Anthropic',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    badgeActive: 'bg-amber-600 text-white border-amber-600',
    accent: 'border-l-amber-500',
    dot: 'bg-amber-500',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-400',
  },
  codex: {
    key: 'codex',
    label: 'Codex',
    abbr: 'CX',
    companyName: 'OpenAI',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeActive: 'bg-emerald-600 text-white border-emerald-600',
    accent: 'border-l-emerald-500',
    dot: 'bg-emerald-500',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-400',
  },
  gemini: {
    key: 'gemini',
    label: 'Gemini',
    abbr: 'GM',
    companyName: 'Google',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeActive: 'bg-blue-600 text-white border-blue-600',
    accent: 'border-l-blue-500',
    dot: 'bg-blue-500',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-sky-400',
  },
  figma: {
    key: 'figma',
    label: 'Figma',
    abbr: 'FG',
    companyName: 'Figma',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    badgeActive: 'bg-violet-600 text-white border-violet-600',
    accent: 'border-l-violet-500',
    dot: 'bg-violet-500',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-400',
  },
};

const PRODUCT_LIST: ProductKey[] = ['claude', 'codex', 'gemini', 'figma'];
const ALL_KEY = '__all__';

// ---------------------------------------------------------------------------
// Resource type detection
// ---------------------------------------------------------------------------

function getResourceType(item: TimelineItem): { label: string; cls: string } {
  const lower = item.sourceName.toLowerCase();
  if (lower.startsWith('reddit')) return { label: 'Reddit', cls: 'bg-orange-50 text-orange-600' };
  if (lower.includes('hacker news')) return { label: 'HN', cls: 'bg-orange-50 text-orange-500' };
  if (lower.startsWith('x ') || lower.startsWith('x@')) return { label: 'X', cls: 'bg-sky-50 text-sky-600' };
  if (lower === 'zenn') return { label: 'Zenn', cls: 'bg-blue-50 text-blue-600' };
  if (lower === 'qiita') return { label: 'Qiita', cls: 'bg-emerald-50 text-emerald-600' };
  if (item.sourceTier === 'primary') return { label: 'Blog', cls: 'bg-amber-50 text-amber-600' };
  if (item.sourceTier === 'secondary') return { label: 'Media', cls: 'bg-indigo-50 text-indigo-600' };
  return { label: 'Article', cls: 'bg-gray-50 text-gray-600' };
}

function isSummaryRedundant(
  summary: string,
  title: string,
  titleJa: string | null,
  originalTitle: string,
): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[\s\u3000]+/g, '').replace(/[^\w\u3000-\u9fff]/g, '');
  const ns = norm(summary);
  if (!ns) return true;
  for (const t of [title, titleJa, originalTitle]) {
    if (!t) continue;
    const nt = norm(t);
    if (nt && (ns === nt || ns.includes(nt) || nt.includes(ns))) return true;
  }
  return false;
}

function formatEngagement(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(0)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function EvolutionView({ entries, stats }: EvolutionViewProps) {
  const [activeProduct, setActiveProduct] = useState<string>(ALL_KEY);

  const filteredEntries = useMemo(() => {
    if (activeProduct === ALL_KEY) return entries;
    return entries.filter((e) => e.productKey === activeProduct);
  }, [entries, activeProduct]);

  // Per-product counts
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      counts[e.productKey] = (counts[e.productKey] || 0) + 1;
    }
    return counts;
  }, [entries]);

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">
      {/* ── Hero ── */}
      <HeroSection stats={stats} />

      {/* ── Filter Bar ── */}
      <div className="sticky top-14 z-40 bg-bg-cream/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 overflow-x-auto">
          <FilterPill
            abbr="ALL"
            label="すべて"
            isActive={activeProduct === ALL_KEY}
            onClick={() => setActiveProduct(ALL_KEY)}
            count={entries.length}
          />
          {PRODUCT_LIST.map((key) => {
            const p = PRODUCTS[key];
            return (
              <FilterPill
                key={key}
                abbr={p.abbr}
                label={p.label}
                isActive={activeProduct === key}
                onClick={() => setActiveProduct(activeProduct === key ? ALL_KEY : key)}
                count={productCounts[key] || 0}
                badgeClass={activeProduct === key ? p.badgeActive : undefined}
              />
            );
          })}
          <span className="ml-auto text-xs text-text-light whitespace-nowrap">
            {filteredEntries.length} updates
          </span>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        {filteredEntries.length > 0 ? (
          <div className="space-y-0">
            {filteredEntries.map((entry, idx) => (
              <TimelineEntry key={entry.id} entry={entry} isFirst={idx === 0} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-4 opacity-20">📡</p>
            <h3 className="font-heading text-xl font-bold text-text-deep mb-2">
              データがありません
            </h3>
            <p className="text-text-muted text-sm">
              この期間に対象プロダクトのアップデートはありません。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero Section
// ---------------------------------------------------------------------------

function HeroSection({ stats }: { stats: { updates: number; resources: number; sources: number } }) {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 text-center">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-blue-200/15 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/3 w-48 h-48 bg-violet-200/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4">
        {/* Badge */}
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-bg-card/80 text-sm text-text-muted mb-6">
          <span className="text-accent-leaf">✦</span>
          AI最前線
          <span className="w-1.5 h-1.5 rounded-full bg-accent-leaf animate-pulse" />
        </span>

        {/* Title */}
        <h1 className="font-heading text-5xl sm:text-6xl font-extrabold tracking-tight leading-none mb-4">
          <span className="text-text-deep">AI</span>{' '}
          <span className="bg-gradient-to-r from-amber-500 via-emerald-500 via-blue-500 to-violet-500 bg-clip-text text-transparent">
            Evolution
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-text-muted text-base sm:text-lg max-w-md mx-auto mb-8">
          Claude・Codex・Gemini・Figma
          <br className="sm:hidden" />
          — 主要AIツールの進化を追跡
        </p>

        {/* Stats */}
        <div className="inline-flex items-center gap-8 text-center">
          <div>
            <div className="text-2xl font-bold text-text-deep">{stats.updates}</div>
            <div className="text-[11px] text-text-light uppercase tracking-wider">Updates</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <div className="text-2xl font-bold text-text-deep">{stats.sources}</div>
            <div className="text-[11px] text-text-light uppercase tracking-wider">Sources</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <div className="text-2xl font-bold text-text-deep">4</div>
            <div className="text-[11px] text-text-light uppercase tracking-wider">Products</div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="mt-10 flex flex-col items-center gap-1 text-text-light/50">
          <span className="text-[10px] uppercase tracking-widest">Scroll to explore</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="animate-bounce">
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Filter Pill
// ---------------------------------------------------------------------------

function FilterPill({
  abbr,
  label,
  isActive,
  onClick,
  count,
  badgeClass,
}: {
  abbr: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  count: number;
  badgeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border whitespace-nowrap ${
        isActive
          ? 'bg-bg-card border-border shadow-sm'
          : 'bg-transparent border-transparent hover:bg-bg-card/60 hover:border-border/50'
      }`}
    >
      <span
        className={`inline-flex items-center justify-center w-7 h-5 rounded text-[10px] font-bold ${
          badgeClass || (isActive ? 'bg-text-deep text-bg-cream' : 'bg-bg-warm text-text-light')
        }`}
      >
        {abbr}
      </span>
      <span className={isActive ? 'text-text-deep' : 'text-text-muted'}>{label}</span>
      {count > 0 && (
        <span className="text-[10px] text-text-light tabular-nums">{count}</span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Timeline Entry (date marker + feature card)
// ---------------------------------------------------------------------------

function TimelineEntry({ entry, isFirst }: { entry: EvolutionEntry; isFirst: boolean }) {
  const product = PRODUCTS[entry.productKey];
  const item = entry.mainItem;
  const displayTitle = item.titleJa || item.title;
  const hasOriginal = !item.isJapaneseSource && item.titleJa && item.originalTitle && item.titleJa !== item.originalTitle;

  return (
    <div className={`grid grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr] gap-4 sm:gap-6 ${isFirst ? '' : 'mt-6'}`}>
      {/* Date marker */}
      <div className="text-right pt-5">
        <div className="text-3xl sm:text-4xl font-extrabold text-text-deep/80 leading-none tabular-nums">
          {String(entry.day).padStart(2, '0')}
        </div>
        <div className="text-xs text-text-light mt-0.5">
          {entry.month}
        </div>
        <div className="text-[10px] text-text-light/60">
          {entry.year}
        </div>
        {/* Vertical line connector */}
        <div className="flex justify-end mt-2">
          <div className={`w-2.5 h-2.5 rounded-full ${product.dot}`} />
        </div>
      </div>

      {/* Card */}
      <div
        className={`rounded-2xl border-l-4 ${product.accent} border border-border bg-bg-card p-5 sm:p-6 transition-all hover:shadow-md hover:border-border-hover`}
      >
        {/* Header: product badge + source link */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${product.badge}`}
          >
            {product.label}
          </span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-text-light hover:text-accent-leaf transition-colors"
          >
            {item.sourceName}
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="opacity-50">
              <path d="M3 9L9 3M9 3H5M9 3V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        {/* Title */}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          <h3 className="text-lg sm:text-xl font-bold text-text-deep leading-snug group-hover:text-accent-moss transition-colors">
            {displayTitle}
          </h3>
          {hasOriginal && (
            <p className="text-[11px] text-text-light mt-0.5 leading-snug">{item.originalTitle}</p>
          )}
        </a>

        {/* Summary — skip if it's just a repeat of the title */}
        {item.contentSummary && !isSummaryRedundant(item.contentSummary, item.title, item.titleJa, item.originalTitle) && (
          <p className="text-sm text-text-muted leading-relaxed mt-3 line-clamp-2">
            {item.contentSummary}
          </p>
        )}

        {/* NVA + Engagement */}
        <div className="flex items-center gap-3 mt-3">
          {item.nvaTotal != null && (
            <span className="text-[11px] font-semibold text-accent-moss bg-accent-leaf/10 px-2 py-0.5 rounded">
              NVA {item.nvaTotal}
            </span>
          )}
          {item.engagementScore != null && item.engagementScore > 0 && (
            <span className="text-[11px] text-amber-600 tabular-nums">
              ♥ {formatEngagement(item.engagementScore)}
            </span>
          )}
          {item.sourceTier !== 'primary' && item.sourceTier !== 'secondary' && (
            <span className="text-[10px] text-text-light bg-bg-warm px-1.5 py-0.5 rounded">
              コミュニティ
            </span>
          )}
        </div>

        {/* Resources carousel */}
        {entry.resources.length > 0 && (
          <ResourceCarousel resources={entry.resources} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resource Carousel
// ---------------------------------------------------------------------------

function ResourceCarousel({ resources }: { resources: TimelineItem[] }) {
  return (
    <div className="mt-5 pt-4 border-t border-border/60">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-text-light uppercase tracking-wider">
          Community
          <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-bg-warm text-[10px] font-bold text-text-muted">
            {resources.length}
          </span>
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {resources.map((r) => (
          <ResourceCard key={r.id} item={r} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resource Card
// ---------------------------------------------------------------------------

function ResourceCard({ item }: { item: TimelineItem }) {
  const type = getResourceType(item);
  const displayTitle = item.titleJa || item.title;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 w-60 sm:w-64 rounded-xl border border-border bg-bg-warm/60 p-3 hover:bg-bg-warm hover:border-border-hover transition-all group"
    >
      {/* Type badge */}
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${type.cls}`}>
        {type.label}
      </span>

      {/* Title */}
      <p className="text-[13px] font-medium text-text-deep leading-snug mt-1.5 line-clamp-2 group-hover:text-accent-moss transition-colors">
        {displayTitle}
      </p>

      {/* Footer: source + engagement */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-text-light truncate max-w-[140px]">{item.sourceName}</span>
        {item.engagementScore != null && item.engagementScore > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-semibold tabular-nums">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="opacity-70">
              <path d="M8 14s-5.5-3.5-5.5-7.5C2.5 3.5 4.5 2 6.5 2c1.1 0 2 .5 1.5 1.5C8.5 2.5 9.4 2 10.5 2c2 0 3.5 1.5 3.5 4.5S8 14 8 14z" />
            </svg>
            {formatEngagement(item.engagementScore)}
          </span>
        )}
      </div>
    </a>
  );
}
