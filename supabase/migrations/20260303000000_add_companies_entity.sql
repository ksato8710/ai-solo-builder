-- ============================================================
-- Companies entity + collected_items company/product relations
-- ============================================================

BEGIN;

-- =====================================================================
-- A. companies テーブル
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  name_ja text,
  website_url text,
  logo_url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_companies_set_updated_at ON public.companies;
CREATE TRIGGER trg_companies_set_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role full access on companies"
  ON public.companies FOR ALL USING (true) WITH CHECK (true);

-- =====================================================================
-- B. FK: sources.company_id, products.company_id
-- =====================================================================
ALTER TABLE public.sources
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sources_company_id ON public.sources(company_id);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);

-- =====================================================================
-- C. source_product_mappings テーブル
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.source_product_mappings (
  source_id uuid NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  product_content_id uuid NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_id, product_content_id)
);

ALTER TABLE public.source_product_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role full access on source_product_mappings"
  ON public.source_product_mappings FOR ALL USING (true) WITH CHECK (true);

-- =====================================================================
-- D. Junction テーブル
-- =====================================================================

-- collected_item_companies
CREATE TABLE IF NOT EXISTS public.collected_item_companies (
  collected_item_id uuid NOT NULL REFERENCES public.collected_items(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  link_reason text NOT NULL CHECK (link_reason IN ('source_company', 'product_company')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collected_item_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_cic_company_id ON public.collected_item_companies(company_id);

ALTER TABLE public.collected_item_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role full access on collected_item_companies"
  ON public.collected_item_companies FOR ALL USING (true) WITH CHECK (true);

-- collected_item_products
CREATE TABLE IF NOT EXISTS public.collected_item_products (
  collected_item_id uuid NOT NULL REFERENCES public.collected_items(id) ON DELETE CASCADE,
  product_content_id uuid NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  link_reason text NOT NULL CHECK (link_reason IN ('source_mapping', 'keyword_match')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collected_item_id, product_content_id)
);

CREATE INDEX IF NOT EXISTS idx_cip_product_content_id ON public.collected_item_products(product_content_id);

ALTER TABLE public.collected_item_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role full access on collected_item_products"
  ON public.collected_item_products FOR ALL USING (true) WITH CHECK (true);

-- =====================================================================
-- E. DB トリガー: collected_items INSERT 後に自動リンク
-- =====================================================================
CREATE OR REPLACE FUNCTION public.trg_collected_item_link_company_products()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_company_id uuid;
  v_product_record RECORD;
BEGIN
  -- 1. sources.company_id → collected_item_companies
  SELECT s.company_id INTO v_company_id
  FROM public.sources s
  WHERE s.id = NEW.source_id;

  IF v_company_id IS NOT NULL THEN
    INSERT INTO public.collected_item_companies (collected_item_id, company_id, link_reason)
    VALUES (NEW.id, v_company_id, 'source_company')
    ON CONFLICT DO NOTHING;
  END IF;

  -- 2. source_product_mappings → collected_item_products
  FOR v_product_record IN
    SELECT spm.product_content_id
    FROM public.source_product_mappings spm
    WHERE spm.source_id = NEW.source_id AND spm.is_active = true
  LOOP
    INSERT INTO public.collected_item_products (collected_item_id, product_content_id, link_reason)
    VALUES (NEW.id, v_product_record.product_content_id, 'source_mapping')
    ON CONFLICT DO NOTHING;

    -- 3. プロダクト経由の追加企業リンク
    SELECT p.company_id INTO v_company_id
    FROM public.products p
    WHERE p.content_id = v_product_record.product_content_id
      AND p.company_id IS NOT NULL;

    IF v_company_id IS NOT NULL THEN
      INSERT INTO public.collected_item_companies (collected_item_id, company_id, link_reason)
      VALUES (NEW.id, v_company_id, 'product_company')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_collected_items_link_company_products ON public.collected_items;
CREATE TRIGGER trg_collected_items_link_company_products
AFTER INSERT ON public.collected_items
FOR EACH ROW
EXECUTE FUNCTION public.trg_collected_item_link_company_products();

-- =====================================================================
-- F. Seed: 11 企業
-- =====================================================================
INSERT INTO public.companies (slug, name, name_ja, website_url) VALUES
  ('anthropic',  'Anthropic',  NULL,            'https://www.anthropic.com'),
  ('openai',     'OpenAI',     NULL,            'https://openai.com'),
  ('google',     'Google',     NULL,            'https://blog.google'),
  ('microsoft',  'Microsoft',  NULL,            'https://www.microsoft.com'),
  ('meta',       'Meta',       NULL,            'https://ai.meta.com'),
  ('github',     'GitHub',     NULL,            'https://github.com'),
  ('apple',      'Apple',      NULL,            'https://developer.apple.com'),
  ('amazon',     'Amazon',     NULL,            'https://aws.amazon.com'),
  ('figma',      'Figma',      NULL,            'https://www.figma.com'),
  ('cursor',     'Cursor',     NULL,            'https://cursor.com'),
  ('vercel',     'Vercel',     NULL,            'https://vercel.com')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================================
-- F2. sources.company_id を domain ベースで UPDATE
-- =====================================================================

-- Anthropic: www.anthropic.com, anthropic.com, docs.anthropic.com, x.com/anthropicai
UPDATE public.sources SET company_id = (SELECT id FROM public.companies WHERE slug = 'anthropic')
WHERE domain IN ('www.anthropic.com', 'anthropic.com', 'docs.anthropic.com')
   OR (domain = 'x.com' AND url ILIKE '%anthropic%');

-- OpenAI: openai.com, x.com/openai
UPDATE public.sources SET company_id = (SELECT id FROM public.companies WHERE slug = 'openai')
WHERE domain IN ('openai.com')
   OR (domain = 'x.com' AND url ILIKE '%openai%');

-- Google: blog.google
UPDATE public.sources SET company_id = (SELECT id FROM public.companies WHERE slug = 'google')
WHERE domain IN ('blog.google');

-- Microsoft: blogs.microsoft.com, devblogs.microsoft.com, www.microsoft.com
UPDATE public.sources SET company_id = (SELECT id FROM public.companies WHERE slug = 'microsoft')
WHERE domain IN ('blogs.microsoft.com', 'devblogs.microsoft.com', 'www.microsoft.com');

-- Meta: ai.meta.com, research.facebook.com
UPDATE public.sources SET company_id = (SELECT id FROM public.companies WHERE slug = 'meta')
WHERE domain IN ('ai.meta.com', 'research.facebook.com');

-- GitHub: github.com, github.blog, github.com/trending
UPDATE public.sources SET company_id = (SELECT id FROM public.companies WHERE slug = 'github')
WHERE domain IN ('github.com', 'github.blog', 'github.com/trending');

-- Apple: developer.apple.com
UPDATE public.sources SET company_id = (SELECT id FROM public.companies WHERE slug = 'apple')
WHERE domain IN ('developer.apple.com');

-- Amazon: aws.amazon.com
UPDATE public.sources SET company_id = (SELECT id FROM public.companies WHERE slug = 'amazon')
WHERE domain IN ('aws.amazon.com');

-- Figma: www.figma.com, release-notes.figma.com, x.com/figma, x.com/FigmaJapan
UPDATE public.sources SET company_id = (SELECT id FROM public.companies WHERE slug = 'figma')
WHERE domain IN ('www.figma.com', 'release-notes.figma.com')
   OR (domain = 'x.com' AND url ILIKE '%figma%');

-- Cursor: cursor.com, x.com/cursor_ai
UPDATE public.sources SET company_id = (SELECT id FROM public.companies WHERE slug = 'cursor')
WHERE domain IN ('cursor.com')
   OR (domain = 'x.com' AND url ILIKE '%cursor_ai%');

-- Vercel: vercel.com
UPDATE public.sources SET company_id = (SELECT id FROM public.companies WHERE slug = 'vercel')
WHERE domain IN ('vercel.com');

-- =====================================================================
-- G. 既存 collected_items のバックフィル
-- =====================================================================
INSERT INTO public.collected_item_companies (collected_item_id, company_id, link_reason)
SELECT ci.id, s.company_id, 'source_company'
FROM public.collected_items ci
JOIN public.sources s ON s.id = ci.source_id
WHERE s.company_id IS NOT NULL
ON CONFLICT DO NOTHING;

COMMIT;
