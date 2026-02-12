# Site Config — サイト設定スキル

## 概要
AI Solo Builder の技術仕様・デプロイ手順・運用ルール。

## 基本情報

| 項目 | 値 |
|------|-----|
| URL | https://ai.essential-navigator.com |
| Vercel URL | https://ai-solo-builder.vercel.app |
| GitHub | ksato8710/ai-solo-builder |
| スタック | Next.js (App Router) + Tailwind CSS + TypeScript + SSG |
| ローカル | /Users/satokeita/Dev/ai-navigator |

## コンテンツ管理

### 記事ファイル
- パス:
  - `content/news/*.md`（Digest/ニュース）
  - `content/products/*.md`（プロダクト辞書）
- フォーマット: Markdown + YAML frontmatter
- 読み取り: `src/lib/posts.ts`（gray-matter + remark）

### 正式データモデル（運用）
- ルート分類: `news | product | digest`
- Digest軸: `morning | evening`
- ニュースタグ: `dev-knowledge` / `case-study` / `product-update`

### DB登録（必須）
- 記事公開前に `npm run publish:gate` を必ず実行
- `publish:gate` は `validate:content -> sync:content:db -> build` を強制実行
- `sync:content:db` が失敗したら `git push` しない

必要な環境変数（`.env.local` または `.env`）:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

### NVA評価データ
- `/news-value`（ランキング）:
  - 参照元: 最新のDigest記事（`morning-summary` / `evening-summary`）にある「重要ニュースランキング（NVA）」の表
  - 読み取り: `src/lib/digest.ts`
- `research/`（中間資料）:
  - パス: `research/YYYY-MM-DD-slug/`（assessment.md + sources.md）
  - 目的: NVAの根拠保存（任意だが推奨）

### ツールディレクトリ
- データ: `src/data/tools.ts`（ハードコード、67件）

## デプロイ手順

```bash
# 1. 記事追加
git add content/news/YYYY-MM-DD-slug.md
git add content/products/your-product.md  # 必要なら（プロダクト辞書）
git add research/YYYY-MM-DD-slug/  # NVA対象の場合

# 2. 公開前ゲート（失敗時は公開中止）
npm run publish:gate

# 3. コミット & プッシュ
git commit -m "記事タイトル"
git push

# 4. デプロイ確認（1-2分待つ）
# https://ai.essential-navigator.com/news/[slug] または /products/[slug] にアクセス
```

## 注意事項
- URL共有前に必ずブラウザで表示確認（TOOLS.md参照）
- ビルドエラー時は `npm run build` でローカル確認
- 画像がない記事はカテゴリ別デフォルト画像を使用

## 参照ドキュメント
- CLAUDE.md — プロジェクト全体の技術仕様
- docs/SITE-ARCHITECTURE.md — サイト構成詳細
