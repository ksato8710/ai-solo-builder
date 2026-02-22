---
title: GitHub Copilot JetBrains、Agent Skills対応でワークフローカスタマイズが可能に
slug: github-copilot-jetbrains-agent-skills-2026-02-14
date: '2026-02-14'
description: >-
  JetBrains IDEのGitHub CopilotがAgent
  Skillsに対応。プロジェクト固有のスキルを作成・共有でき、開発ワークフローに合わせたAI支援が実現する。
publishedAt: '2026-02-14T18:00:00+09:00'
summary: >-
  JetBrains IDEのGitHub CopilotがAgent
  Skillsに対応。プロジェクト固有のスキルを作成・共有でき、開発ワークフローに合わせたAI支援が実現する。
image: >-
  https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=630&fit=crop
contentType: news
readTime: 5
featured: false
tags:
  - product-update
  - GitHub Copilot
  - JetBrains
  - 開発ツール
  - Agent Skills
relatedProducts:
  - github-copilot
  - cursor
---

## 概要

GitHubは2026年2月13日、JetBrains IDE向けのGitHub Copilotに**Agent Skills**サポートを追加したことを発表した。これにより、開発者は自分のワークフローに合わせたスキルを作成し、繰り返しの設定を削減できるようになる。

**出典:** [GitHub Changelog](https://github.blog/changelog/2026-02-13-new-features-and-improvements-in-github-copilot-in-jetbrains-ides-2/) — 2026-02-13

## 詳細

Agent Skillsは、特定のコンテキストやタスクに応じてCopilotの動作をカスタマイズする機能。プロジェクト固有の規約やライブラリの使い方をスキルとして定義しておけば、毎回説明する手間が省ける。

### 主な機能

- **カスタムスキル作成**: プロジェクト用のスキルを自作可能
- **コミュニティスキル活用**: `github/awesome-copilot` や `anthropics/skills` リポジトリからスキルを導入
- **コンテキスト自動読み込み**: 必要なときにスキル固有のコンテンツがコンテキストに追加される

### その他のアップデート

今回のリリースには、Agent Skills以外にもいくつかの改善が含まれている:

- **インラインチャット改善**: 選択コードをCopilot Chatにコンテキストとして追加しやすく
- **設定管理の刷新**: Agent mode、Coding Agent、Custom Agentを個別に有効/無効化
- **品質向上**: ファイル操作ツールのセキュリティ強化、Next Edit Suggestionsの安定性向上

### ポイント

- Agent Skills対応はパブリックプレビュー
- JetBrains IDE設定の `Settings > GitHub Copilot > Chat > Agent` で有効化
- Copilot Business/Enterprise利用者は管理者ポリシー設定が必要

## ソロビルダーへの示唆

ソロビルダーにとって、Agent Skillsの価値は**繰り返し作業の削減**にある。

例えば、自分のプロジェクトでよく使うライブラリの使い方、コーディング規約、特定のアーキテクチャパターンをスキルとして定義しておけば、Copilotが自動的にそれらを考慮したコード提案を行う。

VS CodeではなくIntelliJ IDEA、WebStorm、PyCharmなどを使っている開発者にとっては、待望のアップデートと言える。今日から試して、自分のワークフローに合ったスキルを探ったり作成してみる価値がある。

## NVA評価

| 軸 | スコア | 理由 |
|----|--------|------|
| Newsworthiness | 4/5 | 主要IDEへのAgent Skills初対応 |
| Value | 5/5 | 開発効率に直結する機能強化 |
| Actionability | 5/5 | 今日からプレビュー利用可能 |
| Credibility | 5/5 | GitHub公式Changelog |
| Timeliness | 4/5 | 即時利用可能 |
| **合計** | **23/25** | **Tier S** |
