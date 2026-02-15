export type ContentType = 'news' | 'product' | 'digest';
export type DigestEdition = 'morning' | 'evening' | null;

export interface SourceInfo {
  id?: string;
  name?: string;
  domain?: string;
  type?: 'primary' | 'secondary' | 'tertiary' | 'official' | 'media' | 'community' | 'social' | 'other';
  credibility_score?: number;
  verification_level?: 'official' | 'editorial' | 'community';
}

export interface Post {
  slug: string;
  title: string;
  date: string;
  category: string;
  description: string;
  readTime: number;
  featured: boolean;
  image?: string;
  content?: string;
  htmlContent?: string;
  type: 'news' | 'product';
  url: string;
  relatedProduct?: string;
  relatedProducts?: string[];
  tags?: string[];
  contentType?: ContentType;
  digestEdition?: DigestEdition;
  source?: SourceInfo;
}

export const CATEGORIES: Record<string, { label: string; color: string; emoji: string }> = {
  'morning-summary': { label: '朝のまとめ', color: '#3B82F6', emoji: '🗞️' },
  'evening-summary': { label: '夕のまとめ', color: '#F97316', emoji: '🗞️' },
  news: { label: 'ニュース', color: '#6366F1', emoji: '📰' },
  'dev-knowledge': { label: 'AI開発ナレッジ', color: '#10b981', emoji: '🧠' },
  'case-study': { label: 'ソロビルダー事例', color: '#f59e0b', emoji: '📊' },
  products: { label: 'プロダクト', color: '#8B5CF6', emoji: '🏷️' },
};

export const NEWS_SUBCATEGORIES: Record<string, { label: string; color: string; emoji: string }> = {
  news: { label: 'ニュース', color: '#6366F1', emoji: '📰' },
  'dev-knowledge': { label: 'ナレッジ', color: '#10b981', emoji: '🧠' },
  'case-study': { label: '事例', color: '#f59e0b', emoji: '📊' },
};

export interface TagMeta {
  label: string;
  color: string;
}

export const TAG_METADATA: Record<string, TagMeta> = {
  // News tags
  'dev-knowledge': { label: 'ナレッジ', color: '#10b981' },
  'case-study': { label: '事例', color: '#f59e0b' },
  'product-update': { label: 'ツール紹介', color: '#8B5CF6' },
  'ツール紹介': { label: 'ツール紹介', color: '#8B5CF6' },
  'other': { label: 'その他', color: '#64748b' },
};

// Product category tags
export const PRODUCT_TAGS: Record<string, TagMeta> = {
  'ai-coding': { label: 'AIコーディング', color: '#3B82F6' },
  'ai-ide': { label: 'AI IDE', color: '#6366F1' },
  'ai-image': { label: '画像生成', color: '#EC4899' },
  'ai-video': { label: '動画生成', color: '#F43F5E' },
  'ai-audio': { label: '音声・音楽', color: '#8B5CF6' },
  'ai-writing': { label: '文章作成', color: '#14B8A6' },
  'ai-chat': { label: 'AIチャット', color: '#06B6D4' },
  'ai-search': { label: 'AI検索', color: '#0EA5E9' },
  'ai-agent': { label: 'AIエージェント', color: '#F59E0B' },
  'ai-data': { label: 'データ分析', color: '#10B981' },
  'ai-productivity': { label: '生産性向上', color: '#84CC16' },
  'ai-marketing': { label: 'マーケティング', color: '#EF4444' },
  'ai-design': { label: 'AIデザイン', color: '#A855F7' },
  'no-code': { label: 'ノーコード', color: '#F97316' },
  'developer-tools': { label: '開発ツール', color: '#64748B' },
  'ai-meeting': { label: '会議・議事録', color: '#22C55E' },
  'ai-presentation': { label: 'プレゼン', color: '#EAB308' },
  'automation': { label: '自動化', color: '#7C3AED' },
};

const DEFAULT_NEWS_BADGE: TagMeta = { label: 'その他', color: '#64748b' };

export function getPostBadge(post: Post): { label: string; color: string } {
  const cat = CATEGORIES[post.category];
  // Digests and products use category badge as-is
  if (post.category !== 'news') return cat || DEFAULT_NEWS_BADGE;
  // News articles: derive badge from first recognized tag
  if (post.tags) {
    for (const tag of post.tags) {
      const meta = TAG_METADATA[tag];
      if (meta) return meta;
    }
  }
  return DEFAULT_NEWS_BADGE;
}
