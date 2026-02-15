---
title: "Claude Code入門ガイド — インストールから最初のプロジェクトまで"
slug: "claude-code-getting-started"
date: "2026-02-15"
contentType: "news"
tags: ["dev-knowledge"]
description: "AnthropicのClaude Codeを始めるための完全ガイド。インストール、初期設定、最初のプロジェクト作成まで、ステップバイステップで解説します。"
readTime: 8
image: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&h=420&fit=crop"
relatedProducts:
  - claude-code
source:
  name: "Anthropic Docs"
  url: "https://docs.anthropic.com/en/docs/claude-code"
  type: "primary"
  credibility_score: 10
---

# Claude Code入門ガイド

Claude CodeはAnthropicが開発したターミナルベースのAIコーディングアシスタントです。従来のチャットUIとは異なり、ローカル環境で直接ファイル操作やコマンド実行ができる点が特徴です。

## Claude Codeとは

Claude Codeは**エージェント型のコーディングツール**です。

- ファイルの読み書き
- ターミナルコマンドの実行
- Git操作
- プロジェクト全体の理解と修正

これらをAIが自律的に行いながら、開発者と協調して作業を進めます。

## インストール方法

### 前提条件

- Node.js 18以上
- npm または yarn
- Anthropic APIキー（Maxプランなら不要）

### インストール手順

```bash
# npmでグローバルインストール
npm install -g @anthropic-ai/claude-code

# バージョン確認
claude --version
```

### 認証設定

```bash
# APIキーを設定
export ANTHROPIC_API_KEY="your-api-key-here"

# または、Maxプランの場合
claude auth login
```

## 最初のプロジェクト

### プロジェクトディレクトリで起動

```bash
cd your-project
claude
```

### 基本的な対話

起動後は自然言語で指示を出せます。

```
> このプロジェクトの構成を説明して

> READMEを作成して

> src/utils.tsにエラーハンドリングを追加して
```

## 基本操作

### よく使うコマンド

| 操作 | 説明 |
|------|------|
| `/help` | ヘルプを表示 |
| `/clear` | 会話履歴をクリア |
| `/status` | 現在の状態を確認 |
| `Ctrl+C` | 実行中の処理を中断 |

### プロジェクト設定（CLAUDE.md）

プロジェクトルートに`CLAUDE.md`を作成すると、Claude Codeがプロジェクトの文脈を理解しやすくなります。

```markdown
# CLAUDE.md

## プロジェクト概要
Next.js 14のWebアプリケーション

## 技術スタック
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase

## コーディング規約
- コンポーネントはsrc/components/に配置
- 型定義はsrc/types/に配置
```

## ソロ開発者へのおすすめ設定

### 1. エディタ連携

VS CodeやCursorと併用する場合、Claude Codeは「実行・修正」に特化させると効率的です。

### 2. Git連携

```bash
# コミット前のレビュー
> 変更内容をレビューして、問題があれば指摘して

# コミットメッセージ作成
> 適切なコミットメッセージを提案して
```

### 3. ドキュメント生成

```bash
> 関数のJSDocコメントを追加して
> APIドキュメントを生成して
```

## まとめ

Claude Codeは**ソロ開発者の強力なパートナー**になります。

- 対話しながらコードを書ける
- ファイル操作もAIに任せられる
- プロジェクト全体を理解した上で提案してくれる

まずは小さなプロジェクトで試してみて、使い方を掴んでいきましょう。

---

**関連プロダクト:** [Claude Code](/products/claude-code)
