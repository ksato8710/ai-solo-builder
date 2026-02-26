'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export const dynamic = 'force-dynamic';

type SourceType =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'official'
  | 'media'
  | 'community'
  | 'social'
  | 'other';

type EntityKind =
  | 'primary_source'
  | 'global_media'
  | 'japanese_media'
  | 'newsletter'
  | 'community'
  | 'social'
  | 'tool_directory';

interface SourceEntity {
  id: string;
  name: string;
  url: string;
  domain: string | null;
  source_type: SourceType;
  credibility_score: number | null;
  verification_level: 'official' | 'editorial' | 'community' | null;
  entity_kind: EntityKind | null;
  locale: 'ja' | 'en' | 'multilingual' | 'other';
  region: 'jp' | 'global' | 'us' | 'eu' | 'other';
  is_active: boolean;
  is_newsletter: boolean;
  is_japanese_media: boolean;
  newsletter_from_email: string | null;
  newsletter_archive_url: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface SourceForm {
  name: string;
  url: string;
  domain: string;
  source_type: SourceType;
  credibility_score: number;
  verification_level: 'official' | 'editorial' | 'community' | '';
  entity_kind: EntityKind;
  locale: 'ja' | 'en' | 'multilingual' | 'other';
  region: 'jp' | 'global' | 'us' | 'eu' | 'other';
  is_active: boolean;
  is_newsletter: boolean;
  is_japanese_media: boolean;
  newsletter_from_email: string;
  newsletter_archive_url: string;
  description: string;
  notes: string;
}

const ENTITY_KIND_OPTIONS: { value: EntityKind; label: string }[] = [
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'primary_source', label: 'Primary Source' },
  { value: 'japanese_media', label: 'Japanese Media' },
  { value: 'global_media', label: 'Global Media' },
  { value: 'community', label: 'Community' },
  { value: 'social', label: 'Social' },
  { value: 'tool_directory', label: 'Tool Directory' },
];

const SOURCE_TYPE_OPTIONS: SourceType[] = [
  'primary',
  'secondary',
  'tertiary',
  'official',
  'media',
  'community',
  'social',
  'other',
];

const LOCALE_OPTIONS: SourceForm['locale'][] = ['ja', 'en', 'multilingual', 'other'];
const REGION_OPTIONS: SourceForm['region'][] = ['jp', 'global', 'us', 'eu', 'other'];

function createEmptyForm(): SourceForm {
  return {
    name: '',
    url: '',
    domain: '',
    source_type: 'secondary',
    credibility_score: 7,
    verification_level: 'editorial',
    entity_kind: 'global_media',
    locale: 'en',
    region: 'global',
    is_active: true,
    is_newsletter: false,
    is_japanese_media: false,
    newsletter_from_email: '',
    newsletter_archive_url: '',
    description: '',
    notes: '',
  };
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return '';
  }
}

function toApiPayload(form: SourceForm) {
  return {
    ...form,
    credibility_score: form.credibility_score,
    verification_level: form.verification_level || null,
    newsletter_from_email: form.newsletter_from_email || null,
    newsletter_archive_url: form.newsletter_archive_url || null,
    description: form.description || null,
    notes: form.notes || null,
  };
}

function entityKindLabel(kind: string | null) {
  if (!kind) return 'Uncategorized';
  const found = ENTITY_KIND_OPTIONS.find((option) => option.value === kind);
  return found ? found.label : kind;
}

function kindColor(kind: string | null) {
  switch (kind) {
    case 'newsletter':
      return 'text-accent-bark bg-accent-bark/20 border-accent-bark/40';
    case 'primary_source':
      return 'text-accent-leaf bg-accent-leaf/20 border-accent-leaf/40';
    case 'japanese_media':
      return 'text-cat-tool bg-cat-tool/20 border-cat-tool/40';
    case 'global_media':
      return 'text-accent-bloom bg-accent-bloom/20 border-accent-bloom/40';
    default:
      return 'text-text-muted bg-bg-warm border-border';
  }
}

export default function SourceIntelligenceAdminPage() {
  const [sources, setSources] = useState<SourceEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const [filterKind, setFilterKind] = useState<string>('all');
  const [filterLocale, setFilterLocale] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');

  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState<SourceForm>(createEmptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SourceForm>(createEmptyForm);

  const summary = useMemo(() => {
    const total = sources.length;
    const newsletter = sources.filter((source) => source.entity_kind === 'newsletter').length;
    const japanese = sources.filter((source) => source.entity_kind === 'japanese_media').length;
    const primary = sources.filter((source) => source.entity_kind === 'primary_source').length;
    return { total, newsletter, japanese, primary };
  }, [sources]);

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setNote(null);

      const params = new URLSearchParams();
      if (filterKind !== 'all') params.set('entity_kind', filterKind);
      if (filterLocale !== 'all') params.set('locale', filterLocale);
      if (filterActive === 'active') params.set('active', 'true');
      if (filterActive === 'inactive') params.set('active', 'false');

      const response = await fetch(`/api/admin/source-intelligence?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sources');
      }

      setSources(data.sources || []);
      if (data.note) setNote(data.note as string);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filterActive, filterKind, filterLocale]);

  useEffect(() => {
    void fetchSources();
  }, [fetchSources]);

  function startEdit(source: SourceEntity) {
    setEditingId(source.id);
    setEditForm({
      name: source.name,
      url: source.url,
      domain: source.domain || '',
      source_type: source.source_type,
      credibility_score: source.credibility_score ?? 5,
      verification_level: source.verification_level ?? '',
      entity_kind: source.entity_kind ?? 'global_media',
      locale: source.locale,
      region: source.region,
      is_active: source.is_active,
      is_newsletter: source.is_newsletter,
      is_japanese_media: source.is_japanese_media,
      newsletter_from_email: source.newsletter_from_email || '',
      newsletter_archive_url: source.newsletter_archive_url || '',
      description: source.description || '',
      notes: source.notes || '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(createEmptyForm());
  }

  async function saveEdit(id: string) {
    const response = await fetch('/api/admin/source-intelligence', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...toApiPayload(editForm) }),
    });

    const data = await response.json();
    if (!response.ok) {
      alert(data.error || 'Failed to update source.');
      return;
    }

    cancelEdit();
    await fetchSources();
  }

  async function createSource() {
    const payload = toApiPayload(newForm);
    const response = await fetch('/api/admin/source-intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      alert(data.error || 'Failed to create source.');
      return;
    }

    setIsAdding(false);
    setNewForm(createEmptyForm());
    await fetchSources();
  }

  async function deleteSource(id: string, name: string) {
    if (!confirm(`Delete source "${name}"?`)) return;

    const response = await fetch(`/api/admin/source-intelligence?id=${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    if (!response.ok) {
      alert(data.error || 'Failed to delete source.');
      return;
    }

    await fetchSources();
  }

  if (loading) {
    return <div className="p-8 text-text-muted">Loading source entities...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-text-deep">Source Intelligence 管理</h1>
          <p className="text-sm text-text-light mt-2">
            ニュースレター / 一次情報 / 日本メディアを統合管理し、ワークフロー連携の基盤を維持します。
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/admin/workflows"
            className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-warm"
          >
            ワークフロー
          </a>
          <a
            href="/admin/schedules"
            className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-warm"
          >
            配信スケジュール
          </a>
          <a
            href="/admin/collection"
            className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-warm"
          >
            受信ログ
          </a>
          <a
            href="/admin"
            className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-warm"
          >
            ← 管理トップ
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="総ソース数" value={summary.total} accent="text-text-deep" />
        <StatCard label="ニュースレター" value={summary.newsletter} accent="text-accent-bark" />
        <StatCard label="日本メディア" value={summary.japanese} accent="text-cat-tool" />
        <StatCard label="一次情報" value={summary.primary} accent="text-accent-leaf" />
      </div>

      <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-4 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={filterKind}
            onChange={(event) => setFilterKind(event.target.value)}
            className="bg-bg-warm border border-border text-text-deep rounded px-3 py-2 text-sm"
          >
            <option value="all">All Entity Kinds</option>
            {ENTITY_KIND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filterLocale}
            onChange={(event) => setFilterLocale(event.target.value)}
            className="bg-bg-warm border border-border text-text-deep rounded px-3 py-2 text-sm"
          >
            <option value="all">All Locales</option>
            {LOCALE_OPTIONS.map((locale) => (
              <option key={locale} value={locale}>
                {locale}
              </option>
            ))}
          </select>

          <select
            value={filterActive}
            onChange={(event) => setFilterActive(event.target.value)}
            className="bg-bg-warm border border-border text-text-deep rounded px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            onClick={() => setIsAdding((prev) => !prev)}
            className="bg-accent-leaf hover:bg-accent-moss text-white rounded px-4 py-2 text-sm font-medium"
          >
            {isAdding ? 'Close Form' : '＋ Add Source'}
          </button>
        </div>

        {note && (
          <div className="rounded border border-accent-bloom/40 bg-accent-bloom/10 px-3 py-2 text-xs text-accent-bloom">
            {note}
          </div>
        )}

        {error && (
          <div className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}
      </div>

      {isAdding && (
        <FormPanel
          title="新規ソース追加"
          form={newForm}
          onChange={setNewForm}
          onAutoDomain={() => setNewForm((prev) => ({ ...prev, domain: extractDomain(prev.url) }))}
          onSubmit={createSource}
          submitLabel="Create Source"
        />
      )}

      <div className="space-y-3">
        {sources.map((source) => {
          const isEditing = source.id === editingId;

          return (
            <div key={source.id} className="rounded-[var(--radius-card)] border border-border bg-bg-card p-4">
              {!isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold font-heading text-text-deep">{source.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded border ${kindColor(source.entity_kind)}`}>
                          {entityKindLabel(source.entity_kind)}
                        </span>
                        {source.is_newsletter && (
                          <span className="px-2 py-1 text-xs rounded border border-accent-bark/40 bg-accent-bark/20 text-accent-bark">
                            Newsletter
                          </span>
                        )}
                        {source.is_japanese_media && (
                          <span className="px-2 py-1 text-xs rounded border border-cat-tool/40 bg-cat-tool/20 text-cat-tool">
                            JP
                          </span>
                        )}
                        {!source.is_active && (
                          <span className="px-2 py-1 text-xs rounded border border-danger/30 bg-danger/20 text-danger">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-light break-all">{source.url}</p>
                      <p className="text-xs text-text-light mt-1">
                        domain: {source.domain || '—'} / locale: {source.locale} / region: {source.region}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(source)}
                        className="rounded bg-bg-warm hover:bg-bg-card px-3 py-1.5 text-xs text-text-deep"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => void deleteSource(source.id, source.name)}
                        className="rounded bg-danger/70 hover:bg-danger px-3 py-1.5 text-xs text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                    <MetaChip label="Type" value={source.source_type} />
                    <MetaChip label="Credibility" value={String(source.credibility_score ?? '—')} />
                    <MetaChip label="Verification" value={source.verification_level ?? '—'} />
                    <MetaChip label="From" value={source.newsletter_from_email || '—'} />
                    <MetaChip label="Archive" value={source.newsletter_archive_url || '—'} />
                  </div>

                  {(source.description || source.notes) && (
                    <div className="space-y-1 text-sm text-text-muted">
                      {source.description && <p>{source.description}</p>}
                      {source.notes && <p className="text-xs text-text-light">Note: {source.notes}</p>}
                    </div>
                  )}
                </div>
              ) : (
                <FormPanel
                  title={`編集: ${source.name}`}
                  form={editForm}
                  onChange={setEditForm}
                  onAutoDomain={() => setEditForm((prev) => ({ ...prev, domain: extractDomain(prev.url) }))}
                  onSubmit={() => void saveEdit(source.id)}
                  submitLabel="Save Changes"
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

function FormPanel({
  title,
  form,
  onChange,
  onAutoDomain,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  title: string;
  form: SourceForm;
  onChange: (next: SourceForm | ((prev: SourceForm) => SourceForm)) => void;
  onAutoDomain: () => void;
  onSubmit: () => void;
  submitLabel: string;
  onCancel?: () => void;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-4 space-y-4">
      <h2 className="text-sm font-semibold font-heading text-text-deep">{title}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={form.name}
          onChange={(event) => onChange((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Source Name"
          className="rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
        />
        <input
          value={form.url}
          onChange={(event) => onChange((prev) => ({ ...prev, url: event.target.value }))}
          placeholder="https://..."
          className="rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
        />
        <div className="flex gap-2">
          <input
            value={form.domain}
            onChange={(event) => onChange((prev) => ({ ...prev, domain: event.target.value }))}
            placeholder="domain"
            className="flex-1 rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
          />
          <button
            onClick={onAutoDomain}
            className="rounded border border-border px-2 py-2 text-xs text-text-muted hover:bg-bg-warm"
          >
            Auto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <select
          value={form.entity_kind}
          onChange={(event) => onChange((prev) => ({ ...prev, entity_kind: event.target.value as EntityKind }))}
          className="rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
        >
          {ENTITY_KIND_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={form.source_type}
          onChange={(event) => onChange((prev) => ({ ...prev, source_type: event.target.value as SourceType }))}
          className="rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
        >
          {SOURCE_TYPE_OPTIONS.map((sourceType) => (
            <option key={sourceType} value={sourceType}>
              {sourceType}
            </option>
          ))}
        </select>

        <select
          value={form.locale}
          onChange={(event) => onChange((prev) => ({ ...prev, locale: event.target.value as SourceForm['locale'] }))}
          className="rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
        >
          {LOCALE_OPTIONS.map((locale) => (
            <option key={locale} value={locale}>
              {locale}
            </option>
          ))}
        </select>

        <select
          value={form.region}
          onChange={(event) => onChange((prev) => ({ ...prev, region: event.target.value as SourceForm['region'] }))}
          className="rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
        >
          {REGION_OPTIONS.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>

        <input
          type="number"
          min={1}
          max={10}
          value={form.credibility_score}
          onChange={(event) =>
            onChange((prev) => ({
              ...prev,
              credibility_score: Number.parseInt(event.target.value, 10) || 1,
            }))
          }
          className="rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          value={form.newsletter_from_email}
          onChange={(event) =>
            onChange((prev) => ({ ...prev, newsletter_from_email: event.target.value }))
          }
          placeholder="newsletter from email (optional)"
          className="rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
        />
        <input
          value={form.newsletter_archive_url}
          onChange={(event) =>
            onChange((prev) => ({ ...prev, newsletter_archive_url: event.target.value }))
          }
          placeholder="newsletter archive url (optional)"
          className="rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
        />
      </div>

      <textarea
        value={form.description}
        onChange={(event) => onChange((prev) => ({ ...prev, description: event.target.value }))}
        rows={2}
        placeholder="Description"
        className="w-full rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
      />

      <textarea
        value={form.notes}
        onChange={(event) => onChange((prev) => ({ ...prev, notes: event.target.value }))}
        rows={2}
        placeholder="Operational notes"
        className="w-full rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-text-muted">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => onChange((prev) => ({ ...prev, is_active: event.target.checked }))}
          />
          Active
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_newsletter}
            onChange={(event) =>
              onChange((prev) => ({ ...prev, is_newsletter: event.target.checked }))
            }
          />
          Newsletter
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_japanese_media}
            onChange={(event) =>
              onChange((prev) => ({ ...prev, is_japanese_media: event.target.checked }))
            }
          />
          Japanese media
        </label>
        <select
          value={form.verification_level}
          onChange={(event) =>
            onChange((prev) => ({
              ...prev,
              verification_level: event.target.value as SourceForm['verification_level'],
            }))
          }
          className="rounded border border-border bg-bg-warm px-2 py-1 text-sm text-text-deep"
        >
          <option value="">Verification</option>
          <option value="official">official</option>
          <option value="editorial">editorial</option>
          <option value="community">community</option>
        </select>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-warm"
          >
            Cancel
          </button>
        )}
        <button
          onClick={onSubmit}
          className="rounded bg-accent-leaf px-4 py-2 text-sm font-medium text-white hover:bg-accent-moss"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
