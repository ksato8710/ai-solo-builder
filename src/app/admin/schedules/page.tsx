'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export const dynamic = 'force-dynamic';

const DAY_OPTIONS: { label: string; value: number }[] = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

interface SourceOption {
  id: string;
  name: string;
  domain: string | null;
  is_newsletter: boolean;
  entity_kind: string | null;
}

interface SourceListResponse {
  sources?: SourceOption[];
  error?: string;
}

interface ScheduleListResponse {
  schedules?: SourceScheduleRow[];
  error?: string;
}

interface SourceScheduleRow {
  id: string;
  source_id: string;
  schedule_name: string;
  timezone: string;
  delivery_hour: number;
  delivery_minute: number;
  delivery_days: number[];
  fetch_delay_minutes: number;
  is_active: boolean;
  source?: SourceOption;
}

interface ScheduleForm {
  source_id: string;
  schedule_name: string;
  timezone: string;
  delivery_hour: number;
  delivery_minute: number;
  delivery_days: number[];
  fetch_delay_minutes: number;
  is_active: boolean;
}

function createDefaultForm(): ScheduleForm {
  return {
    source_id: '',
    schedule_name: 'daily_primary',
    timezone: 'Asia/Tokyo',
    delivery_hour: 20,
    delivery_minute: 0,
    delivery_days: [0, 1, 2, 3, 4, 5, 6],
    fetch_delay_minutes: 20,
    is_active: true,
  };
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function formatDays(days: number[]): string {
  return DAY_OPTIONS.filter((day) => days.includes(day.value))
    .map((day) => day.label)
    .join(', ');
}

function toggleDay(days: number[], value: number): number[] {
  if (days.includes(value)) {
    return days.filter((day) => day !== value).sort((a, b) => a - b);
  }
  return [...days, value].sort((a, b) => a - b);
}

export default function SourceSchedulesAdminPage() {
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [schedules, setSchedules] = useState<SourceScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState<ScheduleForm>(createDefaultForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ScheduleForm>(createDefaultForm);

  const fetchSources = useCallback(async () => {
    const response = await fetch('/api/admin/source-intelligence?newsletter_only=true&active=true');
    const data = (await response.json()) as SourceListResponse;

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load source options');
    }

    setSources(
      (data.sources ?? []).map((source) => ({
        id: source.id,
        name: source.name,
        domain: source.domain,
        is_newsletter: Boolean(source.is_newsletter),
        entity_kind: source.entity_kind,
      }))
    );
  }, []);

  const fetchSchedules = useCallback(async () => {
    const response = await fetch('/api/admin/source-schedules?newsletter_only=true');
    const data = (await response.json()) as ScheduleListResponse;

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load schedules');
    }

    setSchedules(data.schedules ?? []);
  }, []);

  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([fetchSources(), fetchSchedules()]);
      } catch (initError) {
        setError(initError instanceof Error ? initError.message : 'Failed to initialize');
      } finally {
        setLoading(false);
      }
    }

    void initialize();
  }, [fetchSources, fetchSchedules]);

  function startEdit(schedule: SourceScheduleRow) {
    setEditingId(schedule.id);
    setEditForm({
      source_id: schedule.source_id,
      schedule_name: schedule.schedule_name,
      timezone: schedule.timezone,
      delivery_hour: schedule.delivery_hour,
      delivery_minute: schedule.delivery_minute,
      delivery_days: schedule.delivery_days || [],
      fetch_delay_minutes: schedule.fetch_delay_minutes,
      is_active: schedule.is_active,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(createDefaultForm());
  }

  const stats = useMemo(() => {
    const total = schedules.length;
    const active = schedules.filter((schedule) => schedule.is_active).length;
    const newsletters = new Set(schedules.map((schedule) => schedule.source_id)).size;
    return { total, active, newsletters };
  }, [schedules]);

  async function createSchedule() {
    const response = await fetch('/api/admin/source-schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newForm),
    });

    const data = await response.json();
    if (!response.ok) {
      alert(data.error || 'Failed to create schedule');
      return;
    }

    setIsAdding(false);
    setNewForm(createDefaultForm());
    await fetchSchedules();
  }

  async function updateSchedule(id: string) {
    const response = await fetch('/api/admin/source-schedules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editForm }),
    });

    const data = await response.json();
    if (!response.ok) {
      alert(data.error || 'Failed to update schedule');
      return;
    }

    cancelEdit();
    await fetchSchedules();
  }

  async function deleteSchedule(id: string) {
    if (!confirm('Delete this schedule?')) return;

    const response = await fetch(`/api/admin/source-schedules?id=${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    if (!response.ok) {
      alert(data.error || 'Failed to delete schedule');
      return;
    }

    await fetchSchedules();
  }

  if (loading) {
    return <div className="p-8 text-slate-300">Loading delivery schedules...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">ニュースレター配信スケジュール管理</h1>
          <p className="text-sm text-slate-400 mt-2">
            参照ニュースレターの配信時刻と、統合ジョブの遅延許容（fetch delay）を管理します。
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/admin/workflows"
            className="inline-flex items-center rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/40"
          >
            ワークフロー
          </a>
          <a
            href="/admin/source-intelligence"
            className="inline-flex items-center rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/40"
          >
            Source管理
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

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Schedules" value={stats.total} color="text-slate-100" />
        <Stat label="Active" value={stats.active} color="text-emerald-200" />
        <Stat label="Newsletters" value={stats.newsletters} color="text-violet-200" />
      </div>

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <button
          onClick={() => setIsAdding((prev) => !prev)}
          className="rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white"
        >
          {isAdding ? 'Close Form' : '＋ Add Schedule'}
        </button>
      </div>

      {isAdding && (
        <ScheduleFormPanel
          title="新規スケジュール"
          sources={sources}
          form={newForm}
          onChange={setNewForm}
          onSubmit={createSchedule}
          submitLabel="Create"
        />
      )}

      <div className="space-y-3">
        {schedules.map((schedule) => {
          const isEditing = schedule.id === editingId;
          const sourceName = schedule.source?.name || 'Unknown source';
          const sourceDomain = schedule.source?.domain || '—';

          return (
            <div key={schedule.id} className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
              {!isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h2 className="text-lg font-semibold text-slate-100">{sourceName}</h2>
                        <span className="rounded border border-slate-600 bg-slate-700 px-2 py-1 text-xs text-slate-200">
                          {schedule.schedule_name}
                        </span>
                        {!schedule.is_active && (
                          <span className="rounded border border-red-400/40 bg-red-500/10 px-2 py-1 text-xs text-red-200">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">{sourceDomain}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(schedule)}
                        className="rounded bg-slate-700 hover:bg-slate-600 px-3 py-1.5 text-xs text-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => void deleteSchedule(schedule.id)}
                        className="rounded bg-red-600/70 hover:bg-red-500 px-3 py-1.5 text-xs text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <Meta label="Timezone" value={schedule.timezone} />
                    <Meta label="Delivery" value={formatTime(schedule.delivery_hour, schedule.delivery_minute)} />
                    <Meta label="Days" value={formatDays(schedule.delivery_days || [])} />
                    <Meta label="Fetch Delay" value={`${schedule.fetch_delay_minutes} min`} />
                  </div>
                </div>
              ) : (
                <ScheduleFormPanel
                  title={`編集: ${sourceName}`}
                  sources={sources}
                  form={editForm}
                  onChange={setEditForm}
                  onSubmit={() => void updateSchedule(schedule.id)}
                  submitLabel="Save"
                  onCancel={cancelEdit}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-700 bg-slate-900/40 px-2 py-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-slate-200 mt-1 break-all">{value}</p>
    </div>
  );
}

function ScheduleFormPanel({
  title,
  sources,
  form,
  onChange,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  title: string;
  sources: SourceOption[];
  form: ScheduleForm;
  onChange: (next: ScheduleForm | ((prev: ScheduleForm) => ScheduleForm)) => void;
  onSubmit: () => void;
  submitLabel: string;
  onCancel?: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-4">
      <h2 className="text-sm font-semibold text-slate-100">{title}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select
          value={form.source_id}
          onChange={(event) => onChange((prev) => ({ ...prev, source_id: event.target.value }))}
          className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100"
        >
          <option value="">Select newsletter source</option>
          {sources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>

        <input
          value={form.schedule_name}
          onChange={(event) => onChange((prev) => ({ ...prev, schedule_name: event.target.value }))}
          placeholder="schedule name"
          className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100"
        />

        <input
          value={form.timezone}
          onChange={(event) => onChange((prev) => ({ ...prev, timezone: event.target.value }))}
          placeholder="Asia/Tokyo"
          className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <input
          type="number"
          min={0}
          max={23}
          value={form.delivery_hour}
          onChange={(event) =>
            onChange((prev) => ({ ...prev, delivery_hour: Number.parseInt(event.target.value, 10) || 0 }))
          }
          className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100"
        />

        <input
          type="number"
          min={0}
          max={59}
          value={form.delivery_minute}
          onChange={(event) =>
            onChange((prev) => ({ ...prev, delivery_minute: Number.parseInt(event.target.value, 10) || 0 }))
          }
          className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100"
        />

        <input
          type="number"
          min={0}
          max={720}
          value={form.fetch_delay_minutes}
          onChange={(event) =>
            onChange((prev) => ({
              ...prev,
              fetch_delay_minutes: Number.parseInt(event.target.value, 10) || 0,
            }))
          }
          className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100"
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-400">Delivery Days</p>
        <div className="flex flex-wrap gap-2">
          {DAY_OPTIONS.map((day) => (
            <label
              key={day.value}
              className="inline-flex items-center gap-2 rounded border border-slate-600 bg-slate-700/50 px-2 py-1 text-xs text-slate-200"
            >
              <input
                type="checkbox"
                checked={form.delivery_days.includes(day.value)}
                onChange={() =>
                  onChange((prev) => ({
                    ...prev,
                    delivery_days: toggleDay(prev.delivery_days, day.value),
                  }))
                }
              />
              {day.label}
            </label>
          ))}
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(event) => onChange((prev) => ({ ...prev, is_active: event.target.checked }))}
        />
        Active
      </label>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </button>
        )}
        <button
          onClick={onSubmit}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
