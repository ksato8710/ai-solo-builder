---
title: "Claude Code — AnthropicのAIコーディングエージェント"
slug: "claude-code"
date: "2026-02-25"
contentType: "product"
description: "AnthropicのAIコーディングエージェント。ターミナル、VS Code、デスクトップアプリ、Webブラウザから利用可能。200K+コンテキストウィンドウで大規模リファクタリングに強み。"
readTime: 8
tags: ["ai-coding", "agent", "anthropic"]
websiteUrl: "https://code.claude.com"
pricingSummary: "Pro $20/月, Max 5x $100/月, Max 20x $200/月, API従量課金"
companyName: "Anthropic"
---

# Claude Code

**Claude Code**は、Anthropicが提供するAIコーディングエージェント。ターミナルで動作し、コードベース全体を理解してファイル編集、コマンド実行、テスト実行まで自律的に行う。

## 基本情報

| 項目 | 内容 |
|------|------|
| 開発元 | Anthropic |
| リリース | 2025年 |
| 対応環境 | Terminal, VS Code, Cursor, JetBrains, Desktop App, Web |
| ランレート収益 | $2.5B（2026年2月時点） |
| 最新モデル | Opus 4.6（2026年2月5日リリース） |

## 特徴

### 1. 200K+コンテキストウィンドウ

他のAIコーディングツールと比較して最大級のコンテキストウィンドウを持つ。大規模なコードベースでも全体を把握した上で作業できる。

### 2. エージェントファーストの設計

エディタ拡張ではなく、**AIエージェントとして設計**されている。タスクを与えると：
- ファイルを読み込み
- コマンドを実行
- マルチファイルを編集
- テストを実行
- 失敗を自動修正

### 3. マルチ環境対応

- **Terminal CLI**: フル機能のコマンドラインツール
- **VS Code / Cursor**: インライン差分、@メンション、計画レビュー
- **JetBrains**: IntelliJ、PyCharm、WebStorm対応
- **Desktop App**: 複数セッション並列実行
- **Web**: ブラウザからローカル環境不要で利用

## ベンチマーク

| ベンチマーク | スコア | 備考 |
|-------------|--------|------|
| SWE-bench Verified | 80.9% | Opus 4.5時点、トップスコア |

## 料金体系（2026年2月時点）

| プラン | 月額 | 特徴 |
|--------|------|------|
| **Pro** | $20 | Claude Code基本利用可能 |
| **Max 5x** | $100 | Proの5倍の利用量 |
| **Max 20x** | $200 | Proの20倍の利用量、最優先アクセス |
| **API** | 従量課金 | Anthropic Console経由 |

全プランでOpus 4.5/4.6、Sonnet 4.5が利用可能。

## インストール

### macOS / Linux / WSL

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

### Windows PowerShell

```powershell
irm https://claude.ai/install.ps1 | iex
```

### Homebrew

```bash
brew install --cask claude-code
```

## 使い方

```bash
cd your-project
claude
```

初回起動時にログインが求められる。

## ユースケース

### 向いている作業

- **大規模リファクタリング**: 数十ファイルにまたがる変更
- **新機能実装**: 要件を伝えてエンドツーエンドで開発
- **バグ修正**: エラーログを渡して自動調査・修正
- **テスト作成**: 既存コードに対するテスト自動生成
- **ドキュメント生成**: コードベースからREADME、API仕様を生成

### 向いていない作業

- **リアルタイム補完**: オートコンプリート機能なし（Cursor/Copilot向き）
- **1行の軽微な修正**: オーバーキル

## 他ツールとの比較

| 特性 | Claude Code | Cursor | GitHub Copilot |
|------|-------------|--------|----------------|
| タイプ | エージェント | エディタ | エディタ拡張 |
| オートコンプリート | なし | ★★★★★ | ★★★★☆ |
| マルチファイル編集 | ★★★★★ | ★★★★☆ | ★★★☆☆ |
| コンテキスト | 200K+ | ~120K | モデル依存 |
| 大規模タスク | ★★★★★ | ★★★☆☆ | ★★☆☆☆ |

## 80/15/5ルール

多くのシニア開発者が実践する使い分け：

- **80%**: Cursor（日常のコーディング、オートコンプリート）
- **15%**: Claude Code（大規模タスク、アーキテクチャ変更）
- **5%**: GitHub Copilot（レビュー、軽量タスク）

## 関連リンク

- [公式ドキュメント](https://code.claude.com/docs)
- [Anthropic](https://anthropic.com)
- [料金ページ](https://claude.com/pricing)

---

*最終更新: 2026-02-25*
