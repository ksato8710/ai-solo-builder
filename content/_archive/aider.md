---
title: "Aider — ターミナルAIペアプログラマー"
slug: "aider"
date: "2026-02-16"
contentType: "product"
type: product
description: "OSSのターミナルベースAIペアプログラマー。Git統合でコード変更を自動コミット。Claude、GPT-4、ローカルLLMなど複数モデルに対応。"
readTime: 10
image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=420&fit=crop"
tags: ["ai-coding", "ai-agent"]
relatedProducts:
  - "claude-code"
  - "cursor"
  - "devin"
  - "cline"
  - "github-copilot"
---

> 最終情報更新: 2026-02-16

| 項目 | 詳細 |
|------|------|
| 種別 | CLIベースAIペアプログラマー |
| 開発元 | Paul Gauthier（OSS） |
| 料金 | 無料（OSS）+ LLM API費用 |
| 対応OS | macOS、Linux、Windows |
| 特徴 | Git統合、マルチLLM対応、OSS |

## Aiderとは？

Aiderは、**オープンソースのターミナルベースAIペアプログラマー**。Claude、GPT-4、Gemini、さらにはローカルLLM（Ollama経由）など、**複数のLLMを選択して利用**できる。

最大の特徴は**Git統合**。コード変更を自動でコミットし、変更履歴を明確に残す。「AIがどこを変更したか」が常に追跡可能で、問題があればgit revertで簡単にロールバック。

Claude Codeの登場前から人気を集めていたCLI型AIツールで、**カスタマイズ性の高さ**がパワーユーザーに支持されている。

## こんな人におすすめ

| ターゲット | 適性 | 理由 |
|------------|------|------|
| ターミナル派 | ⭐⭐⭐ | CLI完結、IDEなしで動作 |
| OSS好き | ⭐⭐⭐ | MITライセンス、カスタマイズ可能 |
| マルチLLM派 | ⭐⭐⭐ | Claude、GPT、ローカルLLMを切り替え |
| コスト意識 | ⭐⭐ | 自分でAPIキーを用意（従量課金） |
| GUI派 | ⭐ | ターミナル操作必須 |

## 主要機能

### Git自動コミット

コード変更のたびに自動でgit commit。コミットメッセージも自動生成。変更履歴が明確に残り、問題時のロールバックが容易。

### マルチファイル編集

複数ファイルを同時に編集。「この機能を追加して」と言えば、関連するファイル（コンポーネント、テスト、型定義）を一括修正。

### マルチLLM対応

Claude、GPT-4、GPT-3.5、Gemini、DeepSeek、Ollama経由のローカルLLMなど、多様なモデルに対応。コストやプライバシー要件に応じて選択。

### リポジトリマップ

プロジェクト構造を自動解析し、LLMに効率的にコンテキストを伝達。大規模プロジェクトでも関連ファイルを特定。

### ウォッチモード

ファイル変更を監視し、自動でAiderに伝達。外部エディタでの変更を即座に反映。

### Voice入力

音声でコーディング指示。ハンズフリーでのペアプログラミングが可能。

## 使い方（Getting Started）

1. **インストール**: `pip install aider-chat` または `brew install aider`
2. **APIキー設定**: `export ANTHROPIC_API_KEY=xxx` または `export OPENAI_API_KEY=xxx`
3. **プロジェクトに移動**: `cd your-project`
4. **起動**: `aider` または `aider --claude-3-5-sonnet`
5. **ファイル追加**: `/add src/app.py` で編集対象を追加
6. **指示**: 「ログイン機能を追加して」と自然言語で指示

## コマンド例

```bash
# Claude 3.5 Sonnetで起動
aider --claude-3-5-sonnet

# GPT-4oで起動
aider --model gpt-4o

# 特定ファイルを指定して起動
aider src/main.py src/utils.py

# 自動コミットを無効化
aider --no-auto-commits

# ウォッチモード
aider --watch
```

## 料金

Aider自体は**無料（OSS）**。ただし、LLM APIの利用料金が別途発生。

| モデル | 目安コスト（1時間作業） |
|--------|------------------------|
| Claude 3.5 Sonnet | $0.5〜2 |
| GPT-4o | $0.5〜2 |
| GPT-3.5 Turbo | $0.05〜0.2 |
| ローカルLLM（Ollama） | $0 |

## Pros（メリット）

- ✅ **OSS**: MITライセンス、完全無料
- ✅ **Git統合**: 自動コミットで変更を追跡
- ✅ **マルチLLM**: Claude、GPT、ローカルLLMを選択
- ✅ **カスタマイズ**: 設定ファイルで細かく調整
- ✅ **軽量**: Python環境があれば即起動
- ✅ **ターミナル完結**: IDEなしで動作
- ✅ **マルチファイル**: 複数ファイル同時編集
- ✅ **Voice入力**: 音声でのコーディング
- ✅ **コミュニティ**: 活発な開発、頻繁なアップデート

## Cons（デメリット）

- ⚠️ **ターミナル必須**: CLI操作に慣れが必要
- ⚠️ **APIキー管理**: 自分でキーを取得・設定
- ⚠️ **コスト管理**: 使いすぎると高額になる可能性
- ⚠️ **GUI不在**: ビジュアル確認は別エディタ
- ⚠️ **学習曲線**: コマンドや設定を覚える必要

## ユーザーの声

> **「Claude Codeが出る前から使っていた。Git自動コミットが神」**
> — OSSコントリビューター

> **「複数のLLMを試せるのがいい。プロジェクトによって使い分け」**
> — AI研究者

> **「OSSなので中身が見える安心感。カスタマイズも自在」**
> — ターミナル派エンジニア

> **「コストは自己責任。使いすぎて月$50行ったことがある」**
> — Hacker News コメント

## FAQ

### Q: Claude Codeとの違いは？

A: Claude CodeはAnthropic公式、Aiderは独立したOSSプロジェクト。Aiderは複数のLLMに対応、Claude CodeはClaudeに特化。Git統合のアプローチも異なる。

### Q: ローカルLLMで使える？

A: Ollama経由でllama、mistral、codellama等のローカルLLMに対応。クラウドにコードを送信したくない場合に有効。

### Q: 大規模プロジェクトでも使える？

A: 使える。リポジトリマップ機能で関連ファイルを効率的に特定。ただし、コンテキストサイズの制限はLLMに依存。

### Q: 無料で使う方法は？

A: ローカルLLM（Ollama）を使えばAPI費用ゼロ。ただし、品質はクラウドLLMに劣る。

## 競合比較

| ツール | 価格 | LLM選択 | 特徴 |
|--------|------|---------|------|
| **Aider** | OSS + API費用 | ◎ 複数対応 | Git自動コミット |
| **Claude Code** | Max $100/月〜 | Claude固定 | Anthropic公式 |
| **Cursor** | $20/月 | 複数選択可 | GUI IDE |
| **Cline** | OSS + API費用 | 複数対応 | VS Code拡張 |

## ソロビルダー向けの使いどころ

### ターミナル作業の延長

ssh先のサーバー、Docker内など、IDEが使いにくい環境でもAiderなら動作。どこでもAIペアプロが可能。

### コスト最適化

プロジェクトの規模や複雑さに応じてLLMを使い分け。簡単なタスクはGPT-3.5、重要なタスクはClaude 3.5と切り替え。

### 実験・プロトタイピング

複数のLLMを試して、どのモデルがプロジェクトに合うか検証。OSSなので制限なく実験可能。

## 公式リンク

- GitHub: https://github.com/paul-gauthier/aider
- ドキュメント: https://aider.chat/
- インストール: https://aider.chat/docs/install.html
- LLM設定: https://aider.chat/docs/llms.html
