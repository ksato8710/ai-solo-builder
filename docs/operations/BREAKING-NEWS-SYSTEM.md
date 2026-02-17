# 速報配信システム設計書

*作成日: 2026-02-18*
*目的: 海外AI/開発ツールの重要情報を、誰よりも早く日本語で届ける*

---

## 📌 概要

**問題:** AI/開発ツールの重要発表は海外発が多く、日本語での情報流通に時間差がある

**解決:** キーパーソンのX投稿を定期監視し、重要情報を検知したら速報記事を自動生成・公開

---

## 👁️ ウォッチリスト

### Tier 1: 最優先監視（公式発表・一次ソース）

| アカウント | カテゴリ | 理由 |
|-----------|----------|------|
| @AnthropicAI | AI企業公式 | Claude関連の公式発表 |
| @OpenAI | AI企業公式 | GPT/ChatGPT公式発表 |
| @cursor_ai | 開発ツール公式 | Cursor公式発表 |
| @figma | デザインツール公式 | Figma公式発表 |
| @vercel | インフラ公式 | Vercel/Next.js公式発表 |
| @suaborase | インフラ公式 | Supabase公式発表 |
| @linear | 開発ツール公式 | Linear公式発表 |
| @NotionHQ | 生産性ツール公式 | Notion公式発表 |

### Tier 2: キーパーソン（業界インフルエンサー）

| アカウント | カテゴリ | 理由 |
|-----------|----------|------|
| @sama | AI企業CEO | OpenAI CEO、業界方針 |
| @daboross | AI企業CEO | Anthropic関連 |
| @dylanf | デザインツールCEO | Figma CEO |
| @karpathy | AI研究者 | 技術トレンドの先行指標 |
| @swyx | 開発者インフルエンサー | AI開発ツールの早期情報 |
| @levelsio | インディーハッカー | ソロ開発者向け事例 |

### Tier 3: 日本語発信者（速報翻訳者）

| アカウント | カテゴリ | 理由 |
|-----------|----------|------|
| @kgsi | 日本発信者 | 海外AI情報の早期キャッチ |
| @y_matsuwitter | 日本発信者 | 開発者向け情報発信 |
| @kajikent | 日本発信者 | AI/LLM関連情報 |

---

## 🔍 監視キーワード

### 製品名・技術キーワード

```
Claude, Claude Code, Anthropic, MCP (Model Context Protocol)
OpenAI, GPT-5, ChatGPT, Codex
Cursor, Windsurf, Cline, Aider
Figma, Figma MCP, Dev Mode
Vercel, Next.js 15, v0
Supabase, Edge Functions
Linear, Notion AI
Agent Teams, AI Agents, Agentic
```

### アクショントリガー（即座に速報化）

```
"just launched", "now available", "introducing", "announcing"
"released", "shipped", "live now", "breaking"
"新機能", "リリース", "発表", "公開"
```

---

## ⚙️ 検知フロー

```
┌─────────────────────────────────────────────────────┐
│  cron: 30分ごと (07:00-23:00 JST)                   │
│  ↓                                                  │
│  xAI API (Grok) でウォッチリスト検索                 │
│  ↓                                                  │
│  重要度判定                                         │
│  - エンゲージメント閾値: likes≥500 or RT≥100       │
│  - キーパーソン発信: Tier1/2は自動通過              │
│  - アクションキーワード含む: 自動通過                │
│  ↓                                                  │
│  重複チェック（過去24時間の速報と比較）              │
│  ↓                                                  │
│  [重要] Slack通知 → 手動判断 → 記事化               │
│  [超重要] 自動速報記事生成 → 公開                   │
└─────────────────────────────────────────────────────┘
```

---

## 📝 速報記事テンプレート

### ファイル名規則

```
/content/news/breaking/YYYY-MM-DD-{slug}.mdx
```

### Frontmatter

```yaml
---
title: "【速報】{タイトル}"
description: "{1行サマリー}"
publishedAt: "{ISO8601}"
contentType: news
tags: ["breaking", "{関連タグ}"]
image: "{OGP画像URL}"
source: "{一次ソースURL}"
sourceType: "x-post"  # x-post | official-blog | press-release
priority: "high"  # high | medium
---
```

### 本文構成

```markdown
## 何が起きたか

{3行以内で要約}

## 一次ソース

<Tweet id="{ツイートID}" />

または

> {引用}
> — [@{アカウント}]({URL})

## 詳細

{技術的な解説、影響範囲}

## 関連プロダクト

- [プロダクト名](/products/{slug}) - {関連性の説明}

## 今後の展望

{推測や期待される影響}

---

*この記事は速報のため、詳細が判明次第更新します。*
```

---

## 🕐 cron設定

### 検知cron（30分間隔）

```yaml
name: asb-breaking-news-watch
schedule:
  kind: cron
  expr: "*/30 7-23 * * *"
  tz: Asia/Tokyo
payload:
  kind: agentTurn
  message: |
    速報監視を実行してください。
    
    1. x-research スキルでウォッチリストを検索
    2. 重要度判定（エンゲージメント、キーパーソン、キーワード）
    3. 重要な情報があれば #tifa に通知
    4. 超重要なら速報記事を作成・公開
sessionTarget: isolated
delivery:
  mode: none  # 通知は検知時のみ
```

---

## 📊 重要度判定基準

| レベル | 条件 | アクション |
|--------|------|------------|
| **超重要** | Tier1公式 + アクションキーワード | 自動記事化・即公開 |
| **重要** | Tier2 + likes≥1000 | Slack通知・手動判断 |
| **注目** | Tier3 + likes≥500 | 次回Digestで言及検討 |
| **参考** | その他 | ログのみ |

---

## 🔧 実装ステップ

### Phase 1: 基盤構築（今日）
- [x] 設計書作成
- [ ] ウォッチリスト設定ファイル作成
- [ ] 速報検知スクリプト作成
- [ ] cron登録

### Phase 2: 検知精度向上（今週）
- [ ] 重複チェックロジック
- [ ] エンゲージメント閾値チューニング
- [ ] 誤検知フィルタ

### Phase 3: 自動化拡張（来週以降）
- [ ] 速報記事の自動生成
- [ ] X自動投稿連携
- [ ] ダッシュボード（検知履歴表示）

---

## 📁 関連ファイル

- ウォッチリスト設定: `/docs/operations/watchlist.json`
- 検知スクリプト: `/scripts/breaking-news-watch.js`
- 速報テンプレート: `/templates/breaking-news.mdx`

---

*「誰よりも早く日本に届ける」ための仕組み。*
