# Site Config — サイト設定スキル

## 概要
AI Solo Craft の技術仕様・デプロイ手順・運用ルール。

## 🚨 絶対ルール
**mdファイル（content/news/, content/products/）への書き込みは禁止。**
**すべてのコンテンツはDB直接投入のみ。**

## 基本情報

| 項目 | 値 |
|------|-----|
| URL | https://ai.essential-navigator.com |
| Vercel URL | https://ai-solo-craft.vercel.app |
| GitHub | ksato8710/ai-solo-craft |
| スタック | Next.js (App Router) + Tailwind CSS + TypeScript + SSG |
| ローカル | /Users/satokeita/Dev/ai-solo-craft |

## コンテンツ管理

### DB直接投入（唯一の方法）

```bash
cat > /tmp/article.json << 'EOF'
{
  "slug": "example-article",
  "title": "記事タイトル",
  "description": "説明文",
  "contentType": "news",
  "date": "2026-03-02",
  "image": "https://...",
  "tags": ["dev-knowledge"],
  "relatedProducts": ["claude-code"],
  "body_markdown": "本文..."
}
EOF
node scripts/create-content-db.mjs --stdin < /tmp/article.json
```

### 禁止事項
- ❌ `content/news/*.md` への書き込み
- ❌ `content/products/*.md` への書き込み
- ❌ mdファイルを作成してから `sync:content:db`

### 正式データモデル（canonical V2）
- `contentType`: `news | product | digest`
- `digestEdition`: `morning`（digest時のみ）
- `tags`: `dev-knowledge` / `case-study` / `product-update`（news時に分類タグとして使用）
- 正規定義: `specs/content-policy/spec.md`

### 公開前チェック
- `npm run publish:gate` を実行（validate + build）
- 失敗したら公開中止

必要な環境変数（`.env.local` または `.env`）:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

## デプロイ手順

```bash
# 1. DB直接投入
node scripts/create-content-db.mjs --stdin < /tmp/article.json

# 2. 公開前ゲート（失敗時は公開中止）
npm run publish:gate

# 3. コミット & プッシュ
git commit -m "記事タイトル"
git push

# 4. デプロイ確認（1-2分待つ）
# web_fetchで https://ai.essential-navigator.com/news/[slug] を確認
```

## 注意事項
- **mdファイルを絶対に作成しない**
- URL共有前に必ずweb_fetchで200確認
- ビルドエラー時は `npm run build` でローカル確認

## 参照ドキュメント
- CLAUDE.md — プロジェクト全体の技術仕様
- `specs/content-policy/spec.md` — コンテンツ分類の正規定義
