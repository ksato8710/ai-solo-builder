# Flutter App Handoff (AI Solo Builder)

Updated: 2026-02-12
Target app: `apps/ai_solo_builder_app`

## 1. 目的と現状

- 目的: Web と同じコンテンツを Flutter で配信する
- 配信元: `GET /api/v1/*`（Next.js）
- 現状: MVPは実装済み（ホーム一覧 + 記事詳細）

機能:
- フィード表示（朝刊・夕刊 / 最新ニュース / 開発ナレッジ / 事例 / プロダクト）
- 記事詳細（Markdown表示）
- Pull-to-refresh
- 失敗時リトライUI

## 2. 動作確認済みベースライン

2026-02-12 時点の確認:
- Flutter: `3.38.9` / Dart `3.10.8`
- `flutter analyze`: No issues found
- `flutter test`: All tests passed
- 本番API疎通:
  - `/api/v1/feed`: 200
  - `/api/v1/contents`: 200
  - `/api/v1/contents/[slug]`: 200

## 3. アーキテクチャ（重要）

データ経路:
1. Flutter app
2. Next.js API (`/api/v1/feed`, `/api/v1/contents`, `/api/v1/contents/[slug]`)
3. `src/lib/posts.ts` で取得
4. Supabase DB（`db-first`、失敗時はMarkdown fallback）

補足:
- モバイルアプリがSupabaseに直接接続する構成ではない
- Flutterは常にContent API契約を使用する

## 4. データモデル前提（コンテンツ分類）

トップ分類:
- `news`
- `product`
- `digest`

補助軸:
- `digestEdition`: `morning` / `evening`
- `tags`: `dev-knowledge` / `case-study` / `product-update` など

注意:
- 旧`category`値は移行互換のため残るが、実装は canonical 項目を優先する

## 5. Flutterコードマップ

エントリ:
- `apps/ai_solo_builder_app/lib/main.dart`

画面:
- `apps/ai_solo_builder_app/lib/src/screens/home_screen.dart`
- `apps/ai_solo_builder_app/lib/src/screens/content_detail_screen.dart`

APIクライアント:
- `apps/ai_solo_builder_app/lib/src/services/content_api_client.dart`

モデル:
- `apps/ai_solo_builder_app/lib/src/models/content_models.dart`

UI部品:
- `apps/ai_solo_builder_app/lib/src/widgets/content_card.dart`

テスト:
- `apps/ai_solo_builder_app/test/widget_test.dart`

## 6. 起動手順

```bash
cd /Users/satokeita/Dev/ai-navigator/apps/ai_solo_builder_app
flutter pub get
flutter run --dart-define=CONTENT_API_BASE_URL=https://ai.essential-navigator.com
```

ローカルAPI参照:
- iOS Simulator: `http://localhost:3000`
- Android Emulator: `http://10.0.2.2:3000`

例:
```bash
flutter run --dart-define=CONTENT_API_BASE_URL=http://localhost:3000
```

## 7. API契約（Flutter側が利用）

### 7.1 Feed
- `GET /api/v1/feed?limit=10`
- 返却:
  - `generatedAt`
  - `sections.morningSummary`
  - `sections.eveningSummary`
  - `sections.latestNews`
  - `sections.products`
  - `sections.devKnowledge`
  - `sections.caseStudies`

### 7.2 Contents list
- `GET /api/v1/contents`
- クエリ:
  - `contentType` (`news|product|digest`)
  - `digestEdition` (`morning|evening`)
  - `category`
  - `tags` (comma separated)
  - `featured`
  - `q`
  - `limit`, `offset`

### 7.3 Content detail
- `GET /api/v1/contents/[slug]`
- 返却: `item`（summary + `content` + `htmlContent`）

## 8. 既知の注意点・障害切り分け

「フィード取得に失敗しました」時の確認順:
1. `CONTENT_API_BASE_URL` が正しいか
2. シミュレータからAPIに到達できるか
3. `curl https://ai.essential-navigator.com/api/v1/feed?limit=1` が200か
4. ローカルAPI利用時は Next.js が起動しているか
5. Web側の環境変数（Supabase）が欠けていないか

補足:
- Web側は `db-first` だが fallback があるため、障害時はAPIログを優先確認

## 9. 本格開発の優先タスク（次スレッド向け）

P1:
1. 画面構成を本番想定へ拡張（カテゴリ一覧/タブ/詳細導線）
2. 一覧のページング（`limit`/`offset`）実装
3. エラー/空状態/ローディングをデザイン統一
4. 記事詳細の表示改善（見出し・リンク・画像・表）

P2:
1. ローカルキャッシュ（Hive or SQLite）
2. オフライン時の既読コンテンツ表示
3. APIリトライ・タイムアウト・サーキットブレーカ
4. 解析イベント（閲覧、滞在、遷移）計測

P3:
1. ブックマーク/既読管理
2. プッシュ通知（朝刊/夕刊）
3. 検索UI（`q` + tags + contentType）

## 10. 開発ルール（このプロジェクト固有）

- モバイルはAPI経由のみ（DB直結しない）
- 秘密鍵はアプリに埋め込まない
- API契約変更時は Web/API 実装と同時に更新
- 記事運用は DB 登録必須（`publish:gate`）

## 11. 参照ドキュメント

- `docs/CONTENT-API-ARCHITECTURE.md`
- `docs/OPERATIONS-PLAN-2026-02-12.md`
- `docs/SUPABASE-SETUP.md`
- `README.md`
