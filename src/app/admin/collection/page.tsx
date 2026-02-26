'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

export const dynamic = 'force-dynamic';

interface SourceOption {
  id: string;
  name: string;
  domain: string | null;
  is_newsletter: boolean;
}

interface SourceListResponse {
  sources?: SourceOption[];
  error?: string;
}

interface ScheduleRow {
  id: string;
  source_id: string;
  schedule_name: string;
  is_active: boolean;
  source?: SourceOption;
}

interface ScheduleListResponse {
  schedules?: ScheduleRow[];
  error?: string;
}

interface ObservationRow {
  id: string;
  source_id: string;
  collector_inbox: string;
  observed_at: string;
  subject: string;
  from_email: string;
  message_id_header: string | null;
  gmail_thread_id: string | null;
  gmail_message_id: string | null;
  gmail_labels: string[];
  read_online_url: string | null;
  archive_url: string | null;
  notes: string | null;
  source?: SourceOption | null;
}

interface ObservationListResponse {
  observations?: ObservationRow[];
  error?: string;
}

interface ObservationForm {
  source_id: string;
  observed_at_local: string;
  collector_inbox: string;
  subject: string;
  from_email: string;
  message_id_header: string;
  gmail_thread_id: string;
  gmail_message_id: string;
  gmail_labels: string;
  read_online_url: string;
  archive_url: string;
  notes: string;
}

function toLocalDatetimeInputValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function createDefaultForm(): ObservationForm {
  return {
    source_id: '',
    observed_at_local: toLocalDatetimeInputValue(new Date()),
    collector_inbox: 'ktlabworks@gmail.com',
    subject: '',
    from_email: '',
    message_id_header: '',
    gmail_thread_id: '',
    gmail_message_id: '',
    gmail_labels: '',
    read_online_url: '',
    archive_url: '',
    notes: '',
  };
}

function toIsoFromLocalInput(value: string): string {
  return new Date(value).toISOString();
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return `${date.toLocaleDateString('ja-JP')} ${date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export default function NewsletterCollectionAdminPage() {
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [observations, setObservations] = useState<ObservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ObservationForm>(createDefaultForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchSources = useCallback(async () => {
    const response = await fetch('/api/admin/source-intelligence?newsletter_only=true&active=true');
    const data = (await response.json()) as SourceListResponse;

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load newsletter sources');
    }

    setSources((data.sources ?? []).filter((source) => source.is_newsletter));
  }, []);

  const fetchSchedules = useCallback(async () => {
    const response = await fetch('/api/admin/source-schedules?newsletter_only=true');
    const data = (await response.json()) as ScheduleListResponse;

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load schedules');
    }

    setSchedules(data.schedules ?? []);
  }, []);

  const fetchObservations = useCallback(async () => {
    const response = await fetch('/api/admin/source-observations?newsletter_only=true&limit=300');
    const data = (await response.json()) as ObservationListResponse;

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load observations');
    }

    setObservations(data.observations ?? []);
  }, []);

  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([fetchSources(), fetchSchedules(), fetchObservations()]);
      } catch (initError) {
        setError(initError instanceof Error ? initError.message : 'Failed to initialize');
      } finally {
        setLoading(false);
      }
    }

    void initialize();
  }, [fetchSources, fetchSchedules, fetchObservations]);

  const stats = useMemo(() => {
    const lookbackDate = hoursAgo(24);
    const activeSourceIds = new Set(
      schedules
        .filter((schedule) => schedule.is_active)
        .map((schedule) => schedule.source_id)
    );

    const observedLast24h = observations.filter((obs) => new Date(obs.observed_at) >= lookbackDate);
    const observedSourceIds = new Set(observedLast24h.map((obs) => obs.source_id));

    const missingSourceIds = Array.from(activeSourceIds).filter((sourceId) => !observedSourceIds.has(sourceId));

    return {
      total: observations.length,
      last24h: observedLast24h.length,
      activeSchedules: activeSourceIds.size,
      coveredSourcesLast24h: observedSourceIds.size,
      missingSources: missingSourceIds,
    };
  }, [observations, schedules]);

  const sourceMap = useMemo(() => {
    const map = new Map<string, SourceOption>();
    for (const source of sources) {
      map.set(source.id, source);
    }
    return map;
  }, [sources]);

  async function submitObservation() {
    if (!form.source_id || !form.subject || !form.from_email) {
      alert('source, subject, from_email は必須です。');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/source-observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_id: form.source_id,
          observed_at: toIsoFromLocalInput(form.observed_at_local),
          collector_inbox: form.collector_inbox,
          subject: form.subject,
          from_email: form.from_email,
          message_id_header: form.message_id_header || null,
          gmail_thread_id: form.gmail_thread_id || null,
          gmail_message_id: form.gmail_message_id || null,
          gmail_labels: form.gmail_labels,
          read_online_url: form.read_online_url || null,
          archive_url: form.archive_url || null,
          notes: form.notes || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Failed to create observation');
        return;
      }

      setForm((prev) => ({
        ...createDefaultForm(),
        source_id: prev.source_id,
        collector_inbox: prev.collector_inbox,
      }));
      await fetchObservations();
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteObservation(id: string) {
    if (!confirm('この観測ログを削除しますか？')) return;

    const response = await fetch(`/api/admin/source-observations?id=${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.error || 'Failed to delete observation');
      return;
    }

    await fetchObservations();
  }

  if (loading) {
    return <div className="p-8 text-text-muted">Loading collection dashboard...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-text-deep">競合ニュースレター受信管理</h1>
          <p className="text-sm text-text-light mt-2">
            `ktlabworks@gmail.com` を受信口として、実際に届いた競合ニュースレターを記録・監視します。
          </p>
        </div>

        <div className="flex gap-2">
          <a
            href="/admin/schedules"
            className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-warm"
          >
            配信スケジュール
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Metric label="Total Logs" value={stats.total} color="text-text-deep" />
        <Metric label="24h Logs" value={stats.last24h} color="text-cat-tool" />
        <Metric label="Active Sources" value={stats.activeSchedules} color="text-accent-bark" />
        <Metric label="24h Covered" value={stats.coveredSourcesLast24h} color="text-accent-leaf" />
        <Metric label="Missing" value={stats.missingSources.length} color="text-accent-bloom" />
      </div>

      {error && (
        <div className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <section className="rounded-[var(--radius-card)] border border-border bg-bg-card p-5 space-y-4">
        <h2 className="text-lg font-semibold font-heading text-text-deep">受信ログ追加（手動）</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="ニュースレターソース">
            <select
              value={form.source_id}
              onChange={(event) => setForm((prev) => ({ ...prev, source_id: event.target.value }))}
              className="w-full rounded border border-border bg-bg-cream px-3 py-2 text-sm text-text-deep"
            >
              <option value="">Select source</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="受信日時（ローカル）">
            <input
              type="datetime-local"
              value={form.observed_at_local}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, observed_at_local: event.target.value }))
              }
              className="w-full rounded border border-border bg-bg-cream px-3 py-2 text-sm text-text-deep"
            />
          </Field>

          <Field label="受信箱メールアドレス">
            <input
              value={form.collector_inbox}
              onChange={(event) => setForm((prev) => ({ ...prev, collector_inbox: event.target.value }))}
              placeholder="ktlabworks@gmail.com"
              className="w-full rounded border border-border bg-bg-cream px-3 py-2 text-sm text-text-deep"
            />
          </Field>

          <Field label="Fromメール">
            <input
              value={form.from_email}
              onChange={(event) => setForm((prev) => ({ ...prev, from_email: event.target.value }))}
              placeholder="news@daily.therundown.ai"
              className="w-full rounded border border-border bg-bg-cream px-3 py-2 text-sm text-text-deep"
            />
          </Field>

          <Field label="Subject" className="md:col-span-2">
            <input
              value={form.subject}
              onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
              placeholder="件名を入力"
              className="w-full rounded border border-border bg-bg-cream px-3 py-2 text-sm text-text-deep"
            />
          </Field>

          <Field label="Read Online URL">
            <input
              value={form.read_online_url}
              onChange={(event) => setForm((prev) => ({ ...prev, read_online_url: event.target.value }))}
              placeholder="https://..."
              className="w-full rounded border border-border bg-bg-cream px-3 py-2 text-sm text-text-deep"
            />
          </Field>

          <Field label="Archive URL（任意）">
            <input
              value={form.archive_url}
              onChange={(event) => setForm((prev) => ({ ...prev, archive_url: event.target.value }))}
              placeholder="https://mail.google.com/..."
              className="w-full rounded border border-border bg-bg-cream px-3 py-2 text-sm text-text-deep"
            />
          </Field>

          <Field label="Message-ID（任意）">
            <input
              value={form.message_id_header}
              onChange={(event) => setForm((prev) => ({ ...prev, message_id_header: event.target.value }))}
              placeholder="<message-id@example.com>"
              className="w-full rounded border border-border bg-bg-cream px-3 py-2 text-sm text-text-deep"
            />
          </Field>

          <Field label="Gmail Labels（カンマ区切り）">
            <input
              value={form.gmail_labels}
              onChange={(event) => setForm((prev) => ({ ...prev, gmail_labels: event.target.value }))}
              placeholder="newsletter, competitor, tier-a"
              className="w-full rounded border border-border bg-bg-cream px-3 py-2 text-sm text-text-deep"
            />
          </Field>

          <Field label="Gmail Thread ID（任意）">
            <input
              value={form.gmail_thread_id}
              onChange={(event) => setForm((prev) => ({ ...prev, gmail_thread_id: event.target.value }))}
              placeholder="thread-id"
              className="w-full rounded border border-border bg-bg-cream px-3 py-2 text-sm text-text-deep"
            />
          </Field>

          <Field label="Gmail Message ID（任意）">
            <input
              value={form.gmail_message_id}
              onChange={(event) => setForm((prev) => ({ ...prev, gmail_message_id: event.target.value }))}
              placeholder="message-id"
              className="w-full rounded border border-border bg-bg-cream px-3 py-2 text-sm text-text-deep"
            />
          </Field>

          <Field label="メモ" className="md:col-span-2">
            <textarea
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              rows={3}
              placeholder="受信遅延や補足メモ"
              className="w-full rounded border border-border bg-bg-cream px-3 py-2 text-sm text-text-deep"
            />
          </Field>
        </div>

        <button
          onClick={() => void submitObservation()}
          disabled={submitting}
          className="rounded bg-accent-leaf hover:bg-accent-moss disabled:opacity-50 px-4 py-2 text-sm font-medium text-white"
        >
          {submitting ? 'Saving...' : '＋ 受信ログを追加'}
        </button>
      </section>

      <section className="rounded-[var(--radius-card)] border border-border bg-bg-card p-5 space-y-3">
        <h2 className="text-lg font-semibold font-heading text-text-deep">未受信アラート（過去24時間）</h2>
        {stats.missingSources.length === 0 ? (
          <p className="text-sm text-accent-moss">アクティブなニュースレターは24時間以内にすべて受信できています。</p>
        ) : (
          <ul className="space-y-2">
            {stats.missingSources.map((sourceId) => {
              const source = sourceMap.get(sourceId);
              return (
                <li
                  key={sourceId}
                  className="rounded border border-accent-bloom/30 bg-accent-bloom/10 px-3 py-2 text-sm text-accent-bloom"
                >
                  {source?.name || sourceId} の受信ログが過去24時間にありません。
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-[var(--radius-card)] border border-border bg-bg-card p-5 space-y-4">
        <h2 className="text-lg font-semibold font-heading text-text-deep">最新の受信ログ</h2>

        <div className="space-y-3">
          {observations.map((obs) => {
            const labels = obs.gmail_labels || [];
            return (
              <article key={obs.id} className="rounded border border-border bg-bg-cream p-4 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-text-deep">
                        {obs.source?.name || 'Unknown source'}
                      </h3>
                      <span className="rounded border border-border bg-bg-card px-2 py-0.5 text-xs text-text-muted">
                        {formatDateTime(obs.observed_at)}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted">{obs.subject}</p>
                    <p className="text-xs text-text-light">
                      from: {obs.from_email} / inbox: {obs.collector_inbox}
                    </p>
                  </div>

                  <button
                    onClick={() => void deleteObservation(obs.id)}
                    className="rounded bg-bg-warm hover:bg-danger px-3 py-1 text-xs text-text-deep hover:text-white"
                  >
                    Delete
                  </button>
                </div>

                {(obs.read_online_url || obs.archive_url) && (
                  <div className="flex flex-wrap gap-3 text-xs">
                    {obs.read_online_url && (
                      <a
                        href={obs.read_online_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-leaf hover:text-accent-moss underline"
                      >
                        Read Online
                      </a>
                    )}
                    {obs.archive_url && (
                      <a
                        href={obs.archive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-muted hover:text-text-deep underline"
                      >
                        Gmail Link
                      </a>
                    )}
                  </div>
                )}

                {labels.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label) => (
                      <span
                        key={`${obs.id}-${label}`}
                        className="rounded border border-accent-bark/30 bg-accent-bark/10 px-2 py-0.5 text-xs text-accent-bark"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}

                {obs.notes && <p className="text-xs text-text-light">Note: {obs.notes}</p>}
              </article>
            );
          })}

          {observations.length === 0 && (
            <p className="rounded border border-border bg-bg-cream px-3 py-4 text-sm text-text-light">
              受信ログがまだありません。上のフォームから最初の記録を追加してください。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-card p-3">
      <p className="text-xs uppercase tracking-wide text-text-light">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-light">{label}</span>
      {children}
    </label>
  );
}
