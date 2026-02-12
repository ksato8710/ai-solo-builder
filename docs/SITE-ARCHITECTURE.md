# AI Solo Builder — サイト構成

*作成日: 2026-02-03*
*更新日: 2026-02-11（DBエンティティ設計追記）*

> 最新のデータモデル正本は `specs/content-policy/spec.md` と `specs/content-model-db/spec.md` を参照。
> このドキュメントの旧 `category` 記述は、現行実装互換の説明を含みます。

---

## 技術スタック

| 要素 | 技術 |
|------|------|
| フレームワーク | Next.js (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| ビルド | SSG（Static Site Generation） |
| ホスティング | Vercel（無料枠） |
| コンテンツ | Markdown（authoring） + PostgreSQL（serving/query） |
| デプロイ | git push → Vercel自動デプロイ |
| リポジトリ | （このリポジトリ） |
| ドメイン | ai.essential-navigator.com |
| 外部配信API | Next.js Route Handler (`/api/v1/*`) |

---

## ディレクトリ構成

```
ai-navigator/
├── src/
│   ├── app/
│   │   ├── page.tsx          # トップページ
│   │   ├── layout.tsx        # ルートレイアウト
│   │   ├── news/
│   │   │   └── [slug]/
│   │   │       └── page.tsx  # 記事詳細ページ
│   │   ├── products/
│   │   │   └── [slug]/
│   │   │       └── page.tsx  # プロダクト詳細ページ
│   │   ├── category/
│   │   │   └── [category]/
│   │   │       └── page.tsx  # カテゴリ一覧ページ
│   │   └── news-value/
│   │       └── page.tsx      # NVAランキング（最新Digest）
│   ├── lib/
│   │   ├── posts.ts          # Markdown読み取り・パース
│   │   ├── digest.ts         # Digest内ランキング表の読み取り
│   │   └── research.ts       # NVA中間資料（将来拡張/分析用）
│   ├── data/
│   │   └── tools.ts          # ツールディレクトリデータ（67件）
├── content/
│   ├── news/                 # 記事Markdownファイル（Digest/ニュース/ナレッジ/事例）
│   └── products/             # プロダクト記事（辞書）
├── research/                 # NVA中間資料
│   └── YYYY-MM-DD-slug/
│       ├── assessment.md     # NVA評価結果
│       └── sources.md        # ソースデータ
├── docs/                     # 事業設計文書
├── public/
│   └── images/               # 静的画像
├── CLAUDE.md                 # プロジェクト設定
├── EDITORIAL.md              # 編集ガイドライン
└── README.md
```

---

## ページ構成

| パス | ページ | 内容 |
|------|--------|------|
| `/` | トップページ | ヒーロー + カテゴリ別グリッド |
| `/news/[slug]` | 記事詳細 | 記事本文 + NVA評価 |
| `/products/[slug]` | プロダクト詳細 | プロダクトの恒久ページ（前提情報） |
| `/category/[category]` | カテゴリ一覧 | カテゴリ別記事リスト |
| `/news-value` | NVAランキング | 朝/夕Digestごとに更新されるTop 10ランキング |

## API構成（Web / Flutter共通）

| パス | 用途 |
|------|------|
| `/api/v1/feed` | モバイル向けホーム集約レスポンス |
| `/api/v1/contents` | フィルタ付き一覧取得 |
| `/api/v1/contents/[slug]` | 詳細取得 |

---

## コンテンツ（Markdown）仕様

### Frontmatter

```yaml
---
title: "記事タイトル"
slug: "url-friendly-slug"
date: "YYYY-MM-DD"
category: "morning-summary"  # morning-summary | evening-summary | news | dev-knowledge | case-study | products
relatedProduct: "product-slug"  # 任意: 関連するプロダクトslug（/products/[slug]）
description: "記事の要約（120文字以内）"
readTime: 5               # 読了時間（分）
featured: false            # トップページのヒーロー表示
image: "/images/xxx.jpg"   # OGP画像（オプション）
---
```

### カテゴリ（方針）

| slug | 名称 | カラー |
|------|------|--------|
| morning-summary | 🗞️ 朝のまとめ（Digest） | #3B82F6 |
| evening-summary | 🗞️ 夕のまとめ（Digest） | #F97316 |
| news | 📰 ニュース（個別） | #6366F1 |
| dev-knowledge | 🧠 AI開発ナレッジ | #10b981 |
| case-study | 📊 ソロビルダー事例紹介 | #f59e0b |
| products | 🏷️ プロダクト（辞書） | #8B5CF6 |

#### 補足（現行実装の互換カテゴリ）
- 現在のコンテンツ/実装には `morning-news`/`evening-news`, `product-news`（ニュース）, `knowledge`/`dev`/`deep-dive`（ナレッジ）, `featured-tools`, `tools` 等が混在している可能性がある
- 方針としては上記6slugに統合する（詳細は `docs/CONCEPT.md` と `docs/CONTENT-STRATEGY.md`）

---

## デプロイ手順

```bash
# 記事追加
1. content/news/ または content/products/ に Markdown を作成
2. git add -A && git commit -m "記事タイトル" && git push
3. Vercelが自動デプロイ（1〜2分）
4. https://ai.essential-navigator.com/news/[slug] または /products/[slug] で公開確認
```

### NVA評価データの更新

```bash
# /news-value への反映
1. Digest記事（morning-summary / evening-summary）に「重要ニュースランキング（NVA）」の表を作成/更新
2. Top 3を深掘りし、必要なら個別ニュース記事も作成してリンク
3. 研究メモとして research/YYYY-MM-DD-slug/ にassessment.md + sources.md を保存（任意だが推奨）
4. git push でデプロイ
```

---

## 外部連携

| サービス | 用途 | 状態 |
|---------|------|------|
| Vercel | ホスティング・デプロイ | ✅ 稼働中 |
| GitHub | ソースコード管理 | ✅ 稼働中 |
| Google Analytics (GA4) | アクセス解析 | ⬜ 未設定 |
| Search Console | 検索パフォーマンス | ⬜ 未設定 |
| Route 53 | DNS（CNAME → Vercel） | ✅ 設定済み |

---

*このサイト構成はCLAUDE.mdの技術仕様と整合。変更時は両方を更新すること。*
