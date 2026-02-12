# AI Solo Builder - TLDR.tech風 日本語AIキュレーションサイト

## プロジェクト概要
- **目標:** TLDR.tech のUIをベースにした、日本語のAIソロビルダー向けニュースキュレーションサイト
- **技術スタック:** Next.js (App Router) + Tailwind CSS + TypeScript
- **ホスティング:** Vercel（無料枠）
- **ドメイン:** ai.essential-navigator.com

## 事業設計文書（docs/）

記事作成・サイト改善・戦略判断時は必ず参照:

| ドキュメント | 内容 | パス |
|------------|------|------|
| コンセプトシート | ビジョン・ターゲット・差別化・進化パス | `docs/CONCEPT.md` |
| リーンキャンバス | 事業全体の設計図 | `docs/LEAN-CANVAS.md` |
| ブランドアイデンティティ | トーン・文体・ビジュアル | `docs/BRAND-IDENTITY.md` |
| コンテンツ戦略 | カテゴリ設計・品質基準・配信計画 | `docs/CONTENT-STRATEGY.md` |
| リサーチソース | 巡回先リスト・リサーチ手順 | `docs/RESEARCH-SOURCES.md` |
| サイト構成 | ディレクトリ構造・デプロイ手順 | `docs/SITE-ARCHITECTURE.md` |

## サブエージェント体制（.claude/agents/）

| エージェント | モデル | 役割 |
|-------------|--------|------|
| news-scout | sonnet | ニュース収集・スクリーニング・NVA一次評価 |
| article-writer | sonnet | 記事作成・NVA評価セクション作成 |
| quality-checker | haiku | 品質チェック（EDITORIAL.md・ブランド準拠） |
| publisher | haiku | git push・デプロイ確認 |

## スキル（.claude/skills/）

| スキル | 内容 |
|--------|------|
| news-curation | ニュースキュレーション手順 |
| article-template | カテゴリ別記事テンプレート |
| brand-voice | ブランドトーン・文体ルール |
| editorial-standards | 編集基準・チェックリスト |
| nva-process | ニュースバリュー評価手順 |
| site-config | 技術仕様・デプロイ手順 |
| research-sources | 巡回先クイックリファレンス |

## 記事作成ワークフロー

```
1. [news-scout] 情報収集 — X/Reddit/HN/PHを巡回、NVA一次スクリーニング
2. [article-writer] 記事作成 — テンプレート選択、定量データ付きMarkdown作成
3. [quality-checker] 品質チェック — EDITORIAL.md準拠、ブランドトーン確認
4. [publisher] 公開前ゲート — npm run publish:gate（validate + DB sync + build）
5. [publisher] 公開 — git push → Vercel自動デプロイ → 表示確認
6. [nemo→stevens] 報告 — 30分定期報告で進捗共有
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

### カテゴリとカラー
各カテゴリに固有のアクセントカラーを割り当て:
- 🗞️ 朝のまとめ (morning-summary): #3B82F6 (blue)
- 🗞️ 夕のまとめ (evening-summary): #F97316 (orange)
- 📰 ニュース（個別） (news): #6366F1 (indigo)
- 🏷️ プロダクト（辞書） (products): #8B5CF6 (violet)
- 🧠 AI開発ナレッジ (dev-knowledge): #10b981 (emerald)
- 📊 ソロビルダー事例紹介 (case-study): #f59e0b (amber)

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

### Frontmatter
```yaml
---
	title: "バイブコーディングが「誰でもできる」時代に突入"
	slug: "morning-news-2026-02-02-vibe-coding-mainstream"
	date: "2026-02-02"
	category: "morning-summary"
	relatedProduct: "cursor" # 任意: 関連プロダクト（/products/[slug]）
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
