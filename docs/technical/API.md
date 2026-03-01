# Web / Flutter 共通コンテンツ配信アーキテクチャ

## 方針

- データの正本: Supabase (`contents` 系テーブル)
- 配信の正本 API: Next.js Route Handler (`/api/v1/*`)
- Web: Next.js サーバーコンポーネントが同一リポジトリ内の取得層 (`src/lib/posts.ts`) を利用
- Flutter: Web と同じ契約の Content API (`/api/v1/*`) を HTTP で利用

この構成により、**外部クライアント（Flutter）には API 契約を固定**しつつ、
**Web は不要な内部 HTTP ループバックを避けて低レイテンシ**で配信できます。

## API エンドポイント

- `GET /api/v1/feed`
  - ホーム画面向けの集約レスポンス
  - セクション: `morningSummary`, `latestNews`, `products`, `devKnowledge`, `caseStudies`
- `GET /api/v1/contents`
  - 汎用一覧 API
  - クエリ: `contentType`, `digestEdition`, `category`, `tags`, `featured`, `q`, `limit`, `offset`
- `GET /api/v1/contents/[slug]`
  - 記事詳細 API

## キャッシュ戦略

- API は `revalidate = 300` と `Cache-Control: s-maxage=300, stale-while-revalidate=600` を設定
- 更新頻度と配信負荷のバランスを取り、モバイルでも安定して高速表示

## データ更新フロー

1. Markdown を `content/` に追加・更新
2. `npm run validate:content`
3. `npm run sync:content:db`
4. Web と Flutter は DB を参照する API/取得層から最新を取得

## ニュースレター API

ニュースレター専用のエンドポイント。詳細は `docs/technical/NEWSLETTER.md` を参照。

- `POST /api/newsletter/subscribe` — メール登録（ハニーポット・レート制限付き）
- `GET /api/newsletter/confirm?token=xxx` — 登録確認 → `/newsletter/confirmed` にリダイレクト
- `GET /api/newsletter/unsubscribe?token=xxx` — 配信停止 → `/newsletter/unsubscribed` にリダイレクト
- `POST /api/cron/send-newsletter` — 日次配信（`Authorization: Bearer {CRON_SECRET}` 認証）

## 管理API（ニュースソース運用）

- `GET /api/admin/source-intelligence` — ニュースソース一覧（newsletter / primary / japanese）
- `GET /api/admin/source-schedules` — ニュースレター配信時刻一覧
- `GET /api/admin/workflows` — 記事種別ワークフローとソース役割
- `GET /api/admin/source-observations` — 競合ニュースレター実受信ログ
- `POST /api/admin/source-observations` — 実受信ログ追加（手動入力）

## 将来拡張

- 認証付き API（管理画面向け）を `/api/v1/admin/*` に分離
- `published_at` や `updated_at` を使った差分同期 API 追加
- Flutter 側にローカルキャッシュ（Hive/SQLite）を追加してオフライン閲覧対応
