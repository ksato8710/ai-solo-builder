# Content Policy Spec

## Goal
Define the service's core content policy and enforce a single, unambiguous taxonomy:

- "News" and "Products" are distinct.
- "Case Study" and "Knowledge" are separate from News/Products.
- "Morning/Evening Digest" are distinct and have a fixed format.
- Content should link to a stable Product dictionary page (`/products/[slug]`) whenever a Product is involved.

This spec exists to satisfy SDD First (AGENTS.md): implementations must be traceable to a spec.

## Content Types (5)
The service has 5 conceptual content types:

1. Digest (Morning)
2. Digest (Evening)
3. News (single topic)
4. Case Study
5. Knowledge

Products are handled as a separate dictionary section (not counted as a "content type" above; they are a reference layer used by all content).

## Storage
- News/Digest/CaseStudy/Knowledge: `content/news/*.md`
- Product dictionary: `content/products/*.md`

## Frontmatter Contract
All markdown content must include YAML frontmatter with at least:

- `title: string`
- `slug: string`
- `date: YYYY-MM-DD string`
- `category: string` (restricted; see below)
- `description: string`
- `readTime: number`

Optional but recommended:
- `relatedProduct: string` (a product slug; must correspond to an existing `content/products/*.md` slug)

## Category Taxonomy (canonical)
We use a small set of **canonical** categories to represent the policy.

- `morning-summary`: Morning Digest
- `evening-summary`: Evening Digest
- `news`: single-topic News
- `dev-knowledge`: AI development knowledge
- `case-study`: solo builder case study
- `products`: product dictionary pages

### Migration mapping (legacy -> canonical)
These legacy categories must be treated as deprecated and migrated:

- `morning-news` -> `morning-summary`
- `evening-news` -> `evening-summary`
- `knowledge` -> `dev-knowledge`
- `product-news` -> `news`
- `tools` -> `news`
- `featured-tools` -> `dev-knowledge`
- `dev` -> `dev-knowledge`
- `deep-dive` -> `dev-knowledge`

## Digest Format (Morning/Evening)
Digest posts must include:

1. A section titled `## 🏁 重要ニュースランキング（NVA）`
2. A table listing **Top 10 (max)** items (rank + NVA + title)
3. A section titled `## 🔥 Top 3 ピックアップ`
4. For each of the Top 3 items: an NVA table with 5 axes (0-20 each) and total (0-100) and Tier.

### Ranking page operation (`/news-value`)
- Each time a Digest (morning/evening) is published, the ranking at `/news-value` is updated for that digest window.
- The ranking page shows **Top 10** for the window.
- Only the **Top 3** are expanded and written as individual News articles (`category: news`) and are linked from the ranking.

## Product Linking Policy
When a piece of content is **about** a Product (or requires product context to understand):

- It must link to `/products/[slug]` in the body, and
- It should set `relatedProduct: [slug]` in frontmatter.

If the product page does not exist at that time:
- Create it in `content/products/*.md` first (or in the same change), then link to it.

## Acceptance Criteria
1. All `content/news/*.md` have `category` in:
   - `morning-summary`, `evening-summary`, `news`, `dev-knowledge`, `case-study`
2. All `content/products/*.md` have `category: products`
3. Every Digest post (category `morning-summary` or `evening-summary`) includes the Digest Format requirements.
4. Any `/products/[slug]` link in `content/news/*.md` resolves to an existing product page slug.
5. App-side category definitions (UI) must include the canonical categories.
6. Header navigation must expose Digest entry as a single menu item (`朝夕のまとめ`) instead of separate `朝刊` and `夕刊` items.
7. Home page must render Digest content in one section (`朝夕のまとめ`) that contains both Morning and Evening Digest entries.

## Implementation Notes (traceability)
This spec is implemented by:
- Category taxonomy and UI mapping: `src/lib/posts.ts`, `src/app/layout.tsx`, `src/app/news/page.tsx`, `src/app/page.tsx`
- Content migration: `content/news/*.md` frontmatter `category` normalization
- Digest format: Digest posts in `content/news/*.md` (category `morning-summary` or `evening-summary`)
- Ranking page (`/news-value`): `src/app/news-value/page.tsx`, `src/lib/digest.ts`
- Product dictionary pages: `content/products/*.md`

## Information Architecture Notes
- Header menu IA:
  - Digest is a unified entry labeled `朝夕のまとめ`.
  - Morning and Evening remain separate categories in content taxonomy, but are grouped in navigation.
- Home IA:
  - A single section labeled `朝夕のまとめ` presents both `morning-summary` and `evening-summary` cards.
  - Existing category sections should not render separate `朝のまとめ` / `夕のまとめ` blocks on Home.
