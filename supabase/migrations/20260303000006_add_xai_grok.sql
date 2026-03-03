-- ============================================================
-- Add xAI (Grok) as a tracked company with news sources
-- ============================================================

BEGIN;

-- 1. Add xAI company
INSERT INTO public.companies (slug, name)
VALUES ('xai', 'xAI')
ON CONFLICT (slug) DO NOTHING;

-- 2. Add primary source: xAI Blog (scrape — no RSS available)
INSERT INTO public.sources (name, url, domain, source_type, credibility_score, is_active, company_id)
SELECT 'xAI Blog', 'https://x.ai/blog', 'x.ai', 'primary', 9, true, c.id
FROM public.companies c WHERE c.slug = 'xai'
ON CONFLICT DO NOTHING;

-- 3. Add tertiary source: X @xai (xAI official account)
INSERT INTO public.sources (name, url, domain, source_type, credibility_score, is_active, company_id)
SELECT 'X @xai', 'https://x.com/xai', 'x.com/xai', 'tertiary', 7, true, c.id
FROM public.companies c WHERE c.slug = 'xai'
ON CONFLICT DO NOTHING;

-- 4. Add crawl config for xAI Blog
INSERT INTO public.source_crawl_configs (source_id, crawl_method, crawl_url, crawl_interval_minutes, crawl_config)
SELECT s.id, 'scrape', 'https://x.ai/blog', 360,
  '{"selector": "article a, .post-card a, a[href*=\"/blog/\"]", "titleSelector": "h2, h3, .title", "baseUrl": "https://x.ai"}'::jsonb
FROM public.sources s WHERE s.domain = 'x.ai' AND s.name = 'xAI Blog'
ON CONFLICT DO NOTHING;

-- 5. Link existing Grok-related X accounts to xAI company (if any mention grok)
-- (Currently none exist, but this is future-proof)

COMMIT;
