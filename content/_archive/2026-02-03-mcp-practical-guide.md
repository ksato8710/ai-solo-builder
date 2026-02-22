---
title: "MCP（Model Context Protocol）実践ガイド — AIソロビルダーのための環境構築からユースケースまで"
slug: "mcp-practical-guide"
date: "2026-02-03"
contentType: "news"
description: "MCPの導入手順から主要サーバー、Claude連携まで実践解説。"
readTime: "15"
tags:
  - "dev-knowledge"
relatedProducts:
  - "claude-code"
featured: "true"
image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=420&fit=crop"
---

## MCP（Model Context Protocol）とは何か

**MCP（Model Context Protocol）** は、Anthropicが **2024年11月** にオープンソースとして公開した、AIアプリケーションと外部システムを接続するための標準プロトコルだ。公式サイトでは「AIのUSB-C」と表現されている — USB-Cがあらゆるデバイスを標準的に接続するように、MCPはあらゆるAIモデルとツールを標準的に接続する。

## 🏷️ 関連プロダクト

- [Claude Code](/products/claude-code)
- [Cursor](/products/cursor)
- [GitHub Copilot](/products/github-copilot)

### なぜMCPが必要なのか

MCP登場以前、AIモデルを外部ツールやデータソースに接続するには、モデルとツールの組み合わせごとにカスタム連携を構築する必要があった。10個のAIアプリと100個のツールがあれば、最大1,000通りの個別統合が必要になる「N×M問題」だ。

MCPはこの問題をシンプルに解決する。各AIアプリはMCPクライアントプロトコルを1度実装し、各ツールはMCPサーバープロトコルを1度実装すれば、すべてが相互接続できる。

### 定量データで見るMCPの現在地

MCPはわずか1年強で、AI業界の事実上の標準となった。以下に主要な定量指標をまとめる。

| 指標 | 数値 | 備考 |
|------|------|------|
| 公開時期 | 2024年11月 | Anthropicがオープンソースとして公開 |
| GitHub Stars（serversリポジトリ） | **約76,000** | 2025年12月時点 |
| 公開MCPサーバー数 | **10,000以上**（レジストリ登録ベース） | MCP Registry上の公開サーバー |
| MCPクライアント数 | **300以上** | 2025年12月時点 |
| 月間SDKダウンロード数 | **約9,700万回**（Python + TypeScript） | 2025年12月時点 |
| 対応SDK言語 | **11言語** | Python, TypeScript, Java, Kotlin, C#, Go, PHP, Ruby, Rust, Swift, Perl |
| 採用企業 | Anthropic, OpenAI, Google, Microsoft, AWS, Block, Bloomberg等 | 大手AI/クラウド企業が網羅的に参加 |
| ガバナンス | Linux Foundation（Agentic AI Foundation） | 2025年12月にAnthropicが寄贈 |

**出典:** [MCP公式サイト](https://modelcontextprotocol.io)、[GitHub modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)、[Enterprise Adoption Guide（guptadeepak.com）](https://guptadeepak.com/the-complete-guide-to-model-context-protocol-mcp-enterprise-adoption-market-trends-and-implementation-strategies/)

---

## MCPのアーキテクチャ — 3つの基本概念

MCPは **Language Server Protocol（LSP）** にインスパイアされたクライアント・サーバーアーキテクチャで、通信にはJSON-RPC 2.0を使用する。

### コンポーネント構成

| コンポーネント | 役割 | 例 |
|---|---|---|
| **MCPホスト** | AIアプリケーションの実行環境 | Claude Desktop, VS Code, Cursor |
| **MCPクライアント** | サーバーとの1:1接続を維持 | ホストアプリに内蔵 |
| **MCPサーバー** | ツール・リソース・プロンプトを提供 | GitHub MCP, Postgres MCP, Filesystem MCP |
| **トランスポート** | 通信レイヤー | stdio（ローカル）、HTTP+SSE（リモート） |

### MCPサーバーが提供する3つのプリミティブ

1. **Tools（ツール）** — AIが呼び出せる関数。例：`create_issue`、`send_message`、`query_database`
2. **Resources（リソース）** — AIが読み取れるデータ。例：ファイル、DBレコード、APIレスポンス
3. **Prompts（プロンプト）** — 定型操作のためのテンプレート。例：コードレビュー用プロンプト

ソロビルダーにとって重要なのは、**stdioトランスポート**だ。ローカルマシン上でMCPサーバーを起動し、Claude DesktopやClaude Codeから直接接続できる。リモートサーバーを立てる必要はない。

---

## 環境構築：Claude Desktop × MCPサーバー

### ステップ1：Claude Desktopのインストール

[Claude Desktop](https://claude.ai/download) をダウンロードしてインストールする。すべてのClaude.aiプランでMCPサーバー接続がサポートされている。

### ステップ2：設定ファイルの編集

Claude Desktopの設定ファイル（macOSの場合 `~/Library/Application Support/Claude/claude_desktop_config.json`）を編集する。

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/yourname/projects"
      ]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

### ステップ3：MCPサーバーのインストール

Node.js（v18以上）がインストール済みであれば、上記の設定だけでClaude Desktop起動時に自動的にMCPサーバーが起動する。`npx`が必要なパッケージをダウンロード・実行する。

Python製サーバーの場合は `uvx` を使う:

```json
{
  "mcpServers": {
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "/path/to/repo"]
    }
  }
}
```

Claude Desktopを再起動すると、チャット画面にMCPツールのアイコンが表示される。これでAIがローカルファイルの読み書きやGit操作を行える状態だ。

---

## Claude Code × MCP：ターミナルからのAI開発

**Claude Code** はAnthropicのCLIベースのAIコーディングツールで、MCPとのネイティブ統合を持つ。

### Claude CodeでのMCP設定

```bash
# Claude Codeのインストール
npm install -g @anthropic-ai/claude-code

# MCPサーバーの追加（プロジェクトスコープ）
claude mcp add filesystem npx -y @modelcontextprotocol/server-filesystem /path/to/dir

# グローバルスコープで追加
claude mcp add --scope global memory npx -y @modelcontextprotocol/server-memory
```

Claude Codeでは `.mcp.json` ファイルをプロジェクトルートに配置することで、チーム共有の設定も可能だ。

### ソロビルダーにとってのClaude Code + MCPの強み

1. **コンテキスト維持** — MCPのMemoryサーバーで、セッション間の知識を永続化
2. **ファイル操作** — Filesystemサーバーで、プロジェクト全体のファイルを安全に読み書き
3. **Git連携** — Gitサーバーで、コミット履歴の参照やブランチ操作をAIに委任
4. **DB接続** — PostgreSQL/SQLiteサーバーで、スキーマ確認やクエリ実行をAIが直接実行

---

## ソロビルダー向け実践ユースケース5選

### ユースケース1：ローカルDBスキーマの自動分析

PostgreSQL MCPサーバーを接続すれば、Claudeが直接DBに読み取りアクセスできる。

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://localhost:5432/myapp"
      ]
    }
  }
}
```

Claudeに「このDBのスキーマを分析して、正規化の改善点を提案して」と依頼するだけで、テーブル構造を読み取り、具体的な改善案を返してくれる。ソロ開発者にとって、DBAの代わりをAIが務めてくれるようなものだ。

### ユースケース2：プロジェクトファイルの横断検索・リファクタリング

Filesystemサーバーで複数ディレクトリへのアクセスを設定し、Claude Codeに「src/ 配下の全コンポーネントで未使用のimportを削除して」と依頼すれば、自動的にファイルを走査・修正する。

### ユースケース3：ナレッジベースの構築

Memoryサーバーを使えば、セッション間で「このプロジェクトのアーキテクチャ判断」「過去に発生したバグと対処法」などをナレッジグラフとして蓄積できる。ソロ開発者の「第二の脳」として機能する。

### ユースケース4：GitHub Issueの自動管理

GitHub MCPサーバーを接続し、「未アサインのIssueを優先度順に整理して、それぞれの対応方針をコメントして」と指示すれば、AIがIssue管理を半自動化する。

### ユースケース5：Webスクレイピング＋データ分析

Fetch MCPサーバー（Webコンテンツ取得）とPostgreSQL MCPサーバーを組み合わせれば、「競合サイトの価格情報を取得してDBに保存する」といったパイプラインをAIとの対話だけで構築できる。

---

## MCPのセキュリティ上の注意点

MCPは強力だが、セキュリティ面で注意すべき点がある。2025年4月にセキュリティ研究者がMCPの脆弱性分析を公開しており、以下の点が指摘されている：

1. **プロンプトインジェクション** — 悪意あるデータソースがAIの行動を操作するリスク
2. **ツール権限の過剰付与** — 複数ツールの組み合わせによるデータ流出リスク
3. **なりすましツール** — 信頼されたツールを偽物に置き換えるリスク

### ソロビルダーが取るべき対策

- **最小権限の原則**: 必要なMCPサーバーだけを有効にする
- **読み取り専用アクセス**: 特にDB接続は読み取り専用から始める
- **信頼できるサーバーのみ使用**: MCP公式リファレンスサーバーやMCP Registryで検証済みのものを優先
- **OAuth 2.1認証**: リモートMCPサーバーを使う場合は、2025年6月の認証仕様に準拠したサーバーを選ぶ

---

## MCPエコシステムの主要プレイヤー

MCPは単なるAnthropicのプロジェクトではなく、業界全体の標準になっている。

| 企業/プラットフォーム | MCP対応状況 | 開始時期 |
|---|---|---|
| **Anthropic** | Claude Desktop, Claude Code でネイティブ対応 | 2024年11月 |
| **OpenAI** | ChatGPT Desktop, Agents SDK, Responses API | 2025年3月 |
| **Google** | Gemini, Google AI Studio, Vertex AI | 2025年4月 |
| **Microsoft** | VS Code, GitHub Copilot Agent Mode, Azure OpenAI | 2025年5月 |
| **AWS** | Lambda, ECS等のMCPサーバー提供 | 2025年 |
| **Cloudflare** | MCPサーバーホスティング基盤 | 2025年7月 |
| **Cursor** | AIコードエディタでMCPネイティブ対応 | 2025年 |

2025年12月には、AnthropicがMCPをLinux Foundation傘下の **Agentic AI Foundation（AAIF）** に寄贈。Anthropic、Block、OpenAIが共同創設し、AWS、Google、Microsoftなどがプラチナメンバーとして参加している。これによりMCPはベンダー中立のオープン標準としての地位を確立した。

---

## ソロビルダーが今すぐ始めるべきこと

MCPはソロビルダーにとって「一人で十人分の仕事をする」ための最重要インフラだ。以下の3ステップで今すぐ始められる。

### Step 1: 最小構成で試す

Claude DesktopにFilesystemサーバーとMemoryサーバーだけを設定し、日常のコーディング作業に組み込む。

### Step 2: DB連携を追加

PostgreSQLまたはSQLiteのMCPサーバーを追加し、AIにスキーマ分析やクエリ生成を任せる。

### Step 3: Claude Codeに移行

CLIベースの開発フローに移行し、`.mcp.json`でプロジェクト単位のMCP設定を管理する。

---

## まとめ

MCPは2024年11月の公開からわずか1年で、GitHub Stars 76,000超、公開サーバー10,000以上、月間SDKダウンロード9,700万回、主要AI企業すべてが採用という驚異的な成長を遂げた。ソロビルダーにとっては、カスタム統合コードを書くことなく、AIに外部ツールやデータへのアクセスを与えられる画期的なプロトコルだ。

特にClaude DesktopやClaude Codeとの組み合わせは、ソロ開発者の生産性を劇的に向上させる。まずはFilesystemサーバーから始めて、MCPの威力を体感してほしい。

---

**参考リンク:**
- [MCP公式サイト](https://modelcontextprotocol.io)
- [MCP GitHub リポジトリ](https://github.com/modelcontextprotocol)
- [Anthropic公式発表](https://www.anthropic.com/news/model-context-protocol)
- [MCP Registry（公開サーバー検索）](https://registry.modelcontextprotocol.io/)
- [MCP Wikipedia](https://en.wikipedia.org/wiki/Model_Context_Protocol)
