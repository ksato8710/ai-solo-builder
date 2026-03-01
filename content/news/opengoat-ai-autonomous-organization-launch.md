---
title: "OpenGoat：AIエージェントの「階層組織」を構築するオープンソースツール登場"
slug: "opengoat-ai-autonomous-organization-launch"
description: "OpenClawエージェントを階層的に組織化し、CEO、マネージャー、スペシャリストとして協働させるOpenGoatが登場。Claude Code、Codex、Cursorなど複数ツールを横断してタスクを委譲・実行できる。"
publishedAt: "2026-03-01"
updatedAt: "2026-03-01"
contentType: "news"
tags: ["product-update", "opengoat", "openclaw", "ai-agent", "multi-agent", "automation"]
image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=630&fit=crop"
source: "GitHub, OpenGoat公式"
sourceUrl: "https://github.com/marian2js/opengoat"
author: "AI Solo Craft編集部"
featured: true
---

## TL;DR

**OpenGoat**は、OpenClawエージェントを**階層的な「会社組織」**として構築・運用できるオープンソースツール。CEOに目標を伝えるだけで、マネージャーがタスクを分解し、スペシャリスト（Claude Code、Codex、Cursor等）が実行する。**MITライセンス**で、サブスクリプション不要。

---

## 話題の発端

そらさん（@sora19ai）のX投稿が注目を集めている：

> 「まさかだけどOpenClawに驚いてる人で『OpenGoat』使ってない人いないよね？」
> — 2026年2月28日

この投稿をきっかけに、複数の開発者がOpenGoatの環境構築に成功し、「エージェント階層組織」の構築報告が相次いでいる。

---

## OpenGoatとは

### 基本コンセプト

OpenGoatは、**AIエージェントを会社のように組織化**するツール。

| 役割 | 説明 |
|------|------|
| **CEO (Goat)** | 組織のトップ。目標を受け取り、計画を立てる |
| **Manager** | タスクを分解し、部下に委譲 |
| **Specialist** | 実際の作業を実行（コーディング、デザイン等） |

従来の「1エージェント」から「チームとしてのエージェント群」へ発展させる。

### 対応ランタイム

スペシャリストは以下のツールで動作可能：

- **Claude Code**
- **Codex CLI**
- **Cursor**
- **GitHub Copilot CLI**
- **OpenCode**
- **Lovable**

マネージャーはOpenClaw上で動作し、タスクの割り振りと進捗管理を担当。

---

## クイックスタート

```bash
# OpenClawとOpenGoatをインストール
npm i -g openclaw opengoat

# OpenClawの初期設定
openclaw onboard

# OpenGoatを起動
opengoat start
```

ブラウザで `http://127.0.0.1:19123` を開くと、ダッシュボードが表示される。

### 組織の構築例

```bash
# CTOを作成（マネージャー、Goatに報告）
opengoat agent create "CTO" --manager --reports-to goat

# エンジニアを作成（個人、CTOに報告、コーディングスキル）
opengoat agent create "Engineer" --individual --reports-to cto --skill coding

# デザイナーを作成
opengoat agent create "Designer" --individual --reports-to cto
```

### タスクの実行

```bash
# CTOにメッセージを送る
opengoat agent cto --message "Q2のエンジニアリングロードマップを計画し、ストリームに分割してください"

# エンジニアにタスクを直接指示
opengoat agent engineer --message "このスプリントの認証ミドルウェアを実装してください"
```

---

## 主な機能

### 1. 組織定義

エージェントは**SOUL（個性）** だけでなく：

- **ROLE**（役割）
- **VISION**（ビジョン）
- **MISSION**（ミッション）
- **VALUES**（価値観）

を持つ。組織としての一貫性を保ちながら協働。

### 2. 階層構造がファーストクラス

```
Goat (CEO)
├── CTO (Manager)
│   ├── Engineer (Individual)
│   └── Designer (Individual)
└── CMO (Manager)
    └── Marketer (Individual)
```

各エージェントは自分の役割と責任を理解し、適切にエスカレーション/デリゲーションを行う。

### 3. タスクボード

```bash
# タスク作成
opengoat task create --title "認証実装" --description "ミドルウェア+テスト" --owner cto --assign engineer

# タスク一覧（エンジニア視点）
opengoat task list --as engineer

# ステータス更新
opengoat task status <task-id> doing
```

### 4. セッション管理

```bash
# 特定セッションでやり取り
opengoat agent goat --session saaslib-planning --message "v1.2のリリースチェックリストを作成"

# 同じセッションで続ける
opengoat agent goat --session saaslib-planning --message "次にチェンジログを作成"
```

### 5. スキルインストール

```bash
opengoat skill install og-boards --from /path/to/skill
opengoat skill install jira-tools --from /path/to/skill
opengoat skill list --agent goat
```

---

## Dockerでの実行

```bash
docker build -t opengoat:latest .
docker run --rm -p 19123:19123 -v opengoat-data:/data/opengoat opengoat:latest
```

---

## ソロ開発者への示唆

### なぜOpenGoatが重要か

| 従来 | OpenGoat |
|------|----------|
| 1エージェントに全てを依頼 | 役割分担で専門性を活かす |
| 長いプロンプトで指示 | 「目標」を伝えれば計画・実行 |
| ツール切り替えが面倒 | 複数ツールを統合管理 |
| コンテキスト消費が大きい | 階層委譲でコンテキスト分散 |

### 活用シナリオ

1. **プロダクト開発の自動化**
   - Goatにアイデアを伝える
   - CTOが技術計画を立てる
   - エンジニアがClaude Codeで実装
   - デザイナーがLovableでUI作成

2. **コードレビュー組織**
   - レビュアーエージェントがPRをチェック
   - 問題があればエンジニアに差し戻し
   - マネージャーが品質を担保

3. **コンテンツ制作**
   - 編集長がトピックを決定
   - ライターが記事を執筆
   - QAがファクトチェック

---

## 技術仕様

| 項目 | 詳細 |
|------|------|
| **ライセンス** | MIT |
| **ランタイム** | Node.js >= 20.11 |
| **パッケージ** | npm: `opengoat` |
| **GitHub** | [marian2js/opengoat](https://github.com/marian2js/opengoat) |
| **ドキュメント** | [docs.opengoat.ai](https://docs.opengoat.ai) |
| **公式サイト** | [opengoat.ai](https://opengoat.ai) |

---

## 関連リンク

- [GitHub: marian2js/opengoat](https://github.com/marian2js/opengoat)
- [公式ドキュメント](https://docs.opengoat.ai)
- [OpenGoat公式サイト](https://opengoat.ai)
- [npm: opengoat](https://www.npmjs.com/package/opengoat)
- [Discord](https://discord.gg/JWGqXJMwYE)

---

## まとめ

OpenGoatは、**単一エージェントから「エージェント組織」への進化**を実現するツール。OpenClawの「エージェントハーネス」の上に、**企業組織のメタファー**を重ねることで、複雑なプロジェクトを分業・協調で進められる。

ソロ開発者にとっては、**自分専用のAIチーム**を構築できる可能性を開くツールだ。MITライセンスでサブスクリプション不要、まずは試してみる価値がある。

> 「CEOを雇い、マネージャーを雇い、スペシャリストを雇う。目標を与えれば、あとは彼らに任せる」
> — OpenGoat公式サイト
