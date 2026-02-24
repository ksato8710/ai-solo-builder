---
title: "Figma Developer Docs 完全ガイド — プラグイン・ウィジェット・REST API の全体像"
slug: "figma-developer-docs-guide"
date: "2026-02-24"
publishedAt: "2026-02-24T10:00:00+09:00"
contentType: "news"
tags: ["dev-knowledge", "figma", "api", "plugin"]
excerpt: "Figma公式開発者ドキュメントの全体像を日本語で解説。Plugin API、Widget API、REST APIの違いと使い分け、ソロビルダーが今日から始められる開発ステップまで。"
description: "Figma Developer Docs（developers.figma.com）の完全ガイド。Plugin API、Widget API、REST API、SCIM APIの違いと用途を解説し、ソロビルダーがFigma拡張開発を始めるための実践的なロードマップを提供。"
readTime: 12
image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&h=420&fit=crop"
author: "AI Solo Craft 編集部"
---

## Figma開発者エコシステムの全体像

Figmaは単なるデザインツールではない。**プラグイン、ウィジェット、REST API**を通じて、開発者がFigmaの機能を拡張し、外部ツールと連携できる強力なエコシステムを提供している。

公式ドキュメント [Figma Developer Docs](https://developers.figma.com/) には、4つの主要なAPIが存在する:

| API | 用途 | 実行環境 |
|-----|------|----------|
| **Plugin API** | ファイル内でのタスク自動化・機能拡張 | Figmaエディタ内 |
| **Widget API** | FigJam等でのインタラクティブなコラボレーション | キャンバス上 |
| **REST API** | 外部ツールからのFigmaデータアクセス | サーバーサイド |
| **SCIM API** | ユーザー・ロールの自動プロビジョニング | エンタープライズ向け |

この記事では、各APIの特徴と使い分けを解説し、ソロビルダーがFigma開発を始めるための実践的なロードマップを提供する。

---

## 🔌 Plugin API — ファイル内の自動化と機能拡張

**公式ドキュメント:** [developers.figma.com/docs/plugins](https://developers.figma.com/docs/plugins/)

### 概要

プラグインは、Figmaエディタ内で動作するJavaScript/HTMLベースのプログラム。ユーザーが起動すると、ファイル内のレイヤーやオブジェクトを読み書きできる。

> "Figma's API has helped bring ideas we have dreamt about for ages to life."  
> — Erik Klimczak, Principal Designer at Uber

### できること

- **レイヤー操作**: フレーム、コンポーネント、ベクター、テキストの作成・編集・削除
- **プロパティ変更**: 色、位置、サイズ、階層構造の変更
- **スタイル適用**: ファイル内のスタイルやコンポーネントの参照
- **UI表示**: カスタムモーダル（iframe）でインタラクティブなUIを提供
- **パラメータ入力**: クイックアクションメニューからの直接入力

### 技術スタック

| 要素 | 技術 |
|------|------|
| ロジック | JavaScript / TypeScript |
| UI | HTML / CSS / JavaScript |
| 実行環境 | iframe（ブラウザAPI利用可能） |
| グローバルオブジェクト | `figma` |

### ドキュメント構造

Figmaファイルはノードのツリー構造:

```
DocumentNode（ルート）
  └── PageNode（ページ）
        └── FrameNode, ComponentNode, TextNode, etc.
```

### 制限事項

- **ライブラリアクセス**: チームライブラリのスタイル・コンポーネントに直接アクセス不可（インポートが必要）
- **フォント**: ローカルフォントまたはFigmaデフォルトフォントのみ（`loadFontAsync()`で読み込み必須）
- **バックグラウンド実行**: 不可（ユーザー起動のアクションのみ）
- **ファイルメタデータ**: 権限、コメント、バージョン履歴は REST API 経由

### 開発モード対応

プラグインはFigma Design Mode、Dev Mode、FigJam、Figma Slides、Figma Buzzで異なる動作が可能。Dev Modeでは特有の制限がある。

### 始め方

1. [クイックスタートガイド](https://developers.figma.com/docs/plugins/plugin-quickstart-guide/)でサンプルプラグインを実行
2. [API リファレンス](https://developers.figma.com/docs/plugins/api/api-reference/)で利用可能な関数を確認
3. [Discord コミュニティ](https://discord.gg/xzQhe2Vcvx)で質問・フィードバック

---

## 🧩 Widget API — インタラクティブなコラボレーション

**公式ドキュメント:** [developers.figma.com/docs/widgets](https://developers.figma.com/docs/widgets/)

### 概要

ウィジェットは、FigJamやFigma Designのキャンバス上に配置できるインタラクティブなオブジェクト。**プラグインと異なり、全員が同じウィジェットを見て操作できる**のが特徴。

### プラグインとの違い

| 観点 | Plugin | Widget |
|------|--------|--------|
| **実行者** | 起動した人のみ | 全員が同時に操作可能 |
| **配置** | モーダルUI | キャンバス上のオブジェクト |
| **複数実行** | 1つずつ | 複数同時に配置可能 |
| **コラボレーション** | 個人作業向け | チーム作業向け |

### ユースケース

- **投票・ポーリング**: リアルタイムで意見を集約
- **タイムライン・カレンダー**: プロジェクト管理
- **データ可視化**: 外部データをインポートしてテーブル表示
- **マルチプレイヤーゲーム**: チームビルディング

### 技術スタック

| 要素 | 技術 |
|------|------|
| 言語 | TypeScript + JSX |
| コンポーネント | Reactライクな宣言的UI |
| 実行環境 | Figmaエディタ内 |

### Plugin APIとの連携

ウィジェットはPlugin APIの機能にもアクセス可能:
- 外部APIからのデータ取得
- iframeでの追加UI表示
- ファイル内の他オブジェクト編集

### 始め方

1. [セットアップガイド](https://developers.figma.com/docs/widgets/setup-guide/)で環境構築
2. [サンプルウィジェット](https://github.com/figma/widget-samples)を参考に実装
3. [API リファレンス](https://developers.figma.com/docs/widgets/api/api-reference/)でコンポーネントを確認

---

## 🌐 REST API — 外部ツールとの連携

**公式ドキュメント:** [developers.figma.com/docs/rest-api](https://developers.figma.com/docs/rest-api/)

### 概要

REST APIは、Figmaの外部から**サーバーサイドで**Figmaデータにアクセスするためのインターフェース。デザイントークン抽出、CI/CD連携、分析ダッシュボード構築などに使用。

### 認証方式

| 方式 | 用途 |
|------|------|
| **アクセストークン** | 個人・小規模プロジェクト向け |
| **OAuth2** | 公開アプリ・他ユーザーのファイルアクセス |

### 主要エンドポイント

| カテゴリ | エンドポイント例 | 用途 |
|----------|------------------|------|
| **Files** | `GET /v1/files/:key` | ファイル構造・レイヤー取得 |
| **Images** | `GET /v1/images/:key` | レイヤーを画像としてエクスポート |
| **Comments** | `GET/POST /v1/files/:key/comments` | コメント取得・投稿 |
| **Versions** | `GET /v1/files/:key/versions` | バージョン履歴 |
| **Variables** | `GET/POST /v1/files/:key/variables` | デザイントークン操作 |
| **Components** | `GET /v1/files/:key/components` | コンポーネント一覧 |
| **Webhooks** | `POST /v2/webhooks` | イベント通知 |
| **Activity logs** | `GET /v1/activity_logs` | 利用状況分析 |
| **Library analytics** | `GET /v1/analytics/libraries` | ライブラリ利用統計 |

### ベースURL

- **通常**: `https://api.figma.com`
- **Figma for Government**: `https://api.figma-gov.com`

### OpenAPI仕様

Figma REST APIは[OpenAPI仕様](https://github.com/figma/rest-api-spec)として公開されている。TypeScript型定義も提供されており、型安全なコードが書ける。

### 始め方

1. [アカウント作成](https://www.figma.com/signup)
2. [認証設定](https://developers.figma.com/docs/rest-api/authentication/)（アクセストークン or OAuth2）
3. [Files エンドポイント](https://developers.figma.com/docs/rest-api/file-endpoints/)から基本を学ぶ
4. 公開アプリを作る場合は [My apps](https://www.figma.com/developers/apps) で登録

---

## 🔐 SCIM API — エンタープライズ向けプロビジョニング

**公式ドキュメント:** [help.figma.com/hc/articles/360048514653](https://help.figma.com/hc/en-us/articles/360048514653-Set-up-automatic-provisioning-via-SCIM)

### 概要

SCIM（System for Cross-domain Identity Management）APIは、IdP（Okta, Azure AD等）からFigmaへのユーザー・ロール自動同期を実現。

### ユースケース

- **入社時**: IdPにユーザー追加 → Figmaアカウント自動作成
- **退社時**: IdPからユーザー削除 → Figmaアクセス自動無効化
- **ロール変更**: IdPでの権限変更 → Figmaに自動反映

**注意**: エンタープライズプラン向け機能。ソロビルダーには通常不要。

---

## 📦 Embed Kit — デザインの埋め込み

Figmaデザインやプロトタイプを外部サイトに埋め込むためのキット。リアルタイムで更新されるデザインを、ドキュメントやポートフォリオに簡単に組み込める。

**ドキュメント:** [developers.figma.com/docs/embeds](https://developers.figma.com/docs/embeds/)

---

## 🚀 ソロビルダーへの実践ロードマップ

### 目的別のAPI選択

| やりたいこと | 推奨API | 難易度 |
|--------------|---------|--------|
| デザイン作業の自動化 | Plugin API | ⭐⭐ |
| FigJamでのチーム活動改善 | Widget API | ⭐⭐⭐ |
| デザイントークン抽出 | REST API | ⭐⭐ |
| CI/CDパイプライン連携 | REST API + Webhooks | ⭐⭐⭐ |
| デザインシステム分析 | REST API (Library analytics) | ⭐⭐ |

### 今日やること

1. **環境セットアップ**: [Plugin クイックスタート](https://developers.figma.com/docs/plugins/plugin-quickstart-guide/)でサンプルを動かす（30分）

2. **Discordに参加**: [Figma Developers Discord](https://discord.gg/xzQhe2Vcvx)で質問できる環境を確保

3. **REST API トークン取得**: [Personal access tokens](https://www.figma.com/developers/api#access-tokens)でAPIキーを発行

### 参考リソース

| リソース | URL |
|----------|-----|
| 公式ドキュメント | [developers.figma.com](https://developers.figma.com/) |
| GitHub サンプル | [figma/widget-samples](https://github.com/figma/widget-samples) |
| OpenAPI 仕様 | [figma/rest-api-spec](https://github.com/figma/rest-api-spec) |
| コミュニティプラグイン | [figma.com/community/plugins](https://www.figma.com/community/plugins) |
| コミュニティフォーラム | [forum.figma.com](https://forum.figma.com/c/plugin-widget-api/20) |
| Discord | [discord.gg/xzQhe2Vcvx](https://discord.gg/xzQhe2Vcvx) |

---

## まとめ

Figma Developer Docsは、**4つのAPI**で構成される:

| API | 一言でいうと |
|-----|------------|
| **Plugin API** | ファイル内の自動化（個人向け） |
| **Widget API** | キャンバス上のコラボツール（チーム向け） |
| **REST API** | 外部ツール連携（サーバーサイド） |
| **SCIM API** | ユーザー管理自動化（エンタープライズ） |

ソロビルダーがまず触るべきは**Plugin API**。自分のワークフローを自動化するプラグインを作ることで、Figma開発の基礎が身につく。その後、ニーズに応じてREST APIやWidget APIに拡張していくのが王道。

Figmaは「Make design accessible to everyone」をミッションに掲げている。その一環として、開発者にも門戸を開いているのがこのDeveloper Docs。今日からFigma拡張開発を始めよう。

---

## 📚 関連記事

- [FigJam × Claude連携ガイド — AIとの対話からダイアグラムを自動生成](/news/figma-claude-figjam-integration)
- [AI時代のFigmaの使い方が変わった — 40画面を作るのではなく「デザインルール」を定義する](/news/figma-design-system-ai-workflow)

## 🏷️ 関連プロダクト

- [Claude Code](/products/claude-code)
