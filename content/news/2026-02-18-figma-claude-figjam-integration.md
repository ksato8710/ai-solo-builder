---
title: "FigJam × Claude連携ガイド — AIとの対話からダイアグラムを自動生成"
slug: "figma-claude-figjam-integration"
date: "2026-02-18"
contentType: "news"
description: "Claudeとの対話からFigJamでフローチャート、ガントチャート、シーケンス図を自動生成。MCPを活用したチーム協働の新しいワークフローを解説"
readTime: 12
tags:
  - "dev-knowledge"
relatedProducts:
  - "claude"
image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=420&fit=crop"
---

2026年1月26日、FigmaはAnthropicと連携し、**Claudeとの対話からFigJamダイアグラムを自動生成**する機能を発表した。

テキスト、PDF、画像、スクリーンショットをClaudeに渡すだけで、フローチャート、ガントチャート、シーケンス図などが生成され、FigJam上で編集可能になる。

この記事では、公式発表の詳細と、日本で実際に試した開発者のレポートを紹介する。

---

## この記事で得られること

1. FigJam × Claude連携の概要と利用方法
2. 生成できるダイアグラムの種類
3. 日本語での実践レポート（リンク集）
4. ソロビルダーにとっての活用ポイント

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

## 日本での実践レポート

日本語で実際に試している開発者の記事を紹介する。

### 1. Figma MCP × Claude連携やってみた

**GMO宮崎クリエイターズ — みんみん氏**

[https://gmo-miyazaki-creators.com/coding/figma-mcpclaude/](https://gmo-miyazaki-creators.com/coding/figma-mcpclaude/)

**やったこと:**
- Figma Config 2025で発表されたグリッド機能を使用
- Figma MCPでデザインからReact/HTMLへの変換を検証

**良かったところ:**
- グリッド機能は使いやすい
- MCP設定は一度できれば楽

**課題:**
- プロンプト10回以上やり直し
- レスポンシブが微妙
- 結局手直し必須

> 「繰り返し作業の自動化効果は確実にある。プロトタイプを素早く作りたい時には威力を発揮しそう」

---

### 2. Claude x Figma によるコンポーネント開発のはじめ方

**Gaji-Labo — 辻氏**

[https://www.gaji.jp/blog/2025/05/30/22897/](https://www.gaji.jp/blog/2025/05/30/22897/)

**やったこと:**
- Cline（VSCode拡張）+ Claude 3.7 Sonnetを使用
- FigmaプレビューURLをプロンプトに渡してコンポーネント生成

**結果:**
- Figma画面から適切な粒度でコンポーネントを切り出し
- react-bootstrapを適切に使用したコード生成
- ページ遷移も動作

> 「プロンプトでは『コンポーネント分割して』などの依頼は一切なかったにも関わらず、適切な粒度でコンポーネントを切り出していた」

---

### 3. Claude Skills で Figma 実装を自動化する

**Zenn — Gaudiy Tech Blog**

[https://zenn.dev/gaudiy_blog/articles/1737f814756e37](https://zenn.dev/gaudiy_blog/articles/1737f814756e37)

**ポイント:**
- Claude Skillsを使ったFigma→実装ワークフローの自動化
- Sub Agentパターンで99%のトークン削減（100,000 → 500トークン）
- チームで共有可能なSkillとして定義

> 「『毎回同じこと説明するの面倒だな』と思ったら、それはSkill化のチャンス」

---

### 4. ニュースメディアの報道

**Impress Watch:**
[https://www.watch.impress.co.jp/docs/news/2081900.html](https://www.watch.impress.co.jp/docs/news/2081900.html)

**Web Designing:**
[https://webdesigning.book.mynavi.jp/article/27417/](https://webdesigning.book.mynavi.jp/article/27417/)

**PR TIMES（公式プレスリリース）:**
[https://prtimes.jp/main/html/rd/p/000000021.000097201.html](https://prtimes.jp/main/html/rd/p/000000021.000097201.html)

---

## 関連: Claude Code to Figma（2026年2月発表）

FigJam連携とは別に、2026年2月17日には**Claude Code to Figma**も発表された。

こちらは逆方向のワークフロー：

| 機能 | FigJam連携（1月発表） | Code to Figma（2月発表） |
|------|----------------------|-------------------------|
| 方向 | Claude → FigJam | コード ↔ Figma |
| 用途 | ダイアグラム生成 | UI実装の双方向同期 |
| 対象 | PM/デザイナー/エンジニア | 主にエンジニア |

**参考:** [Claude Code to Figmaのはじめかた | note](https://note.com/kgsi/n/n6105dc1174bf)（こぎそ氏）

---

## ソロビルダーへの示唆

### 1. 企画段階の高速化

PRDやアイデアメモをClaudeに渡すだけで、**説明用の図**が即座に生成される。クライアントや協力者への説明資料作成時間を大幅短縮。

### 2. 一人でもチーム用ツールを活用

FigJamで整理したアイデアをそのままFigma Designへ展開できるため、**一人でも構想→設計の流れ**がスムーズになる。

### 3. 課題: プロンプトの練度

日本の実践レポートで共通して指摘されているのは、**プロンプトの書き方で結果が大きく変わる**こと。期待通りの出力を得るには試行錯誤が必要。

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

## まとめ

| ポイント | 内容 |
|----------|------|
| **公式発表** | 2026年1月26日、Figma × Anthropic連携 |
| **機能** | Claudeとの対話からFigJamダイアグラムを生成 |
| **対応形式** | フローチャート、ガントチャート、シーケンス図など |
| **日本での評価** | 「便利だが、プロンプト練度が必要」 |
| **関連機能** | Claude Code to Figma（2026年2月発表） |

ソロビルダーにとって、**企画→図解→設計の流れを一人で高速に回せる**ようになるのが最大のメリット。まずはシンプルなフローチャート生成から試してみよう。

---

## 参考リンク

- [Figma公式ブログ: Think Outside of the Box—with Claude and FigJam](https://www.figma.com/blog/think-outside-of-the-box-with-claude-and-figjam/)
- [Claude Figma Connector](https://claude.ai/directory/c758d038-d8eb-4421-b426-9dd68dc7f84a)
- [Figma MCP Server公式](https://www.figma.com/blog/introducing-figma-mcp-server/)
- [Anthropic MCP App UI Kit](https://www.figma.com/community/file/1597641111449594397)
