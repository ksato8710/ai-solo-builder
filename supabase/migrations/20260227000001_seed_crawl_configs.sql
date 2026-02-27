-- ============================================================
-- Seed: New sources + crawl_configs for all sources
-- ============================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Insert new primary sources (skip if domain already exists)
-- ---------------------------------------------------------------------------
WITH new_primary_sources(name, url, domain, source_type, credibility_score, verification_level, description, entity_kind, locale, region) AS (
  VALUES
    ('Google AI Blog',        'https://blog.google/technology/ai/',               'blog.google',              'primary', 10, 'official', 'Google official AI and technology announcements.',         'primary_source', 'en', 'global'),
    ('GitHub Changelog',      'https://github.blog/changelog/',                    'github.blog',              'primary',  9, 'official', 'GitHub official changelog and product updates.',           'primary_source', 'en', 'global'),
    ('Meta AI Blog',          'https://ai.meta.com/blog/',                         'ai.meta.com',              'primary',  9, 'official', 'Meta official AI research and product announcements.',     'primary_source', 'en', 'global'),
    ('Microsoft AI Blog',     'https://blogs.microsoft.com/ai/',                   'blogs.microsoft.com',      'primary',  9, 'official', 'Microsoft official AI product and research updates.',      'primary_source', 'en', 'global'),
    ('Vercel Blog',           'https://vercel.com/blog',                           'vercel.com',               'primary',  9, 'official', 'Vercel official product announcements and engineering.',   'primary_source', 'en', 'global'),
    ('Cursor Changelog',      'https://cursor.com/changelog',                      'cursor.com',               'primary',  9, 'official', 'Cursor AI IDE official changelog and updates.',            'primary_source', 'en', 'global'),
    ('Mistral Blog',          'https://mistral.ai/news/',                          'mistral.ai',               'primary',  9, 'official', 'Mistral AI official model releases and announcements.',    'primary_source', 'en', 'global'),
    ('Hugging Face Blog',     'https://huggingface.co/blog',                       'huggingface.co',           'primary',  9, 'official', 'Hugging Face official blog and community updates.',        'primary_source', 'en', 'global')
)
INSERT INTO public.sources (name, url, domain, source_type, credibility_score, verification_level, description, entity_kind, locale, region, is_active)
SELECT
  s.name, s.url, s.domain,
  s.source_type::public.source_type,
  s.credibility_score,
  s.verification_level::public.verification_level,
  s.description, s.entity_kind, s.locale, s.region, true
FROM new_primary_sources s
WHERE NOT EXISTS (
  SELECT 1 FROM public.sources existing WHERE existing.domain = s.domain
);

-- ---------------------------------------------------------------------------
-- 2. Insert new tertiary sources (skip if domain already exists)
-- ---------------------------------------------------------------------------
-- Note: Hacker News and ProductHunt may already exist from earlier seed.
-- Reddit subreddits share www.reddit.com domain, so we use sub-domain style.
-- For Reddit we insert separate source entries with distinct names but same
-- domain handling via url-based uniqueness workaround.

WITH new_tertiary_sources(name, url, domain, source_type, credibility_score, verification_level, description, entity_kind, locale, region) AS (
  VALUES
    ('Hacker News',              'https://news.ycombinator.com',                'news.ycombinator.com',     'tertiary', 7, 'community', 'Tech community discussion and link aggregator.',                     'community', 'en', 'global'),
    ('Reddit r/MachineLearning', 'https://www.reddit.com/r/MachineLearning',    'reddit.com/r/ml',          'tertiary', 6, 'community', 'Machine learning research and industry discussion on Reddit.',       'community', 'en', 'global'),
    ('Reddit r/LocalLLaMA',      'https://www.reddit.com/r/LocalLLaMA',         'reddit.com/r/localllama',  'tertiary', 6, 'community', 'Local LLM deployment and open-source model community on Reddit.',    'community', 'en', 'global'),
    ('Reddit r/ClaudeAI',        'https://www.reddit.com/r/ClaudeAI',           'reddit.com/r/claudeai',    'tertiary', 5, 'community', 'Anthropic Claude user community on Reddit.',                        'community', 'en', 'global'),
    ('Product Hunt',             'https://www.producthunt.com',                  'www.producthunt.com',      'tertiary', 5, 'community', 'Product discovery and community voting platform.',                   'community', 'en', 'global'),
    ('GitHub Trending',          'https://github.com/trending',                  'github.com/trending',      'tertiary', 6, 'community', 'Trending repositories on GitHub for tool and project discovery.',    'community', 'en', 'global')
)
INSERT INTO public.sources (name, url, domain, source_type, credibility_score, verification_level, description, entity_kind, locale, region, is_active)
SELECT
  s.name, s.url, s.domain,
  s.source_type::public.source_type,
  s.credibility_score,
  s.verification_level::public.verification_level,
  s.description, s.entity_kind, s.locale, s.region, true
FROM new_tertiary_sources s
WHERE NOT EXISTS (
  SELECT 1 FROM public.sources existing WHERE existing.domain = s.domain
);

-- ---------------------------------------------------------------------------
-- 3. Insert crawl_configs for EXISTING primary sources (Anthropic, OpenAI, Figma)
-- ---------------------------------------------------------------------------
INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'rss', 'https://www.anthropic.com/rss.xml', '{"max_items": 20}', 120, true
FROM public.sources s WHERE s.domain = 'www.anthropic.com'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'rss', 'https://openai.com/blog/rss.xml', '{"max_items": 20}', 120, true
FROM public.sources s WHERE s.domain = 'openai.com'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'rss', 'https://www.figma.com/blog/feed/', '{"max_items": 20}', 240, true
FROM public.sources s WHERE s.domain = 'www.figma.com'
ON CONFLICT (source_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Insert crawl_configs for NEW primary sources
-- ---------------------------------------------------------------------------
INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'rss', 'https://blog.google/technology/ai/rss/', '{"max_items": 20}', 120, true
FROM public.sources s WHERE s.domain = 'blog.google'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'rss', 'https://github.blog/changelog/feed/', '{"max_items": 30}', 120, true
FROM public.sources s WHERE s.domain = 'github.blog'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'rss', 'https://ai.meta.com/blog/rss/', '{"max_items": 20}', 120, true
FROM public.sources s WHERE s.domain = 'ai.meta.com'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'rss', 'https://blogs.microsoft.com/ai/feed/', '{"max_items": 20}', 120, true
FROM public.sources s WHERE s.domain = 'blogs.microsoft.com'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'rss', 'https://vercel.com/atom', '{"max_items": 20}', 180, true
FROM public.sources s WHERE s.domain = 'vercel.com'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'scrape', 'https://cursor.com/changelog', '{"selector": "article", "max_items": 15}', 360, true
FROM public.sources s WHERE s.domain = 'cursor.com'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'rss', 'https://mistral.ai/feed/rss.xml', '{"max_items": 20}', 180, true
FROM public.sources s WHERE s.domain = 'mistral.ai'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'rss', 'https://huggingface.co/blog/feed.xml', '{"max_items": 20}', 180, true
FROM public.sources s WHERE s.domain = 'huggingface.co'
ON CONFLICT (source_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Insert crawl_configs for NEW tertiary sources
-- ---------------------------------------------------------------------------
INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'api', 'https://hn.algolia.com/api/v1/search', '{"api_type": "hackernews", "query": "AI", "min_points": 50, "hits_per_page": 30}', 180, true
FROM public.sources s WHERE s.domain = 'news.ycombinator.com'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'api', 'https://www.reddit.com/r/MachineLearning/hot.json', '{"api_type": "reddit", "subreddit": "MachineLearning", "limit": 25}', 180, true
FROM public.sources s WHERE s.domain = 'reddit.com/r/ml'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'api', 'https://www.reddit.com/r/LocalLLaMA/hot.json', '{"api_type": "reddit", "subreddit": "LocalLLaMA", "limit": 25}', 180, true
FROM public.sources s WHERE s.domain = 'reddit.com/r/localllama'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'api', 'https://www.reddit.com/r/ClaudeAI/hot.json', '{"api_type": "reddit", "subreddit": "ClaudeAI", "limit": 25}', 240, true
FROM public.sources s WHERE s.domain = 'reddit.com/r/claudeai'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'api', 'https://www.producthunt.com', '{"api_type": "producthunt", "topic": "artificial-intelligence", "limit": 20}', 360, true
FROM public.sources s WHERE s.domain = 'www.producthunt.com'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'scrape', 'https://github.com/trending', '{"selector": "article.Box-row", "max_items": 25}', 360, true
FROM public.sources s WHERE s.domain = 'github.com/trending'
ON CONFLICT (source_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Insert crawl_configs for EXISTING secondary sources (Japanese media)
-- ---------------------------------------------------------------------------
INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'rss', 'https://xtech.nikkei.com/rss/index.rdf', '{"max_items": 20}', 240, true
FROM public.sources s WHERE s.domain = 'xtech.nikkei.com'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'rss', 'https://www.itmedia.co.jp/news/rss/2.0/news_ai.xml', '{"max_items": 20}', 240, true
FROM public.sources s WHERE s.domain = 'www.itmedia.co.jp'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'rss', 'https://www.publickey1.jp/atom.xml', '{"max_items": 20}', 240, true
FROM public.sources s WHERE s.domain = 'www.publickey1.jp'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'rss', 'https://www.watch.impress.co.jp/data/rss/1.0/ipw/feed.rdf', '{"max_items": 20}', 240, true
FROM public.sources s WHERE s.domain = 'www.watch.impress.co.jp'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'rss', 'https://japan.cnet.com/rss/index.rdf', '{"max_items": 20}', 240, true
FROM public.sources s WHERE s.domain = 'japan.cnet.com'
ON CONFLICT (source_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Insert crawl_configs for EXISTING secondary sources (Newsletters)
--    Newsletters use 'newsletter' method (manual/email-triggered), not crawled.
-- ---------------------------------------------------------------------------
INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'newsletter', s.newsletter_archive_url, '{"delivery_based": true}', 1440, true
FROM public.sources s WHERE s.domain = 'www.therundown.ai'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'newsletter', s.newsletter_archive_url, '{"delivery_based": true}', 1440, true
FROM public.sources s WHERE s.domain = 'www.superhuman.ai'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'newsletter', s.newsletter_archive_url, '{"delivery_based": true}', 1440, true
FROM public.sources s WHERE s.domain = 'bensbites.co'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'newsletter', s.newsletter_archive_url, '{"delivery_based": true}', 1440, true
FROM public.sources s WHERE s.domain = 'tldr.tech'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'newsletter', s.newsletter_archive_url, '{"delivery_based": true}', 1440, true
FROM public.sources s WHERE s.domain = 'www.theneurondaily.com'
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'newsletter', s.newsletter_archive_url, '{"delivery_based": true}', 10080, false
FROM public.sources s WHERE s.domain = 'www.deeplearning.ai'
ON CONFLICT (source_id) DO NOTHING;

COMMIT;
