---
title: "Claude 4.6 Sonnet リリース — Adaptive Thinking搭載で「考える」AIへ"
slug: "claude-4-6-sonnet-adaptive-thinking-2026-02-18"
date: "2026-02-18"
description: "AnthropicがClaude 4.6 Sonnetをリリース。Adaptive Thinkingエンジンでタスク複雑度に応じた推論、SWE-bench 79.6%達成、1Mトークンコンテキスト対応"
publishedAt: "2026-02-18T08:00:00+09:00"
summary: "AnthropicがClaude 4.6 Sonnetをリリース。Adaptive Thinkingエンジンでタスク複雑度に応じた推論、SWE-bench 79.6%達成、1Mトークンコンテキスト対応"
image: "https://images.unsplash.com/photo-1679083216051-aa510a1a2c0e?w=1200&h=630&fit=crop"
contentType: "news"
readTime: 5
featured: false
tags: ["dev-knowledge", "Claude", "Anthropic", "コーディングAI"]
relatedProducts: ["claude", "claude-code", "cursor"]
---

## 概要

AnthropicがClaude 4.6 Sonnetを発表した。最大の進化は**Adaptive Thinkingエンジン**の搭載。タスクの複雑さに応じて推論の深さを動的に調整し、コーディングベンチマークで大幅なスコア向上を達成している。

**出典:** [Anthropic News](https://www.anthropic.com/news/claude-sonnet-4-6) — 2026-02-17

## 詳細

### Adaptive Thinking — 「考える」から「考え方を選ぶ」へ

従来のextended thinkingモードは単純なON/OFFだった。Claude 4.6 Sonnetでは新しい`effort`パラメータにより、モデルが**タスクの複雑さを判断して思考深度を調整**する。

- **低effort**: シンプルな質問→高速レスポンス
- **高effort**: 複雑なバグ修正→内部独白で論理パスをテスト

これにより、レースコンディションのようなバグでも「推測でコードを出す」のではなく、**思考段階で根本原因を特定**してから修正コードを生成する。

### ベンチマーク — Opusに迫る性能

| カテゴリ | 3.5 Sonnet | 4.6 Sonnet | 改善ポイント |
|----------|------------|------------|--------------|
| SWE-bench Verified | 49.0% | **79.6%** | 複雑なバグ修正・マルチファイル編集 |
| OSWorld（Computer Use） | 14.9% | **72.5%** | 自律UI操作・ツール使用 |
| MATH | 71.1% | **88.0%** | アルゴリズム論理の強化 |
| BrowseComp（Search） | 33.3% | **46.6%** | Python実行による動的フィルタリング |

特に注目すべきは**OSWorld 72.5%**。スプレッドシート操作、Webブラウジング、ローカルファイル操作を人間並みの精度で実行できることを示している。

### 1Mトークンコンテキスト（ベータ）

リポジトリ全体、または大規模な技術ドキュメントを一括でプロンプトに投入可能。コヒーレンスを失わずに長文脈を処理できる。

### 価格 — 据え置き

- **入力:** $3 / 1Mトークン
- **出力:** $15 / 1Mトークン
- **プラットフォーム:** Anthropic API、Amazon Bedrock、Google Vertex AI

## ソロビルダーへの示唆

Claude 4.6 Sonnetは「コーディングエージェントの実用性」を一段引き上げた。特に以下のユースケースで威力を発揮する：

1. **大規模リファクタリング** — 1Mトークンコンテキストでリポジトリ全体を把握
2. **複雑なバグ修正** — Adaptive Thinkingで根本原因を特定
3. **Computer Useエージェント** — OSWorld 72.5%でUI自動化が現実的に

extended thinking APIの`effort`パラメータを試して、自分のワークフローでどこまで自動化できるか検証してみるのがオススメだ。

## スコア内訳

| 軸 | スコア | 理由 |
|----|--------|------|
| Newsworthiness | 5/5 | Anthropicのフラグシップモデル更新、業界最高水準のベンチマーク |
| Value | 5/5 | コーディング・エージェント開発に直結する機能強化 |
| Actionability | 5/5 | 即座にAPI経由で利用可能、価格据え置き |
| Credibility | 5/5 | 公式発表、詳細なベンチマークデータあり |
| Timeliness | 5/5 | 昨日発表のホットなニュース |
| **合計** | **25/25** | |
