import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import html from 'remark-html';
import type { Database } from '@/types/database';

const newsDirectory = path.join(process.cwd(), 'content/news');
const productsDirectory = path.join(process.cwd(), 'content/products');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const CONTENT_READ_SOURCE = process.env.CONTENT_READ_SOURCE || 'db-first';

type ContentType = 'news' | 'product' | 'digest';
type DigestEdition = 'morning' | 'evening' | null;

interface CanonicalModel {
  contentType: ContentType;
  digestEdition: DigestEdition;
  tags: string[];
  relatedProducts: string[];
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
}

interface PreparedData {
  allContent: Post[];
  allPosts: Post[];
  allProducts: Post[];
  bySlug: Map<string, Post>;
}

export const CATEGORIES: Record<string, { label: string; color: string; emoji: string }> = {
  'morning-summary': { label: '朝のまとめ', color: '#3B82F6', emoji: '🗞️' },
  'evening-summary': { label: '夕のまとめ', color: '#F97316', emoji: '🗞️' },
  news: { label: 'ニュース', color: '#6366F1', emoji: '📰' },
  'dev-knowledge': { label: 'AI開発ナレッジ', color: '#10b981', emoji: '🧠' },
  'case-study': { label: 'ソロビルダー事例', color: '#f59e0b', emoji: '📊' },
  products: { label: 'プロダクト', color: '#8B5CF6', emoji: '🏷️' },
};

let dbPreparedDataPromise: Promise<PreparedData | null> | null = null;

function canUseDatabase() {
  if (CONTENT_READ_SOURCE === 'file') return false;
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

function inferCanonicalModel(data: Record<string, unknown>, fileType: 'news' | 'product'): CanonicalModel {
  const explicitContentType = data.contentType ? String(data.contentType).trim() : '';
  const legacyCategory = data.category ? String(data.category).trim() : '';

  let contentType: ContentType;
  if (explicitContentType === 'news' || explicitContentType === 'product' || explicitContentType === 'digest') {
    contentType = explicitContentType;
  } else if (fileType === 'product') {
    contentType = 'product';
  } else if (legacyCategory === 'morning-summary' || legacyCategory === 'evening-summary') {
    contentType = 'digest';
  } else if (legacyCategory === 'products') {
    contentType = 'product';
  } else {
    contentType = 'news';
  }

  let digestEdition: DigestEdition = null;
  if (contentType === 'digest') {
    const explicitEdition = data.digestEdition ? String(data.digestEdition).trim() : '';
    if (explicitEdition === 'morning' || explicitEdition === 'evening') {
      digestEdition = explicitEdition;
    } else if (legacyCategory === 'evening-summary') {
      digestEdition = 'evening';
    } else {
      digestEdition = 'morning';
    }
  }

  const tags = unique([
    ...parseArray(data.tags),
    ...(legacyCategory === 'dev-knowledge' ? ['dev-knowledge'] : []),
    ...(legacyCategory === 'case-study' ? ['case-study'] : []),
  ]);

  const relatedProducts = unique([
    ...parseArray(data.relatedProducts),
    data.relatedProduct ? String(data.relatedProduct).trim() : '',
  ]);

  return { contentType, digestEdition, tags, relatedProducts };
}

function normalizePostFromFrontmatter(
  data: Record<string, unknown>,
  filename: string,
  fileType: 'news' | 'product',
  content?: string
): Post {
  const slug = String(data.slug || filename.replace(/\.mdx?$/, '')).trim();
  const model = inferCanonicalModel(data, fileType);
  const category = mapCategoryFromCanonical(model.contentType, model.digestEdition, model.tags);

  return {
    slug,
    title: String(data.title || ''),
    date: String(data.date || ''),
    category,
    description: String(data.description || ''),
    readTime: Number(data.readTime || 5),
    featured: Boolean(data.featured),
    image: data.image ? String(data.image) : undefined,
    content,
    type: model.contentType === 'product' ? 'product' : 'news',
    url: model.contentType === 'product' ? `/products/${slug}` : `/news/${slug}`,
    relatedProduct: model.relatedProducts[0],
    relatedProducts: model.relatedProducts,
    tags: model.tags,
    contentType: model.contentType,
    digestEdition: model.digestEdition,
  };
}

function sortByDateDesc(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function readPostsFromDirectory(directory: string, fileType: 'news' | 'product', includeContent = false): Post[] {
  if (!fs.existsSync(directory)) return [];

  const filenames = fs.readdirSync(directory).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));

  return filenames.map((filename) => {
    const filePath = path.join(directory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    return normalizePostFromFrontmatter(data, filename, fileType, includeContent ? content : undefined);
  });
}

function getAllPostsFromFiles(): Post[] {
  return sortByDateDesc(readPostsFromDirectory(newsDirectory, 'news'));
}

function getAllProductsFromFiles(): Post[] {
  return sortByDateDesc(readPostsFromDirectory(productsDirectory, 'product'));
}

function getAllContentFromFiles(): Post[] {
  return sortByDateDesc([
    ...readPostsFromDirectory(newsDirectory, 'news'),
    ...readPostsFromDirectory(productsDirectory, 'product'),
  ]);
}

async function findPostInDirectory(directory: string, slug: string, fileType: 'news' | 'product'): Promise<Post | null> {
  if (!fs.existsSync(directory)) return null;

  const filenames = fs.readdirSync(directory).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));

  for (const filename of filenames) {
    const filePath = path.join(directory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    const postSlug = String(data.slug || filename.replace(/\.mdx?$/, '')).trim();
    if (postSlug === slug) {
      const post = normalizePostFromFrontmatter(data, filename, fileType, content);
      const processedContent = await remark().use(remarkGfm).use(html).process(content);
      return { ...post, htmlContent: processedContent.toString() };
    }
  }

  return null;
}

async function withHtmlContent(post: Post): Promise<Post> {
  if (!post.content || post.htmlContent) return post;
  const processedContent = await remark().use(remarkGfm).use(html).process(post.content);
  return { ...post, htmlContent: processedContent.toString() };
}

async function fetchDbPreparedData(): Promise<PreparedData> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('DB client unavailable');

  const { data: contents, error: contentsError } = await supabase
    .from('contents')
    .select('id, slug, title, description, date, read_time, featured, hero_image_url, body_markdown, content_type, status')
    .eq('status', 'published')
    .order('date', { ascending: false });

  if (contentsError) throw contentsError;

  if (!contents || contents.length === 0) {
    return { allContent: [], allPosts: [], allProducts: [], bySlug: new Map() };
  }

  const contentIds = contents.map((c) => c.id);

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

  const contentSlugById = new Map(contents.map((c) => [c.id, c.slug]));

  const relatedProductsByContentId = new Map<string, { productSlug: string; relationType: string }[]>();
  for (const row of productLinkRows || []) {
    const productSlug = contentSlugById.get(row.product_content_id);
    if (!productSlug) continue;

    const existing = relatedProductsByContentId.get(row.content_id) || [];
    existing.push({ productSlug, relationType: row.relation_type });
    relatedProductsByContentId.set(row.content_id, existing);
  }

  const allContent: Post[] = contents.map((row) => {
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
    };
  });

  const sortedContent = sortByDateDesc(allContent);
  const allPosts = sortedContent.filter((p) => p.type === 'news');
  const allProducts = sortedContent.filter((p) => p.type === 'product');
  const bySlug = new Map(sortedContent.map((p) => [p.slug, p]));

  return { allContent: sortedContent, allPosts, allProducts, bySlug };
}

async function getDbPreparedData(): Promise<PreparedData | null> {
  if (!canUseDatabase()) return null;

  if (!dbPreparedDataPromise) {
    dbPreparedDataPromise = fetchDbPreparedData().catch((error) => {
      console.warn('[posts] DB read failed, fallback to markdown.', error);
      dbPreparedDataPromise = null;
      return null;
    });
  }

  return dbPreparedDataPromise;
}

export async function getAllPosts(): Promise<Post[]> {
  const db = await getDbPreparedData();
  if (db) return db.allPosts;
  return getAllPostsFromFiles();
}

export async function getAllProducts(): Promise<Post[]> {
  const db = await getDbPreparedData();
  if (db) return db.allProducts;
  return getAllProductsFromFiles();
}

export async function getAllContent(): Promise<Post[]> {
  const db = await getDbPreparedData();
  if (db) return db.allContent;
  return getAllContentFromFiles();
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

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const db = await getDbPreparedData();
  if (db) {
    const post = db.bySlug.get(slug);
    if (post && post.type === 'news') {
      return withHtmlContent(post);
    }
  }

  return findPostInDirectory(newsDirectory, slug, 'news');
}

export async function getProductBySlug(slug: string): Promise<Post | null> {
  const db = await getDbPreparedData();
  if (db) {
    const post = db.bySlug.get(slug);
    if (post && post.type === 'product') {
      return withHtmlContent(post);
    }
  }

  return findPostInDirectory(productsDirectory, slug, 'product');
}
