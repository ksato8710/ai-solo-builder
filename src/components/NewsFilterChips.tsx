'use client';

import { useMemo, useState } from 'react';
import type { Post } from '@/lib/types';
import { TAG_METADATA } from '@/lib/types';
import NewsCard from './NewsCard';

interface NewsFilterChipsProps {
  posts: Post[];
}

const ALL_KEY = '__all__';
const DEFAULT_TAG_COLOR = '#8A9E8C';

export default function NewsFilterChips({ posts }: NewsFilterChipsProps) {
  const [activeTag, setActiveTag] = useState(ALL_KEY);

  // Collect unique tags that actually exist in posts, preserving insertion order
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      if (post.tags && post.tags.length > 0) {
        for (const tag of post.tags) {
          counts.set(tag, (counts.get(tag) || 0) + 1);
        }
      }
    }
    return counts;
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (activeTag === ALL_KEY) return posts;
    return posts.filter(p => p.tags?.includes(activeTag));
  }, [posts, activeTag]);

  const chipColor = (tag: string) => TAG_METADATA[tag]?.color ?? DEFAULT_TAG_COLOR;
  const chipLabel = (tag: string) => TAG_METADATA[tag]?.label ?? tag;

  return (
    <div>
      {/* Active filter indicator */}
      {activeTag !== ALL_KEY && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-text-muted">フィルター:</span>
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: chipColor(activeTag) + '33',
              color: chipColor(activeTag),
              border: `1px solid ${chipColor(activeTag)}66`,
            }}
          >
            {chipLabel(activeTag)}
          </span>
          <button
            onClick={() => setActiveTag(ALL_KEY)}
            className="text-xs text-text-muted hover:text-text-deep transition-colors"
          >
            ✕ クリア
          </button>
        </div>
      )}

      {/* Article Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <NewsCard key={post.slug} post={post} size="medium" />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-6xl mb-4 opacity-20">📰</p>
          <h3 className="font-heading text-xl font-bold text-text-deep mb-2">記事がありません</h3>
          <p className="text-text-muted text-sm">このタグにはまだ記事がありません。</p>
        </div>
      )}

      {/* Tag Chips — bottom of page */}
      {tagCounts.size > 0 && (
        <div className="mt-12 pt-8 border-t border-border-subtle">
          <h2 className="text-sm font-semibold text-text-muted mb-4">タグで絞り込む</h2>
          <div className="flex flex-wrap gap-2">
            {/* "All" chip */}
            <button
              onClick={() => setActiveTag(ALL_KEY)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTag === ALL_KEY
                  ? 'bg-accent-bark/20 text-text-deep border border-accent-bark/40'
                  : 'bg-bg-card text-text-muted border border-transparent'
              }`}
            >
              すべて
              <span className="ml-1.5 opacity-60">{posts.length}</span>
            </button>

            {/* Dynamic tag chips */}
            {[...tagCounts.entries()].map(([tag, count]) => {
              const isActive = activeTag === tag;
              const color = chipColor(tag);
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(isActive ? ALL_KEY : tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    !isActive ? 'bg-bg-card text-text-muted border border-transparent' : ''
                  }`}
                  style={isActive ? {
                    backgroundColor: color + '33',
                    color,
                    border: `1px solid ${color}66`,
                  } : undefined}
                >
                  {chipLabel(tag)}
                  <span className="ml-1.5 opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
