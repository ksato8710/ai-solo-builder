# AI Solo Craft ワークフロー全体像

記事作成ワークフロー、スキル体系、自動化設定の全体像を定義する。

> 各ワークフローの詳細手順:
> - Digest（朝刊）: `docs/operations/WORKFLOW-DIGEST.md`
> - 個別記事: `docs/operations/WORKFLOW-INDIVIDUAL.md`

---

## ドキュメント体系

```
┌──────────────────────────────────────────────────────┐
│              WORKFLOW-OVERVIEW.md（本ドキュメント）      │
│              全体像・スケジュール・スキル・自動化          │
└──────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ WORKFLOW-     │ │ WORKFLOW-     │ │ CHECKLIST.md  │
│ DIGEST.md    │ │ INDIVIDUAL.md│ │ (品質ゲート)   │
│ (朝刊)       │ │ (深掘り記事)  │ │               │
└───────────────┘ └───────────────┘ └───────────────┘
```

---

## ワークフロータイプ

| 観点 | Digestワークフロー | 個別記事ワークフロー |
|------|-------------------|---------------------|
| **目的** | 速報性・全体像把握 | 深さ・独自価値 |
| **記事種別** | digest (morning) | news (dev-knowledge / case-study) |
| **時間軸** | 当日〜前日のニュース | タイムレス or 旬のテーマ |
| **記事長** | 3,000〜5,000字 | 8,000〜20,000字 |
| **読了時間** | 5〜8分 | 10〜20分 |
| **更新頻度** | 毎日1回（朝刊） | 週2〜3本 |
| **cron** | asb-morning-digest | asb-midday-editorial |
| **自動化度** | 高い（5 Phase パイプライン） | 中程度（リサーチは手動要素多い） |
| **詳細** | `WORKFLOW-DIGEST.md` | `WORKFLOW-INDIVIDUAL.md` |

---

## スキル体系

### スキル一覧と対応ワークフロー

| スキル名 | 場所 | Digest | 個別記事 | 説明 |
|----------|------|:------:|:--------:|------|
| **news-research** | `~/.clawdbot/skills/news-research/` | Phase 1 | △※ | ニュース収集・一次ソース確認・DB保存 |
| **news-evaluation** | `~/.clawdbot/skills/news-evaluation/` | Phase 2 | - | 期間フィルタ・NVA・Top10選定 |
| **digest-writer** | `~/.clawdbot/skills/digest-writer/` | Phase 3 | - | Digest + Top3記事作成 |
| **content-optimizer** | `~/.clawdbot/skills/content-optimizer/` | Phase 4 | Phase 5 | UIレベルの読みやすさ向上・表組み最適化 |
| **publish-gate** | `~/.clawdbot/skills/publish-gate/` | Phase 5 | Phase 6 | 最終チェック・デプロイ・報告 |
| **article-quality-check** | `~/.clawdbot/skills/article-quality-check/` | ✅ | ✅ | 投稿前の品質チェック |
| **site-checker** | `~/.clawdbot/skills/site-checker/` | ✅ | ✅ | 公開後のUI確認 |

※ 個別記事のリサーチは、news-research の手法を参考にしつつ、より深いリサーチを手動で行う

### スキル間の依存関係

#### Digest

```
news-research → news-evaluation → digest-writer → content-optimizer → publish-gate → 公開完了
```

#### 個別記事

```
[手動リサーチ] → [記事執筆] → content-optimizer → article-quality-check → publish-gate → 公開完了
```

---

## cron設定（2026-03-02 更新）

### cronジョブ一覧

| ジョブ名 | 実行基盤 | スケジュール | 状態 | 説明 |
|----------|----------|--------------|------|------|
| `collect-sources` | Vercel Cron | 毎日 15:00 JST (`0 6 * * *` UTC) | **稼働中** | RSS/API/Scrape 自動収集 + タイトル翻訳 |
| `send-newsletter` | Vercel Cron | 毎日 08:15 JST (`15 23 * * *` UTC) | **稼働中** | 朝刊 Digest をメール配信 |
| `score-items` | 手動API | — | API実装済 | NVA 5軸スコアリング（`/api/cron/score-items`） |
| 朝刊Digest作成 | Claude Code | 07:30 JST 目標 | 手動実行 | 5 Phase パイプライン |
| 個別記事作成 | Claude Code | 不定期 | 手動実行 | dev-knowledge / case-study |

> **Note:** Vercel Hobby プランは cron 最大2件。`score-items` はスケジュール枠がないため手動トリガー。

### cron → ワークフロー → スキル の対応

```
15:00 JST  collect-sources (Vercel Cron)
     │  source_crawl_configs → RSS/API/Scrape → 重複排除 → タイトル翻訳
     ▼
collected_items (status=new)
     │
     │  score-items (手動トリガー)
     │  scoring_config → NVA 5軸 → スコア・分類・タグ付け
     ▼
collected_items (status=scored)
     │
     │  朝刊Digest作成 (Claude Code / 手動 07:30 JST)
     │  Phase 1-5: 調査 → 評価 → 執筆 → UI最適化 → 公開
     ▼
contents テーブル + 本番サイト公開
     │
     │  08:15 JST  send-newsletter (Vercel Cron)
     │  最新digest → 購読者リスト → Resend API → バッチ送信
     ▼
newsletter 配信完了
```

---

## チェックリストとの関係

| 段階 | Digestワークフロー | 個別記事ワークフロー | 対応チェック項目 |
|------|-------------------|---------------------|------------------|
| リサーチ | Phase 1-2 | Phase 1-3 | 一次ソースURL確認、発表日確認 |
| 執筆 | Phase 3 | Phase 4-5 | Frontmatter整合性、画像設定 |
| 公開前 | Phase 4-5 | Phase 5-6 | validate:content, sync:content:db, build |
| 公開後 | 自動 | 自動 | UI表示確認、OGP確認 |

詳細は `docs/operations/CHECKLIST.md` を参照。

---

## データフロー

### news_candidates テーブル（Digest用）

```sql
CREATE TABLE news_candidates (
  id UUID PRIMARY KEY,
  edition TEXT NOT NULL,           -- 'morning'
  target_date DATE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  source_url TEXT NOT NULL,        -- 一次ソース（必須）
  source_name TEXT,
  published_at TIMESTAMPTZ,        -- 発表日時（必須）

  -- Phase 2で追加
  status TEXT DEFAULT 'collected', -- collected | evaluated | selected | rejected
  nva_n INT, nva_v INT, nva_a INT, nva_c INT, nva_t INT,
  nva_score INT,
  nva_tier TEXT,
  rank INT,
  top3 BOOLEAN DEFAULT false,

  collected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### ステータス遷移

```
collected → evaluated → selected → (記事作成後) completed
                     ↘ rejected
```

---

## ソース管理システム

### 概要

**目的:** 記事の信頼性担保・ソース品質の継続的向上

**機能:**
- 自動ソース検出・分類・信頼度算出
- 記事作成時の自動ソース登録
- 月次メンテナンス・品質管理

### ソーステーブル

```sql
CREATE TABLE sources (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  url TEXT NOT NULL,
  source_type TEXT NOT NULL,        -- 'primary' | 'secondary' | 'tertiary'
  credibility_score DECIMAL(3,1),   -- 1.0〜10.0
  verification_level TEXT,          -- 'official' | 'editorial' | 'community'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### ソース分類基準

| タイプ | 説明 | 信頼度範囲 | 例 |
|--------|------|-----------|-----|
| **primary** | 公式発表・一次情報 | 8.0〜10.0 | OpenAI Blog, Anthropic Blog, Google AI |
| **secondary** | 技術メディア・編集記事 | 6.0〜8.0 | TechCrunch, Ars Technica, Bloomberg |
| **tertiary** | コミュニティ・まとめ | 3.0〜6.0 | Hacker News, Reddit, Medium |

### ワークフローへの統合

| Phase | 従来機能 | + ソース管理機能 |
|-------|----------|----------------|
| Phase 1: news-research | ソース巡回・URL確認 | + 自動ソース検出・分類・登録 |
| Phase 2: news-evaluation | NVAスコアリング | + ソース信頼度考慮評価 |
| Phase 3: digest-writer | 記事作成 | + ソース情報自動登録・メタ記録 |
| Phase 5: publish-gate | 品質チェック | + ソース整合性確認・検証 |

### 実績（2026-02-13完了）

- 既存記事ソース紐づけ: 72/93記事（77%成功率）
- 新規記事自動ソース検出: 100%成功率
- 月次メンテナンス: cron設定完了
- ソース品質管理: 80件新規登録・信頼度自動更新

---

## 良い記事の基準

### Digest記事

| 指標 | 基準 |
|------|------|
| 文字数 | 3,000〜5,000字 |
| 読了時間 | 5〜8分 |
| Top10 | NVA評価に基づくランキング |
| Top3 | 個別記事へのリンク |
| 一次ソース | 全ニュースに明記 |

### 個別記事

| 指標 | 基準 |
|------|------|
| 文字数 | 8,000〜20,000字 |
| 読了時間 | 10〜20分 |
| 独自価値 | 「ここでしか読めない」要素 |
| 実証データ | 数字・事例・比較表 |
| 行動可能性 | 読後に何をすべきか明示 |

### 避けるべきパターン

- テンプレート集のみ（実証なし）
- 公式ドキュメントの言い換え（独自価値なし）
- 「〜が重要です」で終わる（行動に移せない）
- 形容詞だけの説明（具体性なし）

---

## 関連ドキュメント

| ドキュメント | 場所 | 内容 |
|-------------|------|------|
| Digestワークフロー詳細 | `docs/operations/WORKFLOW-DIGEST.md` | 朝刊の5Phase手順 |
| 個別記事ワークフロー詳細 | `docs/operations/WORKFLOW-INDIVIDUAL.md` | 3記事タイプ別の手順 |
| 品質チェックリスト | `docs/operations/CHECKLIST.md` | 品質基準・自動化状況 |
| コンテンツポリシー | `specs/content-policy/spec.md` | taxonomy・リンク規則 |
| DBスキーマ | `specs/content-model-db/spec.md` | エンティティ設計 |

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| **2026-02-16** | ドキュメント再構成: 3分割（OVERVIEW / DIGEST / INDIVIDUAL） |
| 2026-02-16 | publish-gate に UI確認（PC+モバイル）責務を追加 |
| 2026-02-13 | ソース管理システム実装完了 |
| 2026-02-13 | content-optimizer スキル追加、5 Phase ワークフローに拡張 |
| 2026-02-12 | 個別記事ワークフロー追加、2種類のワークフロータイプに整理 |
| 2026-02-12 | 初版作成 |
