---
title: "GitHub Copilot SDK + Foundry Local — 完全ローカルでAIコーディング"
slug: "github-copilot-sdk-foundry-local-2026-02-17"
date: "2026-02-17"
publishedAt: "2026-02-17T08:00:00+09:00"
description: "MicrosoftがGitHub Copilot SDKとFoundry Localを組み合わせた完全ローカル動作のAIコーディングエージェントを公開。機密プロジェクトでもAI支援開発が可能に。"
summary: "MicrosoftがGitHub Copilot SDKとFoundry Localを組み合わせた完全ローカル動作のAIコーディングエージェントを公開。機密プロジェクトでもAI支援開発が可能に。"
image: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&h=630&fit=crop"
contentType: "news"
readTime: 5
featured: false
tags: ["dev-knowledge", "GitHub", "Copilot", "ローカルAI", "セキュリティ"]
relatedProducts: ["github-copilot"]
---

## 概要

MicrosoftはGitHub Copilot SDKとFoundry Localを統合した「Local Repo Patch Agent」のサンプルコードを公開した。これにより、ソースコードを一切外部に送信せずに、AIコーディングエージェントを完全にローカル環境で動作させることが可能になった。

**出典:** [Microsoft Tech Community](https://techcommunity.microsoft.com/blog/educatordeveloperblog/agentic-code-fixing-with-github-copilot-sdk-and-foundry-local/4493967) — 2026-02-16

## 詳細

クラウドベースのAIコーディングツールは便利だが、ソースコードを外部サービスに送信するという制約がある。これは以下のような環境では許容されない：

- **金融サービス**: 規制によりソースコードの外部送信が禁止
- **医療・ヘルスケア**: 患者データを扱うシステムのコード
- **政府・軍事**: 機密扱いのプロジェクト
- **エアギャップ環境**: インターネット接続が完全に遮断された環境

### Local Repo Patch Agentの機能

このエージェントは以下を**すべてオフラインで**実行する：

1. **リポジトリスキャン**: プロジェクト全体を解析
2. **バグ検出**: コードスメルや潜在的なバグを特定
3. **自動修正**: 問題のあるコードを修正
4. **テスト検証**: 修正がテストスイートを通過するか確認
5. **PRサマリー生成**: 変更内容の包括的なサマリーを作成

### 技術スタック

- **GitHub Copilot SDK**: エージェントオーケストレーション
- **Foundry Local**: オンデバイス推論（LLMのローカル実行）
- **ホスト環境**: 完全にローカルマシン上で動作

### ローカルAIの利点

クラウドAPIに依存しないことで得られるメリット：

- **セキュリティ**: コードが外部に漏洩するリスクがゼロ
- **レイテンシ**: ネットワーク往復時間なしで即座にレスポンス
- **コスト**: APIトークン課金なしで無制限に利用可能
- **可用性**: インターネット接続に依存しない

## ソロビルダーへの示唆

機密性の高いプロジェクト（クライアントのコード、NDA対象の開発など）を扱うことが多いソロビルダーには朗報だ。

**試す価値があるケース:**
- 顧客のプロプライエタリコードを扱う受託開発
- 特許出願前の新技術開発
- 金融・医療系のサイドプロジェクト

**検討事項:**
- Foundry LocalはMシリーズMacやNVIDIA GPU搭載マシンで最も性能を発揮
- モデルサイズによってはメモリ要件が高い
- クラウド版Copilotと比較して一部機能が制限される可能性

GitHubリポジトリ（[microsoft/copilotsdk_foundrylocal](https://github.com/leestott/copilotsdk_foundrylocal)）からサンプルコードをクローンして、自分の環境で試してみることをお勧めする。

## NVA評価

| 軸 | スコア | 理由 |
|----|--------|------|
| Newsworthiness | 5/5 | ローカル完結AIコーディングは新しい領域 |
| Value | 5/5 | セキュリティ重視の開発者に高い価値 |
| Actionability | 5/5 | サンプルコードで今すぐ試せる |
| Credibility | 5/5 | Microsoft公式 |
| Timeliness | 5/5 | 2/16発表 |
| **合計** | **25/25** | **Tier S** |
