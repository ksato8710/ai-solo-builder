# AI Solo Craft — コンテンツ戦略

> **コンテンツ種別・frontmatter:** `specs/content-policy/spec.md`（正規定義）
> **記事品質基準:** `docs/operations/CHECKLIST.md`
> **ワークフロー:** `docs/operations/WORKFLOW-OVERVIEW.md`

---

## 目的

**「毎日まずこのサイトを見よう」と思わせる情報の網羅性と鮮度を確保する。**

---

## 内部リンク戦略

- Digest → Top 3の個別ニュース、関連プロダクトへリンク
- ニュース（個別）→ 関連プロダクトへリンク
- 事例/ナレッジ → 関連プロダクトへリンク
- プロダクト → 関連ニュース/事例/ナレッジへの逆リンク（可能なら）

**原則:** 記事内にプロダクトが登場したら、`/products/[slug]` へリンク。なければ新規作成。

---

## SEOキーワード戦略

### 主要キーワード群

1. **ツール名 + レビュー/使い方:** 「Claude Code 使い方」「Cursor 比較」
2. **カテゴリ + おすすめ:** 「AIコーディングツール おすすめ」「AI画像生成 比較」
3. **課題 + 解決:** 「個人開発 収益化」「AIで稼ぐ方法」
4. **人名 + 戦略:** 「Pieter Levels 戦略」「ソロファウンダー 成功事例」
5. **ニュース + 解説:** 「OpenAI 最新 2026」「AI ニュース 今日」

---

## 海外記事の紹介ルール

- **形式:** 要点紹介 + 日本市場への独自分析
- **禁止:** 全文翻訳の転載
- **必須:** 出典リンク、原文へのリスペクト
- **付加価値:** ソロビルダー視点での実現可能性・注意点
- **表記:** 「本記事は翻訳ではなく、原文の紹介・解説記事です」

---

## カテゴリ統合マップ（旧→新）

移行時の参照用。正規定義は `specs/content-policy/spec.md`。

| 旧 category | 新 contentType / tags |
|-------------|----------------------|
| `morning-news` | `contentType: digest`, `digestEdition: morning` |
| `product-news` | `contentType: news` |
| `knowledge` / `dev` / `deep-dive` / `featured-tools` | `contentType: news`, `tags: [dev-knowledge]` |
| `tools`（辞書的内容） | `contentType: product` |

---

*更新: 2026-02-16*
