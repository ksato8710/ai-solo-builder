'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export const dynamic = 'force-dynamic';

interface ScoringConfig {
  id: string;
  config_key: string;
  config_value: unknown;
  description: string | null;
  updated_at: string;
}

interface CollectedItem {
  id: string;
  source_id: string;
  source_tier: 'primary' | 'secondary' | 'tertiary';
  title: string;
  url: string;
  classification: string | null;
  nva_total: number | null;
  nva_social: number | null;
  nva_media: number | null;
  nva_community: number | null;
  nva_technical: number | null;
  nva_solo_relevance: number | null;
  scored_at: string | null;
  status: string;
  source?: { id: string; name: string; domain: string | null; source_type: string; entity_kind: string | null };
}

interface NvaWeights {
  social: number;
  media: number;
  community: number;
  technical: number;
  solo_relevance: number;
  [key: string]: number;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return `${date.toLocaleDateString('ja-JP')} ${date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function tierColor(tier: string): string {
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

export default function ScoringDashboardPage() {
  const [configs, setConfigs] = useState<ScoringConfig[]>([]);
  const [scoredItems, setScoredItems] = useState<CollectedItem[]>([]);
  const [allItems, setAllItems] = useState<CollectedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editingWeights, setEditingWeights] = useState<NvaWeights | null>(null);

  const fetchConfigs = useCallback(async () => {
    const response = await fetch('/api/admin/scoring-config');
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to load scoring configs');
    }
    setConfigs(data.configs || []);
  }, []);

  const fetchScoredItems = useCallback(async () => {
    const response = await fetch('/api/admin/collected-items?status=scored&limit=20');
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to load scored items');
    }
    setScoredItems(data.items || []);
  }, []);

  const fetchAllItemsForStats = useCallback(async () => {
    const scoredRes = await fetch('/api/admin/collected-items?status=scored&limit=1000');
    const scoredData = await scoredRes.json();
    if (!scoredRes.ok) {
      throw new Error(scoredData.error || 'Failed to load items for stats');
    }
    setAllItems(scoredData.items || []);
  }, []);

  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([fetchConfigs(), fetchScoredItems(), fetchAllItemsForStats()]);
      } catch (initError) {
        setError(initError instanceof Error ? initError.message : 'Failed to initialize');
      } finally {
        setLoading(false);
      }
    }

    void initialize();
  }, [fetchConfigs, fetchScoredItems, fetchAllItemsForStats]);

  const stats = useMemo(() => {
    const scored = allItems.filter((item) => item.nva_total != null);
    const scores = scored.map((item) => item.nva_total ?? 0);

    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const max = scores.length > 0 ? Math.max(...scores) : 0;

    return {
      average: Math.round(avg * 10) / 10,
      max,
      scoredCount: scored.length,
      unscoredCount: 0,
    };
  }, [allItems]);

  const nvaWeightsConfig = useMemo(() => {
    return configs.find((config) => config.config_key === 'nva_weights');
  }, [configs]);

  const classificationConfig = useMemo(() => {
    return configs.find((config) => config.config_key === 'classification_categories');
  }, [configs]);

  const tierDefinitionsConfig = useMemo(() => {
    return configs.find((config) => config.config_key === 'tier_definitions');
  }, [configs]);

  useEffect(() => {
    if (nvaWeightsConfig && !editingWeights) {
      const value = nvaWeightsConfig.config_value as NvaWeights;
      setEditingWeights({ ...value });
    }
  }, [nvaWeightsConfig, editingWeights]);

  async function saveWeights() {
    if (!editingWeights) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/scoring-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config_key: 'nva_weights',
          config_value: editingWeights,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Failed to save weights.');
        return;
      }

      await fetchConfigs();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-text-muted">Loading scoring dashboard...</div>;
  }

  const classificationCategories = classificationConfig
    ? (classificationConfig.config_value as string[])
    : [];

  const tierDefinitions = tierDefinitionsConfig
    ? (tierDefinitionsConfig.config_value as Array<{
        tier: string;
        description: string;
        default_interval: string;
        color: string;
      }>)
    : [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-text-deep">スコアリングダッシュボード</h1>
          <p className="text-sm text-text-light mt-2">
            NVAスコアの分布、重み設定、分類ロジックを可視化・管理します。
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/admin/collected-items"
            className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-warm"
          >
            収集データ
          </a>
          <a
            href="/admin/source-intelligence"
            className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-warm"
          >
            Source管理
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="平均NVAスコア" value={stats.average} accent="text-text-deep" />
        <StatCard label="最高スコア" value={stats.max} accent="text-accent-leaf" />
        <StatCard label="スコア済み件数" value={stats.scoredCount} accent="text-cat-tool" />
        <StatCard label="未スコア件数" value={stats.unscoredCount} accent="text-accent-bloom" />
      </div>

      {error && (
        <div className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      {/* NVA Weights Configuration */}
      <section className="rounded-[var(--radius-card)] border border-border bg-bg-card p-5 space-y-4">
        <h2 className="text-lg font-semibold font-heading text-text-deep">NVA重み設定</h2>
        {nvaWeightsConfig && (
          <p className="text-xs text-text-light">
            {nvaWeightsConfig.description || 'NVAスコア計算時の各軸の重み付け'}
            {' / '}
            最終更新: {formatDateTime(nvaWeightsConfig.updated_at)}
          </p>
        )}

        {editingWeights && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(editingWeights).map(([key, value]) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-light">
                  {key}
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={value}
                  onChange={(event) =>
                    setEditingWeights((prev) =>
                      prev ? { ...prev, [key]: Number.parseFloat(event.target.value) || 0 } : prev
                    )
                  }
                  className="w-full rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => void saveWeights()}
            disabled={saving}
            className="rounded bg-accent-leaf hover:bg-accent-moss disabled:opacity-50 px-4 py-2 text-sm font-medium text-white"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </section>

      {/* Classification Categories */}
      <section className="rounded-[var(--radius-card)] border border-border bg-bg-card p-5 space-y-4">
        <h2 className="text-lg font-semibold font-heading text-text-deep">分類カテゴリ一覧</h2>
        {classificationConfig && (
          <p className="text-xs text-text-light">
            {classificationConfig.description || '自動分類に使用されるカテゴリリスト'}
          </p>
        )}

        {classificationCategories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {classificationCategories.map((category: string) => (
              <span
                key={category}
                className="px-2 py-1 text-xs rounded border border-cat-tool/40 bg-cat-tool/20 text-cat-tool"
              >
                {category}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-light">分類カテゴリが設定されていません。</p>
        )}
      </section>

      {/* Tier Definitions */}
      <section className="rounded-[var(--radius-card)] border border-border bg-bg-card p-5 space-y-4">
        <h2 className="text-lg font-semibold font-heading text-text-deep">ソース階層定義</h2>
        {tierDefinitionsConfig && (
          <p className="text-xs text-text-light">
            {tierDefinitionsConfig.description || 'ソースの階層区分と収集間隔の定義'}
          </p>
        )}

        {tierDefinitions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-text-light">階層</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-text-light">説明</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-text-light">デフォルト間隔</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-text-light">カラー</th>
                </tr>
              </thead>
              <tbody>
                {tierDefinitions.map((tier) => (
                  <tr key={tier.tier} className="border-b border-border">
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 text-xs rounded border ${tierColor(tier.tier)}`}>
                        {tier.tier}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-text-muted">{tier.description}</td>
                    <td className="px-3 py-2 text-text-muted">{tier.default_interval}</td>
                    <td className="px-3 py-2 text-text-muted">{tier.color}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-text-light">階層定義が設定されていません。</p>
        )}
      </section>

      {/* Latest Scored Items */}
      <section className="rounded-[var(--radius-card)] border border-border bg-bg-card p-5 space-y-4">
        <h2 className="text-lg font-semibold font-heading text-text-deep">最新スコア済みアイテム</h2>
        <p className="text-xs text-text-light">NVAスコア上位20件を表示</p>

        <div className="space-y-3">
          {scoredItems
            .sort((a, b) => (b.nva_total ?? 0) - (a.nva_total ?? 0))
            .map((item) => (
              <div key={item.id} className="rounded border border-border bg-bg-cream p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-text-deep truncate">
                        {item.title}
                      </h3>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent-leaf hover:text-accent-moss text-xs flex-shrink-0"
                        >
                          &#x2197;
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-text-light">
                      {item.source?.name || 'Unknown'}
                      {item.classification && ` / ${item.classification}`}
                      {item.scored_at && ` / ${formatDateTime(item.scored_at)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-1 text-xs rounded border ${tierColor(item.source_tier)}`}>
                      {item.source_tier}
                    </span>
                    <span className="text-lg font-bold text-text-deep">
                      {item.nva_total ?? '--'}
                    </span>
                  </div>
                </div>

                {/* NVA Mini Bar Chart */}
                <div className="grid grid-cols-5 gap-2">
                  <NvaBar label="Social" score={item.nva_social} />
                  <NvaBar label="Media" score={item.nva_media} />
                  <NvaBar label="Community" score={item.nva_community} />
                  <NvaBar label="Technical" score={item.nva_technical} />
                  <NvaBar label="Solo Rel." score={item.nva_solo_relevance} />
                </div>
              </div>
            ))}

          {scoredItems.length === 0 && (
            <p className="rounded border border-border bg-bg-cream px-3 py-4 text-sm text-text-light">
              スコア済みアイテムがまだありません。
            </p>
          )}
        </div>
      </section>
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

function NvaBar({ label, score }: { label: string; score: number | null }) {
  const displayScore = score ?? 0;
  const widthPercent = Math.min((displayScore / 20) * 100, 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wide text-text-light">{label}</span>
        <span className="text-xs font-medium text-text-muted">{score != null ? score : '--'}</span>
      </div>
      <div className="h-2 rounded bg-bg-warm">
        <div
          style={{ width: `${widthPercent}%` }}
          className="h-2 rounded bg-accent-leaf"
        />
      </div>
    </div>
  );
}
