'use client';

import { useState } from 'react';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header + Status */}
      <div>
        <h1 className="text-3xl font-bold font-heading text-text-deep mb-3">
          管理画面
        </h1>
        <StatusBar />
      </div>

      {/* Management Tools — Primary Content */}
      <section>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          管理ツール
        </h2>
        <ToolCards />
      </section>

      {/* System Reference — Secondary */}
      <section>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          システムリファレンス
        </h2>
        <ReferenceSection />
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status Bar — compact horizontal indicators
// ---------------------------------------------------------------------------

function StatusBar() {
  const indicators = [
    { label: '収集パイプライン', value: '稼働中', color: 'bg-accent-moss' },
    { label: '朝刊配信', value: 'アクティブ', color: 'bg-accent-leaf' },
    { label: 'NVAスコアリング', value: '自動', color: 'bg-accent-leaf' },
    { label: 'データソース', value: 'DB-first', color: 'bg-accent-bloom' },
  ];

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-muted">
      {indicators.map((ind) => (
        <div key={ind.label} className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${ind.color}`} />
          <span className="text-text-light">{ind.label}:</span>
          <span className="font-medium text-text-deep">{ind.value}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tool Cards — clickable grid to each admin sub-page
// ---------------------------------------------------------------------------

function ToolCards() {
  const tools = [
    {
      href: '/admin/collected-items',
      title: '収集データ管理',
      desc: 'RSS / API / スクレイプで自動収集したニュースの一覧・フィルタ・手動編集',
      accent: 'border-accent-moss/40 hover:border-accent-moss',
      badge: 'collected_items',
      badgeColor: 'bg-accent-moss/15 text-accent-moss',
    },
    {
      href: '/admin/scoring',
      title: 'スコアリング',
      desc: 'NVA 5軸スコアの統計・分布確認、重み設定の調整',
      accent: 'border-accent-bloom/40 hover:border-accent-bloom',
      badge: 'scoring_config',
      badgeColor: 'bg-accent-bloom/15 text-accent-bloom',
    },
    {
      href: '/admin/source-intelligence',
      title: 'Source Intelligence',
      desc: '一次 / 二次 / 三次の 3 階層ソースの統合管理・Tier 分析',
      accent: 'border-accent-bark/40 hover:border-accent-bark',
      badge: 'sources',
      badgeColor: 'bg-accent-bark/15 text-accent-bark',
    },
    {
      href: '/admin/workflows',
      title: 'ワークフロー管理',
      desc: '記事種別 × ソースの役割（detect / verify / localize）を可視化',
      accent: 'border-accent-leaf/40 hover:border-accent-leaf',
      badge: 'workflows',
      badgeColor: 'bg-accent-leaf/15 text-accent-leaf',
    },
    {
      href: '/admin/sources',
      title: 'Legacy 情報源',
      desc: '旧 content_sources テーブル（互換運用）',
      accent: 'border-border hover:border-text-light',
      badge: 'legacy',
      badgeColor: 'bg-bg-warm text-text-muted',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tools.map((tool) => (
        <a
          key={tool.href}
          href={tool.href}
          className={`group block p-5 bg-bg-card border-2 ${tool.accent} rounded-[var(--radius-card)] transition-all hover:shadow-sm`}
        >
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold font-heading text-text-deep group-hover:text-accent-leaf transition-colors">
              {tool.title}
            </h3>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${tool.badgeColor}`}>
              {tool.badge}
            </span>
          </div>
          <p className="text-sm text-text-light leading-relaxed">{tool.desc}</p>
        </a>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reference Section — collapsible panels
// ---------------------------------------------------------------------------

function ReferenceSection() {
  return (
    <div className="space-y-3">
      <CollapsiblePanel title="データパイプライン" defaultOpen>
        <PipelineReference />
      </CollapsiblePanel>
      <CollapsiblePanel title="スキル一覧">
        <SkillsReference />
      </CollapsiblePanel>
      <CollapsiblePanel title="技術アーキテクチャ">
        <ArchitectureReference />
      </CollapsiblePanel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collapsible Panel
// ---------------------------------------------------------------------------

function CollapsiblePanel({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-[var(--radius-card)] bg-bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-bg-warm transition-colors"
      >
        <span className="font-semibold font-heading text-sm text-text-deep">
          {title}
        </span>
        <span className="text-text-light text-xs transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>
          ▼
        </span>
      </button>
      {open && <div className="px-5 pb-5 border-t border-border">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline Reference
// ---------------------------------------------------------------------------

function PipelineReference() {
  return (
    <div className="pt-4 space-y-5">
      {/* Data flow */}
      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">データフロー</h4>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[
            { label: '自動収集', sub: 'RSS/API/Scrape', color: 'bg-accent-leaf' },
            { label: 'NVAスコアリング', sub: '5軸 0-100', color: 'bg-accent-moss' },
            { label: '記事選定・作成', sub: 'スコア上位', color: 'bg-accent-bloom' },
            { label: 'DB保存', sub: 'Supabase', color: 'bg-accent-bark' },
            { label: 'Web配信', sub: 'Next.js SSG', color: 'bg-cat-content' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-text-light">→</span>}
              <div className="flex items-center gap-1.5 bg-bg-warm px-3 py-1.5 rounded-lg">
                <span className={`w-1.5 h-1.5 rounded-full ${step.color}`} />
                <span className="text-text-deep font-medium">{step.label}</span>
                <span className="text-text-light text-xs">({step.sub})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule + Stats side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Cron スケジュール</h4>
          <div className="text-sm space-y-1.5 text-text-muted">
            <div className="flex justify-between"><span className="font-mono">06:00</span><span>collect-sources（自動収集 + スコアリング）</span></div>
            <div className="flex justify-between"><span className="font-mono">23:15</span><span>send-newsletter</span></div>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">システム概要</h4>
          <div className="text-sm space-y-1.5 text-text-muted">
            <div className="flex justify-between"><span>ソース階層:</span><span>一次 / 二次 / 三次（124ソース）</span></div>
            <div className="flex justify-between"><span>配信タイプ:</span><span>news / product / digest</span></div>
            <div className="flex justify-between"><span>Digest:</span><span>朝刊（毎日）</span></div>
          </div>
        </div>
      </div>

      {/* NVA axes */}
      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">NVA 5軸スコアリング</h4>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { axis: 'social', weight: '1.0', desc: 'SNS反応' },
            { axis: 'media', weight: '1.0', desc: 'メディア報道量' },
            { axis: 'community', weight: '1.0', desc: 'コミュニティ話題度' },
            { axis: 'technical', weight: '1.0', desc: '技術的インパクト' },
            { axis: 'solo_relevance', weight: '1.5', desc: 'ソロ開発者への関連度' },
          ].map((a) => (
            <div key={a.axis} className="bg-bg-warm px-3 py-2 rounded-lg border border-border">
              <div className="font-mono font-semibold text-text-deep">{a.axis}</div>
              <div className="text-text-light">{a.desc} (×{a.weight})</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skills Reference
// ---------------------------------------------------------------------------

function SkillsReference() {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [skillContent, setSkillContent] = useState<string>('');

  const skills = [
    { name: 'news-research', phase: 'Phase 1', desc: 'ニュース収集・一次ソース確認・DB保存' },
    { name: 'news-evaluation', phase: 'Phase 2', desc: '期間フィルタ・スコア評価・Top10選定' },
    { name: 'digest-writer', phase: 'Phase 3', desc: 'Digest + Top3記事作成' },
    { name: 'content-optimizer', phase: 'Phase 4', desc: '記事の見せ方を最適化' },
    { name: 'publish-gate', phase: 'Phase 5', desc: 'チェックリスト照合・デプロイ' },
    { name: 'article-writer', phase: '個別記事', desc: 'SEO最適化された記事を作成・投稿' },
    { name: 'newsletter-curation-workflow', phase: '横断', desc: 'ニュースレター検知→一次情報検証→ローカライズ' },
  ];

  const loadSkillContent = async (skillName: string) => {
    try {
      const response = await fetch(`/api/admin/skills/${skillName}`);
      const content = response.ok
        ? await response.text()
        : 'スキルファイルの読み込みに失敗しました。';
      setSkillContent(content);
      setSelectedSkill(skillName);
    } catch {
      setSkillContent('スキルファイルの読み込み中にエラーが発生しました。');
      setSelectedSkill(skillName);
    }
  };

  if (selectedSkill) {
    return (
      <div className="pt-4 space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedSkill(null)}
            className="text-sm text-accent-leaf hover:underline"
          >
            ← 一覧に戻る
          </button>
          <span className="font-mono font-semibold text-text-deep">{selectedSkill}</span>
        </div>
        <div className="bg-bg-cream rounded-lg p-4 max-h-80 overflow-y-auto">
          <pre className="text-xs text-text-muted whitespace-pre-wrap font-mono leading-relaxed">
            {skillContent || 'ローディング中...'}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4">
      {/* Pipeline flow */}
      <div className="mb-4 bg-bg-cream rounded-lg p-3 font-mono text-xs text-text-muted">
        <span className="text-accent-moss">Digest:</span>{' '}
        news-research → news-evaluation → digest-writer → content-optimizer → publish-gate
        <br />
        <span className="text-accent-leaf">個別記事:</span>{' '}
        article-writer → content-optimizer → publish-gate
      </div>

      {/* Skill list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {skills.map((skill) => (
          <button
            key={skill.name}
            onClick={() => loadSkillContent(skill.name)}
            className="text-left p-3 bg-bg-warm rounded-lg border border-border hover:border-accent-leaf/50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-semibold text-text-deep">{skill.name}</span>
              <span className="text-[10px] bg-bg-card px-1.5 py-0.5 rounded text-text-muted">{skill.phase}</span>
            </div>
            <p className="text-xs text-text-light">{skill.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Architecture Reference
// ---------------------------------------------------------------------------

function ArchitectureReference() {
  return (
    <div className="pt-4 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tech Stack */}
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">技術スタック</h4>
          <div className="text-sm space-y-1.5">
            {[
              ['フロントエンド', 'Next.js (App Router)'],
              ['データベース', 'Supabase (PostgreSQL)'],
              ['ホスティング', 'Vercel'],
              ['自動化', 'Vercel Cron + スキルシステム'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-text-muted">
                <span className="text-text-light">{k}:</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key API Endpoints */}
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">主要エンドポイント</h4>
          <div className="space-y-1.5 text-xs font-mono">
            {[
              ['GET', '/api/v1/contents', 'accent-moss'],
              ['GET', '/api/v1/contents/[slug]', 'accent-moss'],
              ['POST', '/api/cron/collect-sources', 'accent-bloom'],
              ['GET', '/api/admin/collected-items', 'accent-leaf'],
              ['GET', '/api/admin/scoring-config', 'accent-leaf'],
            ].map(([method, path, color]) => (
              <div key={path} className="flex gap-2 text-text-muted">
                <span className={`text-${color} font-semibold w-10`}>{method}</span>
                <span>{path}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Structure */}
      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">プロジェクト構成</h4>
        <div className="bg-bg-cream rounded-lg p-3">
          <pre className="text-xs text-text-muted overflow-x-auto leading-relaxed">
{`src/
├── app/
│   ├── admin/                  # 管理画面
│   │   ├── collected-items/    # 収集データ管理
│   │   ├── scoring/            # スコアリング
│   │   └── source-intelligence/  # ソース分析
│   └── api/
│       ├── cron/collect-sources/   # 自動収集 Cron
│       ├── admin/collected-items/  # 収集データ API
│       ├── admin/scoring-config/   # スコアリング設定 API
│       └── v1/                     # 公開 API
├── lib/
│   ├── crawler.ts              # RSS/API/Scrapeクローラー
│   └── scorer.ts               # NVA ルールベーススコアラー
└── supabase/migrations/        # DBマイグレーション`}
          </pre>
        </div>
      </div>
    </div>
  );
}
