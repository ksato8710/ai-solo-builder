'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

export const dynamic = 'force-dynamic';

interface SourceOption {
  id: string;
  name: string;
  domain: string | null;
  source_type: string;
  entity_kind: string | null;
}

interface CollectedItem {
  id: string;
  source_id: string;
  source_tier: 'primary' | 'secondary' | 'tertiary';
  title: string;
  url: string;
  url_hash: string;
  author: string | null;
  content_summary: string | null;
  raw_content: string | null;
  published_at: string | null;
  collected_at: string;
  classification: string | null;
  classification_confidence: number | null;
  relevance_tags: string[];
  nva_total: number | null;
  nva_social: number | null;
  nva_media: number | null;
  nva_community: number | null;
  nva_technical: number | null;
  nva_solo_relevance: number | null;
  score_reasoning: string | null;
  scored_at: string | null;
  status: 'new' | 'scored' | 'selected' | 'dismissed' | 'published';
  content_id: string | null;
  digest_date: string | null;
  created_at: string;
  updated_at: string;
  source?: { id: string; name: string; domain: string | null; source_type: string; entity_kind: string | null };
}

type ItemStatus = 'new' | 'scored' | 'selected' | 'dismissed' | 'published';
type SourceTier = 'primary' | 'secondary' | 'tertiary';

function formatDateTime(value: string): string {
  const date = new Date(value);
  return `${date.toLocaleDateString('ja-JP')} ${date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function tierColor(tier: SourceTier): string {
  switch (tier) {
    case 'primary':
      return 'text-accent-leaf bg-accent-leaf/20 border-accent-leaf/40';
    case 'secondary':
      return 'text-accent-bark bg-accent-bark/20 border-accent-bark/40';
    case 'tertiary':
      return 'text-cat-tool bg-cat-tool/20 border-cat-tool/40';
    default:
      return 'text-text-muted bg-bg-warm border-border';
  }
}

function statusColor(status: ItemStatus): string {
  switch (status) {
    case 'new':
      return 'text-text-muted bg-bg-warm border-border';
    case 'scored':
      return 'text-cat-tool bg-cat-tool/20 border-cat-tool/40';
    case 'selected':
      return 'text-accent-leaf bg-accent-leaf/20 border-accent-leaf/40';
    case 'dismissed':
      return 'text-text-light bg-bg-cream border-border';
    case 'published':
      return 'text-accent-moss bg-accent-moss/20 border-accent-moss/40';
    default:
      return 'text-text-muted bg-bg-warm border-border';
  }
}

function statusAccent(status: ItemStatus): string {
  switch (status) {
    case 'new':
      return 'text-text-muted';
    case 'scored':
      return 'text-cat-tool';
    case 'selected':
      return 'text-accent-leaf';
    case 'dismissed':
      return 'text-text-light';
    case 'published':
      return 'text-accent-moss';
    default:
      return 'text-text-muted';
  }
}

const LIMIT = 50;

export default function CollectedItemsAdminPage() {
  const [items, setItems] = useState<CollectedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterSourceId, setFilterSourceId] = useState<string>('all');
  const [filterMinScore, setFilterMinScore] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [offset, setOffset] = useState(0);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    const response = await fetch('/api/admin/source-intelligence');
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to load sources');
    }
    setSources(data.sources || []);
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterTier !== 'all') params.set('tier', filterTier);
      if (filterSourceId !== 'all') params.set('source_id', filterSourceId);
      if (filterMinScore) params.set('min_score', filterMinScore);
      if (filterDateFrom) params.set('date_from', filterDateFrom);
      if (filterDateTo) params.set('date_to', filterDateTo);
      params.set('limit', String(LIMIT));
      params.set('offset', String(offset));

      const response = await fetch(`/api/admin/collected-items?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch collected items');
      }

      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterTier, filterSourceId, filterMinScore, filterDateFrom, filterDateTo, offset]);

  useEffect(() => {
    void fetchSources();
  }, [fetchSources]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const statusCounts = useMemo(() => {
    return {
      total,
      new: 0,
      scored: 0,
      selected: 0,
      dismissed: 0,
      published: 0,
    };
  }, [total]);

  async function updateStatus(id: string, newStatus: ItemStatus) {
    const response = await fetch('/api/admin/collected-items', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    });

    const data = await response.json();
    if (!response.ok) {
      alert(data.error || 'Failed to update status.');
      return;
    }

    await fetchItems();
  }

  async function deleteItem(id: string, title: string) {
    if (!confirm(`「${title}」を削除しますか？`)) return;

    const response = await fetch(`/api/admin/collected-items?id=${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    if (!response.ok) {
      alert(data.error || 'Failed to delete item.');
      return;
    }

    await fetchItems();
  }

  function handleFilterChange() {
    setOffset(0);
  }

  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + LIMIT, total);

  if (loading && items.length === 0) {
    return <div className="p-8 text-text-muted">Loading collected items...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-text-deep">収集データ管理</h1>
          <p className="text-sm text-text-light mt-2">
            全ソースから収集したニュースデータの一覧・詳細確認・ステータス管理を行います。
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/admin/source-intelligence"
            className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-warm"
          >
            Source管理
          </a>
          <a
            href="/admin/scoring"
            className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-warm"
          >
            スコアリング
          </a>
          <a
            href="/admin"
            className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-warm"
          >
            ← 管理トップ
          </a>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard label="Total Items" value={statusCounts.total} accent="text-text-deep" />
        <StatCard label="New" value={statusCounts.new} accent={statusAccent('new')} />
        <StatCard label="Scored" value={statusCounts.scored} accent={statusAccent('scored')} />
        <StatCard label="Selected" value={statusCounts.selected} accent={statusAccent('selected')} />
        <StatCard label="Dismissed" value={statusCounts.dismissed} accent={statusAccent('dismissed')} />
        <StatCard label="Published" value={statusCounts.published} accent={statusAccent('published')} />
      </div>

      {error && (
        <div className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-4 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Field label="ステータス">
            <select
              value={filterStatus}
              onChange={(event) => {
                setFilterStatus(event.target.value);
                handleFilterChange();
              }}
              className="w-full rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="scored">Scored</option>
              <option value="selected">Selected</option>
              <option value="dismissed">Dismissed</option>
              <option value="published">Published</option>
            </select>
          </Field>

          <Field label="Tier">
            <select
              value={filterTier}
              onChange={(event) => {
                setFilterTier(event.target.value);
                handleFilterChange();
              }}
              className="w-full rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
            >
              <option value="all">All Tiers</option>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="tertiary">Tertiary</option>
            </select>
          </Field>

          <Field label="ソース">
            <select
              value={filterSourceId}
              onChange={(event) => {
                setFilterSourceId(event.target.value);
                handleFilterChange();
              }}
              className="w-full rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
            >
              <option value="all">All Sources</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="最小NVAスコア">
            <input
              type="number"
              min={0}
              max={100}
              value={filterMinScore}
              onChange={(event) => {
                setFilterMinScore(event.target.value);
                handleFilterChange();
              }}
              placeholder="0"
              className="w-full rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
            />
          </Field>

          <Field label="日付 (From)">
            <input
              type="date"
              value={filterDateFrom}
              onChange={(event) => {
                setFilterDateFrom(event.target.value);
                handleFilterChange();
              }}
              className="w-full rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
            />
          </Field>

          <Field label="日付 (To)">
            <input
              type="date"
              value={filterDateTo}
              onChange={(event) => {
                setFilterDateTo(event.target.value);
                handleFilterChange();
              }}
              className="w-full rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
            />
          </Field>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-light">
            {total}件中 {rangeStart}-{rangeEnd}件
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              disabled={offset === 0}
              className="rounded border border-border px-3 py-1.5 text-xs text-text-muted hover:bg-bg-warm disabled:opacity-40"
            >
              前へ
            </button>
            <button
              onClick={() => setOffset(offset + LIMIT)}
              disabled={offset + LIMIT >= total}
              className="rounded border border-border px-3 py-1.5 text-xs text-text-muted hover:bg-bg-warm disabled:opacity-40"
            >
              次へ
            </button>
          </div>
        </div>
      </div>

      {/* Item List */}
      <div className="space-y-3">
        {items.map((item) => {
          const isExpanded = expandedId === item.id;

          return (
            <div key={item.id} className="rounded-[var(--radius-card)] border border-border bg-bg-card p-4">
              <div className="space-y-3">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded border ${tierColor(item.source_tier)}`}>
                    {item.source_tier}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded border ${statusColor(item.status)}`}>
                    {item.status}
                  </span>
                  {item.classification && (
                    <span className="px-2 py-1 text-xs rounded border border-border bg-bg-cream text-text-muted">
                      {item.classification}
                    </span>
                  )}
                </div>

                {/* Title */}
                <div
                  className="cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <h3 className="text-lg font-semibold font-heading text-text-deep inline">
                    {item.title}
                  </h3>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="ml-2 text-accent-leaf hover:text-accent-moss text-sm"
                    >
                      &#x2197;
                    </a>
                  )}
                </div>

                {/* Source / Date info */}
                <p className="text-xs text-text-light">
                  {item.source?.name || 'Unknown source'}
                  {' / '}
                  収集: {formatDateTime(item.collected_at)}
                  {item.published_at && ` / 公開: ${formatDateTime(item.published_at)}`}
                  {item.author && ` / ${item.author}`}
                </p>

                {/* Summary */}
                {item.content_summary && (
                  <p className="text-sm text-text-muted line-clamp-2">{item.content_summary}</p>
                )}

                {/* NVA MetaChips */}
                <div className="grid grid-cols-2 md:grid-cols-7 gap-3 text-xs">
                  <MetaChip label="NVA Total" value={item.nva_total != null ? String(item.nva_total) : '--'} />
                  <MetaChip label="Social" value={item.nva_social != null ? String(item.nva_social) : '--'} />
                  <MetaChip label="Media" value={item.nva_media != null ? String(item.nva_media) : '--'} />
                  <MetaChip label="Community" value={item.nva_community != null ? String(item.nva_community) : '--'} />
                  <MetaChip label="Technical" value={item.nva_technical != null ? String(item.nva_technical) : '--'} />
                  <MetaChip label="Solo Rel." value={item.nva_solo_relevance != null ? String(item.nva_solo_relevance) : '--'} />
                  <MetaChip label="Confidence" value={item.classification_confidence != null ? `${(item.classification_confidence * 100).toFixed(0)}%` : '--'} />
                </div>

                {/* Relevance Tags */}
                {item.relevance_tags && item.relevance_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.relevance_tags.map((tag) => (
                      <span
                        key={`${item.id}-${tag}`}
                        className="rounded border border-accent-bark/30 bg-accent-bark/10 px-2 py-0.5 text-xs text-accent-bark"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="space-y-3 border-t border-border pt-3 mt-3">
                    {item.score_reasoning && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-text-light mb-1">Score Reasoning</p>
                        <p className="text-sm text-text-muted whitespace-pre-wrap">{item.score_reasoning}</p>
                      </div>
                    )}
                    {item.raw_content && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-text-light mb-1">Raw Content</p>
                        <pre className="text-xs text-text-muted bg-bg-cream rounded border border-border p-3 overflow-auto max-h-64 whitespace-pre-wrap">
                          {item.raw_content}
                        </pre>
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <MetaChip label="URL Hash" value={item.url_hash || '--'} />
                      <MetaChip label="Scored At" value={item.scored_at ? formatDateTime(item.scored_at) : '--'} />
                      <MetaChip label="Content ID" value={item.content_id || '--'} />
                      <MetaChip label="Digest Date" value={item.digest_date || '--'} />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {item.status !== 'selected' && item.status !== 'published' && (
                    <button
                      onClick={() => void updateStatus(item.id, 'selected')}
                      className="rounded bg-accent-leaf hover:bg-accent-moss px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Select
                    </button>
                  )}
                  {item.status !== 'dismissed' && item.status !== 'published' && (
                    <button
                      onClick={() => void updateStatus(item.id, 'dismissed')}
                      className="rounded bg-bg-warm hover:bg-bg-card px-3 py-1.5 text-xs text-text-deep"
                    >
                      Dismiss
                    </button>
                  )}
                  <button
                    onClick={() => void deleteItem(item.id, item.title)}
                    className="rounded bg-danger/70 hover:bg-danger px-3 py-1.5 text-xs text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && !loading && (
          <div className="rounded border border-border bg-bg-cream px-3 py-4 text-sm text-text-light">
            条件に一致する収集データがありません。フィルターを変更してください。
          </div>
        )}
      </div>

      {/* Bottom Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-light">
            {total}件中 {rangeStart}-{rangeEnd}件
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              disabled={offset === 0}
              className="rounded border border-border px-3 py-1.5 text-xs text-text-muted hover:bg-bg-warm disabled:opacity-40"
            >
              前へ
            </button>
            <button
              onClick={() => setOffset(offset + LIMIT)}
              disabled={offset + LIMIT >= total}
              className="rounded border border-border px-3 py-1.5 text-xs text-text-muted hover:bg-bg-warm disabled:opacity-40"
            >
              次へ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-text-light">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-bg-cream p-2">
      <p className="text-[10px] uppercase tracking-wide text-text-light">{label}</p>
      <p className="text-text-deep mt-1 break-all">{value}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-light">{label}</span>
      {children}
    </label>
  );
}
