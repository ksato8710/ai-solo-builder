---
title: "Cursor 2.5 プラグインマーケットプレイス公開 — 開発ワークフローをエディタ内で一元化"
slug: "cursor-2-5-marketplace-2026-02-21"
date: "2026-02-21"
description: "Cursor 2.5がプラグインマーケットプレイスを導入。Figma、Stripe、AWS、Vercelなど10社との連携で、デザインからデプロイまでエディタ内で完結可能に。"
publishedAt: "2026-02-21T08:00:00+09:00"
summary: "Cursor 2.5がプラグインマーケットプレイスを導入。Figma、Stripe、AWS、Vercelなど10社のローンチパートナーと連携し、開発ライフサイクル全体をカバー。"
image: "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?w=800&h=420&fit=crop"
contentType: "news"
readTime: 5
featured: false
tags: ["product-update", "Cursor", "IDE", "プラグイン", "MCP"]
relatedProducts: ["cursor", "claude-code"]
---

## 概要

Cursor 2.5が2月17日にリリースされ、公式プラグインマーケットプレイスが導入されました。これにより、Figmaデザイン、Stripe決済、AWSインフラ、Vercelデプロイなどを、ツール切り替えなしにエディタ内で直接操作できるようになります。

**出典:** [Cursor Blog](https://cursor.com/blog/marketplace) — 2026-02-17

## 詳細

### マーケットプレイスとは

Cursor Marketplaceは、AIエージェントの能力を拡張するプラグインの配布プラットフォームです。各プラグインは以下の5つの要素を組み合わせたバンドルとして提供されます:

| 要素 | 説明 |
|------|------|
| **MCP Servers** | Model Context Protocolで外部ツール・データソースと接続 |
| **Skills** | エージェントが自動で発見・実行できるドメイン特化プロンプト |
| **Subagents** | 並列タスク実行を可能にする専門エージェント |
| **Hooks** | エージェント動作の監視・制御ポイント |
| **Rules** | コーディング標準・プリファレンスを強制するシステム指示 |

### ローンチパートナー10社

初期リリースでは、開発ライフサイクル全体をカバーする10社が参加:

| カテゴリ | パートナー |
|----------|-----------|
| デザイン | Figma |
| 決済 | Stripe |
| インフラ | AWS, Cloudflare |
| デプロイ | Vercel |
| データ | Databricks, Snowflake, Hex |
| プロダクト管理 | Linear |
| 分析 | Amplitude |

### 使い方

プラグインの導入は極めてシンプル:

```
# エディタ内コマンド
/add-plugin figma

# または cursor.com/marketplace からブラウズ
```

一度インストールすると、CursorのAIエージェントが自動的にプラグインの機能を認識し、適切なタイミングで活用します。

### 非同期サブエージェントの強化

Cursor 2.5では、サブエージェントのレイテンシが低減され、さらに:

- サブ・サブエージェントの生成が可能に
- 並列実行によるマルチファイル操作
- 大規模リファクタリングの効率化
- 複雑なバグ修正の自動化

## ソロビルダーへの示唆

Cursor 2.5のマーケットプレイスは、ソロ開発者のワークフローを根本的に変える可能性があります:

1. **コンテキストスイッチの削減**: Figmaでデザイン確認→Cursorで実装→Vercelでデプロイが、すべてエディタ内で完結
2. **ツール統合の簡略化**: MCP、スキル、サブエージェントを個別設定する必要がなく、ワンクリックでバンドル導入
3. **並列作業の効率化**: サブエージェントが複数ファイルを同時に処理し、大規模変更も短時間で完了
4. **拡張性**: 今後サードパーティプラグインも増加予定

特に、デザインから実装、テスト、デプロイまでを一人で担うソロビルダーにとって、ツール間の移動時間削減は大きなメリットです。

## スコア内訳

| 軸 | スコア | 理由 |
|----|--------|------|
| Newsworthiness | 5/5 | 新アーキテクチャ、エコシステム構築の転換点 |
| Value | 5/5 | ワークフロー一元化で開発効率が大幅向上 |
| Actionability | 5/5 | 今すぐ `/add-plugin` で導入可能 |
| Credibility | 5/5 | Cursor公式、大手10社パートナー参加 |
| Timeliness | 4/5 | 2月17日発表（4日前） |
| **合計** | **24/25** | |

## 関連リンク

- [Cursor Marketplace](https://cursor.com/marketplace) - プラグイン一覧
- [Cursor 2.5 Release Notes](https://cursor.com/blog/marketplace) - 公式発表
