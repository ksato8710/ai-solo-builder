# AI Solo Builder Flutter App

シンプルなモバイルアプリ実装です。`/api/v1/*` からコンテンツを取得して表示します。

## 依存 API

- `GET /api/v1/feed`
- `GET /api/v1/contents`
- `GET /api/v1/contents/[slug]`

## 起動

```bash
cd apps/ai_solo_builder_app
flutter pub get
flutter run \
  --dart-define=CONTENT_API_BASE_URL=https://ai.essential-navigator.com
```

ローカルの Next.js を参照する場合:

```bash
# iOS simulator
flutter run --dart-define=CONTENT_API_BASE_URL=http://localhost:3000

# Android emulator
flutter run --dart-define=CONTENT_API_BASE_URL=http://10.0.2.2:3000
```

## 画面

- フィード（朝刊 / 夕刊 / 最新ニュース / 開発ナレッジ / 事例 / プロダクト）
- 記事詳細（Markdown 表示）

## 実装ファイル

- `lib/src/services/content_api_client.dart`: API クライアント
- `lib/src/screens/home_screen.dart`: フィード画面
- `lib/src/screens/content_detail_screen.dart`: 詳細画面
- `lib/src/models/content_models.dart`: モデル
