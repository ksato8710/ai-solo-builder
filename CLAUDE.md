# AI Solo Builder - TLDR.tech風 日本語AIキュレーションサイト

## プロジェクト概要
- **目標:** TLDR.tech のUIをベースにした、日本語のAIソロビルダー向けニュースキュレーションサイト
- **技術スタック:** Next.js (App Router) + Tailwind CSS + TypeScript
- **ホスティング:** GitHub Pages（GitHub Actions でデプロイ）
- **ドメイン:** ai.essential-navigator.com

## デザイン仕様（TLDR.tech準拠）

### カラーパレット
- 背景: #0f172a (dark navy)
- カード背景: #1e293b (slightly lighter)
- カードホバー: #334155
- テキスト: #e2e8f0 (light gray)
- サブテキスト: #94a3b8
- アクセント（ブランドカラー）:
  - エレクトリックブルー: #3B82F6
  - バイオレット: #8B5CF6
  - エメラルド: #10b981

### カテゴリとカラー
各カテゴリに固有のアクセントカラーを割り当て:
- 🌅 朝のAIニュース (Morning News): #3B82F6 (blue)
- 🛠️ 注目ツール (Featured Tools): #8B5CF6 (violet)
- 🔬 深掘り・ハウツー (Deep Dive): #10b981 (emerald)
- 📊 事例分析 (Case Study): #f59e0b (amber)

### レイアウト（TLDR.tech準拠）
1. **ヘッダー:** ロゴ + ナビ（カテゴリリンク）+ 「ニュースレター登録」ボタン（将来用）
2. **ヒーローセクション:** 今日のトップ記事（大きいカード1枚 + サイド2-3枚）
3. **カテゴリ別セクション:** カテゴリラベル + 横スクロール or グリッドのカード5枚
4. **カードデザイン:**
   - サムネイル画像（OGP or デフォルト）
   - 日付 + カテゴリタグ（カラーバッジ）
   - タイトル（太字）
   - 短い説明（2行）
   - 読了時間

### タイポグラフィ
- フォント: Inter + Noto Sans JP
- 見出し: 太め (font-bold / font-extrabold)
- 本文: 0.875rem (text-sm)
- カテゴリラベル: uppercase, letter-spacing, 小さめ

## コンテンツ構造

### ディレクトリ
```
/content/
  /news/
    2026-02-02-morning-vibe-coding.mdx
    2026-02-02-noon-tools.mdx
    2026-02-02-evening-pieter-levels.mdx
  /tools/     (将来: ツールディレクトリ)
```

### Frontmatter
```yaml
---
title: "バイブコーディングが「誰でもできる」時代に突入"
slug: "morning-news-2026-02-02-vibe-coding-mainstream"
date: "2026-02-02"
category: "morning-news"
description: "Scientific AmericanのClaude Code特集..."
readTime: 5
featured: true
image: "/images/default-morning.jpg"
---
```

## ページ構成
- `/` — トップページ（ヒーロー + カテゴリ別グリッド）
- `/news/[slug]` — 記事詳細ページ
- `/category/[category]` — カテゴリ一覧ページ

## 重要な注意
- ダークモードファースト（ライトモードは不要）
- モバイルファースト（レスポンシブ必須）
- 日本語コンテンツ（UIテキストも日本語）
- 画像がない記事はカテゴリ別のデフォルト画像を使用
- SSG（Static Site Generation）で最大パフォーマンス
