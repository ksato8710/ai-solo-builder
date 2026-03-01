'use client';

import { useCallback, useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface XAccount {
  source_id: string;
  name: string;
  handle: string | null;
  crawl_url: string | null;
  crawl_method: string;
  tier: string;
  credibility_score: number | null;
  is_active: boolean;
  last_crawled_at: string | null;
  last_crawl_status: string | null;
  last_collected: string | null;
  item_count: number;
}

interface XPost {
  id: string;
  source_id: string;
  title: string;
  title_ja: string | null;
  url: string;
  content_summary: string | null;
  collected_at: string;
  published_at: string | null;
  nva_total: number | null;
  engagement_likes: number | null;
  engagement_retweets: number | null;
  engagement_replies: number | null;
  engagement_quotes: number | null;
  engagement_bookmarks: number | null;
  engagement_views: number | null;
  source?: {
    id: string;
    name: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(value: string): string {
  const date = new Date(value);
  return `${date.toLocaleDateString('ja-JP')} ${date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function formatRelativeTime(value: string): string {
  const now = Date.now();
  const then = new Date(value).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}時間前`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}日前`;
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

function formatNumber(n: number | null): string {
  if (n == null) return '--';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Parse human-readable numbers like "1K", "1.5M", "500" → numeric value */
function parseHumanNumber(input: string): number | null {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(K|M)?$/);
  if (!match) return null;
  const base = parseFloat(match[1]);
  const suffix = match[2];
  if (suffix === 'M') return Math.round(base * 1_000_000);
  if (suffix === 'K') return Math.round(base * 1_000);
  return Math.round(base);
}

const ENGAGEMENT_PRESETS = [
  { label: 'すべて', likes: '', views: '' },
  { label: '100+いいね', likes: '100', views: '' },
  { label: '1K+いいね', likes: '1K', views: '' },
  { label: '10K+表示', likes: '', views: '10K' },
  { label: '100K+表示', likes: '', views: '100K' },
] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const LIMIT = 30;

export default function XFeedsPage() {
  const [accounts, setAccounts] = useState<XAccount[]>([]);
  const [posts, setPosts] = useState<XPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState('collected_at');
  const [accountFilter, setAccountFilter] = useState('all');

  // Engagement filters (human-readable strings like "1K", "100")
  const [minLikes, setMinLikes] = useState('');
  const [minViews, setMinViews] = useState('');
  const [minRetweets, setMinRetweets] = useState('');
  const [minBookmarks, setMinBookmarks] = useState('');

  const fetchAccounts = useCallback(async () => {
    const res = await fetch('/api/admin/x-feeds?section=accounts');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch accounts');
    setAccounts(data.accounts || []);
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('section', 'posts');
      params.set('limit', String(LIMIT));
      params.set('offset', String(offset));
      params.set('sort', sort);
      if (accountFilter !== 'all') params.set('account', accountFilter);

      // Engagement filters — parse human-readable values to numeric
      const likesNum = parseHumanNumber(minLikes);
      const viewsNum = parseHumanNumber(minViews);
      const retweetsNum = parseHumanNumber(minRetweets);
      const bookmarksNum = parseHumanNumber(minBookmarks);
      if (likesNum !== null) params.set('min_likes', String(likesNum));
      if (viewsNum !== null) params.set('min_views', String(viewsNum));
      if (retweetsNum !== null) params.set('min_retweets', String(retweetsNum));
      if (bookmarksNum !== null) params.set('min_bookmarks', String(bookmarksNum));

      const res = await fetch(`/api/admin/x-feeds?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch posts');
      setPosts(data.posts || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [offset, sort, accountFilter, minLikes, minViews, minRetweets, minBookmarks]);

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + LIMIT, total);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-text-deep">
            X(Twitter) Feeds
          </h1>
          <p className="text-sm text-text-light mt-2">
            RSSHub経由のXフィード管理・監視アカウント一覧・エンゲージメント分析
          </p>
        </div>
        <a
          href="/admin"
          className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-warm"
        >
          ← 管理トップ
        </a>
      </div>

      {error && (
        <div className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Section A: RSSHub Overview */}
      <CollapsiblePanel title="RSSHub 概要" defaultOpen={false}>
        <RSSHubOverview />
      </CollapsiblePanel>

      {/* Section B: Accounts */}
      <section>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          監視アカウント一覧
        </h2>
        <AccountsTable accounts={accounts} />
      </section>

      {/* Section C: Posts */}
      <section>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          投稿一覧
        </h2>

        {/* Filters + Sort */}
        <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-4 mb-4 space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <label>
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-light">
                アカウント
              </span>
              <select
                value={accountFilter}
                onChange={(e) => { setAccountFilter(e.target.value); setOffset(0); }}
                className="rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
              >
                <option value="all">すべて</option>
                {accounts.map((a) => (
                  <option key={a.source_id} value={a.source_id}>
                    {a.name} {a.handle || ''}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-light">
                ソート
              </span>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setOffset(0); }}
                className="rounded border border-border bg-bg-warm px-3 py-2 text-sm text-text-deep"
              >
                <option value="collected_at">収集日時</option>
                <option value="engagement_likes">いいね数</option>
                <option value="engagement_views">表示回数</option>
                <option value="nva_total">NVAスコア</option>
              </select>
            </label>
          </div>

          {/* Engagement Filters */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-text-light">
              エンゲージメント フィルタ
            </p>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {ENGAGEMENT_PRESETS.map((preset) => {
                const isActive = minLikes === preset.likes && minViews === preset.views;
                return (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setMinLikes(preset.likes);
                      setMinViews(preset.views);
                      setMinRetweets('');
                      setMinBookmarks('');
                      setOffset(0);
                    }}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      isActive
                        ? 'border-accent-leaf bg-accent-leaf/20 text-accent-leaf font-semibold'
                        : 'border-border text-text-muted hover:bg-bg-warm'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom inputs */}
            <div className="flex flex-wrap gap-3 items-end">
              <EngagementInput label="最小いいね" value={minLikes} onChange={(v) => { setMinLikes(v); setOffset(0); }} placeholder="例: 100, 1K" />
              <EngagementInput label="最小表示回数" value={minViews} onChange={(v) => { setMinViews(v); setOffset(0); }} placeholder="例: 10K, 1M" />
              <EngagementInput label="最小リポスト" value={minRetweets} onChange={(v) => { setMinRetweets(v); setOffset(0); }} placeholder="例: 50" />
              <EngagementInput label="最小ブックマーク" value={minBookmarks} onChange={(v) => { setMinBookmarks(v); setOffset(0); }} placeholder="例: 10" />
            </div>
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

        {/* Post Cards */}
        {loading && posts.length === 0 ? (
          <div className="text-text-muted text-sm py-8 text-center">読み込み中...</div>
        ) : posts.length === 0 ? (
          <div className="rounded border border-border bg-bg-cream px-3 py-4 text-sm text-text-light text-center">
            投稿データがありません。
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Bottom Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between mt-4">
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
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CollapsiblePanel (inline, same pattern as admin/page.tsx)
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
        <span
          className="text-text-light text-xs transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
        >
          ▼
        </span>
      </button>
      {open && <div className="px-5 pb-5 border-t border-border">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section A: RSSHub Overview
// ---------------------------------------------------------------------------

function RSSHubOverview() {
  return (
    <div className="pt-4 space-y-5">
      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          アーキテクチャ
        </h4>
        <div className="bg-bg-cream rounded-lg p-4">
          <pre className="text-xs text-text-muted font-mono leading-relaxed whitespace-pre-wrap">
{`RSSHub (localhost:1200)
  └── /twitter/user/:handle?format=json
        └── JSON Feed 1.1 + _extra.engagement
              ├── likes, retweets, replies, quotes, bookmarks, views
              └── crawlJsonFeed() → collected_items (engagement_* 列)`}
          </pre>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            RSSHubの役割
          </h4>
          <ul className="text-sm text-text-muted space-y-1.5 list-disc list-inside">
            <li>Twitter GraphQL API → RSS/JSON Feed 変換プロキシ</li>
            <li><code className="text-xs bg-bg-warm px-1 rounded">?format=json</code> でJSON Feed 1.1出力</li>
            <li><code className="text-xs bg-bg-warm px-1 rounded">_extra.engagement</code> にエンゲージメント含む</li>
            <li>crawl_method: <code className="text-xs bg-bg-warm px-1 rounded">json_feed</code></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            環境設定
          </h4>
          <div className="text-sm space-y-1.5">
            <div className="flex justify-between text-text-muted">
              <span className="text-text-light">Base URL:</span>
              <code className="text-xs font-mono">RSSHUB_BASE_URL</code>
            </div>
            <div className="flex justify-between text-text-muted">
              <span className="text-text-light">デフォルト:</span>
              <code className="text-xs font-mono">http://127.0.0.1:1200</code>
            </div>
            <div className="flex justify-between text-text-muted">
              <span className="text-text-light">フォーマット:</span>
              <code className="text-xs font-mono">JSON Feed 1.1</code>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          データフロー
        </h4>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[
            { label: 'RSSHub', sub: 'localhost:1200', color: 'bg-cat-content' },
            { label: 'JSON Feed', sub: '_extra.engagement', color: 'bg-accent-bloom' },
            { label: 'crawlJsonFeed()', sub: 'パース+保存', color: 'bg-accent-moss' },
            { label: 'collected_items', sub: 'engagement_*列', color: 'bg-accent-leaf' },
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section B: Accounts Table
// ---------------------------------------------------------------------------

function AccountsTable({ accounts }: { accounts: XAccount[] }) {
  if (accounts.length === 0) {
    return (
      <div className="rounded border border-border bg-bg-cream px-3 py-4 text-sm text-text-light text-center">
        X(Twitter)ソースが登録されていません。
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[800px] w-full text-sm">
          <thead className="bg-bg-cream/60 text-text-light">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">アカウント</th>
              <th className="px-4 py-3 text-left font-semibold">Tier</th>
              <th className="px-4 py-3 text-left font-semibold">信頼度</th>
              <th className="px-4 py-3 text-left font-semibold">最終収集</th>
              <th className="px-4 py-3 text-right font-semibold">投稿数</th>
              <th className="px-4 py-3 text-left font-semibold">ステータス</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {accounts.map((account) => (
              <tr key={account.source_id} className="hover:bg-bg-warm/50">
                <td className="px-4 py-3">
                  <div className="font-semibold text-text-deep">{account.name}</div>
                  {account.handle && (
                    <div className="text-xs text-text-light">{account.handle}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded border ${tierColor(account.tier)}`}>
                    {account.tier}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-muted">
                  {account.credibility_score ?? '--'}
                </td>
                <td className="px-4 py-3 text-xs text-text-muted">
                  {account.last_collected
                    ? formatRelativeTime(account.last_collected)
                    : '--'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-text-deep">
                  {account.item_count}
                </td>
                <td className="px-4 py-3">
                  {account.is_active ? (
                    <span className="px-2 py-1 text-xs rounded border text-accent-leaf bg-accent-leaf/20 border-accent-leaf/40">
                      稼働中
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded border text-text-light bg-bg-cream border-border">
                      停止中
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section C: Post Card
// ---------------------------------------------------------------------------

function PostCard({ post }: { post: XPost }) {
  const title = post.title_ja?.trim() || post.title;

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-4 space-y-3">
      {/* Title + Link */}
      <div>
        <h3 className="text-lg font-semibold font-heading text-text-deep inline">
          {title}
        </h3>
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-accent-leaf hover:text-accent-moss text-sm"
          >
            &#x2197;
          </a>
        )}
      </div>

      {/* Account + Date */}
      <p className="text-xs text-text-light">
        {post.source?.name || '不明'}
        {' / '}
        {formatDateTime(post.collected_at)}
        {post.published_at && ` / 投稿: ${formatDateTime(post.published_at)}`}
      </p>

      {/* Summary */}
      {post.content_summary && (
        <p className="text-sm text-text-muted line-clamp-2">{post.content_summary}</p>
      )}

      {/* Engagement + NVA */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-3 text-xs">
        <MetaChip label="いいね" value={formatNumber(post.engagement_likes)} />
        <MetaChip label="リポスト" value={formatNumber(post.engagement_retweets)} />
        <MetaChip label="リプライ" value={formatNumber(post.engagement_replies)} />
        <MetaChip label="引用" value={formatNumber(post.engagement_quotes)} />
        <MetaChip label="ブックマーク" value={formatNumber(post.engagement_bookmarks)} />
        <MetaChip label="表示回数" value={formatNumber(post.engagement_views)} />
        <MetaChip label="NVAスコア" value={post.nva_total != null ? String(post.nva_total) : '--'} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MetaChip (same pattern as collected-items/page.tsx)
// ---------------------------------------------------------------------------

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-bg-cream p-2">
      <p className="text-[10px] uppercase tracking-wide text-text-light">{label}</p>
      <p className="text-text-deep mt-1 break-all">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Engagement Input (with K/M hint)
// ---------------------------------------------------------------------------

function EngagementInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const parsed = parseHumanNumber(value);
  const isInvalid = value.trim() !== '' && parsed === null;

  return (
    <label className="min-w-[120px]">
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-text-light">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded border px-2 py-1.5 text-sm text-text-deep bg-bg-warm ${
          isInvalid ? 'border-danger' : 'border-border'
        }`}
      />
      {isInvalid && (
        <span className="text-[10px] text-danger mt-0.5 block">
          数値を入力 (例: 100, 1K, 1.5M)
        </span>
      )}
    </label>
  );
}
