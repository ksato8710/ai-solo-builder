-- Content Model DB (draft)
-- PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE content_type AS ENUM ('news', 'product', 'digest');
CREATE TYPE content_status AS ENUM ('draft', 'review', 'published', 'archived');
CREATE TYPE digest_edition AS ENUM ('morning', 'evening');
CREATE TYPE authoring_source AS ENUM ('markdown', 'db');
CREATE TYPE product_relation_type AS ENUM ('primary', 'related', 'mentioned', 'ranking-item');
CREATE TYPE source_type AS ENUM ('official', 'media', 'community', 'social', 'other');

CREATE TABLE contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  content_type content_type NOT NULL,
  status content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  date date NOT NULL,
  read_time integer NOT NULL,
  featured boolean NOT NULL DEFAULT false,
  hero_image_url text,
  body_markdown text NOT NULL,
  body_html text,
  legacy_category text,
  authoring_source authoring_source NOT NULL DEFAULT 'markdown',
  source_path text,
  checksum text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contents_type_status_date ON contents (content_type, status, date DESC);
CREATE INDEX idx_contents_status_published_at ON contents (status, published_at DESC);

CREATE TABLE digest_details (
  content_id uuid PRIMARY KEY REFERENCES contents(id) ON DELETE CASCADE,
  edition digest_edition NOT NULL,
  digest_date date NOT NULL,
  UNIQUE (edition, digest_date)
);

CREATE TABLE products (
  content_id uuid PRIMARY KEY REFERENCES contents(id) ON DELETE CASCADE,
  product_slug text NOT NULL UNIQUE,
  website_url text,
  pricing_summary text,
  company_name text,
  last_verified_at timestamptz
);

CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE content_tags (
  content_id uuid NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (content_id, tag_id)
);

CREATE TABLE content_product_links (
  content_id uuid NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  product_content_id uuid NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  relation_type product_relation_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (content_id, product_content_id, relation_type)
);

CREATE TABLE sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  source_type source_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE content_sources (
  content_id uuid NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  cited_url text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (content_id, source_id, cited_url)
);

CREATE TABLE digest_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_content_id uuid NOT NULL UNIQUE REFERENCES contents(id) ON DELETE CASCADE,
  window_start timestamptz,
  window_end timestamptz,
  top_n integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (top_n BETWEEN 1 AND 10)
);

CREATE TABLE digest_ranking_items (
  ranking_id uuid NOT NULL REFERENCES digest_rankings(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  nva_total integer NOT NULL,
  headline text NOT NULL,
  news_content_id uuid REFERENCES contents(id) ON DELETE SET NULL,
  product_content_id uuid REFERENCES contents(id) ON DELETE SET NULL,
  source_url text,
  nva_social integer,
  nva_media integer,
  nva_community integer,
  nva_technical integer,
  nva_solo_relevance integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ranking_id, rank),
  CHECK (rank BETWEEN 1 AND 10),
  CHECK (nva_total BETWEEN 0 AND 100)
);

CREATE TABLE content_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  revision_no integer NOT NULL,
  frontmatter_json jsonb NOT NULL,
  body_markdown text NOT NULL,
  change_summary text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_id, revision_no)
);
