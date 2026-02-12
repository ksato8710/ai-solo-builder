---
title: "GitHub Copilot Testing for .NET一般提供開始"
slug: "github-copilot-testing-dotnet-ga"
date: "2026-02-12"
description: "MicrosoftがVisual Studio 2026でAI powered unit test生成機能を一般提供開始。自然言語でテスト生成、失敗時の自動修正も対応"
publishedAt: "2026-02-12T18:00:00+09:00"
summary: "MicrosoftがVisual Studio 2026でAI powered unit test生成機能を一般提供開始。自然言語でテスト生成、失敗時の自動修正も対応"
image: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&h=420&fit=crop"
contentType: "news"
readTime: 5
featured: false
tags: ["GitHub Copilot", "Visual Studio", ".NET"]
relatedProducts: ["github-copilot"]
---

## 概要

MicrosoftがVisual Studio 2026 v18.3でGitHub Copilot Testing for .NETの一般提供を開始した。Preview版から卒業し、AI-powered unit test生成機能により.NET開発者の単体テスト作成を劇的に効率化する。

**出典:** [Microsoft .NET Blog](https://devblogs.microsoft.com/dotnet/github-copilot-testing-for-dotnet-available-in-visual-studio/) — 2026-02-11

## 詳細

GitHub Copilot Testing for .NETは、単体テストに特化したAI エージェントとして動作する。従来のコード補完ツールとは異なり、プロジェクト構造、テストフレームワーク、ビルドシステムを理解してエンドツーエンドのテストワークフローを提供する。

**主要機能:**
- **自動テスト生成**: 選択したコード範囲（メンバー、クラス、ファイル、プロジェクト、ソリューション、Git diff）に応じてテストを生成
- **自動実行・修正**: 生成したテストを自動実行し、失敗時には自動修正を試行
- **自然言語プロンプト**: "@Test コアビジネスロジックの単体テストを生成"のような自由記述で指示可能
- **構造化レポート**: テストファイル作成・変更状況、カバレッジ情報、成功・失敗シグナルを提供

GA版では新しいエントリポイントが追加され、右クリックメニューからの「Copilot Actions → Generate Tests」やCopilot Chat のアイスブレーカーからも利用できるようになった。

### ポイント

- Visual Studio 2026 v18.3で一般提供開始
- AI-powered unit test生成とエンドツーエンド ワークフロー
- 自然言語プロンプト対応で直感的な操作
- 自動実行・修正でテスト品質を担保

## ソロビルダーへの示唆

.NET開発者にとって単体テストの作成・メンテナンスは時間のかかる作業だった。GitHub Copilot Testing により、コードから安定したテストまでの工程がほぼ自動化される。

特にソロビルダーは品質担保とスピードの両立が課題だが、AI による自動テスト生成とカバレッジレポートにより、より確実なコードをより短時間で出荷できるようになる。有料のGitHub Copilot ライセンスが必要だが、投資対効果は高い。

今後は他の言語・フレームワークへの拡張も予想され、テスト駆動開発（TDD）のワークフローがAI により大きく変わる可能性がある。

## NVA評価

| 軸 | スコア | 理由 |
|----|--------|------|
| Newsworthiness | 3/5 | Preview から GA への移行、AIテスト自動化の標準化 |
| Value | 4/5 | .NET開発者の単体テスト効率化、品質向上とコード信頼性 |
| Actionability | 4/5 | Visual Studio 18.3で即利用、.NET プロジェクトがあれば試用可 |
| Credibility | 5/5 | Microsoft公式ブログ一次ソース、開発チーム直接の発表 |
| Timeliness | 3/5 | GA発表のタイミング良好、開発トレンドと合致 |
| **合計** | **19/25** | **Tier B** |