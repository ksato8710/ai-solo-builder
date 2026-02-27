import { createClient } from '@supabase/supabase-js';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import html from 'remark-html';
import type { Database } from '@/types/database';
import { CATEGORIES, NEWS_SUBCATEGORIES } from './types';
import type { ContentType, DigestEdition, Post } from './types';

export { CATEGORIES, NEWS_SUBCATEGORIES } from './types';
export type { Post } from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

interface PreparedData {
  allContent: Post[];
  allPosts: Post[];
  allProducts: Post[];
  bySlug: Map<string, Post>;
}

const NEWS_CATEGORY_KEYS = Object.keys(NEWS_SUBCATEGORIES);

let dbPreparedDataPromise: Promise<PreparedData | null> | null = null;

function canUseDatabase() {
  return Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY);
}

function getSupabaseClient() {
  if (!canUseDatabase()) return null;
  return createClient<Database>(SUPABASE_URL!, SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean);
  return [];
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function mapCategoryFromCanonical(contentType: ContentType, digestEdition: DigestEdition, tags: string[]): string {
  if (contentType === 'product') return 'products';
  if (contentType === 'digest') {
    return digestEdition === 'evening' ? 'evening-summary' : 'morning-summary';
  }

  if (tags.includes('case-study')) return 'case-study';
  if (tags.includes('dev-knowledge')) return 'dev-knowledge';
  return 'news';
}

function sortByDateDesc(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

async function withHtmlContent(post: Post): Promise<Post> {
  if (!post.content || post.htmlContent) return post;
  const processedContent = await remark().use(remarkGfm).use(html).process(post.content);
  return { ...post, htmlContent: processedContent.toString() };
}

async function fetchDbPreparedData(): Promise<PreparedData> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('DB client unavailable');

  // Temporary workaround for type definitions
  const query: any = supabase
    .from('contents')
    .select(`
      id, slug, title, description, date, read_time, featured, hero_image_url, body_markdown, content_type, status,
      primary_source_id,
      sources:primary_source_id (
        id, name, domain, source_type, credibility_score, verification_level, description
      )
    `)
    .eq('status', 'published')
    .order('date', { ascending: false });

  const { data: contents, error: contentsError } = await query;

  if (contentsError) throw contentsError;

  if (!contents || contents.length === 0) {
    return { allContent: [], allPosts: [], allProducts: [], bySlug: new Map() };
  }

  const contentIds = contents.map((c: any) => c.id);

  const { data: digestRows, error: digestError } = await supabase
    .from('digest_details')
    .select('content_id, edition')
    .in('content_id', contentIds);
  if (digestError) throw digestError;

  const { data: contentTagRows, error: contentTagError } = await supabase
    .from('content_tags')
    .select('content_id, tag_id')
    .in('content_id', contentIds);
  if (contentTagError) throw contentTagError;

  const tagIds = unique((contentTagRows || []).map((r) => r.tag_id));

  let tagsById = new Map<string, string>();
  if (tagIds.length > 0) {
    const { data: tagRows, error: tagError } = await supabase.from('tags').select('id, code').in('id', tagIds);
    if (tagError) throw tagError;
    tagsById = new Map((tagRows || []).map((row) => [row.id, row.code]));
  }

  const { data: productLinkRows, error: productLinkError } = await supabase
    .from('content_product_links')
    .select('content_id, product_content_id, relation_type')
    .in('content_id', contentIds);
  if (productLinkError) throw productLinkError;

  const digestEditionByContentId = new Map((digestRows || []).map((r) => [r.content_id, r.edition]));

  const tagsByContentId = new Map<string, string[]>();
  for (const row of contentTagRows || []) {
    const tagCode = tagsById.get(row.tag_id);
    if (!tagCode) continue;
    const existing = tagsByContentId.get(row.content_id) || [];
    existing.push(tagCode);
    tagsByContentId.set(row.content_id, existing);
  }

  const contentSlugById = new Map(contents.map((c: any) => [c.id, c.slug]));

  const relatedProductsByContentId = new Map<string, { productSlug: string; relationType: string }[]>();
  for (const row of productLinkRows || []) {
    const productSlug = contentSlugById.get(row.product_content_id);
    if (!productSlug) continue;

    const existing = relatedProductsByContentId.get(row.content_id) || [];
    existing.push({ productSlug: String(productSlug), relationType: row.relation_type });
    relatedProductsByContentId.set(row.content_id, existing);
  }

  const allContent: Post[] = contents.map((row: any) => {
    const contentType = row.content_type as ContentType;
    const digestEdition = (digestEditionByContentId.get(row.id) || null) as DigestEdition;
    const tags = unique(tagsByContentId.get(row.id) || []);

    const relatedProducts = unique(
      (relatedProductsByContentId.get(row.id) || [])
        .sort((a, b) => {
          if (a.relationType === 'primary' && b.relationType !== 'primary') return -1;
          if (a.relationType !== 'primary' && b.relationType === 'primary') return 1;
          return a.productSlug.localeCompare(b.productSlug);
        })
        .map((r) => r.productSlug)
    );

    const category = mapCategoryFromCanonical(contentType, digestEdition, tags);
    const type = contentType === 'product' ? 'product' : 'news';

    // Extract source information
    const sourceData = (row as any).sources;
    const source = sourceData ? {
      id: sourceData.id,
      name: sourceData.name,
      domain: sourceData.domain,
      type: sourceData.source_type,
      credibility_score: sourceData.credibility_score,
      verification_level: sourceData.verification_level,
    } : undefined;

    return {
      slug: row.slug,
      title: row.title,
      date: row.date,
      category,
      description: row.description,
      readTime: row.read_time,
      featured: row.featured,
      image: row.hero_image_url || undefined,
      content: row.body_markdown,
      type,
      url: type === 'product' ? `/products/${row.slug}` : `/news/${row.slug}`,
      relatedProduct: relatedProducts[0],
      relatedProducts,
      tags,
      contentType,
      digestEdition,
      source,
    };
  });

  const sortedContent = sortByDateDesc(allContent);
  const allPosts = sortedContent.filter((p) => p.type === 'news');
  const allProducts = sortedContent.filter((p) => p.type === 'product');
  const bySlug = new Map(sortedContent.map((p) => [p.slug, p]));

  return { allContent: sortedContent, allPosts, allProducts, bySlug };
}

const EMPTY_PREPARED_DATA: PreparedData = {
  allContent: [],
  allPosts: [],
  allProducts: [],
  bySlug: new Map(),
};

async function getDbPreparedData(): Promise<PreparedData> {
  if (!canUseDatabase()) {
    console.error('[posts] DB credentials not configured. Returning empty data.');
    return EMPTY_PREPARED_DATA;
  }

  if (!dbPreparedDataPromise) {
    dbPreparedDataPromise = fetchDbPreparedData().catch((error) => {
      console.error('[posts] DB read failed. Returning empty data.', error);
      dbPreparedDataPromise = null;
      return EMPTY_PREPARED_DATA;
    });
  }

  return dbPreparedDataPromise.then((result) => result ?? EMPTY_PREPARED_DATA);
}

export async function getAllPosts(): Promise<Post[]> {
  const db = await getDbPreparedData();
  return db.allPosts;
}

export async function getAllProducts(): Promise<Post[]> {
  const db = await getDbPreparedData();
  return db.allProducts;
}

export async function getAllContent(): Promise<Post[]> {
  const db = await getDbPreparedData();
  return db.allContent;
}

export async function getPostsByCategory(category: string): Promise<Post[]> {
  if (category === 'products') {
    return getAllProducts();
  }

  const posts = await getAllPosts();
  return posts.filter((p) => p.category === category);
}

export async function getFeaturedPosts(): Promise<Post[]> {
  const content = await getAllContent();
  return content.filter((p) => p.featured);
}

export async function getAllNewsPosts(): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts.filter((p) => NEWS_CATEGORY_KEYS.includes(p.category));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const db = await getDbPreparedData();
    const post = db.bySlug.get(slug);
    if (post && post.type === 'news') {
      return withHtmlContent(post);
    }
    return null;
  } catch (error) {
    console.error(`[posts] Failed to get post by slug: ${slug}`, error);
    return null;
  }
}

export async function getProductBySlug(slug: string): Promise<Post | null> {
  try {
    const db = await getDbPreparedData();
    const post = db.bySlug.get(slug);
    if (post && post.type === 'product') {
      return withHtmlContent(post);
    }
    return null;
  } catch (error) {
    console.error(`[posts] Failed to get product by slug: ${slug}`, error);
    return null;
  }
}

export async function getPostsByRelatedProduct(productSlug: string): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts
    .filter((p) => p.relatedProducts?.includes(productSlug))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6); // max 6 items
}
