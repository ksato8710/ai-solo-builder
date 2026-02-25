---
title: Figma Developer Docs 完全ガイド — プラグイン・ウィジェット・REST API の全体像
slug: figma-developer-docs-guide
date: '2026-02-24'
publishedAt: '2026-02-24T10:00:00+09:00'
contentType: news
tags:
  - dev-knowledge
  - figma
  - api
  - plugin
excerpt: >-
  Figma公式開発者ドキュメントの全体像を日本語で解説。Plugin API、Widget API、REST
  APIの違いと使い分け、ソロビルダーが今日から始められる開発ステップまで。
description: >-
  Figma Developer Docs（developers.figma.com）の完全ガイド。Plugin API、Widget API、REST
  API、SCIM APIの違いと用途を解説し、ソロビルダーがFigma拡張開発を始めるための実践的なロードマップを提供。
readTime: 12
image: /thumbnails/figma-developer-docs-guide.png
author: AI Solo Craft 編集部
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

## 🤖 MCP Server — AIエージェントとの連携

**公式ドキュメント:** [developers.figma.com/docs/figma-mcp-server](https://developers.figma.com/docs/figma-mcp-server/)

### 概要

**MCP（Model Context Protocol）Server**は、Figmaのデザイン情報をAIコーディングツール（Cursor、VS Code Copilot、Claude Code、Windsurf等）に提供するサーバー。2025年10月にベータ版として発表され、現在も機能拡張が続いている。

MCPはAnthropicが策定した標準プロトコルで、AIエージェントが外部データソースにアクセスするための共通インターフェース。Figma MCP Serverを使うことで、「デザインを見ながらコードを書く」のではなく、**AIがデザインを直接理解してコードを生成**できるようになる。

### 従来の課題

これまでAIにデザイン情報を伝えるには:
- スクリーンショットを貼り付ける
- REST APIレスポンスをコピペする

という手作業が必要だった。MCP Serverはこれを自動化し、**デザイン意図をLLMに直接伝える**。

### 2つの接続方式

| 方式 | 説明 | 用途 |
|------|------|------|
| **Desktop Server** | Figmaデスクトップアプリ経由でローカル起動 | 選択中のフレームをそのまま使用 |
| **Remote Server** | Figmaホスト（`https://mcp.figma.com/mcp`）に直接接続 | FigmaリンクベースでURL指定 |

Desktop Serverは`http://127.0.0.1:3845/mcp`でローカル起動。Remote ServerはFigma OAuth認証後に利用可能。

### 対応クライアント

| クライアント | Desktop | Remote | Skills対応 |
|-------------|---------|--------|-----------|
| **Claude Code** | ✓ | ✓ | [Claude Skills](https://claude.com/connectors/figma) |
| **Codex (OpenAI)** | ✓ | ✓ | [Codex Skills](https://github.com/openai/skills/blob/main/skills/.curated/figma-implement-design/SKILL.md) |
| **Cursor** | ✓ | ✓ | — |
| **VS Code** | ✓ | ✓ | — |
| **Windsurf** | ✓ | ✓ | — |
| **Gemini CLI** | ✓ | ✓ | — |
| **Kiro** | ✓ | ✓ | [Kiro Powers](https://kiro.dev/powers/) |
| **Android Studio** | ✓ | ✓ | — |

最新の対応状況は[MCP Catalog](https://www.figma.com/mcp-catalog)で確認。

### 主要ツール一覧

MCP Serverは複数の「ツール」を提供し、LLMが目的に応じて使い分ける:

| ツール | 用途 |
|--------|------|
| `get_design_context` | デザインをコード（React + Tailwind等）に変換 |
| `get_screenshot` | フレームのスクリーンショットを取得 |
| `get_variable_defs` | 使用中の変数・スタイル（色、スペーシング等）を取得 |
| `get_code_connect_map` | Figmaノードとコードコンポーネントのマッピングを取得 |
| `add_code_connect_map` | Code Connectマッピングを追加 |
| `get_metadata` | レイヤー構造のXML表現を取得 |
| `get_figjam` | FigJamダイアグラムをXMLで取得 |
| `generate_diagram` | Mermaid構文からFigJamダイアグラムを生成 |
| `create_design_system_rules` | デザインシステムルールファイルを生成 |
| `generate_figma_design` | **Claude Code専用**: UIをFigmaに送信 |
| `whoami` | 認証ユーザー情報を取得 |

### Skills（スキル）とは

Skillsは、MCPツールの使い方をAIエージェントに教える**ワークフロー定義**。単体ツールの組み合わせ方、実行順序、結果の解釈方法を指示する。

例:
- デザインシステムコンポーネントをCode Connectでマッピング
- デザインを本番コードに変換するワークフロー

Claude Code、Codex、Kiroが対応。

### セットアップ（Claude Code）

```bash
# Remote Server を追加
claude mcp add --transport http figma https://mcp.figma.com/mcp

# 全プロジェクトで使う場合
claude mcp add --scope user --transport http figma https://mcp.figma.com/mcp
```

起動後、`/mcp` コマンドでfigmaを選択 → Authenticateで認証。

### セットアップ（VS Code）

1. `Cmd + Shift + P` → `MCP: Open User Configuration`
2. `mcp.json` に以下を追加:

```json
{
  "servers": {
    "figma": {
      "url": "https://mcp.figma.com/mcp",
      "type": "http"
    }
  }
}
```

3. 「Start」をクリック → 「Allow Access」で認証

### セットアップ（Cursor）

1. [Figma MCP server deep link](cursor://anysphere.cursor-deeplink/mcp/install?name=Figma&config=eyJ1cmwiOiJodHRwczovL21jcC5maWdtYS5jb20vbWNwIn0%3D)をクリック
2. 「Install」→「Connect」→「Allow Access」

### 使い方の例

**選択ベース（Desktop Server）:**
1. Figmaでフレームを選択
2. AIに「選択中のデザインを実装して」とプロンプト

**リンクベース（Remote Server）:**
1. Figmaでフレームリンクをコピー
2. AIに「このデザインを実装して: [リンク]」とプロンプト

### Claude Code to Figma（逆方向）

`generate_figma_design`ツールを使うと、**実行中のUIをFigmaに送り返す**ことも可能（Claude Code + Remote Server限定）。

```
"ローカルサーバーを起動して、UIをFigmaファイルにキャプチャして"
```

ブラウザウィンドウが開き、画面全体または要素を選択してFigmaに送信できる。

### Code Connectとの連携

[Code Connect](https://www.figma.com/code-connect-docs/)を設定すると、FigmaコンポーネントとコードベースのReactコンポーネントをマッピングできる。MCP ServerはこのマッピングをLLMに伝え、「正しいコンポーネントを使ったコード生成」を実現する。

### ソロビルダーへの価値

| シナリオ | 従来 | MCP活用 |
|----------|------|---------|
| Figmaデザインをコードに | スクショ貼り付け→プロンプト | リンク貼るだけでAIが構造理解 |
| デザイントークン取得 | 手動で値を転記 | `get_variable_defs`で自動取得 |
| コンポーネント一貫性 | 手動でimport調整 | Code Connect + MCPで自動マッピング |
| FigJamアーキテクチャ図 | 手書き or 別ツール | Mermaid → `generate_diagram`で自動生成 |

### 始め方

1. **Claude Codeユーザー**: 上記コマンドでMCP追加 → すぐ使える
2. **Cursorユーザー**: Deep linkからワンクリック設定
3. **Code Connect未設定**: [Code Connectドキュメント](https://www.figma.com/code-connect-docs/)でコンポーネントマッピングを追加すると出力品質が向上

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
| **AIコーディングツール連携** | **MCP Server** | ⭐ |
| **デザイン→コード自動変換** | **MCP Server + Code Connect** | ⭐⭐ |

### 今日やること

1. **MCP Server 接続**（AIコーディングツール利用者向け）: Claude Code / Cursor / VS Code でMCP Serverを設定（10分）

2. **環境セットアップ**: [Plugin クイックスタート](https://developers.figma.com/docs/plugins/plugin-quickstart-guide/)でサンプルを動かす（30分）

3. **Discordに参加**: [Figma Developers Discord](https://discord.gg/xzQhe2Vcvx)で質問できる環境を確保

4. **REST API トークン取得**: [Personal access tokens](https://www.figma.com/developers/api#access-tokens)でAPIキーを発行

### 参考リソース

| リソース | URL |
|----------|-----|
| 公式ドキュメント | [developers.figma.com](https://developers.figma.com/) |
| **MCP Server ドキュメント** | [developers.figma.com/docs/figma-mcp-server](https://developers.figma.com/docs/figma-mcp-server/) |
| **MCP Catalog（対応クライアント一覧）** | [figma.com/mcp-catalog](https://www.figma.com/mcp-catalog) |
| **Code Connect** | [figma.com/code-connect-docs](https://www.figma.com/code-connect-docs/) |
| GitHub サンプル | [figma/widget-samples](https://github.com/figma/widget-samples) |
| OpenAPI 仕様 | [figma/rest-api-spec](https://github.com/figma/rest-api-spec) |
| コミュニティプラグイン | [figma.com/community/plugins](https://www.figma.com/community/plugins) |
| コミュニティフォーラム | [forum.figma.com](https://forum.figma.com/c/plugin-widget-api/20) |
| Discord | [discord.gg/xzQhe2Vcvx](https://discord.gg/xzQhe2Vcvx) |

---

## まとめ

Figma Developer Docsは、**5つの主要インターフェース**で構成される:

| API / Server | 一言でいうと |
|--------------|------------|
| **Plugin API** | ファイル内の自動化（個人向け） |
| **Widget API** | キャンバス上のコラボツール（チーム向け） |
| **REST API** | 外部ツール連携（サーバーサイド） |
| **MCP Server** | AIコーディングツール連携（デザイン→コード） |
| **SCIM API** | ユーザー管理自動化（エンタープライズ） |

**2025年〜2026年の注目は MCP Server**。Claude Code、Cursor、VS Code等のAIコーディングツールを使うなら、まずMCP Serverを設定してデザイン→コードワークフローを試すのがおすすめ。

プラグイン開発に興味があるなら**Plugin API**から始めて、自分のワークフローを自動化。その後、ニーズに応じてREST APIやWidget APIに拡張していくのが王道。

Figmaは「Make design accessible to everyone」をミッションに掲げている。その一環として、開発者にも門戸を開いているのがこのDeveloper Docs。今日からFigma拡張開発を始めよう。

---

## 📚 関連記事

- [FigJam × Claude連携ガイド — AIとの対話からダイアグラムを自動生成](/news/figma-claude-figjam-integration)
- [AI時代のFigmaの使い方が変わった — 40画面を作るのではなく「デザインルール」を定義する](/news/figma-design-system-ai-workflow)

## 🏷️ 関連プロダクト

- [Claude Code](/products/claude-code)
- [Cursor](/products/cursor)
- [Model Context Protocol (MCP)](/products/mcp)
