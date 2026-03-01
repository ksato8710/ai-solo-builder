'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MappingRole = 'detect' | 'verify' | 'localize' | 'benchmark';

interface SourceRef {
  id: string;
  name: string;
  domain: string | null;
  entity_kind: string | null;
  locale: string;
  credibility_score: number | null;
  is_active: boolean;
}

interface WorkflowMapping {
  workflow_id: string;
  source_id: string;
  role: MappingRole;
  priority: number;
  is_required: boolean;
  source: SourceRef | null;
}

interface Workflow {
  id: string;
  workflow_code: string;
  workflow_name: string;
  content_type: string;
  digest_edition: 'morning' | 'evening' | null;
  article_tag: string | null;
  objective: string;
  output_contract: string;
  is_active: boolean;
  mappings: WorkflowMapping[];
  mapping_summary: {
    detect: number;
    verify: number;
    localize: number;
    benchmark: number;
    total: number;
  };
}

// ---------------------------------------------------------------------------
// Cron schedule data (source of truth: vercel.json + API routes)
// ---------------------------------------------------------------------------

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  timeJST: string;
  frequency: string;
  endpoint: string;
  runner: 'vercel' | 'clawdbot' | 'manual';
  status: 'active' | 'available' | 'manual';
  description: string;
  details: string[];
}

const CRON_JOBS: CronJob[] = [
  {
    id: 'collect-sources',
    name: 'ソース自動収集',
    schedule: '0 6 * * *',
    timeJST: '15:00',
    frequency: '毎日',
    endpoint: '/api/cron/collect-sources',
    runner: 'vercel',
    status: 'active',
    description: 'アクティブなソースからRSS / API / Scrapeで記事を収集し、タイトルを日本語翻訳してDBに保存',
    details: [
      'source_crawl_configs のアクティブ設定を取得',
      'RSS / API / Scrape で各ソースをクロール',
      'URL重複排除 → collected_items に保存（status=new）',
      'タイトルを日本語翻訳（translateTitlesToJapanese）',
      'クロール結果を source_crawl_configs に記録',
    ],
  },
  {
    id: 'score-items',
    name: 'NVAスコアリング',
    schedule: '—',
    timeJST: '—',
    frequency: '手動',
    endpoint: '/api/cron/score-items',
    runner: 'manual',
    status: 'available',
    description: '未スコアの収集アイテムにNVA 5軸スコアリングを適用',
    details: [
      'scoring_config からスコアリング重みを取得',
      'collected_items の status=new を対象',
      '5軸スコアリング（social / media / community / technical / solo_relevance）',
      'スコア・分類・タグ・理由を更新、status=scored に遷移',
    ],
  },
  {
    id: 'send-newsletter',
    name: 'ニュースレター配信',
    schedule: '15 23 * * *',
    timeJST: '08:15',
    frequency: '毎日',
    endpoint: '/api/cron/send-newsletter',
    runner: 'vercel',
    status: 'active',
    description: '最新の朝刊Digestをアクティブな購読者にメール配信',
    details: [
      '当日配信済みチェック（重複防止）',
      '最新の morning digest を取得',
      'アクティブ購読者リストを取得',
      'Resend API でバッチ送信（50件/バッチ）',
      '配信ログを send_logs に記録',
    ],
  },
  {
    id: 'morning-digest',
    name: '朝刊Digest作成',
    schedule: '—',
    timeJST: '07:30 目標',
    frequency: '毎日（手動）',
    endpoint: 'Claude Code / Clawdbot',
    runner: 'clawdbot',
    status: 'manual',
    description: '5 Phase パイプラインで朝刊Digestを作成・公開',
    details: [
      'Phase 1: news-research — ソース巡回・候補収集',
      'Phase 2: news-evaluation — NVAスコアリング・Top10/Top3選定',
      'Phase 3: digest-writer — Digest + Top3個別記事作成',
      'Phase 4: content-optimizer — 表組み・視覚最適化',
      'Phase 5: publish-gate — 品質チェック・デプロイ・報告',
    ],
  },
  {
    id: 'individual-article',
    name: '個別記事作成',
    schedule: '—',
    timeJST: '不定期',
    frequency: '週2〜3本（手動）',
    endpoint: 'Claude Code / Clawdbot',
    runner: 'clawdbot',
    status: 'manual',
    description: 'dev-knowledge / case-study の深掘り記事を作成',
    details: [
      'Phase 1-4: リサーチ・評価・設計・執筆（手動主体）',
      'Phase 5: content-optimizer — レイアウト最適化',
      'Phase 6: publish-gate — 品質チェック・デプロイ',
    ],
  },
];

// ---------------------------------------------------------------------------
// Timeline data
// ---------------------------------------------------------------------------

interface TimelineEntry {
  time: string;
  cronId: string;
  label: string;
  color: string;
}

const TIMELINE: TimelineEntry[] = [
  { time: '07:30', cronId: 'morning-digest', label: '朝刊Digest作成（手動）', color: 'bg-accent-bloom' },
  { time: '08:00', cronId: 'morning-digest', label: '→ 公開完了 目標', color: 'bg-accent-bloom/60' },
  { time: '08:15', cronId: 'send-newsletter', label: 'ニュースレター配信', color: 'bg-accent-leaf' },
  { time: '15:00', cronId: 'collect-sources', label: 'ソース自動収集', color: 'bg-accent-bark' },
];

// ---------------------------------------------------------------------------
// Pipeline phases
// ---------------------------------------------------------------------------

interface PipelinePhase {
  phase: number;
  name: string;
  skill: string;
  description: string;
  automated: boolean;
}

const DIGEST_PIPELINE: PipelinePhase[] = [
  { phase: 1, name: '調査', skill: 'news-research', description: 'ソース巡回・候補収集・DB保存', automated: false },
  { phase: 2, name: '評価', skill: 'news-evaluation', description: '期間フィルタ・NVA・Top10/Top3選定', automated: false },
  { phase: 3, name: '記事作成', skill: 'digest-writer', description: 'Digest + Top3個別記事執筆', automated: false },
  { phase: 4, name: 'UI最適化', skill: 'content-optimizer', description: '表組み・視覚的メリハリ改善', automated: false },
  { phase: 5, name: '公開', skill: 'publish-gate', description: '品質チェック・デプロイ・報告', automated: false },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadge(status: CronJob['status']) {
  switch (status) {
    case 'active':
      return { label: '稼働中', className: 'border-accent-leaf/40 bg-accent-leaf/15 text-accent-leaf' };
    case 'available':
      return { label: 'API実装済', className: 'border-accent-bark/40 bg-accent-bark/15 text-accent-bark' };
    case 'manual':
      return { label: '手動実行', className: 'border-accent-bloom/40 bg-accent-bloom/15 text-accent-bloom' };
  }
}

function runnerBadge(runner: CronJob['runner']) {
  switch (runner) {
    case 'vercel':
      return { label: 'Vercel Cron', className: 'border-border bg-bg-warm text-text-deep' };
    case 'clawdbot':
      return { label: 'Claude Code', className: 'border-accent-bloom/30 bg-accent-bloom/10 text-accent-bloom' };
    case 'manual':
      return { label: '手動API', className: 'border-border bg-bg-warm text-text-muted' };
  }
}

function roleLabel(role: MappingRole): string {
  switch (role) {
    case 'detect': return '検知';
    case 'verify': return '一次検証';
    case 'localize': return '日本語ローカライズ';
    case 'benchmark': return '補助ベンチマーク';
    default: return role;
  }
}

function roleColor(role: MappingRole): string {
  switch (role) {
    case 'detect': return 'border-accent-bark/40 bg-accent-bark/10 text-accent-bark';
    case 'verify': return 'border-accent-leaf/40 bg-accent-leaf/10 text-accent-leaf';
    case 'localize': return 'border-cat-tool/40 bg-cat-tool/10 text-cat-tool';
    case 'benchmark': return 'border-accent-bloom/40 bg-accent-bloom/10 text-accent-bloom';
    default: return 'border-border bg-bg-warm text-text-muted';
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

type SectionTab = 'overview' | 'pipeline' | 'source-mapping';

export default function WorkflowsAdminPage() {
  const [activeTab, setActiveTab] = useState<SectionTab>('overview');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [wfLoading, setWfLoading] = useState(false);
  const [wfError, setWfError] = useState<string | null>(null);
  const [expandedCron, setExpandedCron] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    try {
      setWfLoading(true);
      setWfError(null);
      const res = await fetch('/api/admin/workflows');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setWorkflows(data.workflows ?? []);
    } catch (e) {
      setWfError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setWfLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'source-mapping') {
      void fetchWorkflows();
    }
  }, [activeTab, fetchWorkflows]);

  const cronStats = useMemo(() => {
    const active = CRON_JOBS.filter((j) => j.status === 'active').length;
    const available = CRON_JOBS.filter((j) => j.status === 'available').length;
    const manual = CRON_JOBS.filter((j) => j.status === 'manual').length;
    return { active, available, manual, total: CRON_JOBS.length };
  }, []);

  const tabs: { key: SectionTab; label: string }[] = [
    { key: 'overview', label: 'Cronスケジュール' },
    { key: 'pipeline', label: 'Digestパイプライン' },
    { key: 'source-mapping', label: 'ソースマッピング' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-text-deep">ワークフロー管理</h1>
          <p className="text-sm text-text-light mt-2">
            Cronスケジュール・記事パイプライン・ソースマッピングの全体像
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/admin/source-intelligence"
            className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-warm"
          >
            Source管理
          </a>
          <a
            href="/admin/collected-items"
            className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-warm"
          >
            収集データ
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="全ジョブ" value={cronStats.total} accent="text-text-deep" />
        <StatCard label="Vercel Cron 稼働中" value={cronStats.active} accent="text-accent-leaf" />
        <StatCard label="API実装済（未スケジュール）" value={cronStats.available} accent="text-accent-bark" />
        <StatCard label="手動実行" value={cronStats.manual} accent="text-accent-bloom" />
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-lg border border-border bg-bg-warm p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-bg-card text-text-deep shadow-sm'
                : 'text-text-muted hover:text-text-deep hover:bg-bg-cream/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <OverviewTab
          expandedCron={expandedCron}
          onToggleCron={(id) => setExpandedCron((prev) => (prev === id ? null : id))}
        />
      )}
      {activeTab === 'pipeline' && <PipelineTab />}
      {activeTab === 'source-mapping' && (
        <SourceMappingTab workflows={workflows} loading={wfLoading} error={wfError} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Overview (Cron Schedule)
// ---------------------------------------------------------------------------

function OverviewTab({
  expandedCron,
  onToggleCron,
}: {
  expandedCron: string | null;
  onToggleCron: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Daily timeline */}
      <section className="rounded-[var(--radius-card)] border border-border bg-bg-card p-5">
        <h2 className="text-lg font-semibold font-heading text-text-deep mb-4">日次タイムライン（JST）</h2>
        <div className="relative pl-6">
          <div className="absolute left-2.5 top-0 bottom-0 w-px bg-border" />
          {TIMELINE.map((entry, i) => (
            <div key={i} className="relative flex items-start gap-4 pb-5 last:pb-0">
              <div className={`absolute left-[-14px] top-1.5 w-3 h-3 rounded-full ${entry.color} ring-2 ring-bg-card`} />
              <span className="w-14 shrink-0 text-sm font-mono font-semibold text-text-deep">{entry.time}</span>
              <div className="text-sm text-text-muted">
                {entry.label}
                <span className="ml-2 text-xs text-text-light">
                  ({CRON_JOBS.find((j) => j.id === entry.cronId)?.runner === 'vercel' ? 'Vercel Cron' : '手動'})
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cron job cards */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold font-heading text-text-deep">ジョブ一覧</h2>
        {CRON_JOBS.map((job) => {
          const sBadge = statusBadge(job.status);
          const rBadge = runnerBadge(job.runner);
          const isExpanded = expandedCron === job.id;

          return (
            <div key={job.id} className="rounded-[var(--radius-card)] border border-border bg-bg-card">
              <button
                onClick={() => onToggleCron(job.id)}
                className="w-full text-left p-4 flex items-start justify-between gap-4 hover:bg-bg-cream/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="text-base font-semibold text-text-deep">{job.name}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${sBadge.className}`}>
                      {sBadge.label}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${rBadge.className}`}>
                      {rBadge.label}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted">{job.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-mono font-bold text-text-deep">{job.timeJST}</p>
                  <p className="text-xs text-text-light">{job.frequency}</p>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border px-4 py-4 bg-bg-cream/20 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="rounded border border-border bg-bg-warm p-3">
                      <p className="text-xs text-text-light uppercase tracking-wide mb-1">エンドポイント</p>
                      <p className="font-mono text-text-deep text-xs break-all">{job.endpoint}</p>
                    </div>
                    <div className="rounded border border-border bg-bg-warm p-3">
                      <p className="text-xs text-text-light uppercase tracking-wide mb-1">Cron式</p>
                      <p className="font-mono text-text-deep text-xs">{job.schedule}</p>
                    </div>
                    <div className="rounded border border-border bg-bg-warm p-3">
                      <p className="text-xs text-text-light uppercase tracking-wide mb-1">スケジュール</p>
                      <p className="text-text-deep text-xs">{job.frequency} {job.timeJST} JST</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-deep mb-2">処理ステップ:</p>
                    <ol className="space-y-1">
                      {job.details.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                          <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-bg-warm text-xs font-semibold text-text-deep">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Data flow diagram */}
      <section className="rounded-[var(--radius-card)] border border-border bg-bg-card p-5">
        <h2 className="text-lg font-semibold font-heading text-text-deep mb-4">データフロー</h2>
        <div className="font-mono text-xs text-text-muted leading-relaxed whitespace-pre overflow-x-auto">
{`15:00 JST  collect-sources (Vercel Cron)
  │  source_crawl_configs → RSS/API/Scrape → 重複排除 → タイトル翻訳
  ▼
collected_items (status=new)
  │
  │  score-items (手動トリガー)
  │  scoring_config → NVA 5軸 → スコア・分類・タグ付け
  ▼
collected_items (status=scored)
  │
  │  朝刊Digest作成 (Claude Code / 手動)
  │  Phase 1-5: 調査 → 評価 → 執筆 → UI最適化 → 公開
  ▼
contents テーブル + 本番サイト公開
  │
  │  08:15 JST  send-newsletter (Vercel Cron)
  │  最新digest → 購読者リスト → Resend API → バッチ送信
  ▼
newsletter 配信完了`}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Pipeline
// ---------------------------------------------------------------------------

function PipelineTab() {
  return (
    <div className="space-y-6">
      {/* Digest pipeline */}
      <section className="rounded-[var(--radius-card)] border border-border bg-bg-card p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold font-heading text-text-deep">朝刊Digest パイプライン</h2>
          <p className="text-sm text-text-light mt-1">
            07:30 開始 → 08:00 公開目標。現在は Claude Code / Clawdbot による手動実行。
          </p>
        </div>

        <div className="space-y-3">
          {DIGEST_PIPELINE.map((phase, i) => (
            <div key={phase.phase} className="flex items-start gap-3">
              {/* Phase number + connector */}
              <div className="shrink-0 flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-accent-bloom/15 border border-accent-bloom/40 flex items-center justify-center">
                  <span className="text-sm font-bold text-accent-bloom">{phase.phase}</span>
                </div>
                {i < DIGEST_PIPELINE.length - 1 && (
                  <div className="w-px h-6 bg-border mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 rounded-lg border border-border bg-bg-cream/30 p-3">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-text-deep">{phase.name}</h3>
                  <span className="px-2 py-0.5 text-xs rounded border border-accent-bloom/30 bg-accent-bloom/10 text-accent-bloom font-mono">
                    {phase.skill}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded border ${
                    phase.automated
                      ? 'border-accent-leaf/40 bg-accent-leaf/15 text-accent-leaf'
                      : 'border-border bg-bg-warm text-text-muted'
                  }`}>
                    {phase.automated ? '自動' : '手動'}
                  </span>
                </div>
                <p className="text-sm text-text-muted">{phase.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Individual articles */}
      <section className="rounded-[var(--radius-card)] border border-border bg-bg-card p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold font-heading text-text-deep">個別記事パイプライン</h2>
          <p className="text-sm text-text-light mt-1">
            dev-knowledge / case-study。週2〜3本、不定期。リサーチは手動主体。
          </p>
        </div>
        <div className="space-y-2">
          {[
            { phase: '1-4', name: 'リサーチ・設計・執筆', skill: '手動', desc: '深いリサーチ・評価・独自価値の設計・執筆' },
            { phase: '5', name: 'UI最適化', skill: 'content-optimizer', desc: '表組み・視覚的メリハリ改善' },
            { phase: '6', name: '公開', skill: 'publish-gate', desc: '品質チェック・デプロイ・報告' },
          ].map((item) => (
            <div key={item.phase} className="flex items-center gap-3 rounded-lg border border-border bg-bg-cream/30 p-3">
              <span className="shrink-0 w-9 h-9 rounded-full bg-cat-tool/15 border border-cat-tool/40 flex items-center justify-center text-sm font-bold text-cat-tool">
                {item.phase}
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-text-deep">{item.name}</span>
                  <span className="px-2 py-0.5 text-xs rounded border border-cat-tool/30 bg-cat-tool/10 text-cat-tool font-mono">
                    {item.skill}
                  </span>
                </div>
                <p className="text-sm text-text-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skill reference */}
      <section className="rounded-[var(--radius-card)] border border-border bg-bg-card p-5">
        <h2 className="text-lg font-semibold font-heading text-text-deep mb-4">スキル一覧</h2>
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-sm">
            <thead className="bg-bg-cream/60">
              <tr>
                <th className="px-3 py-2.5 text-left font-semibold text-text-light">スキル</th>
                <th className="px-3 py-2.5 text-left font-semibold text-text-light">Digest</th>
                <th className="px-3 py-2.5 text-left font-semibold text-text-light">個別記事</th>
                <th className="px-3 py-2.5 text-left font-semibold text-text-light">説明</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { skill: 'news-research', digest: 'Phase 1', individual: '—', desc: 'ソース巡回・一次ソース確認・DB保存' },
                { skill: 'news-evaluation', digest: 'Phase 2', individual: '—', desc: '期間フィルタ・NVAスコア・Top10選定' },
                { skill: 'digest-writer', digest: 'Phase 3', individual: '—', desc: 'Digest + Top3個別記事執筆' },
                { skill: 'content-optimizer', digest: 'Phase 4', individual: 'Phase 5', desc: '表組み最適化・視覚的メリハリ改善' },
                { skill: 'publish-gate', digest: 'Phase 5', individual: 'Phase 6', desc: '品質チェック・デプロイ・Slack報告' },
                { skill: 'article-quality-check', digest: '全Phase', individual: '全Phase', desc: '投稿前の品質チェック' },
                { skill: 'site-checker', digest: '公開後', individual: '公開後', desc: '公開後のUI確認（PC+モバイル）' },
              ].map((row) => (
                <tr key={row.skill}>
                  <td className="px-3 py-2 font-mono text-xs text-text-deep">{row.skill}</td>
                  <td className="px-3 py-2 text-xs text-text-muted">{row.digest}</td>
                  <td className="px-3 py-2 text-xs text-text-muted">{row.individual}</td>
                  <td className="px-3 py-2 text-xs text-text-muted">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Source Mapping (existing DB-based workflow → source)
// ---------------------------------------------------------------------------

function SourceMappingTab({
  workflows,
  loading,
  error,
}: {
  workflows: Workflow[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return <div className="text-sm text-text-muted">Loading workflow mappings...</div>;
  }

  if (error) {
    return (
      <div className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
        {error}
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-border bg-bg-card px-4 py-6 text-sm text-text-muted">
        ワークフローのソースマッピングが設定されていません。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-light">
        各ワークフローに対するソースの役割（検知・検証・ローカライズ・ベンチマーク）マッピング。
      </p>
      {workflows.map((workflow) => {
        const grouped = workflow.mappings.reduce<Record<MappingRole, WorkflowMapping[]>>(
          (acc, m) => {
            acc[m.role] = acc[m.role] || [];
            acc[m.role].push(m);
            return acc;
          },
          { detect: [], verify: [], localize: [], benchmark: [] }
        );

        return (
          <article
            key={workflow.id}
            className="rounded-[var(--radius-card)] border border-border bg-bg-card p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold font-heading text-text-deep">{workflow.workflow_name}</h2>
              <span className="rounded border border-border bg-bg-warm px-2 py-0.5 text-xs text-text-muted">
                {workflow.workflow_code}
              </span>
              {!workflow.is_active && (
                <span className="rounded border border-danger/40 bg-danger/10 px-2 py-0.5 text-xs text-danger">
                  Inactive
                </span>
              )}
            </div>
            {workflow.objective && (
              <p className="text-sm text-text-muted">{workflow.objective}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {(['detect', 'verify', 'localize', 'benchmark'] as MappingRole[]).map((role) => (
                <div key={role} className={`rounded-lg border p-3 ${roleColor(role)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide">{roleLabel(role)}</h3>
                    <span className="text-xs">{grouped[role].length}</span>
                  </div>
                  <div className="space-y-2">
                    {grouped[role].length === 0 && (
                      <p className="text-xs opacity-80">No source mapped.</p>
                    )}
                    {grouped[role]
                      .sort((a, b) => b.priority - a.priority)
                      .map((mapping) => (
                        <div key={`${mapping.source_id}-${mapping.role}`} className="rounded bg-black/10 p-2">
                          <p className="text-xs font-medium text-text-deep">{mapping.source?.name || 'Unknown'}</p>
                          <p className="text-[11px] opacity-80 break-all">{mapping.source?.domain || '—'}</p>
                          <p className="text-[11px] opacity-80">
                            priority: {mapping.priority}{mapping.is_required ? ' / required' : ''}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-text-light">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}
