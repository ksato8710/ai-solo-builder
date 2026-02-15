'use client';

import { useMemo, useState } from 'react';
import type { Post } from '@/lib/types';
import { PRODUCT_TAGS } from '@/lib/types';
import NewsCard from './NewsCard';

interface ProductFilterChipsProps {
  products: Post[];
}

const ALL_KEY = '__all__';

export default function ProductFilterChips({ products }: ProductFilterChipsProps) {
  const [activeTag, setActiveTag] = useState(ALL_KEY);

  // Collect unique tags that exist in products
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      if (product.tags && product.tags.length > 0) {
        for (const tag of product.tags) {
          if (PRODUCT_TAGS[tag]) {
            counts.set(tag, (counts.get(tag) || 0) + 1);
          }
        }
      }
    }
    // Sort by count descending
    return new Map([...counts.entries()].sort((a, b) => b[1] - a[1]));
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeTag === ALL_KEY) return products;
    return products.filter(p => p.tags?.includes(activeTag));
  }, [products, activeTag]);

  return (
    <div>
      {/* Filter Chips */}
      {tagCounts.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {/* "All" chip */}
          <button
            onClick={() => setActiveTag(ALL_KEY)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTag === ALL_KEY 
                ? 'bg-[var(--accent-violet)]/20 text-[var(--text-primary)] border border-[var(--accent-violet)]/40'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-transparent hover:border-[var(--border-color)]'
            }`}
          >
            すべて
            <span className="ml-1.5 opacity-60">{products.length}</span>
          </button>

          {/* Dynamic tag chips */}
          {[...tagCounts.entries()].map(([tag, count]) => {
            const isActive = activeTag === tag;
            const meta = PRODUCT_TAGS[tag];
            if (!meta) return null;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(isActive ? ALL_KEY : tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  !isActive ? 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-transparent hover:border-[var(--border-color)]' : ''
                }`}
                style={isActive ? {
                  backgroundColor: meta.color + '22',
                  color: meta.color,
                  border: `1px solid ${meta.color}44`,
                } : undefined}
              >
                {meta.label}
                <span className="ml-1.5 opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <NewsCard key={product.slug} post={product} size="small" />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-6xl mb-4 opacity-20">🏷️</p>
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">プロダクトがありません</h3>
          <p className="text-[var(--text-secondary)] text-sm">このカテゴリにはまだプロダクトがありません。</p>
        </div>
      )}
    </div>
  );
}
