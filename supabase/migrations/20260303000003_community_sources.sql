-- ============================================================
-- Add community sources: note.com + crawl configs for Zenn, Qiita, note
-- ============================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Insert new tertiary sources (Zenn, Qiita already may exist; note is new)
-- ---------------------------------------------------------------------------
WITH new_tertiary_sources(name, url, domain, source_type, credibility_score, verification_level, description, entity_kind, locale, region) AS (
  VALUES
    ('Zenn',  'https://zenn.dev',  'zenn.dev',  'tertiary', 6, 'community', 'Japanese developer knowledge sharing platform (tech articles & books).', 'community', 'ja', 'jp'),
    ('Qiita', 'https://qiita.com', 'qiita.com', 'tertiary', 6, 'community', 'Japanese developer community for technical articles and knowledge sharing.', 'community', 'ja', 'jp'),
    ('note',  'https://note.com',  'note.com',  'tertiary', 5, 'community', 'Japanese content platform with tech/AI articles and creator essays.', 'community', 'ja', 'jp')
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
-- 2. Upsert crawl configs for Zenn (API with engagement)
-- ---------------------------------------------------------------------------
INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'api', 'https://zenn.dev/api/articles',
  '{"api_type": "zenn", "topic": "ai", "count": 30}', 240, true
FROM public.sources s WHERE s.domain = 'zenn.dev'
ON CONFLICT (source_id) DO UPDATE SET
  crawl_method = EXCLUDED.crawl_method,
  crawl_url = EXCLUDED.crawl_url,
  crawl_config = EXCLUDED.crawl_config,
  crawl_interval_minutes = EXCLUDED.crawl_interval_minutes;

-- ---------------------------------------------------------------------------
-- 3. Upsert crawl configs for Qiita (API with engagement)
-- ---------------------------------------------------------------------------
INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'api', 'https://qiita.com/api/v2/items',
  '{"api_type": "qiita", "tag": "AI", "per_page": 20}', 240, true
FROM public.sources s WHERE s.domain = 'qiita.com'
ON CONFLICT (source_id) DO UPDATE SET
  crawl_method = EXCLUDED.crawl_method,
  crawl_url = EXCLUDED.crawl_url,
  crawl_config = EXCLUDED.crawl_config,
  crawl_interval_minutes = EXCLUDED.crawl_interval_minutes;

-- ---------------------------------------------------------------------------
-- 4. Insert crawl config for note (Search API with engagement)
-- ---------------------------------------------------------------------------
INSERT INTO source_crawl_configs (source_id, crawl_method, crawl_url, crawl_config, crawl_interval_minutes, is_active)
SELECT s.id, 'api', 'https://note.com/api/v3/searches',
  '{"api_type": "note", "tag": "AI", "size": 20}', 360, true
FROM public.sources s WHERE s.domain = 'note.com'
ON CONFLICT (source_id) DO NOTHING;

COMMIT;
