#!/usr/bin/env node

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const NEWS_DIR = path.join(ROOT, 'content', 'news');
const PRODUCTS_DIR = path.join(ROOT, 'content', 'products');

const DEFAULT_TAG_LABELS = {
  'dev-knowledge': '開発ナレッジ',
  'case-study': 'ソロビルダー事例',
  'product-update': 'プロダクトアップデート',
};

const DIGEST_EDITION_FROM_CATEGORY = {
  'morning-summary': 'morning',
  'evening-summary': 'evening',
  'morning-news': 'morning',
  'evening-news': 'evening',
};

const NEWS_TAG_FROM_LEGACY_CATEGORY = {
  'dev-knowledge': ['dev-knowledge'],
  'knowledge': ['dev-knowledge'],
  dev: ['dev-knowledge'],
  'deep-dive': ['dev-knowledge'],
  'featured-tools': ['dev-knowledge'],
  'case-study': ['case-study'],
};

function die(message) {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

function listMarkdownFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith('.md') || name.endsWith('.mdx'))
    .map((name) => path.join(directory, name));
}

function parseArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeContentType({ explicitContentType, legacyCategory, fileKind }) {
  if (explicitContentType) {
    if (!['news', 'product', 'digest'].includes(explicitContentType)) {
      throw new Error(`Invalid contentType: ${explicitContentType}`);
    }
    return explicitContentType;
  }

  if (fileKind === 'product') return 'product';

  switch (legacyCategory) {
    case 'morning-news':
    case 'morning-summary':
    case 'evening-news':
    case 'evening-summary':
      return 'digest';
    case 'news':
    case 'knowledge':
    case 'dev':
    case 'deep-dive':
    case 'featured-tools':
    case 'product-news':
    case 'tools':
    case 'dev-knowledge':
    case 'case-study':
      return 'news';
    case 'products':
      return 'product';
    default:
      return 'news';
  }
}

function normalizeRecord(filePath, fileKind) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);

  const slug = String(data.slug || path.basename(filePath).replace(/\.mdx?$/, '')).trim();
  const title = String(data.title || '').trim();
  const date = String(data.date || '').trim();
  const description = String(data.description || '').trim();

  if (!slug || !title || !date || !description) {
    throw new Error(`Missing required frontmatter in ${filePath}`);
  }

  const explicitContentType = data.contentType ? String(data.contentType).trim() : '';
  const legacyCategory = data.category ? String(data.category).trim() : '';

  const contentType = normalizeContentType({ explicitContentType, legacyCategory, fileKind });

  let digestEdition = data.digestEdition ? String(data.digestEdition).trim() : '';
  if (!digestEdition && legacyCategory in DIGEST_EDITION_FROM_CATEGORY) {
    digestEdition = DIGEST_EDITION_FROM_CATEGORY[legacyCategory];
  }

  if (contentType === 'digest' && !['morning', 'evening'].includes(digestEdition)) {
    throw new Error(`Digest requires digestEdition=morning|evening: ${filePath}`);
  }

  const tags = unique([
    ...parseArray(data.tags),
    ...(NEWS_TAG_FROM_LEGACY_CATEGORY[legacyCategory] || []),
  ]);

  const relatedProducts = unique([
    ...parseArray(data.relatedProducts),
    data.relatedProduct ? String(data.relatedProduct).trim() : '',
  ]);

  const readTime = Number(data.readTime || 5);
  if (!Number.isFinite(readTime) || readTime <= 0) {
    throw new Error(`Invalid readTime in ${filePath}`);
  }

  const status = data.status ? String(data.status).trim() : 'published';
  if (!['draft', 'review', 'published', 'archived'].includes(status)) {
    throw new Error(`Invalid status in ${filePath}: ${status}`);
  }

  const checksum = crypto.createHash('sha256').update(raw).digest('hex');
  const sourcePath = path.relative(ROOT, filePath).replaceAll('\\', '/');

  return {
    slug,
    title,
    date,
    description,
    content,
    readTime,
    featured: Boolean(data.featured),
    image: data.image ? String(data.image).trim() : null,
    contentType,
    digestEdition: contentType === 'digest' ? digestEdition : null,
    tags: contentType === 'news' ? tags : [],
    relatedProducts,
    legacyCategory: legacyCategory || null,
    status,
    checksum,
    sourcePath,
    fileKind,
  };
}

function chunk(items, size = 200) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function dedupeRecordsBySlug(records) {
  const bySlug = new Map();
  const duplicateNotes = [];

  for (const record of records) {
    const existing = bySlug.get(record.slug);
    if (!existing) {
      bySlug.set(record.slug, record);
      continue;
    }

    const existingDate = new Date(existing.date).getTime();
    const nextDate = new Date(record.date).getTime();

    const useNext =
      Number.isFinite(nextDate) &&
      (!Number.isFinite(existingDate) || nextDate > existingDate || (nextDate === existingDate && record.sourcePath > existing.sourcePath));

    const selected = useNext ? record : existing;
    const dropped = useNext ? existing : record;
    bySlug.set(record.slug, selected);
    duplicateNotes.push(`${record.slug}: keep=${selected.sourcePath}, drop=${dropped.sourcePath}`);
  }

  return { records: [...bySlug.values()], duplicateNotes };
}

function dedupeRows(rows, keyFn) {
  const m = new Map();
  for (const row of rows) m.set(keyFn(row), row);
  return [...m.values()];
}

function dedupeDigestSlots(records) {
  const kept = new Map();
  const notes = [];

  for (const record of records) {
    if (record.contentType !== 'digest' || !record.digestEdition) {
      kept.set(`slug:${record.slug}`, record);
      continue;
    }

    const digestKey = `digest:${record.digestEdition}:${record.date}`;
    const existing = kept.get(digestKey);
    if (!existing) {
      kept.set(digestKey, record);
      continue;
    }

    const useNext =
      (record.featured ? 1 : 0) > (existing.featured ? 1 : 0) ||
      ((record.featured ? 1 : 0) === (existing.featured ? 1 : 0) && record.sourcePath > existing.sourcePath);

    const selected = useNext ? record : existing;
    const dropped = useNext ? existing : record;
    kept.set(digestKey, selected);
    notes.push(`${digestKey}: keep=${selected.slug} (${selected.sourcePath}), drop=${dropped.slug} (${dropped.sourcePath})`);
  }

  const digestValues = [...kept.entries()]
    .filter(([key]) => key.startsWith('digest:'))
    .map(([, value]) => value);
  const nonDigestValues = [...kept.entries()]
    .filter(([key]) => key.startsWith('slug:'))
    .map(([, value]) => value);

  return { records: [...nonDigestValues, ...digestValues], notes };
}

async function upsertInChunks(table, rows, onConflict, client) {
  for (const rowsChunk of chunk(rows)) {
    if (rowsChunk.length === 0) continue;
    const { error } = await client.from(table).upsert(rowsChunk, { onConflict });
    if (error) throw error;
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    die('Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).');
  }

  const files = [
    ...listMarkdownFiles(NEWS_DIR).map((p) => ({ p, fileKind: 'news' })),
    ...listMarkdownFiles(PRODUCTS_DIR).map((p) => ({ p, fileKind: 'product' })),
  ];

  if (files.length === 0) die('No markdown files found in content/news or content/products');

  const parsedRecords = files.map(({ p, fileKind }) => normalizeRecord(p, fileKind));
  const { records: dedupedBySlugRecords, duplicateNotes } = dedupeRecordsBySlug(parsedRecords);
  const { records, notes: digestSlotNotes } = dedupeDigestSlots(dedupedBySlugRecords);

  if (dryRun) {
    const digestCount = records.filter((r) => r.contentType === 'digest').length;
    const newsCount = records.filter((r) => r.contentType === 'news').length;
    const productCount = records.filter((r) => r.contentType === 'product').length;
    console.log('✅ dry-run summary');
    console.log(`- total: ${records.length}`);
    console.log(`- news: ${newsCount}`);
    console.log(`- digest: ${digestCount}`);
    console.log(`- product: ${productCount}`);
    if (duplicateNotes.length > 0) {
      console.log(`- deduped slugs: ${duplicateNotes.length}`);
    }
    if (digestSlotNotes.length > 0) {
      console.log(`- deduped digest slots: ${digestSlotNotes.length}`);
    }
    return;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const contentRows = records.map((r) => ({
    slug: r.slug,
    title: r.title,
    description: r.description,
    content_type: r.contentType,
    status: r.status,
    published_at: r.status === 'published' ? `${r.date}T00:00:00.000Z` : null,
    date: r.date,
    read_time: r.readTime,
    featured: r.featured,
    hero_image_url: r.image,
    body_markdown: r.content,
    body_html: null,
    legacy_category: r.legacyCategory,
    authoring_source: 'markdown',
    source_path: r.sourcePath,
    checksum: r.checksum,
  }));

  await upsertInChunks('contents', contentRows, 'slug', supabase);

  const allSlugs = records.map((r) => r.slug);
  const { data: savedContents, error: contentFetchError } = await supabase
    .from('contents')
    .select('id, slug, content_type')
    .in('slug', allSlugs);

  if (contentFetchError) throw contentFetchError;
  if (!savedContents || savedContents.length === 0) die('Failed to fetch upserted contents');

  const contentBySlug = new Map(savedContents.map((c) => [c.slug, c]));
  const allContentIds = savedContents.map((c) => c.id);

  const digestRows = records
    .filter((r) => r.contentType === 'digest')
    .map((r) => ({
      content_id: contentBySlug.get(r.slug)?.id,
      edition: r.digestEdition,
      digest_date: r.date,
    }))
    .filter((r) => r.content_id && r.edition);

  const productRows = records
    .filter((r) => r.contentType === 'product')
    .map((r) => ({
      content_id: contentBySlug.get(r.slug)?.id,
      product_slug: r.slug,
      website_url: null,
      pricing_summary: null,
      company_name: null,
      last_verified_at: null,
    }))
    .filter((r) => r.content_id);

  const digestIds = new Set(digestRows.map((r) => r.content_id));
  const productIds = new Set(productRows.map((r) => r.content_id));

  if (allContentIds.length > 0) {
    const { data: existingDigestRows, error: digestSelectError } = await supabase
      .from('digest_details')
      .select('content_id')
      .in('content_id', allContentIds);
    if (digestSelectError) throw digestSelectError;

    const staleDigestIds = (existingDigestRows || [])
      .map((r) => r.content_id)
      .filter((id) => !digestIds.has(id));

    if (staleDigestIds.length > 0) {
      const { error } = await supabase.from('digest_details').delete().in('content_id', staleDigestIds);
      if (error) throw error;
    }

    const { data: existingProductRows, error: productSelectError } = await supabase
      .from('products')
      .select('content_id')
      .in('content_id', allContentIds);
    if (productSelectError) throw productSelectError;

    const staleProductIds = (existingProductRows || [])
      .map((r) => r.content_id)
      .filter((id) => !productIds.has(id));

    if (staleProductIds.length > 0) {
      const { error } = await supabase.from('products').delete().in('content_id', staleProductIds);
      if (error) throw error;
    }
  }

  await upsertInChunks('digest_details', digestRows, 'content_id', supabase);
  await upsertInChunks('products', productRows, 'content_id', supabase);

  const tagCodes = unique(records.flatMap((r) => r.tags));
  const tagRows = tagCodes.map((code) => ({
    code,
    label: DEFAULT_TAG_LABELS[code] || code,
    description: DEFAULT_TAG_LABELS[code] ? null : 'custom tag',
  }));

  await upsertInChunks('tags', tagRows, 'code', supabase);

  const { data: savedTags, error: tagsFetchError } = await supabase
    .from('tags')
    .select('id, code')
    .in('code', tagCodes.length > 0 ? tagCodes : ['__none__']);

  if (tagsFetchError) throw tagsFetchError;
  const tagIdByCode = new Map((savedTags || []).map((t) => [t.code, t.id]));

  if (allContentIds.length > 0) {
    const { error } = await supabase.from('content_tags').delete().in('content_id', allContentIds);
    if (error) throw error;
  }

  const contentTagRows = dedupeRows(records.flatMap((r) => {
    const content = contentBySlug.get(r.slug);
    if (!content) return [];
    return r.tags
      .map((tagCode) => ({
        content_id: content.id,
        tag_id: tagIdByCode.get(tagCode),
      }))
      .filter((row) => row.tag_id);
  }), (row) => `${row.content_id}:${row.tag_id}`);

  await upsertInChunks('content_tags', contentTagRows, 'content_id,tag_id', supabase);

  if (allContentIds.length > 0) {
    const { error } = await supabase.from('content_product_links').delete().in('content_id', allContentIds);
    if (error) throw error;
  }

  const relatedProductSlugs = unique(records.flatMap((r) => r.relatedProducts));
  const lookupProductSlugs = unique([
    ...relatedProductSlugs,
    ...records.filter((r) => r.contentType === 'product').map((r) => r.slug),
  ]);

  const { data: productContentRows, error: productLookupError } = await supabase
    .from('contents')
    .select('id, slug, content_type')
    .in('slug', lookupProductSlugs.length > 0 ? lookupProductSlugs : ['__none__']);

  if (productLookupError) throw productLookupError;

  const productIdBySlug = new Map(
    (productContentRows || [])
      .filter((row) => row.content_type === 'product')
      .map((row) => [row.slug, row.id])
  );

  const missingProductLinks = [];
  const productLinkRows = [];

  for (const record of records) {
    const sourceContent = contentBySlug.get(record.slug);
    if (!sourceContent || record.relatedProducts.length === 0) continue;

    record.relatedProducts.forEach((productSlug, index) => {
      const productId = productIdBySlug.get(productSlug);
      if (!productId) {
        missingProductLinks.push(`${record.slug} -> ${productSlug}`);
        return;
      }

      productLinkRows.push({
        content_id: sourceContent.id,
        product_content_id: productId,
        relation_type: index === 0 ? 'primary' : 'related',
      });
    });
  }

  await upsertInChunks(
    'content_product_links',
    dedupeRows(productLinkRows, (row) => `${row.content_id}:${row.product_content_id}:${row.relation_type}`),
    'content_id,product_content_id,relation_type',
    supabase
  );

  console.log('✅ sync-content-to-supabase: completed');
  console.log(`- contents: ${contentRows.length}`);
  console.log(`- digest_details: ${digestRows.length}`);
  console.log(`- products: ${productRows.length}`);
  console.log(`- tags: ${tagRows.length}`);
  console.log(`- content_tags: ${contentTagRows.length}`);
  console.log(`- content_product_links: ${productLinkRows.length}`);
  if (duplicateNotes.length > 0) {
    console.warn('\\n⚠ Deduped duplicated slugs before sync:');
    for (const item of duplicateNotes) {
      console.warn(`- ${item}`);
    }
  }
  if (digestSlotNotes.length > 0) {
    console.warn('\\n⚠ Deduped duplicated digest edition/date slots before sync:');
    for (const item of digestSlotNotes) {
      console.warn(`- ${item}`);
    }
  }

  if (missingProductLinks.length > 0) {
    console.warn('\n⚠ Missing product references (not linked):');
    for (const item of missingProductLinks) {
      console.warn(`- ${item}`);
    }
  }
}

main().catch((error) => {
  console.error('\n❌ sync-content-to-supabase failed');
  console.error(error);
  process.exit(1);
});
