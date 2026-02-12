import type { Post } from '@/lib/posts';

export type ApiContentType = 'news' | 'product' | 'digest';

export interface ContentListQuery {
  contentType?: ApiContentType;
  category?: string;
  digestEdition?: 'morning' | 'evening';
  tags?: string[];
  featured?: boolean;
  limit: number;
  offset: number;
  q?: string;
}

export interface ApiContentSummary {
  slug: string;
  title: string;
  date: string;
  description: string;
  readTime: number;
  featured: boolean;
  image?: string;
  url: string;
  category: string;
  type: 'news' | 'product';
  contentType: ApiContentType;
  digestEdition: 'morning' | 'evening' | null;
  tags: string[];
  relatedProducts: string[];
}

export interface ApiContentDetail extends ApiContentSummary {
  content: string;
  htmlContent?: string;
}

export function parseBoolean(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  if (value === '1' || value.toLowerCase() === 'true') return true;
  if (value === '0' || value.toLowerCase() === 'false') return false;
  return undefined;
}

export function parseInteger(
  value: string | null,
  fallback: number,
  options: { min?: number; max?: number } = {}
): number {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;

  const min = options.min ?? Number.MIN_SAFE_INTEGER;
  const max = options.max ?? Number.MAX_SAFE_INTEGER;
  return Math.max(min, Math.min(max, parsed));
}

export function parseTags(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function toApiSummary(post: Post): ApiContentSummary {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    description: post.description,
    readTime: post.readTime,
    featured: post.featured,
    image: post.image,
    url: post.url,
    category: post.category,
    type: post.type,
    contentType: post.contentType || (post.type === 'product' ? 'product' : 'news'),
    digestEdition: post.digestEdition ?? null,
    tags: post.tags || [],
    relatedProducts: post.relatedProducts || [],
  };
}

export function toApiDetail(post: Post): ApiContentDetail {
  return {
    ...toApiSummary(post),
    content: post.content || '',
    htmlContent: post.htmlContent,
  };
}

function getPostContentType(post: Post): ApiContentType {
  return post.contentType || (post.type === 'product' ? 'product' : 'news');
}

export function matchesQuery(post: Post, query: Omit<ContentListQuery, 'limit' | 'offset'>): boolean {
  if (query.contentType && getPostContentType(post) !== query.contentType) {
    return false;
  }

  if (query.category && post.category !== query.category) {
    return false;
  }

  if (query.digestEdition) {
    if ((post.digestEdition || null) !== query.digestEdition) {
      return false;
    }
  }

  if (query.featured !== undefined && post.featured !== query.featured) {
    return false;
  }

  if (query.tags && query.tags.length > 0) {
    const postTags = post.tags || [];
    if (!query.tags.every((tag) => postTags.includes(tag))) {
      return false;
    }
  }

  if (query.q) {
    const needle = query.q.toLowerCase();
    const haystack = `${post.title}\n${post.description}`.toLowerCase();
    if (!haystack.includes(needle)) {
      return false;
    }
  }

  return true;
}

export function filterPosts(posts: Post[], query: ContentListQuery): Post[] {
  const filtered = posts.filter((post) => matchesQuery(post, query));

  return filtered.slice(query.offset, query.offset + query.limit);
}
