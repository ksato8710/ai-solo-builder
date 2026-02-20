# AI Solo Builder - TLDR.tech風 日本語AIキュレーションサイト

## プロジェクト概要
- **目標:** TLDR.tech のUIをベースにした、日本語のAIソロビルダー向けニュースキュレーションサイト
- **技術スタック:** Next.js (App Router) + Tailwind CSS + TypeScript
- **ホスティング:** Vercel（無料枠）
- **ドメイン:** ai.essential-navigator.com

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
| Digestワークフロー | 朝刊/夕刊の5Phase手順 | `docs/operations/WORKFLOW-DIGEST.md` |
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

## 記事作成ワークフロー

### Digest（朝刊/夕刊 5 Phase）

詳細は `docs/operations/WORKFLOW-DIGEST.md` を参照。

```
1. [news-scout]     Phase 1: 調査 — X/Reddit/HN/PHを巡回、一次ソース確認、DB保存
2. [news-scout]     Phase 2: 評価 — 期間フィルタ・NVAスコアリング・Top10/Top3選定
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
- 🗞️ 夕刊Digest (contentType: digest, digestEdition: evening): #F97316 (orange)
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

### ディレクトリ
```
/content/
  /news/        # Digest/ニュース/ナレッジ/事例
  /products/    # プロダクト辞書（恒久ページ）
```

### Frontmatter（canonical V2 — 正規定義は `specs/content-policy/spec.md`）
```yaml
---
title: "バイブコーディングが「誰でもできる」時代に突入"
slug: "morning-news-2026-02-02-vibe-coding-mainstream"
date: "2026-02-02"
contentType: "digest"           # news | product | digest
digestEdition: "morning"        # morning | evening（digestの場合のみ）
tags: ["vibe-coding", "cursor"] # ニュース分類タグ
relatedProducts: ["cursor"]     # 関連プロダクト（配列）
description: "Scientific AmericanのClaude Code特集..."
readTime: 5
featured: true
image: "/images/default-morning.jpg"
---
```

## ページ構成
- `/` — トップページ（ヒーロー + カテゴリ別グリッド）
- `/news/[slug]` — 記事詳細ページ
- `/products/[slug]` — プロダクト詳細ページ
- `/category/[category]` — カテゴリ一覧ページ
- `/news-value` — ニュースバリュー評価一覧ページ

## 海外記事の紹介方針（2026-02-03 けいた様承認・確定）

海外メディアの記事を紹介する場合は、以下の形式を統一ルールとする:

- **形式:** 「原文の要点紹介＋日本市場への独自分析」
- **禁止:** 全文翻訳の転載（著作権侵害リスク）
- **必須:** 出典リンクの明記、原文への敬意を示す構成
- **付加価値:** 日本のソロビルダー視点での実現可能性・注意点の独自分析を必ず追加
- **表記例:** 「本記事は翻訳ではなく、原文の紹介・解説記事です。詳細は原文（英語）をご覧ください。」

この形式であれば権利リスクなく、かつ読者にとって原文以上の価値を提供できる。

## 重要な注意
- ダークモードファースト（ライトモードは不要）
- モバイルファースト（レスポンシブ必須）
- 日本語コンテンツ（UIテキストも日本語）
- 画像がない記事はカテゴリ別のデフォルト画像を使用
- SSG（Static Site Generation）で最大パフォーマンス
