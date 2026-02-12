# Content Model + Database Spec

## Goal
Provide a production-ready content model for web + mobile apps, while preserving current Markdown authoring.

This spec defines:
- Database entities and relations
- Mapping between Markdown frontmatter and DB schema
- Sync direction and lifecycle
- Migration phases from file-only to DB-backed delivery

## Scope
- In scope: content domain model, ingestion/sync, query requirements for web/mobile.
- Out of scope: UI layout details, auth/role policy implementation details.

## Canonical Domain Model

### Root content types
- `news`
- `product`
- `digest`

### Sub-dimensions
- Digest edition: `morning | evening` (for `digest` only)
- News tags: e.g. `dev-knowledge`, `case-study`, `product-update`

## Database Entity Design (PostgreSQL)

### 1) `contents` (base table)
Single source for all publishable content.

Fields:
- `id uuid pk`
- `slug text unique not null`
- `title text not null`
- `description text not null`
- `content_type text not null` (`news|product|digest`)
- `status text not null` (`draft|review|published|archived`)
- `published_at timestamptz null`
- `date date not null` (editorial date)
- `read_time int not null`
- `featured boolean not null default false`
- `hero_image_url text null`
- `body_markdown text not null`
- `body_html text null` (optional cache)
- `legacy_category text null` (temporary during migration)
- `authoring_source text not null` (`markdown|db`)
- `source_path text null` (e.g. `content/news/....md`)
- `checksum text null` (dedupe/change detection)
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:
- `(content_type, status, date desc)`
- `(status, published_at desc)`

### 2) `digest_details`
Subtype for digest-only fields.

Fields:
- `content_id uuid pk fk -> contents(id) on delete cascade`
- `edition text not null` (`morning|evening`)
- `digest_date date not null`

Constraints:
- `contents.content_type = 'digest'` for referenced row
- unique `(edition, digest_date)`

### 3) `products`
Subtype for product profile fields.

Fields:
- `content_id uuid pk fk -> contents(id) on delete cascade`
- `product_slug text unique not null` (normally same as `contents.slug`)
- `website_url text null`
- `pricing_summary text null`
- `company_name text null`
- `last_verified_at timestamptz null`

### 4) `tags`
Tag dictionary.

Fields:
- `id uuid pk`
- `code text unique not null` (e.g. `dev-knowledge`)
- `label text not null`
- `description text null`
- `created_at timestamptz not null default now()`

### 5) `content_tags`
Many-to-many link between content and tags.

Fields:
- `content_id uuid fk -> contents(id) on delete cascade`
- `tag_id uuid fk -> tags(id) on delete cascade`
- `created_at timestamptz not null default now()`

Constraints:
- unique `(content_id, tag_id)`

### 6) `content_product_links`
Links from news/digest to product dictionary entries.

Fields:
- `content_id uuid fk -> contents(id) on delete cascade`
- `product_content_id uuid fk -> contents(id) on delete cascade`
- `relation_type text not null` (`primary|related|mentioned|ranking-item`)
- `created_at timestamptz not null default now()`

Constraints:
- unique `(content_id, product_content_id, relation_type)`
- referenced `product_content_id` must point to `content_type = 'product'`

### 7) `sources`
Normalized source reference metadata.

Fields:
- `id uuid pk`
- `name text not null`
- `url text not null`
- `source_type text not null` (`official|media|community|social|other`)
- `created_at timestamptz not null default now()`

### 8) `content_sources`
Citation links per content item.

Fields:
- `content_id uuid fk -> contents(id) on delete cascade`
- `source_id uuid fk -> sources(id) on delete cascade`
- `cited_url text null`
- `note text null`

Constraints:
- unique `(content_id, source_id, coalesce(cited_url, ''))`

### 9) `digest_rankings`
Top-level ranking set for a digest.

Fields:
- `id uuid pk`
- `digest_content_id uuid unique fk -> contents(id) on delete cascade`
- `window_start timestamptz null`
- `window_end timestamptz null`
- `top_n int not null default 10`
- `created_at timestamptz not null default now()`

### 10) `digest_ranking_items`
Ranking rows and NVA details.

Fields:
- `ranking_id uuid fk -> digest_rankings(id) on delete cascade`
- `rank int not null`
- `nva_total int not null`
- `headline text not null`
- `news_content_id uuid null fk -> contents(id) on delete set null`
- `product_content_id uuid null fk -> contents(id) on delete set null`
- `source_url text null`
- `nva_social int null`
- `nva_media int null`
- `nva_community int null`
- `nva_technical int null`
- `nva_solo_relevance int null`

Constraints:
- unique `(ranking_id, rank)`
- check `rank between 1 and 10`

### 11) `content_revisions`
Revision history for audit/rollback.

Fields:
- `id uuid pk`
- `content_id uuid fk -> contents(id) on delete cascade`
- `revision_no int not null`
- `frontmatter_json jsonb not null`
- `body_markdown text not null`
- `change_summary text null`
- `created_at timestamptz not null default now()`
- `created_by text null`

Constraints:
- unique `(content_id, revision_no)`

## Markdown <-> DB Mapping

### File layout (kept)
- `content/news/*.md` stores `news` + `digest`
- `content/products/*.md` stores `product`

### Canonical frontmatter (target)
- `contentType` -> `contents.content_type`
- `digestEdition` -> `digest_details.edition`
- `tags[]` -> `tags` + `content_tags`
- `relatedProducts[]` -> `content_product_links`

### Legacy compatibility mapping (during migration)
- `category: morning-summary` -> `contentType=digest`, `digestEdition=morning`
- `category: evening-summary` -> `contentType=digest`, `digestEdition=evening`
- `category: dev-knowledge` -> `contentType=news`, add tag `dev-knowledge`
- `category: case-study` -> `contentType=news`, add tag `case-study`
- `relatedProduct` -> `relatedProducts[0]`

## Sync & Source-of-Truth Strategy

### Phase 1 (recommended immediate)
- **Authoring SoT:** Markdown (Git)
- **Serving SoT:** DB mirror for read APIs
- Flow:
  1. Editor updates Markdown
  2. Validator checks schema/link integrity
  3. Ingestion job upserts DB entities
  4. Web/mobile read from DB (fallback to file only if needed)

### Phase 2
- Authoring can be Markdown or CMS/editor UI (DB write)
- Export job generates Markdown snapshots for backup/audit

### Conflict policy
- `checksum` + `updated_at` detect drift.
- Last writer wins only within the same source.
- Cross-source conflicts are quarantined (`status=review`) and require manual resolution.

## Query Requirements (Web + Mobile)

### Feed queries
- Latest news feed by tag + date
- Latest morning/evening digest cards
- Product detail with related news

### Ranking queries
- Latest morning ranking Top 10
- Latest evening ranking Top 10
- Top 3 with linked individual news article

### Performance expectations
- Feed P95 under 200ms with index usage
- Ranking query under 100ms (cached view allowed)

## API Contract Suggestion
- `GET /api/contents?type=news&tag=dev-knowledge`
- `GET /api/digests/latest?edition=morning`
- `GET /api/digests/{slug}/ranking`
- `GET /api/products/{slug}`
- `GET /api/products/{slug}/related-news`

## Migration Plan
1. Add DB schema and ingestion script (no UI changes)
2. Add canonical frontmatter fields in newly created content
3. Backfill legacy markdown -> DB mapping
4. Switch read path to DB for web + mobile APIs
5. Gradually remove runtime dependency on legacy `category`

## Acceptance Criteria
1. Every published content row has `content_type` in `news|product|digest`.
2. Every digest row has exactly one `digest_details` row with `edition`.
3. News tags are represented through `tags`/`content_tags`, not top-level categories.
4. Product references resolve via `content_product_links` to product content.
5. Digest ranking supports Top 10 + Top 3 expansion links.
6. Markdown-to-DB mapping is deterministic and documented.
7. A sync command exists to upsert Markdown content into DB idempotently.
8. Web read path is DB-first with automatic Markdown fallback when DB is unavailable.
9. Legacy frontmatter (`category`, `relatedProduct`) remains accepted during migration.

## Required Implementation (Phase 1)

### A. Sync command
- Command: `npm run sync:content:db`
- Behavior:
  - Parse `content/news/*.md` and `content/products/*.md`
  - Normalize legacy fields into canonical model (`contentType`, `digestEdition`, `tags`, `relatedProducts`)
  - Upsert `contents` and subtype tables (`digest_details`, `products`)
  - Upsert tags and refresh `content_tags`
  - Refresh `content_product_links`
  - Be idempotent (same input produces stable DB state)

### B. Validator compatibility
- `scripts/validate-content.mjs` must accept both:
  - Canonical fields (`contentType`, `digestEdition`, `tags`, `relatedProducts`)
  - Legacy fields (`category`, `relatedProduct`)
- Validator must enforce digest requirements based on canonical or derived digest type.

### C. Runtime read strategy
- `src/lib/posts.ts` must provide DB-first read for list/detail retrieval.
- If DB env vars are missing or DB fetch fails, file-based Markdown read is used as fallback.
- Existing UI taxonomy labels can remain category-style while canonical model is rolled out.
