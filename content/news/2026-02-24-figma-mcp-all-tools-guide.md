---
title: "Figma MCP 全13ツール完全解説 — 読み取り・書き込み・Code Connect・ユーティリティを徹底分析"
slug: "figma-mcp-all-tools-guide"
date: "2026-02-24"
publishedAt: "2026-02-24T11:00:00+09:00"
contentType: "news"
tags: ["dev-knowledge", "figma", "mcp", "claude-code", "cursor"]
excerpt: "Figma MCP Serverが提供する全13ツールを4カテゴリに分類して徹底解説。get_design_contextからgenerate_figma_design、Code Connect連携まで、各ツールの実践的な使い方とプロンプト例を網羅。"
description: "Figma MCP Serverの全機能を詳細分析。読み取り系5ツール、書き込み系2ツール、Code Connect連携4ツール、ユーティリティ2ツールの計13ツールについて、用途・プロンプト例・ベストプラクティスを解説。"
readTime: 15
image: "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?w=800&h=420&fit=crop"
author: "AI Solo Craft 編集部"
---

## Figma MCP Server とは

**Figma MCP Server**は、Figmaのデザイン情報をAIコーディングツール（Claude Code、Cursor、VS Code等）に提供するサーバー。Anthropicが策定した**Model Context Protocol（MCP）**に準拠し、AIエージェントがFigmaデザインを理解してコードを生成できるようにする。

従来、AIにデザイン情報を伝えるにはスクリーンショットやAPIレスポンスの手動コピペが必要だった。MCP Serverはこれを自動化し、**デザイン意図をLLMに直接伝達**する。

この記事では、Figma MCP Serverが提供する**全13ツール**を4カテゴリに分類し、各ツールの用途・使い方・実践的なプロンプト例を詳細に解説する。

---

## ツール一覧（4カテゴリ × 13ツール）

| カテゴリ | ツール数 | 主な用途 |
|----------|----------|----------|
| **読み取り系（Figma → コード）** | 5 | デザイン情報をコードに変換 |
| **書き込み系（コード → Figma）** | 2 | UIやダイアグラムをFigmaに生成 |
| **Code Connect連携** | 4 | Figmaコンポーネントとコードをマッピング |
| **ユーティリティ** | 2 | 認証確認・ルール生成 |

---

## 🔍 読み取り系（Figma → コード）— 5ツール

デザインファイルから情報を取得し、コード生成に活用するツール群。

---

### 1. `get_design_context` ⭐最重要

**概要**: ノードのUIコードを生成（デフォルトはReact + Tailwind）

| 項目 | 詳細 |
|------|------|
| **対応ファイル** | Figma Design, Figma Make |
| **出力形式** | React + Tailwind（カスタマイズ可能） |
| **含まれる情報** | スクリーンショット、デザイントークン、Code Connect情報 |
| **制限** | Remote Serverはリンクベースのみ（選択ベースはDesktop Server） |

#### なぜ最重要か

`get_design_context`は、Figmaデザインを**LLMが理解しやすい形式**にエンコードする。単なるスクリーンショットではなく、レイアウト構造・スタイリング・コンポーネント情報を含む構造化データを返す。

出力がReactライクなのは、AIが大量のWebコードで訓練されているため。この形式を中間表現として、AIが任意のフレームワークに変換する。

#### プロンプト例

**フレームワークを指定:**
```
generate my Figma selection in Vue
generate my Figma selection in plain HTML + CSS
generate my Figma selection in iOS SwiftUI
```

**既存コンポーネントを使用:**
```
generate my Figma selection using components from src/components/ui
```

**組み合わせ:**
```
generate my Figma selection using components from src/ui and style with Tailwind
implement this using Chakra UI components
```

**ファイルパスを指定:**
```
Add this component to src/components/marketing/PricingCard.tsx
```

#### Code Connect連携

Code Connectが設定されている場合、`get_design_context`は**実際のコードコンポーネントへの参照**を含む。これにより、AIは「このFigmaコンポーネントは `src/components/Button.tsx` に対応する」と認識し、正しいimportを生成できる。

複数のCode Connectマッピング（React + SwiftUI等）がある場合:
- **Desktop Server**: Dev Modeで選択中のマッピングを使用
- **Remote Server**: `clientFrameworks`パラメータで指定（例: "React", "SwiftUI"）

---

### 2. `get_screenshot`

**概要**: 指定ノードのスクリーンショットを取得

| 項目 | 詳細 |
|------|------|
| **対応ファイル** | Figma Design, FigJam |
| **用途** | レイアウトの忠実度を保つための視覚情報補完 |
| **推奨設定** | ON（トークン制限が厳しい場合のみOFF） |

#### なぜ必要か

メタデータだけでは伝わらない**視覚的な文脈**を提供する。例えば:
- 複数画面の全体フロー
- インタラクティブなコンテンツの配置意図
- モバイル/デスクトップのレスポンシブ構成

#### 使用シーン

- 複雑なレイアウトの全体像を把握させる
- デザイン意図の「雰囲気」を伝える
- メタデータとコードの補足情報として

---

### 3. `get_metadata`

**概要**: ノード/ページの構造をXMLで取得

| 項目 | 詳細 |
|------|------|
| **対応ファイル** | Figma Design |
| **出力形式** | XML（ID、レイヤー名、座標、サイズ、タイプ） |
| **用途** | 大規模デザインの分割処理、構造分析 |

#### 返されるデータ

```xml
<Frame id="123:456" name="Header" x="0" y="0" width="1440" height="80">
  <Text id="123:457" name="Logo" x="20" y="25" />
  <Frame id="123:458" name="NavLinks" x="200" y="20" />
</Frame>
```

#### 使い方

1. まず`get_metadata`で全体構造を取得
2. AIが構造を分析し、必要なノードを特定
3. 特定ノードに対して`get_design_context`を呼び出し

**メリット**: 巨大なデザインファイルでも、必要な部分だけを効率的に処理できる。トークン消費を抑えつつ、精度の高いコード生成が可能。

---

### 4. `get_variable_defs`

**概要**: デザイン変数の定義を取得

| 項目 | 詳細 |
|------|------|
| **対応ファイル** | Figma Design |
| **取得できる情報** | カラー、フォント、スペーシング、その他の変数 |

#### プロンプト例

**すべての変数を取得:**
```
get the variables used in my Figma selection
```

**特定タイプに絞る:**
```
what color and spacing variables are used in my Figma selection?
```

**名前と値の両方:**
```
list the variable names and their values used in my Figma selection
```

#### 実践的な活用

- デザイントークンをCSSカスタムプロパティに変換
- Tailwind設定ファイル（`tailwind.config.js`）の自動生成
- デザインシステムの整合性チェック

---

### 5. `get_figjam`

**概要**: FigJamファイル専用の読み取り

| 項目 | 詳細 |
|------|------|
| **対応ファイル** | FigJam |
| **出力形式** | XML（get_metadataと同様 + ノードのスクリーンショット） |
| **用途** | アーキテクチャ図、ワークフロー図の取り込み |

#### 使用シーン

- FigJamで描いたアプリ構成図をコードに反映
- ユーザーフロー図からルーティング設計を生成
- ホワイトボードのアイデアを構造化データに変換

---

## ✍️ 書き込み系（コード → Figma）— 2ツール

AIが生成したものをFigmaに送り込むツール群。

---

### 6. `generate_figma_design` ⭐注目

**概要**: WebページをFigmaデザインに変換

| 項目 | 詳細 |
|------|------|
| **対応ファイル** | Figma Design |
| **制限** | **Claude Code専用、Remote Server専用** |
| **出力先** | 新規ファイル / 既存ファイル / クリップボード |

#### Claude Code to Figma

これは**逆方向のワークフロー**—実行中のUIをFigmaに送り返す機能。

#### セットアップ

1. Remote Figma MCP Serverを設定（Claude Code向け）
2. Claude Codeでプロンプト

#### プロンプト例

**新規ファイルに:**
```
Start a local server for my app and capture the UI in a new Figma file.
```

**既存ファイルに:**
```
Start a local server for my app and capture the UI in [Figmaファイル URL].
```

**クリップボードに:**
```
Start a local server for my app and capture the UI to my clipboard.
```

#### 動作フロー

1. Claudeがローカルサーバーを起動
2. ブラウザウィンドウが開く
3. ツールバーで「Entire screen」または「Select element」を選択
4. 「Open file」でFigmaに送信

#### ユースケース

- 実装したUIをデザイナーにレビュー依頼
- 本番UIとデザインファイルの同期
- プロトタイプから逆生成してデザイン資産化

---

### 7. `generate_diagram`

**概要**: Mermaid構文からFigJamダイアグラムを生成

| 項目 | 詳細 |
|------|------|
| **対応ファイル** | ファイル不要（FigJamに直接生成） |
| **入力** | Mermaid.js構文 or 自然言語 |
| **対応図種** | フローチャート、ガントチャート、ステート図、シーケンス図 |

#### プロンプト例

**自然言語から:**
```
create a flowchart for the user authentication flow using the Figma MCP generate_diagram tool
generate a gantt chart for the project timeline using the Figma MCP generate_diagram tool
generate a sequence diagram for the payment processing system
```

**Mermaid構文から:**
```
create a diagram from this mermaid syntax:
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
```

#### ポイント

自然言語でリクエストすると、AIがMermaid構文を生成して`generate_diagram`を呼び出す。明示的に「use the Figma MCP generate_diagram tool」と指示すると確実。

---

## 🔗 Code Connect連携 — 4ツール

Figmaコンポーネントとコードベースのコンポーネントをマッピングするツール群。

---

### Code Connectとは

**Code Connect**は、Figmaのデザインコンポーネントと実際のコードコンポーネントを紐づける仕組み。設定すると:

- Dev Modeで**本物のコードスニペット**が表示される
- MCP経由でAIが**正確なimport文**を生成できる
- デザイン↔コードの**整合性**が保たれる

#### 設定方法

**Code Connect UI（新方式）:**
- Figma内で完結
- GitHubと直接連携
- 自動マッピング機能あり

**Code Connect CLI（従来方式）:**
- ローカルで設定ファイルを記述
- 複数フレームワーク対応（React, SwiftUI, Compose等）

```tsx
// Button.figma.tsx
import figma from '@figma/code-connect/react'

figma.connect(Button, 'https://figma.com/...', {
  props: {
    label: figma.string('Text Content'),
    disabled: figma.boolean('Disabled'),
    size: figma.enum('Size', {
      Large: 'large',
      Medium: 'medium',
      Small: 'small',
    }),
  },
  example: ({ disabled, label, size }) => (
    <Button size={size} disabled={disabled}>
      <Text>{label}</Text>
    </Button>
  ),
})
```

---

### 8. `get_code_connect_map`

**概要**: ノードに紐づいたコードコンポーネントのマッピングを取得

| 項目 | 詳細 |
|------|------|
| **対応ファイル** | Figma Design |
| **返却値** | `{ nodeId: { codeConnectSrc, codeConnectName } }` |

#### 返されるデータ例

```json
{
  "123:456": {
    "codeConnectSrc": "src/components/Button.tsx",
    "codeConnectName": "Button"
  },
  "123:789": {
    "codeConnectSrc": "src/components/Card.tsx",
    "codeConnectName": "Card"
  }
}
```

#### 用途

- AIがどのコンポーネントをimportすべきか判断
- 既存コンポーネントの再利用を促進
- デザインシステムとの整合性確保

---

### 9. `get_code_connect_suggestions`

**概要**: ノードとコードを紐づける戦略の提案を取得

| 項目 | 詳細 |
|------|------|
| **対応ファイル** | Figma Design |
| **トリガー** | Figmaがプロンプト（AIへの推奨） |
| **用途** | まだマッピングされていないコンポーネントの提案 |

#### 動作

1. Figmaが「このノードはコードのどれに対応しそうか」を分析
2. 候補を提案
3. ユーザー/AIが確認して`send_code_connect_mappings`で確定

---

### 10. `add_code_connect_map`

**概要**: ノードとコードコンポーネントを手動でマッピング

| 項目 | 詳細 |
|------|------|
| **対応ファイル** | Figma Design |
| **用途** | 単一のマッピングを追加 |

#### 使用シーン

- 提案が不正確だった場合の手動修正
- 新しいコンポーネントの登録
- 特定のバリアントをマッピング

---

### 11. `send_code_connect_mappings`

**概要**: 複数のマッピングを一括送信

| 項目 | 詳細 |
|------|------|
| **対応ファイル** | Figma Design |
| **前提** | `get_code_connect_suggestions`の後に使用 |

#### ワークフロー

1. `get_code_connect_suggestions`で提案を取得
2. 内容を確認・調整
3. `send_code_connect_mappings`で一括適用

---

## 🔧 ユーティリティ — 2ツール

認証確認やルール生成など、補助的な機能。

---

### 12. `whoami`

**概要**: 認証中のユーザー情報を確認

| 項目 | 詳細 |
|------|------|
| **対応ファイル** | 不要 |
| **制限** | **Remote Server専用** |
| **返却値** | メールアドレス、所属プラン、シートタイプ |

#### 用途

- MCP接続が正しく認証されているか確認
- 複数アカウント使用時のアカウント確認
- 権限（シートタイプ）の確認

---

### 13. `create_design_system_rules`

**概要**: デザインシステムルールを生成するプロンプトを取得

| 項目 | 詳細 |
|------|------|
| **対応ファイル** | 不要 |
| **出力** | ルールファイル（`rules/` or `instructions/` に保存） |

#### 何を生成するか

AIエージェントが**デザインシステムに沿ったコード**を生成するためのガイドライン。

含まれる内容:
- 使用するフレームワーク・ライブラリ
- ファイル構造の規約
- 命名規則
- レイアウトシステム（Flexbox, Grid等）
- コンポーネントの使い方

#### セットアップ

1. `create_design_system_rules`を実行
2. 出力を`rules/`または`instructions/`ディレクトリに保存
3. AIエージェントがコード生成時に参照

---

## ベストプラクティス

### プロンプトの書き方

MCPはFigmaの構造化データを提供するが、**何を生成するかはプロンプト次第**。

**効果的なプロンプトの要素:**
1. **フレームワーク/スタイル**を指定（SwiftUI, Chakra UI等）
2. **ファイルパス**を指定（src/components/ui等）
3. **既存コード**との統合方法を指示
4. **レイアウトシステム**を明示（Flexbox, Grid等）

**例:**
```
Implement the selected frame using Chakra UI components.
Add this component to src/components/marketing/PricingCard.tsx.
Use our Stack layout component for spacing.
```

### Code Connectの設定

Code Connectを設定すると出力品質が**劇的に向上**:

| 設定なし | 設定あり |
|----------|----------|
| 汎用的なReactコード | 実際のコンポーネントを使用 |
| 推測ベースのimport | 正確なファイルパス |
| デザインシステムとの乖離 | 整合性の確保 |

### 大規模デザインの処理

1. `get_metadata`で全体構造を取得
2. 必要なセクションを特定
3. セクションごとに`get_design_context`を呼び出し
4. 最後に統合

---

## Make連携

**Figma Make**（旧称: Figma Prototype）のプロジェクトからコードリソースを取得する機能。

### 概要

Makeで作成したプロトタイプのコードを、本番コードベースに取り込める。

### ワークフロー例

1. MakeのプロジェクトリンクをAIに共有
2. 「このMakeファイルからポップアップコンポーネントの振る舞いとスタイルを取得して、既存のポップアップコンポーネントに実装して」
3. AIがMakeからコンテキストを取得し、既存コードを拡張

---

## まとめ

Figma MCP Serverの全13ツールを4カテゴリで整理:

### 読み取り系（5ツール）
| ツール | 用途 |
|--------|------|
| `get_design_context` | UIコード生成（最重要） |
| `get_screenshot` | 視覚情報の補完 |
| `get_metadata` | 構造のXML表現 |
| `get_variable_defs` | デザイントークン取得 |
| `get_figjam` | FigJam専用読み取り |

### 書き込み系（2ツール）
| ツール | 用途 |
|--------|------|
| `generate_figma_design` | UI→Figma変換（Claude Code専用） |
| `generate_diagram` | Mermaid→FigJam |

### Code Connect連携（4ツール）
| ツール | 用途 |
|--------|------|
| `get_code_connect_map` | マッピング取得 |
| `get_code_connect_suggestions` | 提案取得 |
| `add_code_connect_map` | 手動マッピング |
| `send_code_connect_mappings` | 一括適用 |

### ユーティリティ（2ツール）
| ツール | 用途 |
|--------|------|
| `whoami` | 認証情報確認 |
| `create_design_system_rules` | ルール生成 |

### ソロビルダーへの推奨

1. **まず試す**: `get_design_context` + シンプルなプロンプト
2. **精度を上げる**: Code Connectを設定
3. **逆方向も**: `generate_figma_design`でUIをFigmaに
4. **自動化**: `create_design_system_rules`でルール整備

---

## 📚 関連記事

- [Figma Developer Docs 完全ガイド — Plugin API、REST API、MCPの全体像](/news/figma-developer-docs-guide)

## 🏷️ 関連プロダクト

- [Claude Code](/products/claude-code)
- [Cursor](/products/cursor)
- [Model Context Protocol (MCP)](/products/mcp)
