---
title: "Slack公式MCPサーバーとReal-time Search API発表"
slug: "slack-mcp-server-rts-api"
date: "2026-02-19"
description: "SlackがModel Context Protocol (MCP) サーバーとReal-time Search APIを同時発表。AIエージェントがワークスペースデータに直接アクセスする新時代へ。"
publishedAt: "2026-02-19T08:00:00+09:00"
summary: "SlackがModel Context Protocol (MCP) サーバーとReal-time Search APIを同時発表。AIエージェントがワークスペースデータに直接アクセスする新時代へ。"
image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=420&fit=crop"
contentType: "news"
readTime: 5
featured: false
tags: ["dev-knowledge", "MCP", "Slack", "AIエージェント"]
relatedProducts: ["claude", "claude-code"]
---

## 概要

Slackが、AIエージェントとの連携を強化する2つの重要な機能を同時発表した。Model Context Protocol (MCP) サーバーと、Real-time Search (RTS) APIだ。

**出典:** [Slack Developer Docs](https://docs.slack.dev/changelog/2026/02/17/slack-mcp/) — 2026-02-17

## 詳細

### Slack MCPサーバー

MCPサーバーは、AIエージェントがSlackコンテンツを「発見・設定・実行」するためのツール群を提供する。従来のAPIとの違いは、**LLMが直接消費することを前提に設計されている点**だ。

- 各ツールに詳細な説明とサンプルが付属
- レスポンスは自然言語形式
- Claude Desktop等のMCP対応クライアントから即座に利用可能

### Real-time Search API

以前は「Data Access API」と呼ばれていた機能が、Real-time Search APIとして進化。サードパーティアプリがSlackデータを安全に検索できるようになった。

**重要な変更:** `assistant.search.context` APIメソッドのスコープが細分化された。

| スコープ | 対象 |
|----------|------|
| `search:read.public` | パブリックチャンネル（必須） |
| `search:read.private` | プライベートチャンネル（ユーザー同意） |
| `search:read.im` | DM（ユーザー同意） |
| `search:read.mpim` | グループDM（ユーザー同意） |

### ポイント

- **標準化された接続:** 独自実装なしでSlackにアクセス可能に
- **セキュリティ強化:** 細分化されたスコープでデータアクセスを制御
- **即座に利用可能:** MCP対応クライアントがあれば今日から使える

## ソロビルダーへの示唆

これまで「AIにSlackの過去のやり取りを理解させる」には、独自のスクレイピングやAPI実装が必要だった。公式MCPサーバーの登場で、その労力が大幅に削減される。

特に注目すべきは、**スコープの細分化**だ。「パブリックチャンネルだけ」「DMは含めない」といった細かな制御ができるため、プライバシーを考慮したエージェント開発がしやすくなった。

OpenClawやClaude Desktopを使っているソロビルダーなら、今日からSlackコンテキストを持つエージェントを構築できる。

## スコア内訳

| 軸 | スコア | 理由 |
|----|--------|------|
| Newsworthiness | 5/5 | Slack公式によるMCP対応は業界初 |
| Value | 5/5 | ソロビルダーのエージェント開発に直接影響 |
| Actionability | 5/5 | MCP対応クライアントがあれば即座に実装可能 |
| Credibility | 5/5 | Slack公式ドキュメントが一次ソース |
| Timeliness | 5/5 | 発表翌日の報道 |
| **合計** | **25/25** | |
