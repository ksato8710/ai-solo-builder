---
title: "Spec-first Context Pack — AIコーディングエージェントがブレない最小セット"
slug: "spec-first-context-pack"
date: "2026-02-10"
contentType: "news"
description: "AIコーディングの品質はモデルより“前提”で決まる。仕様・禁止・レビュー観点をMarkdownで固定するための最小Context Pack（4ファイル）と、毎日回る運用ループをまとめた。"
readTime: "9"
tags:
  - "dev-knowledge"
relatedProducts:
  - "claude-code"
image: "https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?w=800&h=420&fit=crop"
featured: "false"
---

## この記事で分かること
- AIコーディングがブレる根本原因（コンテキストドリフト）
- ブレを抑える「最小Context Pack（4ファイル）」の具体例
- ソロでも“毎日回る”Spec-first運用ループ

## 背景: なぜAIコーディングはブレるのか

AIコーディングの失敗は、だいたい次のどれかに収束する。

- 仕様が曖昧（「何を作るか」より「何を作らないか」が書かれていない）
- ルールが曖昧（PR粒度、依存追加、エラーハンドリング、ログ方針が毎回変わる）
- “安全にやってはいけないこと”が曖昧（秘密情報、破壊的操作、外部通信）

これを解決する最短ルートは「会話で頑張る」ではなく、**前提をファイルに固定**することだ。

## 最小Context Pack（4ファイル）

リポジトリ直下に `context/` を作り、まずは4ファイルだけ置く。

```
context/
  product.md
  workflow.md
  architecture.md
  safety.md
```

### 1) context/product.md（仕様）
```md
# Product

## Problem
- 誰の、どの痛みを解決するか

## Goals
- 今スプリントで達成すること（3つまで）

## Non-goals
- やらないこと（重要）

## Definition of Done
- 受け入れ基準（チェックリスト）
```

### 2) context/workflow.md（開発ルール）
```md
# Workflow

## SDD First
- specがない実装はしない

## PR / Diff
- 1PR = 1目的（巨大PR禁止）
- 変更理由を必ず残す（Why）

## Testing
- 変更に対応する最小テストを追加
```

### 3) context/architecture.md（設計の前提）
```md
# Architecture

- 採用スタックと理由
- データの流れ（1段落で）
- 触って良い範囲/触らない範囲
```

### 4) context/safety.md（禁止事項）
```md
# Safety

## Never do
- 破壊的コマンド（delete/drop）を実行しない
- 秘密情報をコミットしない

## Always do
- 変更前に影響範囲を列挙
- 不明点は質問して止める
```

## どう運用に落とすか（ソロ向け）

### ループは「Spec → Small Diff → Review」
ソロでも、1日で回る粒度に切る。

1. `product.md` に “今日のゴール” を3つまで書く
2. 1ゴールをさらに分割して、小さな差分で実装する
3. 差分を「要約・リスク・テスト観点」でレビューする

このループに乗ると、AIの提案がズレた時も **戻る場所（仕様）がある**。

## どのツールでも効く（CLI/IDE/OSS）

Context Packはツール依存の機能ではなく、**人間の運用資産**だ。  
Claude CodeのようなCLIエージェントでも、Cursor/ContinueのようなIDE拡張でも、同じ思想が効く。

## 関連プロダクト
- [/products/claude-code](/products/claude-code)
- [/products/cursor](/products/cursor)
- [/products/continue-dev](/products/continue-dev)
- [/products/github-copilot](/products/github-copilot)
- [/products/openai-codex](/products/openai-codex)

## まとめ
- AIコーディングの勝ち筋は「モデル選定」より「前提固定」
- まずは4ファイルだけ置く（仕様/ルール/設計/安全）
- ソロは“毎日回る粒度”に落とした瞬間に強くなる

**参考リンク:** [Anthropic](https://www.anthropic.com/) / [Cursor](https://cursor.com/) / [Continue](https://continue.dev/)

