# Article Template — 記事テンプレートスキル

## 概要
コンテンツ種類別の記事構造テンプレートと、frontmatter仕様。

## Frontmatter（全記事共通）

> **正規定義:** `specs/content-policy/spec.md`

```yaml
---
title: "記事タイトル"
slug: "url-friendly-slug"
date: "YYYY-MM-DD"
contentType: "digest"            # news | product | digest（必須）
digestEdition: "morning"         # morning（digest時のみ必須）
tags: ["dev-knowledge"]          # news時に分類タグを先頭に（dev-knowledge / case-study / product-update）
relatedProducts: ["product-slug"] # 関連プロダクト（/products/[slug]）
description: "記事の要約（120文字以内）"
readTime: 5
featured: false
image: "/images/xxx.jpg"
---
```

補足:
- `contentType` / `digestEdition` / `tags` / `relatedProducts` が canonical V2 フィールド
- レガシー互換: `category`, `relatedProduct`（単数）は既存記事に残存するが、新規記事では使用しない
- 記事内で登場するプロダクトは必ず `/products/[slug]` にリンクする

## 種類別テンプレート

### 🗞️ 朝刊まとめ（contentType: digest, digestEdition: morning）

```markdown
# AIソロビルダー朝刊 — YYYY年M月D日（曜）[メインテーマ]

導入（今日の結論を1〜3行）

## 🏁 重要ニュースランキング（NVA）

（この表は最大10件。Top 3は個別ニュース記事（`category: news`）も作成し、Digestと `/news-value` からリンクする）

| 順位 | NVA | ニュース | 出典 | 関連プロダクト |
|------|-----|----------|------|----------------|
| 1 | 86 | [タイトル](/news/your-news-slug) | [リンク] | [/products/slug](/products/slug) |
| 2 | 78 | [タイトル](/news/your-news-slug) | [リンク] | [/products/slug](/products/slug) |
| 3 | 72 | [タイトル](/news/your-news-slug) | [リンク] | — |
| 4 | 65 | タイトル | [リンク] | — |
| 5 | 61 | タイトル | [リンク] | — |
| 6 | 58 | タイトル | [リンク] | — |
| 7 | 55 | タイトル | [リンク] | — |
| 8 | 49 | タイトル | [リンク] | — |
| 9 | 44 | タイトル | [リンク] | — |
| 10 | 40 | タイトル | [リンク] | — |

## 🔥 Top 3 ピックアップ

### 1位: [タイトル]
- **何が起きたか:** ...
- **数字で理解:** ...
- **なぜ重要か:** ...
- **ソロビルダー視点:** ...
- **関連プロダクト:** [/products/slug](/products/slug)
- **個別ニュース記事:** [/news/your-news-slug](/news/your-news-slug)

#### ニュースバリュー評価（NVA）
| 評価軸 | スコア |
|--------|--------|
| SNS反応量 | XX/20 |
| メディアカバレッジ | XX/20 |
| コミュニティ反応 | XX/20 |
| 技術的インパクト | XX/20 |
| ソロビルダー関連度 | XX/20 |
| **合計** | **XX/100 (Tier X)** |

**所見:** ...

**出典:** [リンク]

## ✅ 今日のアクション（読者が今すぐやること）
- 1つ目
- 2つ目
- 3つ目
```

### 📰 ニュース（contentType: news）

```markdown
# [主語]、[何が起きたか] — [一言の文脈・意味]

## TL;DR
- 要点1
- 要点2
- 要点3

## 何が起きたか
[事実の整理。出典リンクと定量データをセットで。]

## なぜ今重要か
[市場/技術/コミュニティ文脈]

## ソロビルダー視点（どう使うか / 何が変わるか）
[具体的なユースケース、注意点]

## 関連プロダクト
→ [/products/slug](/products/slug)

## ニュースバリュー評価（NVA）
| 評価軸 | スコア |
|--------|--------|
| SNS反応量 | XX/20 |
| メディアカバレッジ | XX/20 |
| コミュニティ反応 | XX/20 |
| 技術的インパクト | XX/20 |
| ソロビルダー関連度 | XX/20 |
| **合計** | **XX/100 (Tier X)** |

**所見:** ...

🗣 **生の声（日本語）**
- 「...」

**出典:** [リンク]
```

### 🏷️ プロダクト（contentType: product）

```markdown
# [プロダクト名] — [一言で定義]

> 最終情報更新: YYYY-MM-DD

| 項目 | 詳細 |
|------|------|
| サービス開始 | YYYY年MM月 |
| 運営 | 企業名/個人名 |
| 調達額/収益 | ... |
| 利用者規模 | ... |
| GitHub | ... |

## これは何？
[概要。何ができるか、誰向けか。]

## 主な機能
- ...

## 料金
- ...

## ユースケース（ソロビルダー視点）
- ...

## 注意点・限界
- ...

## 公式リンク
- 公式サイト: ...
- ドキュメント: ...
```

### 🧠 AI開発ナレッジ（contentType: news, tags: [dev-knowledge]）

```markdown
# [タイトル — 読者が何を得るか]

## この記事で分かること
- [ポイント1]
- [ポイント2]
- [ポイント3]

## 背景・前提
[テーマの背景説明]

## 手順/解説
[詳細な解説、手順、分析]

## 実践
[ソロビルダーが今すぐ活かせる具体的なアクション]

## 関連プロダクト
- [/products/slug](/products/slug)

## まとめ
[要点の整理 + 次のステップ]

**参考リンク:** [出典一覧]
```

### 📊 ソロビルダー事例紹介（contentType: news, tags: [case-study]）

```markdown
# [ビルダー名/プロダクト名] — [成果の要約]

## プロフィール
| 項目 | 内容 |
|------|------|
| ビルダー | [名前] |
| プロダクト | [名前] |
| 開始 | [時期] |
| 現在のMRR | [$XX] |
| ユーザー数 | [数値] |
| 技術スタック | [使用ツール] |

## ストーリー
[どうやって始めたか、どう成長したか]

## 収益モデル
[どうやって稼いでいるか、料金体系]

## 成功要因の分析
[なぜうまくいったか、再現可能性]

## ソロビルダーへの教訓
[この事例から学べること、注意すべきこと]

## 関連プロダクト
- [/products/slug](/products/slug)

**出典:** [リンク]
```

## 参照ドキュメント
- `specs/content-policy/spec.md` — frontmatter・taxonomy の正規定義
- `docs/operations/EDITORIAL.md` — タイトルルール
- `docs/business/BRAND-IDENTITY.md` — トーン・文体
- `docs/operations/CONTENT-STRATEGY.md` — SEO・内部リンク戦略
- `docs/business/CONCEPT.md` — 最重要ポリシー

## 公開前ゲート（必須）

```bash
npm run publish:gate
```

`validate:content`、`sync:content:db`、`build` がすべて通過した変更のみ公開する。
