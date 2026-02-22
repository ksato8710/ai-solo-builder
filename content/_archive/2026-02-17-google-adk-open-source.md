---
title: "Google ADKオープンソース化 — 社内フレームワークを公開"
slug: "google-adk-open-source-2026-02-17"
date: "2026-02-17"
publishedAt: "2026-02-17T08:00:00+09:00"
description: "GoogleがAgent Development Kit（ADK）をオープンソース化。Agentspace等で実運用されていた本番検証済みフレームワークが誰でも利用可能に。A2Aプロトコルも同時発表。"
summary: "GoogleがAgent Development Kit（ADK）をオープンソース化。Agentspace等で実運用されていた本番検証済みフレームワークが誰でも利用可能に。A2Aプロトコルも同時発表。"
image: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1200&h=630&fit=crop"
contentType: "news"
readTime: 5
featured: false
tags: ["dev-knowledge", "Google", "AIエージェント", "オープンソース"]
relatedProducts: ["google-ai-studio"]
---

## 概要

GoogleはAgent Development Kit（ADK）をオープンソース化した。ADKはGoogle社内で実際に使われているAIエージェント開発フレームワークで、Agentspace、Customer Engagement Suite、その他のエンタープライズ向けAI製品の基盤となっている。

**出典:** [The AI Corner](https://www.the-ai-corner.com/p/google-open-sourced-the-ai-agent) — 2026-02-16

## 詳細

ADKの最大の特徴は「本番環境で先に検証されてから公開された」点だ。LangChain、CrewAI、AutoGenなど多くのエージェントフレームワークが研究プロジェクトやサイドプロジェクトとしてスタートしたのに対し、ADKはGoogleの大規模ワークロードで実運用されてきた。

### ADKの主要機能

- **ソフトウェア開発標準の統合**: バージョン管理、テスト、CI/CDパイプライン
- **デバッグUI**: 各関数呼び出しの検査、ステップごとのレイテンシ追跡、会話のリプレイ
- **ワンコマンドデプロイ**: またはDockerでの完全オフライン実行
- **4言語SDK**: Python、Java、TypeScript、Go

Googleの公式メッセージは「エージェント開発をソフトウェア開発のように感じさせる」というものだ。

### A2Aプロトコル

ADKと同時に発表されたA2A（Agent-to-Agent）プロトコルは、異なるフレームワーク間でエージェント同士が通信するためのオープン規格だ。

- **MCP（Anthropic）**: エージェント ⇔ ツールの連携
- **A2A（Google）**: エージェント ⇔ エージェントの連携

両プロトコルはAgentic AI Foundationで管理されており、Anthropic、OpenAI、Blockが共同設立。Adobe、SAP、Salesforce、Cisco、Twilioなど150社以上が参加している。

### 他フレームワークとの比較

AutoGenコントリビューターのVictor Dibia氏は「ADKのセッション管理、メモリ抽象化、イベントフック、デプロイ機能は非常によく設計されている」と評価。Samsung AIチームメンバーからも「LangChain、CrewAI、AutoGenを試した中でADKが際立っていた」との声がある。

一方で、元Googler Lak Lakshmanan氏はADKのイベント駆動アプローチが「初期TensorFlowの苦労を思い起こさせる」と警告している。

## ソロビルダーへの示唆

マルチエージェントシステムを構築しているなら、ADKは検討に値する選択肢だ。特に：

- 既にGCP/Vertex AIを使っているプロジェクトでは相性が良い
- A2Aプロトコルは今後の業界標準になる可能性が高い
- ただしGoogleエコシステムへの依存度は認識しておくべき

まずは公式ドキュメントとサンプルを触って、自分のユースケースに合うか評価することをお勧めする。

## NVA評価

| 軸 | スコア | 理由 |
|----|--------|------|
| Newsworthiness | 5/5 | Google内部フレームワークの公開は大ニュース |
| Value | 5/5 | エージェント開発者に直接価値 |
| Actionability | 5/5 | 今すぐ試せる |
| Credibility | 5/5 | Google公式 |
| Timeliness | 5/5 | 2/16発表 |
| **合計** | **25/25** | **Tier S** |
