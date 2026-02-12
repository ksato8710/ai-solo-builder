# Content Policy Spec (V2)

## Goal
Define the service's canonical content policy with a DB-ready model.

Core decisions:
- Top-level content classification is **3 types**:
  1. `news`
  2. `product`
  3. `digest`
- Digest has an edition axis: `morning` / `evening`.
- `dev-knowledge`, `case-study`, `product-update` are managed as **news tags**, not top-level categories.
- Any content involving a product must link to a stable product dictionary page (`/products/[slug]`).

This spec is the policy layer. Database entities and file/DB sync details are defined in:
- `specs/content-model-db/spec.md`

## Canonical Content Model

### 1) Top-level classification
- `contentType: news | product | digest`

### 2) Digest edition
- `digestEdition: morning | evening` (required only when `contentType: digest`)

### 3) News tag model
Recommended tags for `contentType: news`:
- `dev-knowledge`
- `case-study`
- `product-update`

Additional tags can be added later, but must remain additive and backward compatible.

## Storage Policy
- Authoring files:
  - News + Digest: `content/news/*.md`
  - Product dictionary: `content/products/*.md`
- Serving/query layer (web + mobile): PostgreSQL (see DB spec)

During migration, Markdown remains an authoring source while DB is introduced as query source.

## Frontmatter Contract (Authoring Files)

### Canonical v2 fields (target)
Required for all content:
- `title: string`
- `slug: string`
- `date: YYYY-MM-DD string`
- `contentType: news | product | digest`
- `description: string`
- `readTime: number`

Migration compatibility note:
- Existing legacy product markdown may omit `readTime`; validator allows this temporarily and applies default handling at runtime/sync.

Conditional:
- `digestEdition: morning | evening` (required for `contentType: digest`)
- `tags: string[]` (recommended for `contentType: news`)
- `relatedProducts: string[]` (recommended when product context exists)

Optional compatibility:
- `relatedProduct: string` (legacy single-value field; to be migrated into `relatedProducts`)

### Legacy compatibility (current implementation)
Current runtime still uses `category`. Until full migration, map as follows:
- `morning-summary` -> `contentType: digest`, `digestEdition: morning`
- `evening-summary` -> `contentType: digest`, `digestEdition: evening`
- `news` -> `contentType: news`
- `dev-knowledge` -> `contentType: news`, `tags += ["dev-knowledge"]`
- `case-study` -> `contentType: news`, `tags += ["case-study"]`
- `products` -> `contentType: product`

## Digest Format (Policy)
Digest posts must include:
1. `## 🏁 重要ニュースランキング（NVA）`
2. Top 10 (max) ranking table
3. `## 🔥 Top 3 ピックアップ`
4. NVA breakdown for each Top 3 item

### Ranking page operation (`/news-value`)
- Publishing each digest (morning/evening) updates ranking for that digest window.
- Ranking page displays Top 10 for morning and Top 10 for evening.
- Top 3 items are expected to have individual news articles and links.

## Product Linking Policy
When content needs product context:
- Include links to `/products/[slug]` in body.
- Set `relatedProducts` (or legacy `relatedProduct`) in frontmatter.
- If product page does not exist, create/update it first (or in the same change).

## Information Architecture Notes
- Header navigation exposes digest as one entry: `朝夕のまとめ`.
- Home page has one digest section: `朝夕のまとめ` containing both morning and evening cards.
- Morning/evening remain distinct digest editions in the data model.

## Acceptance Criteria
1. Policy-level top classification is `news | product | digest`.
2. Digest is represented via `contentType: digest` + `digestEdition`.
3. `dev-knowledge` and `case-study` are treated as news tags in canonical model.
4. Product context is linked to `/products/[slug]` and resolved.
5. Digest format and `/news-value` operation remain enforced.
6. File/DB dual operation is documented and traceable to DB spec.

## Implementation Notes (Traceability)
- Current runtime (legacy category-based):
  - `src/lib/posts.ts`
  - `scripts/validate-content.mjs`
  - `src/app/news/page.tsx`
  - `src/app/layout.tsx`
  - `src/app/page.tsx`
- Digest ranking parser:
  - `src/lib/digest.ts`
  - `src/app/news-value/page.tsx`
- DB-ready target model:
  - `specs/content-model-db/spec.md`
