---
title: "FigJam × Claude連携ガイド — AIとの対話からダイアグラムを自動生成"
slug: "figma-claude-figjam-integration"
date: "2026-02-18"
contentType: "news"
description: "Claudeとの対話からFigJamでフローチャート、ガントチャート、シーケンス図を自動生成。公式発表の詳細と利用方法を解説"
readTime: 8
tags:
  - "dev-knowledge"
relatedProducts:
  - "claude"
image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=420&fit=crop"
---

2026年1月26日、FigmaはAnthropicと連携し、**Claudeとの対話からFigJamダイアグラムを自動生成**する機能を発表した。

テキスト、PDF、画像、スクリーンショットをClaudeに渡すだけで、フローチャート、ガントチャート、シーケンス図などが生成され、FigJam上で編集可能になる。

---

## この記事で得られること

1. FigJam × Claude連携の概要と利用方法
2. 生成できるダイアグラムの種類
3. ソロビルダーにとっての活用ポイント
4. 関連技術（Figma × Claude連携）との違い

---

## 公式発表の要点

**出典:** [Think Outside of the Box—with Claude and FigJam | Figma Blog](https://www.figma.com/blog/think-outside-of-the-box-with-claude-and-figjam/)（2026年1月26日）

### 何ができるようになったか

| 機能 | 説明 |
|------|------|
| **入力** | テキストプロンプト、PDF、画像、スクリーンショット |
| **出力** | FigJam上で編集可能なダイアグラム |
| **生成形式** | フローチャート、ガントチャート、シーケンス図、ステートダイアグラム、意思決定ツリー |
| **対応プラン** | Claude Pro / Max / Team / Enterprise |
| **対応モデル** | Claude Opus 4.5, Claude Sonnet 4.5 |

### 利用方法

1. Claudeの[Figma Connector](https://claude.ai/directory/c758d038-d8eb-4421-b426-9dd68dc7f84a)を追加（ブラウザ/デスクトップ）
2. Claudeにテキスト/PDF/画像で依頼
3. 生成されたダイアグラムをプレビュー
4. 「Open in FigJam」でチームと共有・編集

---

## なぜこの連携が重要か

### AIチャットの限界を超える

Figma公式ブログより：

> 「AIとの会話は一人での探索には優れている。しかし、本当の進歩はチームが共有スペースでアイデアを視覚化し、形作り、発展させるときに起こる」

Claudeとの対話で得たアイデアを、**すぐにチームと共有できる形**にできるのがポイントだ。

### 職種別のユースケース

| 職種 | 活用例 |
|------|--------|
| **プロダクトマネージャー** | PRDからガントチャートを生成、タイムラインと依存関係を可視化 |
| **デザイナー** | ユーザージャーニーマップ、ワイヤーフロー |
| **エンジニア** | システムアーキテクチャ図、シーケンス図、API依存関係図 |

### Figmaエコシステムとの連携

FigJamで整理したアイデアは、そのまま**Figma Design**や**Figma Slides**に展開可能。構想→設計→共有→実装の一連の流れを分断なく扱える。

---

## ソロビルダーへの示唆

### 1. 企画段階の高速化

PRDやアイデアメモをClaudeに渡すだけで、**説明用の図**が即座に生成される。クライアントや協力者への説明資料作成時間を大幅短縮。

### 2. 一人でもチーム用ツールを活用

FigJamで整理したアイデアをそのままFigma Designへ展開できるため、**一人でも構想→設計の流れ**がスムーズになる。

### 3. プロンプトの工夫がポイント

ダイアグラムの種類（フローチャート、シーケンス図など）を明示し、主要な要素や分岐点を指定すると、より意図に近い出力が得られる。

---

## セットアップ手順

### 1. Figma Connectorを追加

[Claude Figma Connector](https://claude.ai/directory/c758d038-d8eb-4421-b426-9dd68dc7f84a)にアクセスし、Claudeに追加。

### 2. 基本的なプロンプト例

```
このPRDをもとに、ユーザーフローのダイアグラムを作成してください。
フローチャート形式で、主要な分岐点を明示してください。

[PRDの内容をペースト]
```

### 3. 生成されたダイアグラムを開く

Claude上でプレビューを確認し、「Open in FigJam」をクリック。

---

## 関連技術との違い

FigJam連携とは別に、Figma × Claudeには複数の連携方法がある。混同しないよう整理する。

| 連携方法 | 概要 | 主な用途 |
|----------|------|----------|
| **FigJam連携（本記事）** | Claude → FigJamダイアグラム生成 | 企画・設計の可視化 |
| **Figma MCP** | Figmaデザイン ↔ Claude（API経由） | デザインからコード変換 |
| **Claude Code to Figma** | コード → Figma UI同期 | 実装とデザインの双方向同期 |
| **Cline + Claude** | VSCode拡張経由でFigma参照 | コンポーネント実装 |

**FigJam連携**は「アイデアをダイアグラム化」する機能。**Figma MCP**や**Code to Figma**は「デザインとコードを連携」する機能で、目的が異なる。

---

## 日本語での報道

- [Impress Watch](https://www.watch.impress.co.jp/docs/news/2081900.html)
- [Web Designing](https://webdesigning.book.mynavi.jp/article/27417/)
- [PR TIMES（公式プレスリリース）](https://prtimes.jp/main/html/rd/p/000000021.000097201.html)

---

## まとめ

| ポイント | 内容 |
|----------|------|
| **公式発表** | 2026年1月26日、Figma × Anthropic連携 |
| **機能** | Claudeとの対話からFigJamダイアグラムを生成 |
| **対応形式** | フローチャート、ガントチャート、シーケンス図など |
| **ポイント** | アイデア→図解→チーム共有の流れを高速化 |

ソロビルダーにとって、**企画→図解→設計の流れを一人で高速に回せる**ようになるのが最大のメリット。まずはシンプルなフローチャート生成から試してみよう。

---

## 参考リンク

- [Figma公式ブログ: Think Outside of the Box—with Claude and FigJam](https://www.figma.com/blog/think-outside-of-the-box-with-claude-and-figjam/)
- [Claude Figma Connector](https://claude.ai/directory/c758d038-d8eb-4421-b426-9dd68dc7f84a)
