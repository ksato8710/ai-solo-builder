'use client';

import { useEffect, useMemo, useState } from 'react';

export const dynamic = 'force-dynamic';

type ContentType = 'news' | 'product' | 'digest';

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
  content_type: ContentType;
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

function roleLabel(role: MappingRole): string {
  switch (role) {
    case 'detect':
      return '検知';
    case 'verify':
      return '一次検証';
    case 'localize':
      return '日本語ローカライズ';
    case 'benchmark':
      return '補助ベンチマーク';
    default:
      return role;
  }
}

function roleColor(role: MappingRole): string {
  switch (role) {
    case 'detect':
      return 'border-violet-400/40 bg-violet-500/10 text-violet-200';
    case 'verify':
      return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200';
    case 'localize':
      return 'border-sky-400/40 bg-sky-500/10 text-sky-200';
    case 'benchmark':
      return 'border-amber-400/40 bg-amber-500/10 text-amber-200';
    default:
      return 'border-slate-500/40 bg-slate-500/10 text-slate-200';
  }
}

function contentTypeLabel(workflow: Workflow): string {
  if (workflow.content_type === 'digest') {
    return workflow.digest_edition === 'morning' ? 'Digest (Morning)' : 'Digest (Evening)';
  }

  if (workflow.content_type === 'news') {
    return workflow.article_tag ? `News (${workflow.article_tag})` : 'News';
  }

  return 'Product';
}

export default function WorkflowsAdminPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchWorkflows();
  }, []);

  const totals = useMemo(() => {
    return workflows.reduce(
      (acc, workflow) => {
        acc.workflows += 1;
        acc.mappings += workflow.mapping_summary.total;
        acc.detect += workflow.mapping_summary.detect;
        acc.verify += workflow.mapping_summary.verify;
        acc.localize += workflow.mapping_summary.localize;
        return acc;
      },
      { workflows: 0, mappings: 0, detect: 0, verify: 0, localize: 0 }
    );
  }, [workflows]);

  async function fetchWorkflows() {
    try {
      setLoading(true);
      setError(null);
      setNote(null);
      const response = await fetch('/api/admin/workflows');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch workflows');
      }

      setWorkflows(data.workflows || []);
      if (data.note) {
        setNote(data.note as string);
      }
    } catch (workflowError) {
      setError(workflowError instanceof Error ? workflowError.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(workflow: Workflow) {
    try {
      setSavingId(workflow.id);
      const response = await fetch('/api/admin/workflows', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: workflow.id,
          updates: {
            is_active: !workflow.is_active,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update workflow');
      }

      await fetchWorkflows();
    } catch (updateError) {
      alert(updateError instanceof Error ? updateError.message : 'Failed to update workflow');
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-300">Loading workflow matrix...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">記事作成ワークフロー管理</h1>
          <p className="text-sm text-slate-400 mt-2">
            ニュースソースと記事種別の関係を、検知・検証・ローカライズ役割ごとに可視化します。
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/admin/source-intelligence"
            className="inline-flex items-center rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/40"
          >
            Source管理
          </a>
          <a
            href="/admin/schedules"
            className="inline-flex items-center rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/40"
          >
            配信スケジュール
          </a>
          <a
            href="/admin/collection"
            className="inline-flex items-center rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/40"
          >
            受信ログ
          </a>
          <a
            href="/admin"
            className="inline-flex items-center rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/40"
          >
            ← 管理トップ
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="Workflow" value={totals.workflows} color="text-slate-100" />
        <KpiCard label="Mappings" value={totals.mappings} color="text-slate-100" />
        <KpiCard label="Detect" value={totals.detect} color="text-violet-200" />
        <KpiCard label="Verify" value={totals.verify} color="text-emerald-200" />
        <KpiCard label="Localize" value={totals.localize} color="text-sky-200" />
      </div>

      {note && (
        <div className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {note}
        </div>
      )}

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {workflows.map((workflow) => {
          const grouped = workflow.mappings.reduce<Record<MappingRole, WorkflowMapping[]>>(
            (acc, mapping) => {
              const role = mapping.role;
              acc[role] = acc[role] || [];
              acc[role].push(mapping);
              return acc;
            },
            {
              detect: [],
              verify: [],
              localize: [],
              benchmark: [],
            }
          );

          return (
            <article
              key={workflow.id}
              className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="text-xl font-semibold text-slate-100">{workflow.workflow_name}</h2>
                    <span className="rounded border border-slate-600 bg-slate-700 px-2 py-1 text-xs text-slate-200">
                      {workflow.workflow_code}
                    </span>
                    <span className="rounded border border-blue-400/40 bg-blue-500/10 px-2 py-1 text-xs text-blue-200">
                      {contentTypeLabel(workflow)}
                    </span>
                    {!workflow.is_active && (
                      <span className="rounded border border-red-400/40 bg-red-500/10 px-2 py-1 text-xs text-red-200">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{workflow.objective}</p>
                  <p className="text-xs text-slate-500 mt-2">Output: {workflow.output_contract}</p>
                </div>

                <button
                  onClick={() => void toggleActive(workflow)}
                  disabled={savingId === workflow.id}
                  className="rounded bg-slate-700 hover:bg-slate-600 px-3 py-2 text-xs text-slate-100 disabled:opacity-50"
                >
                  {workflow.is_active ? 'Disable' : 'Enable'}
                </button>
              </div>

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
                        .slice()
                        .sort((a, b) => b.priority - a.priority)
                        .map((mapping) => (
                          <div key={`${mapping.source_id}-${mapping.role}`} className="rounded bg-black/20 p-2">
                            <p className="text-xs font-medium text-white/90">{mapping.source?.name || 'Unknown source'}</p>
                            <p className="text-[11px] opacity-80 break-all">
                              {mapping.source?.domain || 'domain unavailable'}
                            </p>
                            <p className="text-[11px] opacity-80">
                              priority: {mapping.priority}
                              {mapping.is_required ? ' / required' : ''}
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
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
