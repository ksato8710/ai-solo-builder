# AI Solo Craft - 日本語AIキュレーションサイト

## プロジェクト概要
- **目標:** AIソロビルダー向け日本語ニュースキュレーションサイト
- **技術スタック:** Next.js (App Router) + Tailwind CSS + TypeScript + Supabase
- **ホスティング:** Vercel
- **ドメイン:** ai-solo-craft.craftgarden.studio
- **データ:** DB-first（Supabase PostgreSQL）、自動収集パイプライン稼働中

## ドキュメント体系（docs/）

> **構造・運用ルールの詳細:** `docs/DOCUMENTATION-GUIDE.md`

記事作成・サイト改善・戦略判断時は必ず参照:

### business/ — 事業設計

| ドキュメント | 内容 | パス |
|------------|------|------|
| コンセプトシート | ビジョン・ターゲット・差別化・進化パス | `docs/business/CONCEPT.md` |
| リーンキャンバス | 事業全体の設計図 | `docs/business/LEAN-CANVAS.md` |
| ブランドアイデンティティ | トーン・文体・ビジュアル | `docs/business/BRAND-IDENTITY.md` |

### operations/ — 運用

| ドキュメント | 内容 | パス |
|------------|------|------|
| ワークフロー全体像 | スキル体系・cron・スケジュール | `docs/operations/WORKFLOW-OVERVIEW.md` |
| Digestワークフロー | 朝刊の5Phase手順 | `docs/operations/WORKFLOW-DIGEST.md` |
| 個別記事ワークフロー | 深掘り記事の5Phase手順 | `docs/operations/WORKFLOW-INDIVIDUAL.md` |
| 品質チェックリスト | 公開前・コミット前チェック | `docs/operations/CHECKLIST.md` |
| 編集ガイドライン | 文体・トーン・表記ルール | `docs/operations/EDITORIAL.md` |
| コンテンツ戦略 | SEO・内部リンク・カテゴリ統合 | `docs/operations/CONTENT-STRATEGY.md` |
| リサーチソース | 巡回先リスト・リサーチ手順 | `docs/operations/RESEARCH-SOURCES.md` |

### technical/ — 技術

| ドキュメント | 内容 | パス |
|------------|------|------|
| サイト構成 | ディレクトリ構造・デプロイ手順 | `docs/technical/ARCHITECTURE.md` |
| API設計 | Content API仕様 | `docs/technical/API.md` |
| データベース | Supabase設定・スキーマ | `docs/technical/DATABASE.md` |
| ニュースレター | メール配信機能の技術仕様 | `docs/technical/NEWSLETTER.md` |
| 管理ガイド | 運用管理手順 | `docs/technical/ADMIN.md` |

### specs/ — 正規仕様

| ドキュメント | 内容 | パス |
|------------|------|------|
| コンテンツポリシー | 3型分類・frontmatter契約 | `specs/content-policy/spec.md` |
| DBスキーマ | エンティティ設計 | `specs/content-model-db/spec.md` |

## サブエージェント体制（.claude/agents/）

| エージェント | モデル | 役割 | 使用スキル |
|-------------|--------|------|-----------|
| news-scout | sonnet | ニュース収集・スクリーニング・NVA一次評価 | news-curation, research-sources, nva-process |
| article-writer | sonnet | 記事作成・NVA評価セクション作成 | article-template, brand-voice, editorial-standards, nva-process |
| quality-checker | haiku | 品質チェック（EDITORIAL.md・ブランド準拠） | editorial-standards, brand-voice |
| publisher | haiku | git push・デプロイ確認 | site-config |

## スキル（.claude/skills/）

| スキル | 内容 | 主な参照先 |
|--------|------|-----------|
| news-curation | ニュースキュレーション手順 | RESEARCH-SOURCES, WORKFLOW-DIGEST |
| article-template | 記事種別テンプレート + frontmatter | specs/content-policy/spec.md |
| brand-voice | ブランドトーン・文体ルール | BRAND-IDENTITY |
| editorial-standards | 編集基準・チェックリスト | EDITORIAL, CHECKLIST |
| nva-process | ニュースバリュー評価手順 | WORKFLOW-DIGEST, WORKFLOW-INDIVIDUAL |
| site-config | 技術仕様・デプロイ手順 | ARCHITECTURE, CHECKLIST |
| research-sources | 巡回先クイックリファレンス | RESEARCH-SOURCES |
| ui-design-system | UIデザインパターン・CSS設計ルール | globals.css, BRAND-IDENTITY |
| thumbnail-generation | サムネイル画像生成手順・ブランドカラー活用 | generate-thumbnail.mjs, types.ts |

## 記事作成ワークフロー

### Digest（朝刊 5 Phase）

詳細は `docs/operations/WORKFLOW-DIGEST.md` を参照。

```
0. [自動]           収集パイプライン — Vercel Cron 06:00 → RSS/API/Scrape → NVAスコアリング
1. [news-scout]     Phase 1: 調査 — 収集データから候補選定、一次ソース確認
2. [news-scout]     Phase 2: 評価 — 期間フィルタ・NVAスコア確認・Top10/Top3選定
3. [article-writer] Phase 3: 記事作成 — Digest + Top3個別記事作成（テンプレート厳守）
4. [article-writer] Phase 4: UI最適化 — テーブルレイアウト・ビジュアル階層・可読性向上
5. [publisher]      Phase 5: 公開 — publish:gate → git push → Vercel確認
```

### 個別記事（dev-knowledge / case-study）

詳細は `docs/operations/WORKFLOW-INDIVIDUAL.md` を参照。

```
1. Phase 1: テーマ選定（30分）
2. Phase 2: 一次ソースリサーチ（1〜2時間）
3. Phase 3: 既存リソース評価（1時間）
4. Phase 4: 独自価値の設計（30分）
5. Phase 5: 執筆・品質チェック・公開（2〜4時間）
```

## DB登録必須ルール（運用）

- 記事公開前に `npm run publish:gate` を必ず実行する
- `publish:gate` 内の `sync:content:db` が失敗した場合は公開しない
- `sync:content:db` は `.env.local` / `.env` を自動読込する

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

### カテゴリとカラー（canonical contentType + 表示用カテゴリ）
各コンテンツ種別に固有のアクセントカラーを割り当て:
- 🗞️ 朝刊Digest (contentType: digest, digestEdition: morning): #3B82F6 (blue)
- 📰 ニュース（個別） (contentType: news): #6366F1 (indigo)
- 🏷️ プロダクト（辞書） (contentType: product): #8B5CF6 (violet)
- 🧠 AI開発ナレッジ (contentType: news, tags: [dev-knowledge]): #10b981 (emerald)
- 📊 ソロビルダー事例紹介 (contentType: news, tags: [case-study]): #f59e0b (amber)

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

### 🚨 絶対ルール
**mdファイル（content/news/, content/products/）への書き込みは禁止。**
**すべてのコンテンツはDB直接投入のみ。**

```bash
# DB直接投入（唯一の方法）
cat > /tmp/article.json << 'EOF'
{
  "slug": "example",
  "title": "タイトル",
  "body_markdown": "本文..."
}
EOF
node scripts/create-content-db.mjs --stdin < /tmp/article.json
```

### ディレクトリ（参照のみ、書き込み禁止）
```
/content/
  /news/        # ⚠️ 書き込み禁止 — DBから配信
  /products/    # ⚠️ 書き込み禁止 — DBから配信
```

### Frontmatter（canonical V2 — 正規定義は `specs/content-policy/spec.md`）
```yaml
---
title: "バイブコーディングが「誰でもできる」時代に突入"
slug: "morning-news-2026-02-02-vibe-coding-mainstream"
date: "2026-02-02"
contentType: "digest"           # news | product | digest
digestEdition: "morning"        # morning（digestの場合のみ）
tags: ["vibe-coding", "cursor"] # ニュース分類タグ
relatedProducts: ["cursor"]     # 関連プロダクト（配列）
description: "Scientific AmericanのClaude Code特集..."
readTime: 5
featured: true
image: "/images/default-morning.jpg"
---
```

## ページ構成

### 公開ページ
- `/` — トップページ（ヒーロー + カテゴリ別グリッド）
- `/news/[slug]` — 記事詳細ページ
- `/products/[slug]` — プロダクト詳細ページ
- `/category/[category]` — カテゴリ一覧ページ
- `/news-value` — ニュースバリュー評価一覧ページ

### 管理画面
- `/admin` — 管理ダッシュボード（ツール導線 + システムリファレンス）
- `/admin/collected-items` — 収集データ管理（フィルタ・手動編集）
- `/admin/scoring` — NVAスコアリングダッシュボード（統計・重み設定）
- `/admin/source-intelligence` — 3階層ソース統合管理

### API エンドポイント
- `GET /api/v1/contents` — コンテンツ一覧
- `GET /api/v1/contents/[slug]` — コンテンツ詳細
- `POST /api/cron/collect-sources` — 自動収集 + スコアリング（Vercel Cron）
- `POST /api/cron/send-newsletter` — ニュースレター配信（Vercel Cron）
- `GET /api/admin/collected-items` — 収集データ管理 API
- `GET/PUT /api/admin/scoring-config` — スコアリング設定 API

## 海外記事の紹介方針（2026-02-03 けいた様承認・確定）

海外メディアの記事を紹介する場合は、以下の形式を統一ルールとする:

- **形式:** 「原文の要点紹介＋日本市場への独自分析」
- **禁止:** 全文翻訳の転載（著作権侵害リスク）
- **必須:** 出典リンクの明記、原文への敬意を示す構成
- **付加価値:** 日本のソロビルダー視点での実現可能性・注意点の独自分析を必ず追加
- **表記例:** 「本記事は翻訳ではなく、原文の紹介・解説記事です。詳細は原文（英語）をご覧ください。」

この形式であれば権利リスクなく、かつ読者にとって原文以上の価値を提供できる。

## ニュース収集パイプライン

### 概要
124ソースから RSS / API / Scrape で自動収集し、ルールベースの NVA スコアリングを行う。

### 3階層ソース分類
| Tier | 種別 | 例 | 信頼度 |
|------|------|-----|--------|
| 一次（primary） | 公式ブログ・リリース | Anthropic, OpenAI, Google AI, Vercel, GitHub | 9-10 |
| 二次（secondary） | メディア・ニュースレター | 日経xTECH, ITmedia, Publickey, The Rundown AI | 6-8 |
| 三次（tertiary） | コミュニティ | Hacker News, Reddit, Product Hunt, GitHub Trending | 5-7 |

### NVA 5軸スコアリング (0-100)
各軸 0-20 → 加重平均 × 5 で 0-100 に正規化:
- `social` (×1.0): SNS反応
- `media` (×1.0): メディア報道量
- `community` (×1.0): コミュニティ話題度
- `technical` (×1.0): 技術的インパクト
- `solo_relevance` (×1.5): ソロ開発者への関連度

### 主要ファイル
- `src/lib/crawler.ts` — RSS / API / Scrape クローラー
- `src/lib/scorer.ts` — NVA ルールベーススコアラー
- `src/app/api/cron/collect-sources/route.ts` — Cron エントリポイント

### Cron スケジュール（vercel.json）
- `06:00 UTC+9` — collect-sources（自動収集 + スコアリング）
- `23:15 UTC+9` — send-newsletter

### DB テーブル
- `source_crawl_configs` — ソースごとのクロール設定
- `collected_items` — 収集データ + NVAスコア
- `scoring_config` — スコアリング重み・分類カテゴリ

## 重要な注意

### 品質ポリシー（最重要）
> AI時代だからこそ、品質の高いものだけを世に出す。
- 速さより正確さ。未検証情報は出さない
- 量より密度。読者の時間を奪わない
- 一次ソースへの敬意。出典明記、原文以上の付加価値
- 定量データの裏付け。数字で語る
- 「出さない判断」ができることが品質を守る最大の武器

### 技術方針
- Quiet Garden デザインシステム（植物テーマ）
- モバイルファースト（レスポンシブ必須）
- 日本語コンテンツ（UIテキストも日本語）
- 画像がない記事はカテゴリ別のデフォルト画像を使用
- SSG（Static Site Generation）で最大パフォーマンス
- DB-first: コンテンツは Supabase から配信（Markdown は補助）
