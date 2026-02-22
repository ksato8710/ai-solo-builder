---
title: "【2026年最新】OpenAI Codex完全ガイド｜CLI・デスクトップアプリの使い方から料金・競合比較まで"
slug: "openai-codex-complete-guide"
date: "2026-02-03"
contentType: "news"
description: "月間100万ユーザーのCodex CLI＋デスクトップアプリを徹底解説。"
readTime: "12"
tags:
  - "dev-knowledge"
relatedProducts:
  - "openai-codex"
featured: "true"
image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=420&fit=crop"
---

## この記事でわかること
OpenAI Codex（2025年5月CLI公開、2026年2月デスクトップアプリ公開）は、月間100万人以上の開発者が利用するAIコーディングエージェントだ。ターミナルから自然言語でコード生成・編集・デバッグができ、2026年2月2日にはmacOSデスクトップアプリもリリースされた。
この記事では、Codex CLIのインストールから、新登場のデスクトップアプリの使い方、マルチエージェント機能、料金プラン、競合（Claude Code・Gemini CLI）との比較まで、実践的に解説する。

→ [OpenAI Codexのプロダクト詳細](/products/openai-codex)
## OpenAI Codexとは？
**OpenAI Codex**は、OpenAIが提供するAIコーディングエージェントだ。自然言語の指示をコードに変換し、ファイルの編集、コマンドの実行、テストの実行までを自律的に行う。
### 基本データ

| 項目 | 詳細 |
|------|------|
| 開始時期 | 2025年5月（CLI公開）/ 2026年2月2日（デスクトップアプリ公開） |
| 開発元 | OpenAI（2015年設立、累計調達額$300億以上） |
| 利用者規模 | 月間100万人以上の開発者が利用（2026年1月時点、Sam Altman発言） |
| 成長率 | 2025年8月から利用量20倍以上に成長。GPT-5.2-Codex（2025年12月公開）以降、利用量がほぼ倍増 |
| 対応モデル | GPT-5.2-Codex（最速で採用が広がったモデル — Altman談） |
| オープンソース | CLI版はApache-2.0ライセンスでGitHubに公開（github.com/openai/codex） |
| 対応OS | macOS / Linux / Windows（デスクトップアプリはmacOSのみ、Windows版は開発中） |
| 主要顧客 | Cisco、Ramp、Virgin Atlantic、Vanta、Duolingo、Gap |

## Codex CLIのインストール・セットアップ
Codex CLIは3つの方法でインストールできる。
### 方法1: npm（推奨）
npm install -g @openai/codex
### 方法2: Homebrew（macOS）
brew install --cask codex
### 方法3: GitHubリリースからバイナリダウンロード
[GitHub Releases](https://github.com/openai/codex/releases/latest)からプラットフォームに合ったバイナリをダウンロードする。

- macOS Apple Silicon: codex-aarch64-apple-darwin.tar.gz
- macOS Intel: codex-x86_64-apple-darwin.tar.gz
- Linux x86_64: codex-x86_64-unknown-linux-musl.tar.gz
- Linux arm64: codex-aarch64-unknown-linux-musl.tar.gz

### 認証設定
インストール後、codexコマンドを実行し、「Sign in with ChatGPT」を選択する。ChatGPTの有料プラン（Plus $20/月〜）のアカウントで認証すれば、すぐに使い始められる。
APIキーを使う方法もあるが、ChatGPTプランでのサインインが最も簡単だ。
### 承認モード（Approval Modes）
Codex CLIには3段階の承認モードがある。最初は保守的に始め、慣れたら自律性を上げていくのがおすすめだ。

- **Suggest（推奨開始）:** すべての変更に承認が必要
- **Auto Edit:** ファイル編集は自動、コマンド実行は承認が必要
- **Full Auto:** すべて自動実行（サンドボックス内で安全に動作）

## 【NEW】Codex デスクトップアプリの使い方（2026年2月2日リリース）
2026年2月2日、OpenAIはmacOS向けのCodexデスクトップアプリをリリースした。これは単なるGUIラッパーではない。**複数のAIエージェントを同時に管理するための「コマンドセンター」**だ。
### デスクトップアプリの特徴
#### 1. マルチエージェント並列実行
複数のコーディングエージェントを同時に走らせ、それぞれ独立したスレッドで作業させることができる。プロジェクトごとにエージェントがグループ化されるため、複数プロジェクトの同時作業も可能だ。
Git worktreeに対応しており、各エージェントがコードの独立したコピーで作業するため、メインのコードベースに影響しない。
#### 2. Skills（スキル）システム
Skillsは、指示・リソース・スクリプトをまとめた拡張機能だ。コード生成以外のタスクにもCodexの機能を拡張できる。
公式スキルライブラリには以下が含まれる：

- Figmaデザインの実装
- Linearプロジェクト管理
- Cloudflare/Netlify/Vercelへのデプロイ
- GPT Imageによる画像生成
- PDF・スプレッドシート・Docx作成

チームで作ったカスタムスキルはリポジトリにコミットすれば、CLI・IDE・アプリすべてで共有できる。
#### 3. Automations（自動化）
指示とスキルをスケジュールに組み合わせ、バックグラウンドで定期実行する機能。結果はレビューキューに溜まるので、好きなタイミングで確認できる。
OpenAIチーム自身が以下の用途で使っている：

- 日次のイシュートリアージ
- CI失敗の要約レポート
- リリースブリーフの自動生成
- バグ検出の定期スキャン

#### 4. セキュリティ
ネイティブのオープンソースサンドボックスにより、デフォルトではファイル編集はカレントフォルダに限定され、ネットワークアクセスには承認が必要。チーム単位でルールセットを設定し、特定のコマンドを自動昇格させることも可能だ。
### アプリの入手方法

- [openai.com/form/codex-app](https://openai.com/form/codex-app) でウェイトリストに参加
- 承認後、ChatGPTの認証情報でログイン
- 既存のCodex CLIやIDE拡張の設定が自動インポートされる

## 料金プラン

| プラン | 月額 | Codexアクセス | 備考 |
|--------|------|--------------|------|
| ChatGPT Free / Go | 無料 / $6 | 期間限定で利用可能 | 基本的なレート制限 |
| ChatGPT Plus | $20 | フルアクセス（CLI・Web・IDE・アプリ） | レート制限2倍（期間限定） |
| ChatGPT Pro | $200 | フルアクセス + 高レート制限 | パワーユーザー向け |
| Business / Enterprise | $25~/ユーザー | フルアクセス + チーム管理 | 管理コンソール付き |
| Edu | 割引あり | フルアクセス | 教育機関向け |

**注目:** Codex CLIはオープンソースで無料。ただし、使用するにはOpenAIのAPIキーまたはChatGPTの有料プランが必要だ。最もコスパが良いのはChatGPT Plus（$20/月）で始めること。
## 競合比較: Codex CLI vs Claude Code vs Gemini CLI

| 項目 | OpenAI Codex | Claude Code | Gemini CLI |
|------|-------------|-------------|------------|
| 開発元 | OpenAI | Anthropic | Google |
| 開始時期 | 2025年5月（CLI） | 2025年2月 | 2025年6月 |
| 利用者数 | 月間100万人以上 | 非公開 | 非公開 |
| 基盤モデル | GPT-5.2-Codex | Claude Opus 4.5 / Sonnet 4 | Gemini 3 |
| 実行環境 | ローカル + クラウド | ローカル | ローカル |
| デスクトップアプリ | ✅（2026年2月〜） | ✅（Cowork） | ❌ |
| マルチエージェント | ✅（並列実行） | 一部対応 | ❌ |
| オープンソース | ✅（Apache-2.0） | ❌ | ✅ |
| IDE連携 | VS Code, Cursor, Windsurf, JetBrains | VS Code, JetBrains | VS Code |
| GitHub連携 | ✅（@codex メンション対応） | ✅ | ✅ |
| 最低料金 | $20/月（Plus） | $17/月（Pro年払い） | $5.99/月（AI Premium Lite） |
| コンテキスト長 | 非公開 | 200Kトークン | 1Mトークン |

### 使い分けガイド

- **Codexがおすすめ:** 複数エージェントを並列で走らせたい人、ChatGPTをすでに使っている人、オープンソースが重要な人
- **Claude Codeがおすすめ:** ローカル完結で使いたい人、長いコンテキストを扱う人、推論の質を重視する人
- **Gemini CLIがおすすめ:** コストを最小限に抑えたい人、Google Workspaceと連携する人

## 実践Tips: Codexを最大限活用するコツ
### 1. AGENTS.mdを活用する
プロジェクトルートにAGENTS.mdファイルを作り、プロジェクトの規約・技術スタック・コーディングスタイルを記述する。Codexがこのファイルを読み込み、プロジェクトに適したコードを生成してくれる。
### 2. プロンプトは具体的に
❌「バグを直して」
✅「src/api/auth.tsのlogin関数で、トークン期限切れ時にリフレッシュトークンで再取得するフォールバック処理を追加して。既存のテストも更新すること」
### 3. まずSuggestモードで信頼を構築
いきなりFull Autoにせず、Suggestモードで数日使い、Codexの挙動を理解してから自律性を上げる。
### 4. worktreeで安全に実験
大きな変更を試す場合、Codexのworktree機能でメインブランチから隔離して作業させる。気に入らなければ捨てればいい。
## こんな人におすすめ / 向いていない人
### ✅ おすすめ

- **ソロ開発者・フリーランス:** 一人で複数タスクを並列処理したい人に最適。マルチエージェントが「AIチーム」として機能する
- **プロトタイプを素早く作りたい人:** Sam Altman自身が「IDEを一度も開かずに数日でプロジェクトを完成させた」と発言
- **すでにChatGPT Plusを使っている人:** 追加コストなしでCodexの全機能を利用できる

### ❌ 向いていない人

- **完全オフラインで作業したい人:** APIまたはChatGPTプランへの接続が必須
- **Windows + デスクトップアプリを使いたい人:** デスクトップアプリは現時点でmacOSのみ（CLIはWindows対応）
- **月$20を払いたくない人:** 無料プランは期間限定。本格利用にはPlus以上が必要

## まとめ
OpenAI Codexは、2025年5月のCLI公開からわずか9ヶ月で月間100万ユーザーを獲得し、AIコーディングエージェント市場で最も急成長しているツールの一つだ。2026年2月のデスクトップアプリリリースにより、マルチエージェント管理・Skills・Automationsという新たな価値を提供し始めた。
ChatGPT Plus（$20/月）から始められる手軽さと、オープンソースのCLIという透明性。まだ使っていないなら、まずはCLIのインストールから試してみることをおすすめする。
**公式サイト:** [openai.com/codex](https://openai.com/codex/)
**GitHub:** [github.com/openai/codex](https://github.com/openai/codex)
**デスクトップアプリ ウェイトリスト:** [openai.com/form/codex-app](https://openai.com/form/codex-app)

---

## 📊 ニュースバリュー評価

| 評価軸 | スコア |
|--------|--------|
| SNS反応量 | 12/20 |
| メディアカバレッジ | 18/20 |
| コミュニティ反応 | 14/20 |
| 技術的インパクト | 17/20 |
| ソロビルダー関連度 | 19/20 |
| **合計** | **80/100** |

**所見:** GitHub 58,572 stars（Apache-2.0）のOSSプロジェクト。TechCrunch、Reuters、CNBC、Ars Technica、Fortune等がリリースを全面カバー。マルチエージェント並列実行・Skills・Automationsは開発パラダイムのシフト。ソロビルダーにとって最も重要なツールの1つ。

🗣 **生の声**
- 「Cursorキラー？ 一部ではCodexアプリをCursor等の競合IDEの直接的なライバルと見ている」— Reddit r/vibecoding
- 「Cursorの強みはIDE中心の体験だ。Codexアプリはエージェントの監視とレビューゲートに焦点を当てている。使い分けが重要」— Reddit r/vibecoding
- 「期間限定で無料プラン・Goプランにも含まれる。Plus/Proのレート制限も倍増。今が試すチャンス」— Reddit r/OpenAI
