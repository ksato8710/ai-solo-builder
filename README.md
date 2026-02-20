This is a [Next.js](https://nextjs.org) project for AI content curation.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## Content Validation

```bash
npm run validate:content
```

## X Discovery Experiment

X API を使った「生成AI × ソロビルダー向け投稿の発見」実験CLIを追加しています。

```bash
# Offline sample
python3 scripts/discover-x-ai-signals.py \
  --sample-file scripts/fixtures/x_recent_search_sample.json \
  --output-dir research/x-discovery

# Live run (requires X_API_BEARER_TOKEN)
python3 scripts/discover-x-ai-signals.py \
  --sort-order mixed \
  --lookback-hours 24 \
  --top-k 20 \
  --with-usage

# Focus topic run (e.g. OpenClaw)
python3 scripts/discover-x-ai-signals.py \
  --focus OpenClaw \
  --sort-order mixed \
  --lookback-hours 24 \
  --top-k 15
```

```bash
# npm shortcuts
npm run x:discover:sample
npm run x:discover
```

詳細: `docs/operations/X-DISCOVERY-SYSTEM.md`

## Supabase (Database)

Detailed setup: `docs/technical/DATABASE.md`

Set environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (server-side only)

`sync:content:db` は `.env.local` / `.env` を自動読込します（どちらかを配置）。

```bash
# Apply migrations to linked Supabase project
npm run db:push

# Check migration status
npm run db:migrations:list

# Lint linked schema
npm run db:lint

# Generate database TypeScript types
npm run db:types

# Sync markdown content into Supabase
npm run sync:content:db

# Publish gate (must pass before git push)
npm run publish:gate
```

## Content Delivery API

Web と Flutter 共通の配信用 API を `src/app/api/v1` で提供しています。

- `GET /api/v1/feed`
- `GET /api/v1/contents`
- `GET /api/v1/contents/[slug]`

詳細: `docs/technical/API.md`

## Flutter App

シンプルなモバイルアプリは `apps/ai_solo_builder_app` にあります。

```bash
cd apps/ai_solo_builder_app
flutter pub get
flutter run --dart-define=CONTENT_API_BASE_URL=https://ai.essential-navigator.com
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
