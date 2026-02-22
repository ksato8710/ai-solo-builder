---
title: Google Conductor AIに自動コードレビュー機能追加
slug: google-conductor-ai-review-2026-02-15
date: '2026-02-15'
publishedAt: '2026-02-15T18:00:00+09:00'
description: >-
  GoogleのGemini
  CLI拡張「Conductor」に自動レビュー機能が追加。セキュリティ脆弱性検出、計画との整合性チェック、ガイドライン準拠を自動化。
summary: >-
  GoogleのGemini
  CLI拡張「Conductor」に自動レビュー機能が追加。セキュリティ脆弱性検出、計画との整合性チェック、ガイドライン準拠を自動化。
image: >-
  https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&h=630&fit=crop
contentType: news
readTime: 4
featured: false
tags:
  - dev-knowledge
  - Google
  - Gemini CLI
  - コードレビュー
  - セキュリティ
relatedProducts:
  - cursor
  - claude-code
---

## 概要

Googleが2月12日、Gemini CLIの拡張機能「Conductor」に**Automated Review（自動レビュー）機能**を追加したことを発表した。AIによるコード生成から検証までを一貫して自動化し、一人開発でも「レビュアー」を持てる環境を実現する。

**出典:** [Google Developers Blog](https://developers.googleblog.com/conductor-update-introducing-automated-reviews/) — 2026-02-12

## 詳細

### Conductorとは

ConductorはGemini CLI向けの拡張機能で、**コンテキスト駆動開発**をターミナルで実現するツール。プロジェクト情報をエフェメラルなチャットログではなく、バージョン管理されたMarkdownファイルに永続化する設計が特徴。

### 新機能: Automated Review

今回追加されたAutomated Review機能により、Conductorは「計画→実行」だけでなく「検証」フェーズも担当する。

**主な機能:**

1. **セキュリティスキャン**
   - ハードコードされたAPIキーの検出
   - PII（個人識別情報）漏洩リスクの特定
   - インジェクション攻撃の脆弱性チェック
   - 高リスク問題はマージ前にフラグ

2. **コードレビュー**
   - 新規生成ファイルに対する静的・ロジック分析
   - ピアレビュアーとして機能

3. **計画との整合性チェック**
   - `plan.md`や`spec.md`との比較検証
   - 当初計画からの逸脱を検出

4. **ガイドライン準拠**
   - プロジェクト固有のコーディング規約との照合
   - 長期的なコード品質維持

5. **テストスイート統合**
   - テスト実行をレビューワークフローに組み込み

### ポイント

- **一人開発の弱点を補完**: レビュアー不在でも品質を担保
- **セキュリティ最優先**: 重大な脆弱性はマージ前に検出
- **計画との一貫性**: スコープクリープを防止

## ソロビルダーへの示唆

一人で開発していると「見落とし」が避けられない。特にセキュリティ面は専門知識が必要で、個人開発者が全てをカバーするのは困難だった。

**Conductor Automated Reviewの活用法:**

1. **Gemini CLIをインストール**: 既にGemini APIを使っているなら追加コストなし
2. **plan.mdを作成**: プロジェクトの計画を文書化
3. **レビューを習慣化**: PRを出す前に自動レビューを実行

特に**APIキーのハードコード検出**は、個人開発でありがちなミスを防ぐ実用的な機能。GitHubにプッシュしてから焦る状況を未然に防げる。

Cursorや Claude Codeと併用する場合も、最終的なセキュリティチェックとしてConductorを通すワークフローが有効だ。

## NVA評価

| 軸 | スコア | 理由 |
|----|--------|------|
| Newsworthiness | 4/5 | Google公式の新機能発表 |
| Value | 5/5 | セキュリティ自動化は即戦力 |
| Actionability | 5/5 | 今日からGemini CLIで利用可能 |
| Credibility | 5/5 | Google公式ブログ |
| Timeliness | 4/5 | 2/12発表 |
| **合計** | **23/25** | **Tier S** |
