/**
 * News collection crawler for RSS feeds, APIs (HN, Reddit), and scraping.
 *
 * Zero external dependencies beyond Node.js built-ins and native fetch.
 * RSS/Atom parsing uses regex extraction rather than xml2js or DOMParser.
 */

import { createHash } from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EngagementData {
  likes?: number;
  retweets?: number;
  replies?: number;
  quotes?: number;
  bookmarks?: number;
  views?: number | null;
}

export interface RawCollectedItem {
  title: string;
  url: string;
  author?: string;
  content_summary?: string;
  raw_content?: string;
  published_at?: string;
  engagement?: EngagementData;
}

/** Error classification for crawl failures */
export type CrawlErrorKind = 'transient' | 'permanent' | 'unknown';

export interface CrawlResult {
  items: RawCollectedItem[];
  error?: string;
  /** Classify the error so callers can decide whether to retry / disable */
  errorKind?: CrawlErrorKind;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const USER_AGENT = 'AISoloCraft-Crawler/1.0 (news aggregator)';
const FETCH_TIMEOUT_MS = 15_000;

/** Compute md5 hash for url dedup */
export function urlHash(url: string): string {
  return createHash('md5').update(url).digest('hex');
}

/** Safe fetch with timeout and user-agent */
async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html, application/rss+xml, application/xml, application/json, */*',
        ...(init?.headers ?? {}),
      },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

const RETRY_MAX = 2;
const RETRY_BASE_MS = 1_000;

/** Classify HTTP status into error kind */
function classifyHttpError(status: number): CrawlErrorKind {
  if (status >= 500) return 'transient';
  if (status === 429) return 'transient';
  if (status === 403 || status === 404 || status === 410) return 'permanent';
  return 'unknown';
}

/**
 * Fetch with automatic retry for transient errors (5xx, 429, timeout).
 * Returns the last Response even if non-ok so callers can inspect status.
 */
async function safeFetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= RETRY_MAX; attempt++) {
    try {
      const res = await safeFetch(url, init);
      // Only retry on server errors or rate-limit
      if (res.status >= 500 || res.status === 429) {
        if (attempt < RETRY_MAX) {
          await sleep(RETRY_BASE_MS * (attempt + 1));
          continue;
        }
      }
      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Retry on network/timeout errors
      if (attempt < RETRY_MAX) {
        await sleep(RETRY_BASE_MS * (attempt + 1));
        continue;
      }
    }
  }
  throw lastError ?? new Error('safeFetchWithRetry exhausted');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Strip HTML tags from a string */
function stripHtml(html: string): string {
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/** Extract text content between XML/HTML tags using regex */
function extractTag(xml: string, tagName: string): string | null {
  // Handle CDATA wrapped content
  const cdataPattern = new RegExp(
    `<${tagName}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tagName}>`,
    'i'
  );
  const cdataMatch = xml.match(cdataPattern);
  if (cdataMatch) return cdataMatch[1].trim();

  const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i');
  const match = xml.match(pattern);
  return match ? stripHtml(match[1]) : null;
}

/** Extract href attribute from a tag (used for Atom <link> elements) */
function extractLinkHref(xml: string): string | null {
  // Atom style: <link rel="alternate" href="..." />
  const altMatch = xml.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (altMatch) return altMatch[1];

  // Self-closing link with href
  const hrefMatch = xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (hrefMatch) return hrefMatch[1];

  // RSS style: <link>URL</link>
  const tagMatch = xml.match(/<link[^>]*>([^<]+)<\/link>/i);
  if (tagMatch) return tagMatch[1].trim();

  return null;
}

/** Truncate to maxLen chars */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

// ---------------------------------------------------------------------------
// RSS / Atom Feed Crawling
// ---------------------------------------------------------------------------

export async function crawlRss(feedUrl: string): Promise<CrawlResult> {
  try {
    const res = await safeFetch(feedUrl);
    if (!res.ok) {
      return { items: [], error: `RSS fetch failed: HTTP ${res.status}` };
    }

    const xml = await res.text();
    const items: RawCollectedItem[] = [];

    // Detect Atom vs RSS
    const isAtom = xml.includes('<feed') && xml.includes('xmlns="http://www.w3.org/2005/Atom"');

    if (isAtom) {
      // Atom feed parsing: split by <entry>
      const entries = xml.split(/<entry[\s>]/i).slice(1);
      for (const entry of entries) {
        const title = extractTag(entry, 'title');
        const link = extractLinkHref(entry);
        const summary = extractTag(entry, 'summary') || extractTag(entry, 'content');
        const published = extractTag(entry, 'published') || extractTag(entry, 'updated');
        const author = extractTag(entry, 'name'); // <author><name>...</name></author>

        if (title && link) {
          items.push({
            title: stripHtml(title),
            url: link,
            author: author || undefined,
            content_summary: summary ? truncate(stripHtml(summary), 500) : undefined,
            published_at: published || undefined,
          });
        }
      }
    } else {
      // RSS 2.0 parsing: split by <item>
      const rssItems = xml.split(/<item[\s>]/i).slice(1);
      for (const item of rssItems) {
        const title = extractTag(item, 'title');
        const link = extractTag(item, 'link') || extractLinkHref(item);
        const description = extractTag(item, 'description') || extractTag(item, 'content:encoded');
        const pubDate = extractTag(item, 'pubDate') || extractTag(item, 'dc:date');
        const author = extractTag(item, 'author') || extractTag(item, 'dc:creator');

        if (title && link) {
          items.push({
            title: stripHtml(title),
            url: link.trim(),
            author: author || undefined,
            content_summary: description ? truncate(stripHtml(description), 500) : undefined,
            published_at: pubDate || undefined,
          });
        }
      }
    }

    return { items };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { items: [], error: `RSS crawl error: ${message}` };
  }
}

// ---------------------------------------------------------------------------
// Hacker News (Algolia API)
// ---------------------------------------------------------------------------

interface HnHit {
  title: string;
  url: string | null;
  objectID: string;
  author: string;
  points: number;
  created_at: string;
  story_text?: string | null;
}

export async function crawlHackerNews(config: Record<string, unknown>): Promise<CrawlResult> {
  try {
    const query = (config.query as string) || 'AI';
    const minPoints = (config.min_points as number) || 50;
    const hitsPerPage = (config.hits_per_page as number) || 30;

    const apiUrl =
      `https://hn.algolia.com/api/v1/search?tags=story` +
      `&query=${encodeURIComponent(query)}` +
      `&hitsPerPage=${hitsPerPage}` +
      `&numericFilters=points>${minPoints}`;

    const res = await safeFetch(apiUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return { items: [], error: `HN API error: HTTP ${res.status}` };
    }

    const data = (await res.json()) as { hits: HnHit[] };
    const items: RawCollectedItem[] = [];

    for (const hit of data.hits) {
      const url = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
      items.push({
        title: hit.title,
        url,
        author: hit.author,
        content_summary: hit.story_text
          ? truncate(stripHtml(hit.story_text), 500)
          : `HN: ${hit.points} points`,
        published_at: hit.created_at,
      });
    }

    return { items };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { items: [], error: `HN crawl error: ${message}` };
  }
}

// ---------------------------------------------------------------------------
// Reddit API
// ---------------------------------------------------------------------------

interface RedditChild {
  data: {
    title: string;
    url: string;
    permalink: string;
    author: string;
    score: number;
    created_utc: number;
    selftext?: string;
    is_self: boolean;
  };
}

export async function crawlReddit(
  subreddit: string,
  config: Record<string, unknown>
): Promise<CrawlResult> {
  try {
    const limit = (config.limit as number) || 25;
    const apiUrl = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/hot.json?limit=${limit}`;

    const res = await safeFetch(apiUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return { items: [], error: `Reddit API error: HTTP ${res.status}` };
    }

    const data = (await res.json()) as { data: { children: RedditChild[] } };
    const items: RawCollectedItem[] = [];

    for (const child of data.data.children) {
      const post = child.data;
      // Skip pinned/meta posts
      if (!post.title) continue;

      const url = post.is_self
        ? `https://www.reddit.com${post.permalink}`
        : post.url;

      items.push({
        title: post.title,
        url,
        author: post.author,
        content_summary: post.selftext
          ? truncate(post.selftext, 500)
          : `Reddit: ${post.score} upvotes`,
        published_at: new Date(post.created_utc * 1000).toISOString(),
      });
    }

    return { items };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { items: [], error: `Reddit crawl error (r/${subreddit}): ${message}` };
  }
}

// ---------------------------------------------------------------------------
// Scraping (generic HTML)
// ---------------------------------------------------------------------------

export async function crawlScrape(
  url: string,
  config: Record<string, unknown>
): Promise<CrawlResult> {
  try {
    const res = await safeFetch(url);
    if (!res.ok) {
      return { items: [], error: `Scrape fetch failed: HTTP ${res.status}` };
    }

    const html = await res.text();
    const items: RawCollectedItem[] = [];

    // Extract page title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? stripHtml(titleMatch[1]) : url;

    // Extract meta description
    const metaDescMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*\/?>/i
    ) || html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*\/?>/i
    );
    const metaDesc = metaDescMatch ? stripHtml(metaDescMatch[1]) : undefined;

    // Try to extract article/section links from the page
    // Match <a> tags that look like article links
    const linkPattern = /<a[^>]*href=["']([^"'#]+)["'][^>]*>([^<]*(?:<[^/a][^>]*>[^<]*)*)<\/a>/gi;
    let match: RegExpExecArray | null;
    const seenUrls = new Set<string>();

    const maxItems = (config.max_items as number) || 25;

    while ((match = linkPattern.exec(html)) !== null && items.length < maxItems) {
      let linkUrl = match[1];
      const linkText = stripHtml(match[2]);

      // Skip navigation, empty, very short links
      if (!linkText || linkText.length < 10) continue;
      if (linkUrl.startsWith('javascript:') || linkUrl.startsWith('mailto:')) continue;

      // Resolve relative URLs
      if (linkUrl.startsWith('/')) {
        const baseUrl = new URL(url);
        linkUrl = `${baseUrl.origin}${linkUrl}`;
      } else if (!linkUrl.startsWith('http')) {
        continue;
      }

      if (seenUrls.has(linkUrl)) continue;
      seenUrls.add(linkUrl);

      items.push({
        title: linkText,
        url: linkUrl,
        content_summary: metaDesc,
      });
    }

    // If no links extracted, at least return the page itself
    if (items.length === 0) {
      // Extract <article> content as fallback
      const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
      const articleText = articleMatch ? truncate(stripHtml(articleMatch[1]), 500) : metaDesc;

      items.push({
        title: pageTitle,
        url,
        content_summary: articleText,
      });
    }

    return { items };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { items: [], error: `Scrape error: ${message}` };
  }
}

// ---------------------------------------------------------------------------
// Product Hunt (RSS fallback since PH API requires auth)
// ---------------------------------------------------------------------------

async function crawlProductHunt(config: Record<string, unknown>): Promise<CrawlResult> {
  // Product Hunt provides an RSS feed that does not require authentication
  const topic = (config.topic as string) || 'artificial-intelligence';
  const feedUrl = `https://www.producthunt.com/feed?category=${encodeURIComponent(topic)}`;

  try {
    const result = await crawlRss(feedUrl);
    if (result.items.length > 0) return result;

    // Fallback: scrape the topics page
    return crawlScrape(`https://www.producthunt.com/topics/${topic}`, config);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { items: [], error: `Product Hunt crawl error: ${message}` };
  }
}

// ---------------------------------------------------------------------------
// JSON Feed (RSSHub ?format=json)
// ---------------------------------------------------------------------------

interface JsonFeedItem {
  id?: string;
  url?: string;
  title?: string;
  content_text?: string;
  content_html?: string;
  date_published?: string;
  authors?: { name?: string; url?: string }[];
  _extra?: {
    engagement?: {
      likes?: number;
      retweets?: number;
      replies?: number;
      quotes?: number;
      bookmarks?: number;
      views?: number | null;
    };
    links?: { url: string; type: string }[];
  };
}

interface JsonFeed {
  version?: string;
  title?: string;
  items?: JsonFeedItem[];
}

export async function crawlJsonFeed(feedUrl: string): Promise<CrawlResult> {
  try {
    const res = await safeFetchWithRetry(feedUrl, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      const errorKind = classifyHttpError(res.status);
      // Try to extract upstream error message (RSSHub returns JSON with error.message)
      let detail = '';
      try {
        const body = (await res.json()) as { error?: { message?: string } };
        if (body?.error?.message) detail = `: ${body.error.message}`;
      } catch {
        // ignore parse failures
      }
      return {
        items: [],
        error: `JSON Feed fetch failed: HTTP ${res.status}${detail}`,
        errorKind,
      };
    }

    const feed = (await res.json()) as JsonFeed;
    const items: RawCollectedItem[] = [];

    for (const entry of feed.items ?? []) {
      const url = entry.url || entry.id;
      if (!url) continue;

      const title = entry.title || '';
      const contentRaw = entry.content_text || entry.content_html || '';
      const summary = contentRaw ? truncate(stripHtml(contentRaw), 500) : undefined;
      const author = entry.authors?.[0]?.name;

      const engagement = entry._extra?.engagement;

      items.push({
        title: title ? stripHtml(title) : url,
        url,
        author: author || undefined,
        content_summary: summary,
        published_at: entry.date_published || undefined,
        engagement: engagement
          ? {
              likes: engagement.likes,
              retweets: engagement.retweets,
              replies: engagement.replies,
              quotes: engagement.quotes,
              bookmarks: engagement.bookmarks,
              views: engagement.views,
            }
          : undefined,
      });
    }

    return { items };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = message.includes('abort') || message.includes('timeout');
    return {
      items: [],
      error: `JSON Feed crawl error: ${message}`,
      errorKind: isTimeout ? 'transient' : 'unknown',
    };
  }
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------

export async function collectFromSource(
  method: string,
  crawlUrl: string,
  crawlConfig: Record<string, unknown>
): Promise<CrawlResult> {
  switch (method) {
    case 'rss':
      return crawlRss(crawlUrl);

    case 'api': {
      const apiType = crawlConfig.api_type as string | undefined;

      if (apiType === 'hackernews') {
        return crawlHackerNews(crawlConfig);
      }

      if (apiType === 'reddit') {
        const subreddit = (crawlConfig.subreddit as string) || '';
        if (!subreddit) {
          return { items: [], error: 'Reddit subreddit not specified in crawl_config' };
        }
        return crawlReddit(subreddit, crawlConfig);
      }

      if (apiType === 'producthunt') {
        return crawlProductHunt(crawlConfig);
      }

      return { items: [], error: `Unknown api_type: ${apiType}` };
    }

    case 'json_feed':
      return crawlJsonFeed(crawlUrl);

    case 'scrape':
      return crawlScrape(crawlUrl, crawlConfig);

    case 'newsletter':
      // Newsletters are ingested via email/manual process, not crawled
      return { items: [], error: undefined };

    case 'manual':
      return { items: [], error: undefined };

    default:
      return { items: [], error: `Unknown crawl method: ${method}` };
  }
}
