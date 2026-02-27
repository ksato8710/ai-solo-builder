-- ============================================================
-- News Collection System: source_crawl_configs + collected_items + scoring_config
-- ============================================================

BEGIN;

-- 1. Crawl configurations per source
CREATE TABLE IF NOT EXISTS source_crawl_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  crawl_method text NOT NULL CHECK (crawl_method IN ('rss', 'api', 'scrape', 'newsletter', 'manual')),
  crawl_url text,
  crawl_config jsonb NOT NULL DEFAULT '{}',
  crawl_interval_minutes integer NOT NULL DEFAULT 240,
  last_crawled_at timestamptz,
  last_crawl_status text CHECK (last_crawl_status IS NULL OR last_crawl_status IN ('success', 'error', 'partial')),
  last_crawl_error text,
  last_crawl_item_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_id)
);

-- 2. Collected items (raw news data from all sources)
CREATE TABLE IF NOT EXISTS collected_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  source_tier text NOT NULL CHECK (source_tier IN ('primary', 'secondary', 'tertiary')),
  title text NOT NULL,
  url text NOT NULL,
  url_hash text NOT NULL,
  author text,
  content_summary text,
  raw_content text,
  published_at timestamptz,
  collected_at timestamptz NOT NULL DEFAULT now(),
  classification text,
  classification_confidence numeric(3,2) CHECK (classification_confidence IS NULL OR classification_confidence BETWEEN 0 AND 1),
  relevance_tags text[] NOT NULL DEFAULT '{}',
  nva_total integer CHECK (nva_total IS NULL OR nva_total BETWEEN 0 AND 100),
  nva_social integer CHECK (nva_social IS NULL OR nva_social BETWEEN 0 AND 20),
  nva_media integer CHECK (nva_media IS NULL OR nva_media BETWEEN 0 AND 20),
  nva_community integer CHECK (nva_community IS NULL OR nva_community BETWEEN 0 AND 20),
  nva_technical integer CHECK (nva_technical IS NULL OR nva_technical BETWEEN 0 AND 20),
  nva_solo_relevance integer CHECK (nva_solo_relevance IS NULL OR nva_solo_relevance BETWEEN 0 AND 20),
  score_reasoning text,
  scored_at timestamptz,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'scored', 'selected', 'dismissed', 'published')),
  content_id uuid REFERENCES contents(id),
  digest_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Scoring configuration (viewable in admin)
CREATE TABLE IF NOT EXISTS scoring_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collected_items_source ON collected_items(source_id);
CREATE INDEX IF NOT EXISTS idx_collected_items_status ON collected_items(status);
CREATE INDEX IF NOT EXISTS idx_collected_items_tier ON collected_items(source_tier);
CREATE INDEX IF NOT EXISTS idx_collected_items_collected_at ON collected_items(collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_collected_items_nva_total ON collected_items(nva_total DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_collected_items_url_hash ON collected_items(url_hash);
CREATE INDEX IF NOT EXISTS idx_collected_items_digest_date ON collected_items(digest_date);
CREATE INDEX IF NOT EXISTS idx_collected_items_status_scored ON collected_items(status, scored_at DESC) WHERE status = 'scored';
CREATE INDEX IF NOT EXISTS idx_crawl_configs_active ON source_crawl_configs(is_active) WHERE is_active = true;

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_source_crawl_configs_set_updated_at ON source_crawl_configs;
CREATE TRIGGER trg_source_crawl_configs_set_updated_at
BEFORE UPDATE ON source_crawl_configs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_collected_items_set_updated_at ON collected_items;
CREATE TRIGGER trg_collected_items_set_updated_at
BEFORE UPDATE ON collected_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_scoring_config_set_updated_at ON scoring_config;
CREATE TRIGGER trg_scoring_config_set_updated_at
BEFORE UPDATE ON scoring_config
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE source_crawl_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE collected_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access on source_crawl_configs" ON source_crawl_configs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access on collected_items" ON collected_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access on scoring_config" ON scoring_config FOR ALL USING (true) WITH CHECK (true);

-- Seed scoring config
INSERT INTO scoring_config (config_key, config_value, description) VALUES
('nva_weights', '{"social": 1.0, "media": 1.0, "community": 1.0, "technical": 1.0, "solo_relevance": 1.5}', 'NVA軸の重み付け（solo_relevanceを1.5倍で重視）'),
('classification_categories', '["product-release", "product-update", "research-paper", "funding-acquisition", "partnership", "tutorial-guide", "opinion-analysis", "community-trend", "security-vulnerability", "regulatory-policy", "case-study", "benchmark-comparison"]', '自動分類カテゴリ一覧'),
('tier_definitions', '{"primary": {"label": "一次情報", "description": "公式発表・プレスリリース・開発者ブログ", "default_interval_minutes": 120, "color": "accent-leaf"}, "secondary": {"label": "二次情報", "description": "テックメディア・ニュースレター・日本メディア", "default_interval_minutes": 240, "color": "accent-bark"}, "tertiary": {"label": "三次情報", "description": "コミュニティ・Reddit・HN・X・Product Hunt", "default_interval_minutes": 180, "color": "cat-tool"}}', 'ソース階層の定義')
ON CONFLICT (config_key) DO NOTHING;

COMMIT;
