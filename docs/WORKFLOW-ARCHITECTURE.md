# AI Solo Builder ワークフローアーキテクチャ

このドキュメントは、AI Solo Builder の記事作成ワークフロー、スキル、チェックリストの関係性を包括的に定義する。

---

## 📋 ドキュメント体系

```
┌─────────────────────────────────────────────────────────────────┐
│                    WORKFLOW-ARCHITECTURE.md                      │
│                    （本ドキュメント・包括）                        │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  ワークフロー   │     │    スキル     │     │ チェックリスト │
│   (プロセス)   │     │  (実行手順)   │     │  (品質ゲート)  │
└───────────────┘     └───────────────┘     └───────────────┘
        │                       │                       │
        ├─ Digestワークフロー   │                       │
        └─ 個別記事ワークフロー  │                       │
                                │                       │
                                ▼                       ▼
                          ~/.clawdbot/skills/    CHECKLIST.md
                            ├─ news-research/
                            ├─ news-evaluation/
                            ├─ digest-writer/
                            └─ publish-gate/
```

---

## 🎯 ワークフロータイプ

AI Solo Builder の記事作成には **2種類のワークフロー** がある。

| 観点 | Digestワークフロー | 個別記事ワークフロー |
|------|-------------------|---------------------|
| **目的** | 速報性・全体像把握 | 深さ・独自価値 |
| **記事種別** | morning-summary / evening-summary | dev-knowledge / case-study / product |
| **時間軸** | 当日〜前日のニュース | タイムレス or 旬のテーマ |
| **記事長** | 3,000〜5,000字 | 8,000〜20,000字 |
| **読了時間** | 5〜8分 | 10〜20分 |
| **更新頻度** | 毎日2回（朝刊・夕刊） | 週2〜3本 |
| **cron** | asb-morning-digest / asb-evening-digest | asb-midday-editorial |
| **自動化度** | 高い（4 Phase自動化） | 中程度（リサーチは手動要素多い） |

---

## 🔄 Digestワークフロー（朝刊・夕刊）

### 概要

**目的:** 前回Digest以降の重要ニュースをTop10形式で配信し、Top3を個別記事化

**特徴:**
- 4 Phase の自動化されたパイプライン
- NVAスコアリングによる客観的評価
- cron による定時実行

### 4 Phase構成

```
Phase 1          Phase 2          Phase 3          Phase 4
[調査] ──────▶ [評価・選定] ──────▶ [記事作成] ──────▶ [公開]
   │                │                  │                │
   ▼                ▼                  ▼                ▼
news_candidates  selected候補      Markdown記事      本番公開
(DB保存)         (NVA付き)          (Top3個別含む)    (Vercel)
```

### Phase間の責務分離

| Phase | 責務 | 入力 | 出力 | スキル |
|-------|------|------|------|--------|
| 1. 調査 | 一次ソース特定・日付確認・DB保存 | ソース巡回 | news_candidates (collected) | news-research |
| 2. 評価 | 期間フィルタ・NVA・事実確認 | collected候補 | selected候補 (Top10/Top3) | news-evaluation |
| 3. 記事作成 | Digest + Top3個別記事執筆 | selected候補 | Markdownファイル | digest-writer |
| 4. 公開 | チェックリスト照合・デプロイ | Markdownファイル | 本番サイト | publish-gate |

### 日次スケジュール

#### 朝刊（07:30開始 → 08:00公開目標）

```
07:30  news-research (morning)
       ├─ ソース巡回（前日夕刊〜今朝刊の期間）
       └─ news_candidates に8-15件保存

07:40  news-evaluation
       ├─ 期間フィルタ
       ├─ NVAスコアリング
       └─ Top10/Top3選定

07:50  digest-writer
       ├─ Digest記事作成
       ├─ Top3個別記事作成
       └─ プロダクトリンク整備

07:55  publish-gate
       ├─ チェックリスト照合
       ├─ npm run publish:gate
       ├─ git push
       └─ Slack報告

08:00  公開完了
```

#### 夕刊（17:30開始 → 18:00公開目標）

```
17:30  news-research (evening)
       └─ ソース巡回（今朝刊〜今夕刊の期間）

17:40  news-evaluation
       └─ 朝刊との重複排除 + NVA

17:50  digest-writer
       └─ Digest + Top3

17:55  publish-gate
       └─ チェック・デプロイ・報告

18:00  公開完了
```

---

## 📝 個別記事ワークフロー（dev-knowledge / case-study）

### 概要

**目的:** 特定テーマを深掘りし、読者に独自の価値を提供

**特徴:**
- 速報性より「深さ」と「独自性」を重視
- 既存リソースの評価・キュレーションを含む
- リサーチ段階で人間的判断が必要

### 3つの記事型

| 型 | 説明 | 例 |
|----|------|-----|
| **キュレーション型** | 既存リソースを評価・比較し、学習パスを案内 | 「プロンプトエンジニアリング完全ガイド」 |
| **事例分析型** | 成功/失敗事例を深掘り分析し、再現可能な教訓を抽出 | 「Pieter Levelsの事例」 |
| **実践ガイド型** | 特定スキル・ツールを「使えるようになる」ための具体手順 | 「MCP実践ガイド」 |

### 5 Phase構成

```
Phase 1          Phase 2            Phase 3          Phase 4          Phase 5
[テーマ選定] ──▶ [リサーチ] ──────▶ [評価] ──────▶ [設計] ──────▶ [執筆・公開]
   │                │                  │                │                │
   ▼                ▼                  ▼                ▼                ▼
テーマ決定      一次ソース収集      リソース評価      独自価値設計      記事公開
(30分)          (1-2時間)           (1時間)           (30分)           (2-4時間)
```

### Phase詳細

| Phase | 責務 | チェックポイント |
|-------|------|-----------------|
| 1. テーマ選定 | 読者価値・差別化・ソース存在確認 | ターゲット読者に価値があるか |
| 2. リサーチ | 公式ドキュメント・作者発言・海外記事・実践者報告収集 | 一次ソースを最低3つ確保 |
| 3. 評価 | 各リソースを正確性・深さ・実用性・独自性・日本語対応で評価 | 推奨リソースを決定 |
| 4. 設計 | 「この記事でしか得られない価値」を明確化 | 日本向けローカライズ or 比較分析 or 実践検証 |
| 5. 執筆・公開 | 8,000字以上・実例付き・publish-gate | CHECKLIST.md準拠 |

### 曜日別テーマ（平日編集枠 12:30）

| 曜日 | カテゴリ | 内容 |
|------|---------|------|
| 月 | dev-knowledge | 開発ナレッジ（ツール活用、プロンプト設計等） |
| 火 | case-study | 事例紹介（成功事例の分析） |
| 水 | product | プロダクト辞書更新（必要時にproduct-updateニュース） |
| 木 | dev-knowledge | 開発ナレッジ |
| 金 | case-study | 事例紹介 |

---

## 🛠️ スキル体系

### スキル一覧と対応ワークフロー

| スキル名 | 場所 | Digest | 個別記事 | 説明 |
|----------|------|:------:|:--------:|------|
| **news-research** | `~/.clawdbot/skills/news-research/` | ✅ | △※ | ニュース収集・一次ソース確認・DB保存 |
| **news-evaluation** | `~/.clawdbot/skills/news-evaluation/` | ✅ | - | 期間フィルタ・NVA・Top10選定 |
| **digest-writer** | `~/.clawdbot/skills/digest-writer/` | ✅ | - | Digest + Top3記事作成 |
| **publish-gate** | `~/.clawdbot/skills/publish-gate/` | ✅ | ✅ | 最終チェック・デプロイ・報告 |
| **article-quality-check** | `~/.clawdbot/skills/article-quality-check/` | ✅ | ✅ | 投稿前の品質チェック |
| **site-checker** | `~/.clawdbot/skills/site-checker/` | ✅ | ✅ | 公開後のUI確認 |

※ 個別記事のリサーチは、news-researchの手法を参考にしつつ、より深いリサーチを手動で行う

### スキル間の依存関係

#### Digestワークフロー

```
news-research
     │
     │ news_candidates (status=collected)
     ▼
news-evaluation
     │
     │ news_candidates (status=selected, nva_score, rank)
     ▼
digest-writer
     │
     │ content/news/*.md
     ▼
publish-gate
     │
     │ git push → Vercel deploy
     ▼
   公開完了
```

#### 個別記事ワークフロー

```
[手動リサーチ]
     │
     │ 一次ソース・参考記事リスト
     ▼
[記事執筆]
     │
     │ content/news/*.md
     ▼
article-quality-check
     │
     │ 品質基準クリア
     ▼
publish-gate
     │
     │ git push → Vercel deploy
     ▼
   公開完了
```

---

## ⏰ cron設定との対応

### tifa担当のcronジョブ

| ジョブ名 | スケジュール | ワークフロー | 説明 |
|----------|--------------|--------------|------|
| `asb-morning-digest` | 毎日 07:30 JST | Digest | 朝刊作成（4 Phase） |
| `asb-evening-digest` | 毎日 17:30 JST | Digest | 夕刊作成（4 Phase） |
| `asb-midday-editorial` | 平日 12:30 JST | 個別記事 | 曜日別テーマで深掘り記事 |

### cron → ワークフロー → スキル の対応

```
asb-morning-digest / asb-evening-digest
     │
     └─▶ Digestワークフロー（4 Phase）
              ├─ Phase 1: news-research
              ├─ Phase 2: news-evaluation
              ├─ Phase 3: digest-writer
              └─ Phase 4: publish-gate

asb-midday-editorial
     │
     └─▶ 個別記事ワークフロー（5 Phase）
              ├─ Phase 1-4: 手動（リサーチ・評価・設計・執筆）
              └─ Phase 5: publish-gate
```

---

## ✅ チェックリストとの関係

### ワークフロー段階別のチェック項目

| 段階 | Digestワークフロー | 個別記事ワークフロー | 対応チェック項目 |
|------|-------------------|---------------------|------------------|
| リサーチ | Phase 1-2 | Phase 1-3 | 一次ソースURL確認、発表日確認 |
| 執筆 | Phase 3 | Phase 4-5 | Frontmatter整合性、画像設定 |
| 公開前 | Phase 4 | Phase 5 | validate:content, sync:content:db, build |
| 公開後 | 自動 | 自動 | UI表示確認、OGP確認 |

### スキルとチェックリストの対応

| スキル | 対応するチェック項目 |
|--------|---------------------|
| news-research | 一次ソースURL確認、発表日確認 |
| news-evaluation | 期間適切性、事実確認、NVAスコア |
| digest-writer | Frontmatter、Digest構造、画像、リンク |
| article-quality-check | サムネイル、メタデータ、フォーマット |
| publish-gate | ゲート通過、デプロイ確認、Slack報告 |

---

## 🗄️ データフロー

### news_candidates テーブル（Digest用）

```sql
CREATE TABLE news_candidates (
  id UUID PRIMARY KEY,
  edition TEXT NOT NULL,           -- 'morning' | 'evening'
  target_date DATE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  source_url TEXT NOT NULL,        -- 一次ソース（必須）
  source_name TEXT,
  published_at TIMESTAMPTZ,        -- 発表日時（必須）
  
  -- Phase 2で追加
  status TEXT DEFAULT 'collected', -- collected | evaluated | selected | rejected
  nva_n INT,
  nva_v INT,
  nva_a INT,
  nva_c INT,
  nva_t INT,
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

## 📚 良い記事の基準

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

- ❌ テンプレート集のみ（実証なし）
- ❌ 公式ドキュメントの言い換え（独自価値なし）
- ❌ 「〜が重要です」で終わる（行動に移せない）
- ❌ 形容詞だけの説明（具体性なし）

---

## 🔗 関連ドキュメント

| ドキュメント | 場所 | 内容 |
|-------------|------|------|
| チェックリスト | `docs/CHECKLIST.md` | 品質基準・自動化状況 |
| コンテンツポリシー | `specs/content-policy/spec.md` | taxonomy・リンク規則 |
| 運営計画 | `docs/OPERATIONS-PLAN-2026-02-12.md` | 運営方針・優先度 |
| **Digestスキル** | | |
| ├ news-research | `~/.clawdbot/skills/news-research/SKILL.md` | Phase 1 手順 |
| ├ news-evaluation | `~/.clawdbot/skills/news-evaluation/SKILL.md` | Phase 2 手順 |
| ├ digest-writer | `~/.clawdbot/skills/digest-writer/SKILL.md` | Phase 3 手順 |
| └ publish-gate | `~/.clawdbot/skills/publish-gate/SKILL.md` | Phase 4 手順 |
| **共通スキル** | | |
| ├ article-quality-check | `~/.clawdbot/skills/article-quality-check/SKILL.md` | 品質チェック |
| └ site-checker | `~/.clawdbot/skills/site-checker/SKILL.md` | UI確認 |

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-02-12 | 個別記事ワークフローを追加、2種類のワークフロータイプに整理 |
| 2026-02-12 | 初版作成（ワークフロー・スキル・チェックリストの包括整理） |
