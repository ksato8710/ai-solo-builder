---
title: "Google Chrome、WebMCPの早期プレビューを開始—AIエージェントがWebサイトを直接操作可能に"
slug: "google-chrome-webmcp-early-preview-2026-02-14"
date: "2026-02-14"
description: "GoogleとMicrosoftが共同開発したWebMCP（Web Model Context Protocol）がChrome 146 Canaryで利用可能に。Webサイトが構造化ツールをAIエージェントに公開でき、従来比67%の計算オーバーヘッド削減を実現。"
publishedAt: "2026-02-14T08:00:00+09:00"
summary: "GoogleとMicrosoftが共同開発したWebMCP（Web Model Context Protocol）がChrome 146 Canaryで利用可能に。Webサイトが構造化ツールをAIエージェントに公開でき、従来比67%の計算オーバーヘッド削減を実現。"
image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop"
contentType: "news"
readTime: 6
featured: false
tags: ["Google", "MCP", "AIエージェント", "Web標準", "Chrome"]
relatedProducts: ["claude"]
---

## 概要

Googleは今週、Web Model Context Protocol（WebMCP）の早期プレビューを公開した。GoogleとMicrosoft のエンジニアが共同開発したこの新しいWeb標準は、Webサイトが構造化されたツールをAIエージェントに直接公開できるようにする。

**出典:** [WinBuzzer](https://winbuzzer.com/2026/02/13/google-chrome-webmcp-early-preview-ai-agents-xcxwbn/) — 2026-02-13

## 詳細

従来、AIエージェントがWebを操作する際は、スクリーンショットベースの手法（ClaudeやGeminiなどで画像を処理）か、DOMベースの手法（HTMLとJavaScriptを直接解析）が主流だった。しかし、これらは数千トークンを消費し、レイテンシも大きいという課題があった。

WebMCPは新しいブラウザAPI `navigator.modelContext` を提供し、2つの方式で動作する：

1. **Declarative API**: HTMLフォームをベースとした宣言的な定義
2. **Imperative API**: JavaScriptによる動的なインタラクション

早期ベンチマークでは、従来の視覚ベースの手法と比較して約67%の計算オーバーヘッド削減を達成している。

WebMCPはW3Cの Web Machine Learning コミュニティグループで標準化が進められており、Chrome 146 Canaryの「Experimental Web Platform Features」フラグで試用可能。

### ポイント

- GoogleとMicrosoftの共同開発によるW3C標準
- `navigator.modelContext` API で構造化ツールを公開
- 従来手法比67%の計算コスト削減
- Chrome 146 Canaryで試用可能

## ソロビルダーへの示唆

WebMCPの登場により、AIエージェント向けのWebアプリ設計が大きく変わる可能性がある。「ページがMCPサーバーになる」というコンセプトは、バックエンドのAPI構築なしにAIエージェントとの連携を可能にする。

早期にWebMCPを試してみたい開発者は、Chrome 146 Canaryをインストールし、`chrome://flags/#enable-experimental-web-platform-features` を有効化することで試用できる。自社サービスのAIエージェント対応を検討している場合、今から仕様を理解しておくことで先行者利益を得られるだろう。

## NVA評価

| 軸 | スコア | 理由 |
|----|--------|------|
| Newsworthiness | 5/5 | 新しいWeb標準の登場 |
| Value | 5/5 | AIエージェント開発に直接関係 |
| Actionability | 4/5 | Chrome Canaryで今すぐ試用可能 |
| Credibility | 4/5 | Google/Microsoft共同開発、W3C標準化 |
| Timeliness | 5/5 | 今週公開 |
| **合計** | **23/25** | **Tier S** |
