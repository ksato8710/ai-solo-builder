---
title: "Alibaba Qwen3.5発表 — 512エキスパートMoE、Apache 2.0ライセンス"
slug: "alibaba-qwen-3-5-release"
date: "2026-02-19"
description: "Alibabaが新フラッグシップQwen3.5を発表。397Bパラメータ/17B活性化のMoE設計、Apache 2.0ライセンスでOpenClaw対応を明示。"
publishedAt: "2026-02-19T08:00:00+09:00"
summary: "Alibabaが新フラッグシップQwen3.5を発表。397Bパラメータ/17B活性化のMoE設計、Apache 2.0ライセンスでOpenClaw対応を明示。"
image: "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=800&h=420&fit=crop"
contentType: "news"
readTime: 6
featured: false
tags: ["dev-knowledge", "Qwen", "オープンソース", "AIモデル"]
relatedProducts: ["chatgpt", "claude"]
---

## 概要

Alibabaが新フラッグシップAIモデル「Qwen3.5」を発表した。397Bのパラメータを持ちながら、1トークンあたり17Bのみを活性化する超効率MoE（Mixture of Experts）設計。Apache 2.0ライセンスで完全商用利用可能、OpenClaw対応も明示している。

**出典:** [VentureBeat](https://venturebeat.com/technology/alibabas-qwen-3-5-397b-a17-beats-its-larger-trillion-parameter-model-at-a) — 2026-02-17

## 詳細

### アーキテクチャの革新

Qwen3.5は前世代から大幅にスケールアップ：

| 項目 | Qwen3 | Qwen3.5 |
|------|-------|---------|
| エキスパート数 | 128 | 512 |
| コンテキスト長 | - | 256K（オープンソース）/ 1M（Plus版） |
| 言語数 | 119 | 201 |
| 語彙サイズ | 150K | 250K |

**推論速度:** Qwen3-Maxと比較して、256Kコンテキストで19倍高速。コストは60%削減、同時ワークロード処理能力は8倍に向上。

### ネイティブマルチモーダル

従来の「言語モデル+視覚エンコーダー」方式ではなく、**最初からテキスト・画像・動画を同時に学習**。ベンチマーク結果：

- MathVista: 90.3
- MMMU: 85.0
- Claude Opus 4.5をマルチモーダルタスクで上回る

### OpenClaw/Agentic対応

AlibabaはQwen3.5を「エージェント向けモデル」として明確に位置づけ：

- **Qwen Code:** Claude Codeに相当するCLIツールをオープンソース公開
- **OpenClaw互換:** 記事内で明示的にOpenClawとの連携を言及
- **15,000以上のRL環境:** 強化学習でエージェント性能を強化

### Apache 2.0ライセンス

商用利用・改変・再配布すべて自由。ロイヤリティなし。制約のある他のオープンモデルとは一線を画す。

### ハードウェア要件

- 量子化版: 約256GB RAM
- 推奨: 512GB以上（余裕を持った運用）
- GPUノードでの運用が現実的

## ソロビルダーへの示唆

「APIに依存しない」選択肢として、Qwen3.5は非常に魅力的だ。Apache 2.0ライセンスなので、法務確認も最小限で済む。

特にOpenClaw/Claude Code的なワークフローを自前で構築したいソロビルダーにとって、Qwen Codeのオープンソース公開は大きい。「自分のマシンで動くClaude Code相当」が手に入る。

ただし、フル性能を引き出すには相応のハードウェアが必要。クラウドGPUインスタンスか、オンプレでのGPUサーバー構築が前提となる。

多言語対応の改善（201言語、非ラテン文字の効率15-40%向上）は、日本語でのユースケースにもプラスに働くはずだ。

## スコア内訳

| 軸 | スコア | 理由 |
|----|--------|------|
| Newsworthiness | 5/5 | 主要オープンソースモデルの新バージョン |
| Value | 5/5 | API契約なしで高性能モデルを利用可能 |
| Actionability | 4/5 | ハードウェア要件あり、すぐには試せない |
| Credibility | 5/5 | VentureBeat報道、公式発表あり |
| Timeliness | 5/5 | 発表直後 |
| **合計** | **24/25** | |
