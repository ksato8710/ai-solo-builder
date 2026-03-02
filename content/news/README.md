# ⚠️ このディレクトリにファイルを作成しないでください

## 2026-03-01以降のルール

すべてのコンテンツはDB直接投入のみです。mdファイルの作成は禁止されています。

## 正しい方法

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
  "body_markdown": "本文..."
}
EOF
node scripts/create-content-db.mjs --stdin < /tmp/article.json
```

## 禁止事項

- ❌ このディレクトリに `.md` ファイルを作成する
- ❌ mdファイルを作成してから `sync:content:db` を実行する

## 理由

- DB-first アーキテクチャへの完全移行
- 二重管理（mdファイル + DB）の排除
- 公開漏れ・同期エラーの防止
