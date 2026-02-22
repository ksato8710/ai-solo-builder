---
title: "【arXiv速報】MCPツール記述の97%に「コードの臭い」— AIエージェント効率化の盲点"
slug: "arxiv-mcp-tool-descriptions-smells-2026-02-20"
date: "2026-02-20"
publishedAt: "2026-02-20T07:00:00+09:00"
description: "103のMCPサーバー、856のツールを分析した結果、97.1%のツール記述に欠陥があることが判明。56%が目的すら明確に述べていない。記述を改善すれば成功率5.85%向上するが、トークン消費とのトレードオフも。"
summary: "103のMCPサーバー、856のツールを分析した結果、97.1%のツール記述に欠陥があることが判明。56%が目的すら明確に述べていない。記述を改善すれば成功率5.85%向上するが、トークン消費とのトレードオフも。"
image: "https://images.unsplash.com/photo-1550063873-ab792950096b?w=800&h=420&fit=crop"
contentType: "news"
readTime: 6
featured: false
tags: ["dev-knowledge", "arXiv論文", "MCP", "AIエージェント", "プロンプトエンジニアリング"]
relatedProducts: []
---

## 📊 NVA評価

| 項目 | スコア | 理由 |
|------|--------|------|
| 新規性 (Novelty) | ★★★★☆ | MCP特化の品質分析は初めて |
| 価値 (Value) | ★★★★★ | MCPを使う全員に直接影響 |
| 実行可能性 (Actionability) | ★★★★★ | 今日から改善可能 |

**総合スコア: 4.7/5.0** — MCPでAIエージェントを作るソロビルダー必読

---

## 概要

MCPサーバーを作ったことがあるなら、きっと覚えがあるはず：

> 「このツールの説明、適当に書いたな…」

研究者たちが**103のMCPサーバー、856のツール**を徹底分析した結果：

| 発見 | 数値 |
|------|------|
| 何らかの「臭い」があるツール | **97.1%** |
| 目的が不明確なツール | **56%** |
| 改善後の成功率向上 | **+5.85%** |
| 改善後のステップ数増加 | **+67.46%** |

**ほぼ全てのMCPツールが、書き方に問題を抱えている。**

---

## 6つのツール記述コンポーネント

研究チームは、良いツール記述に必要な6つの要素を特定した：

### 1. 目的（Purpose）
ツールが**何をするか**の明確な説明。

❌ 悪い例：
```json
{
  "name": "search",
  "description": "Searches stuff"
}
```

✅ 良い例：
```json
{
  "name": "search",
  "description": "Searches the project codebase for files and symbols matching the given query"
}
```

### 2. ドメイン（Domain）
ツールが**どの分野/領域**で使われるか。

### 3. 入力仕様（Input Specification）
引数の**型、フォーマット、制約**。

### 4. 出力仕様（Output Specification）
返り値の**構造と意味**。

### 5. 使用例（Examples）
**具体的な使用シナリオ**。

### 6. 注意事項（Caveats）
**制限、副作用、前提条件**。

---

## 発見された「ツール記述の臭い」

### 臭い1: 曖昧な目的

**最も多い問題。56%のツールが該当。**

```json
// 臭い
{
  "description": "Handles the thing"
}

// 改善
{
  "description": "Converts markdown files to HTML, preserving frontmatter metadata"
}
```

### 臭い2: 入力の説明不足

引数があるのに、何を渡すべきか不明。

```json
// 臭い
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "data": { "type": "string" }
    }
  }
}

// 改善
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "data": {
        "type": "string",
        "description": "JSON-encoded array of user IDs to process, max 100 items"
      }
    }
  }
}
```

### 臭い3: 出力が不明

ツールを呼んだ後、**何が返ってくるかわからない**。

### 臭い4: 例示なし

「こう使う」という具体例がない。LLMは**例から学ぶのが得意**なのに。

### 臭い5: 副作用の非開示

ファイルを書き込む、APIを呼ぶ、課金が発生する…といった副作用が書かれていない。

---

## 改善の効果とトレードオフ

### 良いニュース

全てのコンポーネントを適切に書くと：

| 指標 | 改善幅 |
|------|--------|
| タスク成功率 | **+5.85%** |
| 部分目標達成率 | **+15.12%** |

### 注意が必要なニュース

| 指標 | 変化 |
|------|------|
| 実行ステップ数 | **+67.46%** |
| 性能が下がったケース | **16.67%** |

**なぜステップ数が増えるのか？**

詳細な記述により、LLMが：
- より多くの情報を処理する
- より慎重に判断する
- 結果として呼び出し回数が増える

**なぜ逆効果のケースがあるのか？**

- 記述が長すぎてコンテキストを圧迫
- 余計な情報がノイズになる
- タスクによっては簡潔な方が良い

---

## 最適なバランスを見つける

研究チームは「コンパクトな変種」も検証：

> 全コンポーネントではなく、**タスクに応じた組み合わせ**を選ぶと、信頼性を維持しつつトークン消費を抑えられる

### 推奨アプローチ

**必須コンポーネント（常に含める）：**
- 目的（Purpose）
- 入力仕様（Input Specification）

**状況に応じて追加：**
- 複雑なツール → 使用例（Examples）
- 副作用があるツール → 注意事項（Caveats）
- 構造化された出力 → 出力仕様（Output Specification）

---

## ソロビルダーへの示唆

### 1. 今すぐできる：自分のMCPツールを監査

自作MCPサーバーがあるなら、各ツールをチェック：

```bash
# チェックリスト
□ 目的が1文で明確に述べられているか
□ 各引数の意味と制約が説明されているか
□ 返り値の構造がわかるか
□ 副作用（ファイル書き込み、API呼び出し等）が明記されているか
```

### 2. 記述テンプレート

これをベースに書き始めると「臭い」を避けやすい：

```json
{
  "name": "tool_name",
  "description": "[動詞]で[対象]を[結果にする]。[ドメイン]で使用。",
  "inputSchema": {
    "type": "object",
    "properties": {
      "param1": {
        "type": "string",
        "description": "[何を渡すか]。[フォーマット/制約]。例: [具体例]"
      }
    },
    "required": ["param1"]
  }
}
```

### 3. トークン消費を意識した設計

MCPツールのメタデータは**毎回のリクエストに含まれる**。

つまり：
- 冗長な記述 → APIコスト増
- 簡潔すぎる記述 → 呼び出しミス増

**バランスが重要。**

### 4. 実際に測定する

「感覚」ではなく**データで判断**：

```python
# 改善前後で比較
metrics = {
    "task_success_rate": [],
    "total_steps": [],
    "total_tokens": []
}

# A/Bテストで検証
```

---

## 実践例：改善Before/After

### Before（臭いあり）

```json
{
  "name": "read_file",
  "description": "Reads a file"
}
```

### After（臭い除去）

```json
{
  "name": "read_file",
  "description": "Reads the content of a text file and returns it as a string. Supports UTF-8 encoding. Maximum file size: 10MB.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "Relative or absolute path to the file. Example: 'src/main.py' or '/home/user/data.txt'"
      },
      "encoding": {
        "type": "string",
        "description": "Character encoding. Default: 'utf-8'. Options: 'utf-8', 'ascii', 'latin-1'",
        "default": "utf-8"
      }
    },
    "required": ["path"]
  }
}
```

**この改善で期待される効果：**
- LLMがpathの形式を正しく理解
- エンコーディングエラーの減少
- 大きすぎるファイルへのアクセス試行が減少

---

## MCPエコシステムへの影響

### 短期的（今〜3ヶ月）

- [ ] 主要MCPサーバーの記述品質向上
- [ ] Lintingツールの登場（「MCP Description Linter」）
- [ ] ベストプラクティスガイドの整備

### 中期的（3〜12ヶ月）

- [ ] MCP仕様に「推奨記述フォーマット」追加
- [ ] 自動記述生成ツール
- [ ] エージェントが記述品質を自己診断

---

## 技術的詳細（興味ある人向け）

### FM-based Scanner

研究チームは、記述品質を自動評価するLLMベースのスキャナーを開発：

```
ツール記述 → LLM評価 → 6コンポーネント各スコア → 総合品質スコア
```

このスキャナー自体がMCPサーバーとして公開されれば、**自分のサーバーを自動監査**できるようになる。

### コンポーネント削除実験

各コンポーネントを1つずつ削除して影響を測定：

| 削除したコンポーネント | 成功率への影響 |
|-----------------------|---------------|
| 目的 | **-12.3%** |
| 入力仕様 | **-8.7%** |
| 使用例 | -3.2% |
| 出力仕様 | -2.1% |
| 注意事項 | -1.8% |
| ドメイン | -0.9% |

**目的と入力仕様が圧倒的に重要**という結果。

---

## まとめ

MCPツールを作るとき、記述は「おまけ」ではない。

**97.1%のツールに問題がある**という事実は、裏を返せば：

> **記述を丁寧に書くだけで、競合の97%より良いツールになる**

今日から意識するだけで、AIエージェントの性能が変わる。

---

## 参考

- **論文**: Model Context Protocol (MCP) Tool Descriptions Are Smelly! Towards Improving AI Agent Efficiency with Augmented MCP Tool Descriptions
- **著者**: Mohammed Mehedi Hasan et al.
- **arXiv**: 2602.14878
- **タグ**: #software-engineering #MCP #AI-agents

---

*この記事はarXiv最新論文から、AI Solo Builder読者に特に関連性の高いものを選定してお届けしています。*
