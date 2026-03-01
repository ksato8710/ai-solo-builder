---
title: "Playwright MCP vs Vercel Agent Browser：AIエージェント向けブラウザ自動化ツール徹底比較"
slug: "playwright-mcp-vs-vercel-agent-browser-comparison"
date: '2026-03-01'
status: published
contentType: news
description: "AIコーディングエージェントのブラウザ自動化に最適なツールはどれか？Playwright MCP、Playwright CLI、Vercel Agent Browserの3つを比較し、トークン効率と機能面から最適な選択を解説。"
image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop"
tags:
  - dev-knowledge
  - playwright
  - vercel
  - ai-agent
  - browser-automation
  - testing
source: "Pulumi Blog, TestCollab"
sourceUrl: "https://www.pulumi.com/blog/self-verifying-ai-agents-vercels-agent-browser-in-the-ralph-wiggum-loop/"
---

## TL;DR

AIコーディングエージェント（Claude Code、Cursor、GitHub Copilot等）でブラウザ自動化を行う場合、**トークン効率**が重要なファクターになる。Vercel Agent Browserは従来のPlaywright MCPと比較して**82.5%のトークン削減**を実現。一方、Playwright CLIも**76%削減**（114K→27K tokens）と大幅改善。用途に応じた使い分けが鍵となる。

---

## 背景：なぜブラウザ自動化のトークン効率が重要なのか

AIコーディングエージェントがフロントエンドを構築した後、**自分で動作検証**できることが理想。しかし、ブラウザ自動化には大きな課題があった。

### Playwright MCPのトークン消費問題

Playwright MCPは強力なブラウザ制御を提供するが、**トークンオーバーヘッドが深刻**だった：

- **バージョン0.0.30→0.0.32で6倍のトークン増加**（[GitHub Issue #889](https://github.com/microsoft/playwright-mcp/issues/889)）
- 単一スクリーンショットで**15,000トークン以上**消費するケースも
- 5時間分のトークン割り当てを数ステップで使い果たす事例が報告

原因は**冗長な出力**。フルアクセシビリティツリーがすべての要素とプロパティを含み、コンソールログも追加される。

---

## 比較対象の3ツール

### 1. Playwright MCP

**Microsoft公式**のMCP（Model Context Protocol）サーバー。

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp"]
    }
  }
}
```

**特徴:**
- フル機能（ネットワークインターセプト、PDF生成、マルチタブ）
- 自己修復テスト、長時間自律ワークフロー向け
- **トークン消費: 約114,000/テスト**

### 2. Playwright CLI

**Microsoft公式**のCLIツール。MCPの代替として2026年初頭に登場。

```bash
npm install -g @playwright/cli
playwright-cli install
playwright-cli open https://example.com
```

**特徴:**
- データをファイルに保存（コンテキストに送らない）
- シェルアクセス前提（Claude Code、Cursor等で利用可能）
- **トークン消費: 約27,000/テスト（76%削減）**

### 3. Vercel Agent Browser

**Vercel Labs**が開発したAIエージェント特化のCLI。

```bash
npm install -g agent-browser
agent-browser install
agent-browser open example.com
```

**特徴:**
- Rustで高速実装
- refベースの要素参照（`@e1`, `@e2`）
- **トークン消費: 約5,500/テスト（82.5%削減）**

---

## 実測比較：同一テストでの結果

Pulumiのエンジニアが同一の6テストを両ツールで実行した結果：

| 指標 | Playwright MCP | Agent Browser | 削減率 |
|------|---------------|---------------|--------|
| **総レスポンス文字数** | 31,117 | 5,455 | **82.5%** |
| **最大単一レスポンス** | 12,891 | 2,847 | 77.9% |
| **平均レスポンス** | 3,112 | 328 | 89.5% |
| **ホームページスナップショット** | 8,247 | 280 | **96.6%** |
| **ダッシュボードスナップショット** | 12,891 | 2,847 | 77.9% |

**概算トークン数:**
- Playwright MCP: ~7,800トークン
- Agent Browser: ~1,400トークン
- **同じコンテキスト予算で5.7倍のテストが実行可能**

---

## なぜAgent Browserが効率的なのか

### 1. snapshot + refs システム

従来のPlaywright MCPはフルDOMを返すが、Agent Browserは**コンパクトな要素リスト**を返す：

```
- button "Sign In" [ref=e1]
- textbox "Email" [ref=e2]
- textbox "Password" [ref=e3]
- link "Documentation" [ref=e4]
```

操作は`agent-browser click @e1`のようにrefで指定。CSSセレクタやXPathは不要。

### 2. 最小限の応答

```bash
$ agent-browser click @e9
✓ Done
```

たった**6文字**。同じ操作でPlaywright MCPは12,891文字を返す。

### 3. Vercelの「Less is More」哲学

Vercelは自社のD0エージェント（text-to-SQL）で実証済み：

| 構成 | ツール数 | 成功率 | 平均時間 | 平均トークン |
|------|---------|--------|----------|-------------|
| 旧アーキテクチャ | 17 | 80% | 274.8秒 | 102,000 |
| 新アーキテクチャ | 2 | **100%** | 77.4秒 | 61,000 |

> 「モデルを信頼しなかったから、推論を制約していた」— Vercel

---

## 使い分けガイド

### Vercel Agent Browser を選ぶ場合

- ✅ **長時間の自律セッション**（コンテキスト予算が重要）
- ✅ **基本的なナビゲーションと検証タスク**
- ✅ **MCPサーバー設定をスキップしたい**
- ✅ Claude Codeのbashツールで直接呼び出したい

### Playwright CLI を選ぶ場合

- ✅ **開発ワークフローでの素早い自動化**
- ✅ **テストスキャフォールド生成**
- ✅ **探索的テスト**
- ✅ 既存のPlaywrightエコシステムとの親和性

### Playwright MCP を選ぶ場合

- ✅ **高度な機能が必要**（ネットワークインターセプト、PDF生成）
- ✅ **マルチタブワークフロー**
- ✅ **自己修復テスト**
- ✅ 既存のPlaywrightテストスイートがある

---

## セットアップ手順

### Vercel Agent Browser

```bash
# インストール
npm install -g agent-browser
agent-browser install

# Claude Code用スキル設置
mkdir -p .claude/skills/agent-browser
curl -o .claude/skills/agent-browser/SKILL.md \
  https://raw.githubusercontent.com/vercel-labs/agent-browser/main/skills/agent-browser/SKILL.md

# 使用例
agent-browser open https://your-app.com
agent-browser snapshot -i  # インタラクティブ要素のみ
agent-browser click @e2
agent-browser screenshot page.png
```

### Playwright CLI

```bash
# インストール
npm install -g @playwright/cli
playwright-cli install

# スキルインストール（Claude Code用）
playwright-cli install --skills

# 使用例
playwright-cli open https://your-app.com --headed
playwright-cli snapshot
playwright-cli fill e8 "test@example.com"
playwright-cli screenshot
```

---

## ソロ開発者への示唆

### 推奨スタート構成

1. **日常の検証・デバッグ**: Vercel Agent Browser
   - 最小限のセットアップ
   - トークン効率最高
   - refベースで直感的

2. **テスト自動化を本格化**: Playwright CLI
   - より多くのコマンド
   - ファイルベースで管理しやすい

3. **複雑なE2Eテスト**: Playwright MCP
   - 高度な機能が必要な場合のみ

### 実践Tips

- **Agent Browserの弱点**: モーダルやAPI後の動的要素には手動でwait追加が必要
- **セッション管理**: `agent-browser --session agent1`で複数インスタンス可能
- **認証状態の保存**: `agent-browser state save auth.json`で再利用

---

## 関連リンク

- [Vercel Agent Browser (GitHub)](https://github.com/vercel-labs/agent-browser)
- [Playwright MCP (GitHub)](https://github.com/microsoft/playwright-mcp)
- [Playwright CLI (npm)](https://www.npmjs.com/package/@playwright/cli)
- [Pulumi Blog: Self-Verifying AI Agents](https://www.pulumi.com/blog/self-verifying-ai-agents-vercels-agent-browser-in-the-ralph-wiggum-loop/)

---

## まとめ

| ツール | トークン効率 | 機能の豊富さ | セットアップ容易さ |
|--------|-------------|-------------|-------------------|
| **Agent Browser** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Playwright CLI** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Playwright MCP** | ⭐ | ⭐⭐⭐ | ⭐⭐ |

**結論:** AIエージェントでのブラウザ自動化は、**Agent Browserから始めて、必要に応じてPlaywrightに移行**するのが現時点でのベストプラクティス。トークン効率の差は、長時間セッションや頻繁なテストで顕著に効いてくる。
