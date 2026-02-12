import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const NEWS_DIR = path.join(ROOT, 'content', 'news');
const PRODUCTS_DIR = path.join(ROOT, 'content', 'products');

const ALLOWED_NEWS_CATEGORIES = new Set([
  'morning-summary',
  'evening-summary',
  'news',
  'dev-knowledge',
  'case-study',
  // Legacy categories kept for migration compatibility.
  'morning-news',
  'evening-news',
  'knowledge',
  'product-news',
  'tools',
  'featured-tools',
  'dev',
  'deep-dive',
]);

const ALLOWED_PRODUCT_CATEGORY = 'products';
const ALLOWED_CONTENT_TYPES = new Set(['news', 'product', 'digest']);
const ALLOWED_DIGEST_EDITIONS = new Set(['morning', 'evening']);

const DIGEST_FORMAT_ENFORCE_FROM = '2026-02-10';

function die(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

function listMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
    .map((f) => path.join(dir, f));
}

function readFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  return { data, content, raw };
}

function assertRequiredFrontmatter(filePath, data, requiredKeys) {
  const missing = [];
  for (const k of requiredKeys) {
    if (data[k] === undefined || data[k] === null || String(data[k]).trim() === '') missing.push(k);
  }
  if (missing.length > 0) {
    die(`${filePath} is missing required frontmatter keys: ${missing.join(', ')}`);
  }
}

function normalizeArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean);
  die(`Expected array or comma-separated string, got: ${typeof value}`);
}

function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function inferFromLegacy(category, fileKind) {
  if (fileKind === 'product') {
    return { contentType: 'product', digestEdition: null, derivedTags: [] };
  }

  switch (category) {
    case 'morning-news':
    case 'morning-summary':
      return { contentType: 'digest', digestEdition: 'morning', derivedTags: [] };
    case 'evening-news':
    case 'evening-summary':
      return { contentType: 'digest', digestEdition: 'evening', derivedTags: [] };
    case 'knowledge':
    case 'dev':
    case 'deep-dive':
    case 'featured-tools':
    case 'dev-knowledge':
      return { contentType: 'news', digestEdition: null, derivedTags: ['dev-knowledge'] };
    case 'product-news':
    case 'tools':
      return { contentType: 'news', digestEdition: null, derivedTags: [] };
    case 'case-study':
      return { contentType: 'news', digestEdition: null, derivedTags: ['case-study'] };
    case 'products':
      return { contentType: 'product', digestEdition: null, derivedTags: [] };
    case 'news':
    default:
      return { contentType: 'news', digestEdition: null, derivedTags: [] };
  }
}

function resolveModel(filePath, data, fileKind) {
  const category = data.category ? String(data.category).trim() : '';
  const explicitContentType = data.contentType ? String(data.contentType).trim() : '';
  const explicitDigestEdition = data.digestEdition ? String(data.digestEdition).trim() : '';

  if (category) {
    if (fileKind === 'news' && !ALLOWED_NEWS_CATEGORIES.has(category)) {
      die(`${filePath} has invalid legacy category "${category}"`);
    }
    if (fileKind === 'product' && category !== ALLOWED_PRODUCT_CATEGORY) {
      die(`${filePath} category must be "${ALLOWED_PRODUCT_CATEGORY}" (got "${category}")`);
    }
  }

  const inferred = inferFromLegacy(category, fileKind);
  const contentType = explicitContentType || inferred.contentType;

  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    die(`${filePath} has invalid contentType "${contentType}"`);
  }

  const digestEdition = explicitDigestEdition || inferred.digestEdition;
  if (contentType === 'digest') {
    if (!digestEdition || !ALLOWED_DIGEST_EDITIONS.has(digestEdition)) {
      die(`${filePath} requires digestEdition=morning|evening for digest content`);
    }
  } else if (digestEdition) {
    die(`${filePath} has digestEdition but contentType is not digest`);
  }

  const tags = unique([...normalizeArray(data.tags), ...inferred.derivedTags]);
  const relatedProducts = unique([
    ...normalizeArray(data.relatedProducts),
    data.relatedProduct ? String(data.relatedProduct).trim() : '',
  ]);

  if (tags.includes('product-update') && relatedProducts.length === 0) {
    die(`${filePath} has tag "product-update" but no relatedProducts/relatedProduct`);
  }

  if (fileKind === 'product' && contentType !== 'product') {
    die(`${filePath} in content/products must resolve to contentType=product`);
  }

  if (fileKind === 'news' && contentType === 'product') {
    die(`${filePath} in content/news cannot resolve to contentType=product`);
  }

  return { contentType, digestEdition, tags, relatedProducts };
}

function extractProductLinks(markdown) {
  const links = [];
  const re = /\/products\/([a-z0-9-]+)/g;
  let m;
  while ((m = re.exec(markdown)) !== null) {
    links.push(m[1]);
  }
  return links;
}

function hasDigestSections(rawMarkdown) {
  return rawMarkdown.includes('## 🏁 重要ニュースランキング（NVA）') && rawMarkdown.includes('## 🔥 Top 3 ピックアップ');
}

function hasRankingTable(rawMarkdown) {
  const header = '## 🏁 重要ニュースランキング（NVA）';
  const idx = rawMarkdown.indexOf(header);
  if (idx === -1) return false;
  const after = rawMarkdown.slice(idx + header.length);
  return /\n\|.+\|\n\|[-| :]+\|\n\|.+\|/m.test(after);
}

function collectProductSlugs() {
  const slugs = new Set();

  for (const filePath of listMarkdownFiles(PRODUCTS_DIR)) {
    const { data } = readFrontmatter(filePath);
    assertRequiredFrontmatter(filePath, data, ['title', 'slug', 'date', 'description']);
    resolveModel(filePath, data, 'product');

    if (data.readTime === undefined || data.readTime === null || String(data.readTime).trim() === '') {
      console.warn(`⚠ ${filePath} has no readTime (legacy allowed for products during migration)`);
    }

    const slug = String(data.slug || '').trim();
    if (!slug) die(`${filePath} has empty slug`);
    slugs.add(slug);
  }

  return slugs;
}

function main() {
  const productSlugs = collectProductSlugs();

  const newsFiles = listMarkdownFiles(NEWS_DIR);
  if (newsFiles.length === 0) die('No content/news markdown files found');

  for (const filePath of newsFiles) {
    const { data, raw } = readFrontmatter(filePath);
    assertRequiredFrontmatter(filePath, data, ['title', 'slug', 'date', 'description', 'readTime']);

    const model = resolveModel(filePath, data, 'news');

    const links = extractProductLinks(raw);
    for (const slug of links) {
      if (!productSlugs.has(slug)) die(`${filePath} links to missing product slug "${slug}"`);
    }

    for (const rp of model.relatedProducts) {
      if (!productSlugs.has(rp)) die(`${filePath} has unresolved related product "${rp}"`);
    }

    if (model.contentType === 'digest') {
      const date = String(data.date || '').trim();
      const legacyCategory = data.category ? String(data.category).trim() : '';
      const isLegacyDigestCategory = legacyCategory === 'morning-news' || legacyCategory === 'evening-news';
      if (date && date >= DIGEST_FORMAT_ENFORCE_FROM && !isLegacyDigestCategory) {
        if (!hasDigestSections(raw)) die(`${filePath} (Digest) is missing required sections`);
        if (!hasRankingTable(raw)) {
          die(`${filePath} (Digest) is missing a valid ranking table under the NVA section`);
        }
      }
    }
  }

  console.log('✅ validate-content: OK');
}

main();
