# Sonnet依頼: プロダクト辞書（/products）記事の作成・品質向上

このドキュメントは、Claude Code（Sonnet）に「プロダクト辞書」記事を作成/更新してもらうための依頼文です。

## 背景（目的）
- 本サイトでは、ニュース/事例/ナレッジ記事から `/products/[slug]` に必ずリンクし、読者が前提情報を迷わず参照できるようにする
- `/products` は「恒久ページ（辞書）」として運用し、状況変化があれば同じページを更新していく

## ゴール（アウトプット）
- `content/products/*.md` を、実運用できる品質に更新する
- 既存ファイルがある場合は **更新**（新規作成ではなく改善）
- ファイル名/slug/URL は **既存互換を維持**（リンク切れ防止）

## 重要ルール（絶対）
- **slugは変更しない**
- 事実（開始時期/運営/資金調達/ユーザー数/料金等）は、必ず根拠となるURLを確認する
- 不明な情報は推測で埋めず、`不明` と明記する（ハルシネーション禁止）

## プロダクト記事のテンプレート（必須）
各プロダクト記事は、以下の構造を満たしてください（日本語で）。

```md
---
title: "Product Name — 一言で定義"
slug: your-slug
date: "YYYY-MM-DD"        # 最終更新日（更新した日）
category: products
type: product
description: "120文字以内の要約"
readTime: 5
image: "https://images.unsplash.com/..." # 可能なら。無理なら省略可
---

> 最終情報更新: YYYY-MM-DD

| 項目 | 詳細 |
|------|------|
| 種別 | 例: コーディング支援（IDE/CLI/エージェント） |
| 提供形態 | 例: SaaS / OSS / ローカルアプリ |
| 開発元 | 企業名/個人名 |
| サービス開始 | YYYY年MM月（不明なら不明） |
| 料金 | 無料枠/有料プラン概要（不明なら不明） |
| 利用規模 | MAU/ユーザー数/導入社数/Stars等（不明なら不明） |
| GitHub | URL（OSSなら） |

## これは何？
（誰向けで、何を解決するか。1〜3段落）

## 主な機能
- （箇条書き）

## 料金
- （無料枠の有無、代表的プラン）

## ソロビルダー視点の使いどころ
- （具体例。開発/運用/マーケ等の観点）

## 注意点・限界
- （ロックイン、コスト、精度、セキュリティ等）

## 公式リンク
- 公式: ...
- ドキュメント: ...
- 価格: ...
- GitHub: ...（該当すれば）

## 参考（出典）
- URL
- URL
```

## 優先度（まずここから）
参照頻度が高い順（`content/news` 内の `/products/` リンク頻度ベース）:
- `claude-code`
- `github-copilot`
- `openai-codex`
- `cursor`
- `pitchmode`
- `lovable-ai-web-app-builder`
- `kleo`
- `figr-design`
- `codeium`
- `cline`

## 対象ファイル一覧（更新対象）
以下の既存ファイルを、上のテンプレートに沿って品質向上してください（slugは維持）:

- `content/products/adcreative-ai-ad-creative-generator.md`
- `content/products/bifrost.md`
- `content/products/bolt-new-ai-app-builder.md`
- `content/products/claude-code.md`
- `content/products/claude-cowork-plugins-solo-team.md`
- `content/products/cline.md`
- `content/products/codeium.md`
- `content/products/crew.md`
- `content/products/cursor.md`
- `content/products/elevenlabs-ai-voice-generation.md`
- `content/products/fathom-ai-meeting-assistant.md`
- `content/products/figr-design.md`
- `content/products/gamma-ai-presentation-builder.md`
- `content/products/github-copilot.md`
- `content/products/jasper-ai-marketing-platform.md`
- `content/products/julius-ai-data-analysis.md`
- `content/products/kimi-k25.md`
- `content/products/kleo.md`
- `content/products/localgpt.md`
- `content/products/lovable-ai-web-app-builder.md`
- `content/products/manus-autonomous-ai-agent.md`
- `content/products/mentions.md`
- `content/products/midjourney-ai-image-generation.md`
- `content/products/misatay.md`
- `content/products/n8n-ai-workflow-automation.md`
- `content/products/openai-codex.md`
- `content/products/openai-prism.md`
- `content/products/perplexity-ai-search-engine.md`
- `content/products/pitchmode.md`
- `content/products/runway-ai-video-generation.md`
- `content/products/sleek-design.md`
- `content/products/suno-ai-music-generation.md`
- `content/products/v0.md`
- `content/products/windsurf-ai-coding-ide.md`
- `content/products/zed.md`

## 進め方（Sonnetへの指示）
1. 上記の「優先度」順に、各プロダクトの公式情報を確認する
2. 公式に不足がある場合のみ、信頼できる第三者ソースで補完する
3. 各ファイルを更新する（最終更新日 `date` と `> 最終情報更新` を更新）
4. 「参考（出典）」に確認したURLを必ず列挙する

