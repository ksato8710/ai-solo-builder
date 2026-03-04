# ⚠️ このディレクトリにmdファイルを作成しないでください

## DB直接投入ルール（2026-03-01〜）

**全ての記事はDBに直接投入します。**

### ❌ 禁止
```bash
# これはやらない
echo "---\ntitle: ..." > content/news/example.md
```

### ✅ 正しい方法
```bash
cat > /tmp/article.json << 'EOF'
{
  "slug": "example-article",
  "title": "記事タイトル",
  "body_markdown": "## 見出し\n\n本文..."
}
EOF

node scripts/create-content-db.mjs --stdin < /tmp/article.json
```

### 参照
- `/Users/satokeita/clawd-tifa/TOOLS.md`
- `~/.openclaw/skills/digest-writer/SKILL.md`

---
*husky pre-commitでもチェックされますが、このREADMEは人間への警告です。*
