---
title: "Agoda APIAgent オープンソース公開 — ゼロコードで既存APIをMCPサーバーに変換"
slug: "agoda-apiagent-mcp-server-2026-02-18"
date: "2026-02-18"
description: "旅行大手AgodaがAPIAgentをオープンソース公開。REST/GraphQL APIをMCPサーバーに変換し、AIエージェントとの連携をゼロコードで実現"
publishedAt: "2026-02-18T08:00:00+09:00"
summary: "旅行大手AgodaがAPIAgentをオープンソース公開。REST/GraphQL APIをMCPサーバーに変換し、AIエージェントとの連携をゼロコードで実現"
image: "https://images.unsplash.com/photo-1558403194-611308249627?w=1200&h=630&fit=crop"
contentType: "news"
readTime: 5
featured: false
tags: ["dev-knowledge", "MCP", "API", "オープンソース"]
relatedProducts: ["claude", "cursor", "claude-code"]
---

## 概要

旅行大手Agodaが**APIAgent**をオープンソースで公開した。REST/GraphQL APIをModel Context Protocol（MCP）サーバーに変換するツールで、コードを1行も書かずにAIエージェントと既存APIを接続できる。

**出典:** [MarkTechPost](https://www.marktechpost.com/2026/02/16/agoda-open-sources-apiagent-to-convert-any-rest-pr-graphql-api-into-an-mcp-server-with-zero-code/) — 2026-02-16

## 詳細

### 「Integration Tax」の解消

MCPはAnthropicが策定したLLMと外部ツールの標準接続プロトコル。しかし現状、MCPサーバーの構築には以下の作業が必要だった：

1. Python/TypeScriptでMCPサーバーを新規実装
2. 全ツールとパラメータを手動定義
3. サーバーのデプロイ・運用
4. APIが変更されるたびにコード更新

Agodaチームはこれを「integration tax」と呼び、社内に1,000以上のAPIがある企業にとって非現実的だと指摘する。

### APIAgent — ユニバーサルMCPサーバー

APIAgentは既存APIの**プロキシ**として動作する。LLM（Claude、GPT-4など）と既存APIの間に配置し、MCPプロトコルを自動的に仲介する。

技術スタック：
- **FastMCP**: MCPサーバーレイヤー
- **OpenAI Agents SDK**: LLMオーケストレーション
- **DuckDB**: SQL後処理エンジン

### Dynamic Tool Discovery

APIAgentの核心機能。OpenAPI仕様またはGraphQLスキーマを指定すると、**エンドポイントとフィールドを自動解析**してLLM向けのツールを生成する。手動マッピング不要。

### DuckDB — SQL後処理

APIが10,000行のソートされていないデータを返した場合、APIAgentはDuckDBを使って**ローカルでフィルタリング・集計・ソート**を実行。簡潔な結果だけをLLMに返す。

例：「バンコクのレビュー数トップ10ホテルを表示」
1. APIから全ホテルデータ取得
2. DuckDBで `ORDER BY reviews DESC LIMIT 10`
3. 結果をLLMにフォーマットして返却

### Recipe Learning

成功した自然言語クエリの実行トレースを「レシピ」として保存。次回以降、類似の質問にはレシピを直接使用し、**LLM推論をスキップ**。レイテンシ・コスト大幅削減。

### セキュリティ

デフォルトは**読み取り専用**。データ変更を伴う操作は明示的な許可が必要。

## ソロビルダーへの示唆

MCPエコシステムに参加するハードルが劇的に下がった。ソロビルダーにとっての活用ポイント：

1. **既存APIの即時MCP化** — 自作のREST APIを数分でAIエージェント対応に
2. **SaaSのAPI連携** — OpenAPI仕様があればどのサービスも接続可能
3. **コスト最適化** — Recipe LearningでLLM呼び出しを削減

特に、すでに複数のマイクロサービスを持つソロビルダーにとって、APIAgentは「integration tax」からの解放だ。

## スコア内訳

| 軸 | スコア | 理由 |
|----|--------|------|
| Newsworthiness | 4/5 | 旅行大手のOSS公開、MCPエコシステムへの貢献 |
| Value | 5/5 | MCP導入の最大障壁「実装コスト」を解消 |
| Actionability | 5/5 | 今日からOpenAPI仕様で試せる |
| Credibility | 4/5 | Agoda公式、技術詳細が明確 |
| Timeliness | 4/5 | 2日前発表、MCPトレンドの中で注目度高 |
| **合計** | **22/25** | |
