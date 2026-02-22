---
title: "OpenAI Lockdown Mode発表 — プロンプトインジェクション対策強化"
slug: "openai-lockdown-mode-2026-02-17"
date: "2026-02-17"
publishedAt: "2026-02-17T18:00:00+09:00"
description: "OpenAIがChatGPTにLockdown ModeとElevated Riskラベルを導入。高リスクユーザー向けにプロンプトインジェクション対策を強化する。"
summary: "OpenAIがChatGPTにLockdown ModeとElevated Riskラベルを導入。高リスクユーザー向けにプロンプトインジェクション対策を強化する。"
image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&h=420&fit=crop"
contentType: "news"
readTime: 5
featured: false
tags: ["dev-knowledge", "OpenAI", "ChatGPT", "セキュリティ", "プロンプトインジェクション"]
relatedProducts: ["chatgpt", "openai"]
---

## 概要

OpenAIは2026年2月16日、ChatGPTに「Lockdown Mode」と「Elevated Risk」ラベルという2つの新しいセキュリティ機能を導入した。AIシステムがより複雑なタスク、特にWebや連携アプリを使う作業を行うようになる中で、セキュリティリスクへの対応を強化する狙いがある。

**出典:** [OpenAI公式ブログ](https://openai.com/index/introducing-lockdown-mode-and-elevated-risk-labels-in-chatgpt/) — 2026-02-16

## 詳細

### Lockdown Modeとは

Lockdown Modeは、高度な脅威に対する保護が必要なユーザー向けのオプション設定だ。対象となるのは、企業の経営層やセキュリティチームなど、標的型攻撃のリスクが高いユーザーである。

このモードを有効にすると、ChatGPTと外部システムとのやり取りが厳格に制限される。具体的には：

- **Web閲覧の制限**: キャッシュされたコンテンツのみを使用し、ライブネットワークリクエストは送信しない
- **一部機能の無効化**: データ安全性の強力な保証ができない機能は完全に無効化
- **アプリ接続の管理**: 管理者がどのアプリ（とその具体的なアクション）を許可するかを細かく制御可能

### Elevated Riskラベル

OpenAIは、一部の機能に「Elevated Risk」ラベルを導入した。これはChatGPT、ChatGPT Atlas、Codexで一貫して表示され、ユーザーにリスクを明示する。

例えば、CodexでネットワークアクセスをONにすると、「Elevated Risk」ラベルとともに、何が変わるのか、どんなリスクがあるのか、どんな場合に適切かが説明される。

### 提供状況

- **Enterprise/Edu/Healthcare/Teachers向け**: 即座に利用可能
- **一般ユーザー向け**: 数ヶ月以内に提供予定

管理者は、Workspace Settingsで新しいロールを作成することでLockdown Modeを有効化できる。

## ソロビルダーへの示唆

プロンプトインジェクションは、AIエージェントが外部コンテンツを処理する際の深刻なリスクだ。悪意のある第三者が、WebページやメールにAIへの「偽の指示」を埋め込み、機密情報を抜き取ろうとする攻撃が増えている。

ソロビルダーとして考慮すべき点：

1. **クライアント案件での活用**: セキュリティ要件の厳しい金融・医療系プロジェクトで、Lockdown Modeは有効なオプションになる
2. **自作AIツールの設計**: 外部コンテンツを処理するAIアプリを作る際は、同様の制限機構を検討すべき
3. **Elevated Riskの考え方**: ユーザーにリスクを明示し、選択させるUXパターンは参考になる

## スコア内訳

| 軸 | スコア | 理由 |
|----|--------|------|
| Newsworthiness | 4/5 | 新しいセキュリティアプローチの導入 |
| Value | 5/5 | ChatGPT利用者に直接的な価値 |
| Actionability | 4/5 | Enterprise版で即座に有効化可能 |
| Credibility | 5/5 | OpenAI公式発表 |
| Timeliness | 5/5 | 即日利用可能 |
| **合計** | **23/25** | |
