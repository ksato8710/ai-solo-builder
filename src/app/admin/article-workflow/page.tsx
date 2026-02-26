'use client';

import { useState, useCallback } from 'react';

export const dynamic = 'force-dynamic';

// ワークフロー定義
interface Phase {
  id: string;
  name: string;
  skill: string;
  description: string;
  isOptional: boolean;
  estimatedMinutes: number;
}

interface Workflow {
  id: string;
  name: string;
  code: string;
  cronSchedule: string;
  cronName: string;
  description: string;
  phases: Phase[];
  isActive: boolean;
}

// 初期データ（WORKFLOW-OVERVIEW.mdから）
const initialWorkflows: Workflow[] = [
  {
    id: 'digest-morning',
    name: '朝刊Digest',
    code: 'asb-morning-digest',
    cronSchedule: '30 7 * * *',
    cronName: 'asb-morning-digest',
    description: '過去24時間のニュースをTop10 + Top3形式でまとめる',
    isActive: true,
    phases: [
      {
        id: 'phase-0',
        name: 'Phase 0: 競合NL取得',
        skill: 'gmail',
        description: 'ktlabworks@gmailから競合ニュースレターを確認',
        isOptional: true,
        estimatedMinutes: 5,
      },
      {
        id: 'phase-1',
        name: 'Phase 1: ニュース収集',
        skill: 'news-research',
        description: 'ニュース収集・一次ソース確認・DB保存',
        isOptional: false,
        estimatedMinutes: 15,
      },
      {
        id: 'phase-2',
        name: 'Phase 2: 評価・選定',
        skill: 'news-evaluation',
        description: '期間フィルタ・スコアリング・Top10選定（20/25以上）',
        isOptional: false,
        estimatedMinutes: 10,
      },
      {
        id: 'phase-3',
        name: 'Phase 3: 記事作成',
        skill: 'digest-writer',
        description: 'Digest + Top3個別記事を作成',
        isOptional: false,
        estimatedMinutes: 20,
      },
      {
        id: 'phase-3.5',
        name: 'Phase 3.5: 画像エンリッチ',
        skill: 'article-image-enricher',
        description: '公式画像・適切なサムネイルを設定',
        isOptional: true,
        estimatedMinutes: 5,
      },
      {
        id: 'phase-4',
        name: 'Phase 4: 公開ゲート',
        skill: 'publish-gate',
        description: 'validate + sync + build + git push',
        isOptional: false,
        estimatedMinutes: 5,
      },
      {
        id: 'phase-5',
        name: 'Phase 5: X投稿',
        skill: 'x-publisher',
        description: '記事公開後のX告知',
        isOptional: true,
        estimatedMinutes: 3,
      },
      {
        id: 'phase-6',
        name: 'Phase 6: Slack報告',
        skill: 'slack-thread-report',
        description: '#tifa に完了報告',
        isOptional: false,
        estimatedMinutes: 2,
      },
    ],
  },
  {
    id: 'midday-editorial',
    name: '平日編集枠',
    code: 'asb-midday-editorial',
    cronSchedule: '30 12 * * 1-5',
    cronName: 'asb-midday-editorial',
    description: '曜日別テーマで深掘り記事を作成',
    isActive: true,
    phases: [
      {
        id: 'phase-1',
        name: 'Phase 1: テーマ選定',
        skill: 'manual',
        description: '月木=dev-knowledge, 火金=case-study, 水=product更新',
        isOptional: false,
        estimatedMinutes: 5,
      },
      {
        id: 'phase-2',
        name: 'Phase 2: リサーチ',
        skill: 'web_search',
        description: '一次ソース調査・競合分析',
        isOptional: false,
        estimatedMinutes: 20,
      },
      {
        id: 'phase-3',
        name: 'Phase 3: 記事執筆',
        skill: 'article-writer',
        description: '8,000〜20,000字の深掘り記事',
        isOptional: false,
        estimatedMinutes: 30,
      },
      {
        id: 'phase-4',
        name: 'Phase 4: 品質チェック',
        skill: 'article-quality-check',
        description: '投稿前の品質確認',
        isOptional: false,
        estimatedMinutes: 5,
      },
      {
        id: 'phase-5',
        name: 'Phase 5: 画像エンリッチ',
        skill: 'article-image-enricher',
        description: '公式画像・適切なサムネイルを設定',
        isOptional: true,
        estimatedMinutes: 5,
      },
      {
        id: 'phase-6',
        name: 'Phase 6: 公開ゲート',
        skill: 'publish-gate',
        description: 'validate + sync + build + git push',
        isOptional: false,
        estimatedMinutes: 5,
      },
      {
        id: 'phase-7',
        name: 'Phase 7: X投稿',
        skill: 'x-publisher',
        description: '記事公開後のX告知',
        isOptional: true,
        estimatedMinutes: 3,
      },
    ],
  },
  {
    id: 'breaking-news',
    name: '速報監視',
    code: 'asb-breaking-news-watch',
    cronSchedule: '0,30 7-23 * * *',
    cronName: 'asb-breaking-news-watch',
    description: '30分ごとに重大ニュースを監視',
    isActive: true,
    phases: [
      {
        id: 'phase-1',
        name: 'Phase 1: ソース監視',
        skill: 'news-research',
        description: '主要ソースの新着を確認',
        isOptional: false,
        estimatedMinutes: 5,
      },
      {
        id: 'phase-2',
        name: 'Phase 2: 重要度判定',
        skill: 'news-evaluation',
        description: '速報基準を満たすか判定',
        isOptional: false,
        estimatedMinutes: 3,
      },
      {
        id: 'phase-3',
        name: 'Phase 3: 速報作成',
        skill: 'breaking-news-writer',
        description: '速報記事を作成（該当時のみ）',
        isOptional: true,
        estimatedMinutes: 10,
      },
    ],
  },
  {
    id: 'newsletter-curation',
    name: 'ニュースレター構築',
    code: 'newsletter-curation',
    cronSchedule: '0 7 * * *',
    cronName: 'newsletter-curation',
    description: '競合NLを検知レイヤーとして活用し、独自NLを構築',
    isActive: true,
    phases: [
      {
        id: 'phase-1',
        name: 'Phase 1: 検知',
        skill: 'gmail',
        description: 'ktlabworks@gmail.comで競合NLを受信確認、複数レター横断チェック',
        isOptional: false,
        estimatedMinutes: 10,
      },
      {
        id: 'phase-2',
        name: 'Phase 2: 一次情報検証',
        skill: 'web_search',
        description: '公式発表・原典で事実確認、数値・日付・機能差分を検証',
        isOptional: false,
        estimatedMinutes: 15,
      },
      {
        id: 'phase-3',
        name: 'Phase 3: 日本語ローカライズ',
        skill: 'web_search',
        description: 'JP一次/JP編集メディアで国内文脈を補完',
        isOptional: false,
        estimatedMinutes: 10,
      },
      {
        id: 'phase-4',
        name: 'Phase 4: 記事種別振り分け',
        skill: 'manual',
        description: 'digest/news(dev-knowledge/case-study)/productに振り分け',
        isOptional: false,
        estimatedMinutes: 5,
      },
      {
        id: 'phase-5',
        name: 'Phase 5: コンテンツ作成',
        skill: 'digest-writer',
        description: '統一フォーマットで出力（EN公式+JP解説の2リンク必須）',
        isOptional: false,
        estimatedMinutes: 20,
      },
      {
        id: 'phase-6',
        name: 'Phase 6: 配信前チェック',
        skill: 'publish-gate',
        description: 'ガードレール確認、unsubscribeヘッダー、重複送信防止',
        isOptional: false,
        estimatedMinutes: 5,
      },
      {
        id: 'phase-7',
        name: 'Phase 7: ニュースレター配信',
        skill: 'send-newsletter',
        description: 'Resend経由で購読者にメール送信（/api/cron/send-newsletter）',
        isOptional: false,
        estimatedMinutes: 3,
      },
    ],
  },
];

function PhaseCard({
  phase,
  index,
  onToggleOptional,
  onUpdateMinutes,
}: {
  phase: Phase;
  index: number;
  onToggleOptional: () => void;
  onUpdateMinutes: (minutes: number) => void;
}) {
  return (
    <div
      className={`relative flex items-start gap-4 rounded-lg border p-4 ${
        phase.isOptional
          ? 'border-border/50 bg-bg-warm/50'
          : 'border-accent-leaf/40 bg-accent-leaf/5'
      }`}
    >
      {/* 接続線 */}
      {index > 0 && (
        <div className="absolute -top-4 left-8 h-4 w-0.5 bg-border" />
      )}
      
      {/* フェーズ番号 */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          phase.isOptional
            ? 'bg-bg-warm text-text-muted'
            : 'bg-accent-leaf text-white'
        }`}
      >
        {index + 1}
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-text-deep">{phase.name}</h4>
          {phase.isOptional && (
            <span className="rounded bg-bg-warm px-1.5 py-0.5 text-[10px] text-text-muted">
              Optional
            </span>
          )}
        </div>
        <p className="text-sm text-text-muted mb-2">{phase.description}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded border border-cat-tool/40 bg-cat-tool/10 px-2 py-1 text-cat-tool">
            {phase.skill}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-text-light">⏱️</span>
            <input
              type="number"
              value={phase.estimatedMinutes}
              onChange={(e) => onUpdateMinutes(parseInt(e.target.value) || 0)}
              className="w-12 rounded border border-border bg-bg-warm px-1 py-0.5 text-center text-text-deep"
              min={1}
              max={120}
            />
            <span className="text-text-light">分</span>
          </div>
          <button
            onClick={onToggleOptional}
            className="text-text-muted hover:text-text-deep underline"
          >
            {phase.isOptional ? '必須にする' : '任意にする'}
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkflowCard({
  workflow,
  onUpdate,
}: {
  workflow: Workflow;
  onUpdate: (updated: Workflow) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const totalMinutes = workflow.phases.reduce((sum, p) => sum + p.estimatedMinutes, 0);
  const requiredMinutes = workflow.phases
    .filter((p) => !p.isOptional)
    .reduce((sum, p) => sum + p.estimatedMinutes, 0);

  const handleTogglePhaseOptional = useCallback(
    (phaseId: string) => {
      const updated = {
        ...workflow,
        phases: workflow.phases.map((p) =>
          p.id === phaseId ? { ...p, isOptional: !p.isOptional } : p
        ),
      };
      onUpdate(updated);
    },
    [workflow, onUpdate]
  );

  const handleUpdatePhaseMinutes = useCallback(
    (phaseId: string, minutes: number) => {
      const updated = {
        ...workflow,
        phases: workflow.phases.map((p) =>
          p.id === phaseId ? { ...p, estimatedMinutes: minutes } : p
        ),
      };
      onUpdate(updated);
    },
    [workflow, onUpdate]
  );

  const handleToggleActive = useCallback(() => {
    onUpdate({ ...workflow, isActive: !workflow.isActive });
  }, [workflow, onUpdate]);

  return (
    <article className="rounded-[var(--radius-card)] border border-border bg-bg-card overflow-hidden">
      {/* ヘッダー */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-bg-warm/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${
              workflow.isActive ? 'bg-accent-leaf' : 'bg-text-muted'
            }`}
          />
          <div>
            <h3 className="text-xl font-semibold font-heading text-text-deep">
              {workflow.name}
            </h3>
            <p className="text-sm text-text-muted">{workflow.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <p className="text-text-muted">
              <span className="font-mono text-cat-tool">{workflow.cronSchedule}</span>
            </p>
            <p className="text-xs text-text-light">
              {requiredMinutes}〜{totalMinutes}分
            </p>
          </div>
          <span className="text-text-muted">{expanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {/* フェーズ一覧 */}
      {expanded && (
        <div className="border-t border-border p-5 space-y-4">
          {/* メタ情報 */}
          <div className="flex flex-wrap gap-4 text-sm mb-4">
            <div className="flex items-center gap-2">
              <span className="text-text-light">cron名:</span>
              <code className="rounded bg-bg-warm px-2 py-1 text-xs text-text-deep">
                {workflow.cronName}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-light">フェーズ数:</span>
              <span className="text-text-deep">{workflow.phases.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-light">必須:</span>
              <span className="text-accent-leaf">
                {workflow.phases.filter((p) => !p.isOptional).length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-light">任意:</span>
              <span className="text-text-muted">
                {workflow.phases.filter((p) => p.isOptional).length}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleActive();
              }}
              className={`ml-auto rounded px-3 py-1 text-xs ${
                workflow.isActive
                  ? 'bg-danger/10 text-danger hover:bg-danger/20'
                  : 'bg-accent-leaf/10 text-accent-leaf hover:bg-accent-leaf/20'
              }`}
            >
              {workflow.isActive ? '無効化' : '有効化'}
            </button>
          </div>

          {/* フローチャート風表示 */}
          <div className="space-y-4">
            {workflow.phases.map((phase, index) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                index={index}
                onToggleOptional={() => handleTogglePhaseOptional(phase.id)}
                onUpdateMinutes={(minutes) =>
                  handleUpdatePhaseMinutes(phase.id, minutes)
                }
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

export default function ArticleWorkflowPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [hasChanges, setHasChanges] = useState(false);

  const handleUpdateWorkflow = useCallback((updated: Workflow) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === updated.id ? updated : w))
    );
    setHasChanges(true);
  }, []);

  const handleExportConfig = useCallback(() => {
    const config = {
      version: '1.0',
      updatedAt: new Date().toISOString(),
      workflows,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'article-workflow-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [workflows]);

  const totalPhases = workflows.reduce((sum, w) => sum + w.phases.length, 0);
  const activeWorkflows = workflows.filter((w) => w.isActive).length;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-text-deep">
            記事作成ワークフロー
          </h1>
          <p className="text-sm text-text-light mt-2">
            各ワークフローのフェーズ構成・スキル・所要時間を可視化・調整します。
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportConfig}
            className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-warm"
          >
            📥 設定をエクスポート
          </button>
          <a
            href="/admin"
            className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-warm"
          >
            ← 管理トップ
          </a>
        </div>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="ワークフロー" value={workflows.length} />
        <KpiCard label="有効" value={activeWorkflows} color="text-accent-leaf" />
        <KpiCard label="総フェーズ" value={totalPhases} />
        <KpiCard
          label="変更"
          value={hasChanges ? '未保存' : '保存済み'}
          isText
          color={hasChanges ? 'text-accent-bloom' : 'text-text-muted'}
        />
      </div>

      {/* 凡例 */}
      <div className="flex flex-wrap gap-4 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-accent-leaf" />
          <span>必須フェーズ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-bg-warm border border-border" />
          <span>任意フェーズ</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-cat-tool/40 bg-cat-tool/10 px-1.5 py-0.5 text-cat-tool">
            skill-name
          </span>
          <span>使用スキル</span>
        </div>
      </div>

      {/* ワークフロー一覧 */}
      <div className="space-y-6">
        {workflows.map((workflow) => (
          <WorkflowCard
            key={workflow.id}
            workflow={workflow}
            onUpdate={handleUpdateWorkflow}
          />
        ))}
      </div>

      {/* フッター */}
      <div className="text-center text-xs text-text-light pt-8">
        ワークフロー定義は{' '}
        <code className="rounded bg-bg-warm px-1">docs/operations/WORKFLOW-OVERVIEW.md</code>{' '}
        と同期されています
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  color = 'text-text-deep',
  isText = false,
}: {
  label: string;
  value: number | string;
  color?: string;
  isText?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-text-light">{label}</p>
      <p className={`mt-2 ${isText ? 'text-sm' : 'text-2xl'} font-bold ${color}`}>
        {value}
      </p>
    </div>
  );
}
