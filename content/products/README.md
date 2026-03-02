# ⚠️ このディレクトリにファイルを作成しないでください

## 2026-03-01以降のルール

すべてのコンテンツはDB直接投入のみです。mdファイルの作成は禁止されています。

## 正しい方法

```bash
cat > /tmp/product.json << 'EOF'
{
  "slug": "example-product",
  "title": "プロダクト名",
  "description": "説明文",
  "contentType": "product",
  "body_markdown": "本文..."
}
EOF
node scripts/create-content-db.mjs --stdin < /tmp/product.json
```

## 禁止事項

- ❌ このディレクトリに `.md` ファイルを作成する
- ❌ mdファイルを作成してから `sync:content:db` を実行する
