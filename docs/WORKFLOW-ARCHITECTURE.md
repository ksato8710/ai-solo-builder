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

### 5 Phase構成

```
Phase 1          Phase 2          Phase 3          Phase 4           Phase 5
[調査] ──────▶ [評価・選定] ──────▶ [記事作成] ──────▶ [UI最適化] ──────▶ [公開]
   │                │                  │                 │                 │
   ▼                ▼                  ▼                 ▼                 ▼
news_candidates  selected候補      Markdown記事       最適化記事        本番公開
(DB保存)         (NVA付き)          (Top3個別含む)     (読みやすさ向上)   (Vercel)
```

### Phase間の責務分離

| Phase | 責務 | 入力 | 出力 | スキル |
|-------|------|------|------|--------|
| 1. 調査 | 一次ソース特定・日付確認・**自動ソース検出・分類**・DB保存 | ソース巡回 | news_candidates (collected) | news-research |
| 2. 評価 | 期間フィルタ・**ソース信頼度考慮NVA**・事実確認 | collected候補 | selected候補 (Top10/Top3) | news-evaluation |
| 3. 記事作成 | Digest + Top3個別記事執筆・**ソース情報自動登録** | selected候補 | Markdownファイル | digest-writer |
| 4. UI最適化 | 表組み・構造・視覚的メリハリの改善 | Markdownファイル | 最適化記事 | content-optimizer |
| 5. 公開 | チェックリスト照合・**ソース整合性チェック**・デプロイ・**UI確認（PC+モバイル）** | 最適化記事 | 本番サイト | publish-gate |

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

07:48  digest-writer
       ├─ Digest記事作成
       ├─ Top3個別記事作成
       └─ プロダクトリンク整備

07:53  content-optimizer
       ├─ 表組み最適化
       ├─ 視覚的メリハリ改善
       └─ 情報階層明確化

07:57  publish-gate
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

17:48  digest-writer
       └─ Digest + Top3

17:53  content-optimizer
       └─ UI最適化・読みやすさ向上

17:57  publish-gate
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
| **content-optimizer** | `~/.clawdbot/skills/content-optimizer/` | ✅ | ✅ | UIレベルの読みやすさ向上・表組み最適化 |
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
     │ content/news/*.md (初稿)
     ▼
content-optimizer
     │
     │ content/news/*.md (UI最適化済み)
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
     │ content/news/*.md (初稿)
     ▼
content-optimizer
     │
     │ content/news/*.md (UI最適化済み)
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
     └─▶ Digestワークフロー（5 Phase）
              ├─ Phase 1: news-research
              ├─ Phase 2: news-evaluation
              ├─ Phase 3: digest-writer
              ├─ Phase 4: content-optimizer
              └─ Phase 5: publish-gate

asb-midday-editorial
     │
     └─▶ 個別記事ワークフロー（6 Phase）
              ├─ Phase 1-4: 手動（リサーチ・評価・設計・執筆）
              ├─ Phase 5: content-optimizer
              └─ Phase 6: publish-gate
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
| news-research | 一次ソースURL確認、発表日確認、**自動ソース検出・登録** |
| news-evaluation | 期間適切性、事実確認、**ソース信頼度考慮**NVAスコア |
| digest-writer | Frontmatter、Digest構造、画像、リンク、**ソース情報登録** |
| article-quality-check | サムネイル、メタデータ、フォーマット |
| publish-gate | ゲート通過、**ソース整合性チェック**、デプロイ確認、**UI確認（PC+モバイル）**、Slack報告 |

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

## 🔗 ソース管理システム（Phase 4: 運用最適化）

### 概要

**目的:** 記事の信頼性担保・ソース品質の継続的向上

**機能:**
- 自動ソース検出・分類・信頼度算出
- 記事作成時の自動ソース登録
- 月次メンテナンス・品質管理

### ソーステーブル構成

```sql
-- メインソーステーブル
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

-- 記事・ソース関連
ALTER TABLE contents ADD COLUMN primary_source_id UUID REFERENCES sources(id);
ALTER TABLE contents ADD COLUMN source_credibility_score DECIMAL(3,1);
ALTER TABLE contents ADD COLUMN source_verification_note TEXT;
```

### ソース分類基準

| タイプ | 説明 | 信頼度範囲 | 例 |
|--------|------|-----------|-----|
| **primary** | 公式発表・一次情報 | 8.0〜10.0 | OpenAI Blog, Anthropic Blog, Google AI |
| **secondary** | 技術メディア・編集記事 | 6.0〜8.0 | TechCrunch, Ars Technica, Bloomberg |
| **tertiary** | コミュニティ・まとめ | 3.0〜6.0 | Hacker News, Reddit, Medium |

### 自動ソース検出フロー

```
記事作成時
    │
    ▼
URLパターン分析 ──▶ ソース分類 ──▶ 信頼度算出 ──▶ DB登録
    │                  │              │            │
    ▼                  ▼              ▼            ▼
既存ソース確認      primary判定     スコア計算    記事紐づけ
未登録なら新規      secondary      タイプ別基準   メタ情報更新
```

### 月次メンテナンス

**実行:** 毎月1日03:00（cron: `0 3 1 * *`）

1. **信頼度更新** - 過去30日の利用頻度で調整
2. **新規ソース発見** - 記事内リンクから自動抽出
3. **非アクティブ検出** - 90日未利用ソースの特定
4. **詳細レポート** - 統計・推移・異常値の報告

### ワークフローへの統合

| Phase | 従来機能 | + ソース管理機能 |
|-------|----------|----------------|
| **Phase 1: news-research** | ソース巡回・URL確認 | + 自動ソース検出・分類・登録 |
| **Phase 2: news-evaluation** | NVAスコアリング | + ソース信頼度考慮評価 |
| **Phase 3: digest-writer** | 記事作成 | + ソース情報自動登録・メタ記録 |
| **Phase 4: publish-gate** | 品質チェック | + ソース整合性確認・検証 |

### 実績（2026-02-13完了）

- ✅ 既存記事ソース紐づけ: 72/93記事（77%成功率）
- ✅ 新規記事自動ソース検出: 100%成功率
- ✅ 月次メンテナンス: cron設定完了
- ✅ ソース品質管理: 80件新規登録・信頼度自動更新

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
| ├ content-optimizer | `~/.clawdbot/skills/content-optimizer/SKILL.md` | Phase 4 手順 |
| └ publish-gate | `~/.clawdbot/skills/publish-gate/SKILL.md` | Phase 5 手順 |
| **共通スキル** | | |
| ├ article-quality-check | `~/.clawdbot/skills/article-quality-check/SKILL.md` | 品質チェック |
| └ site-checker | `~/.clawdbot/skills/site-checker/SKILL.md` | UI確認 |

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| **2026-02-16** | **publish-gateにUI確認（PC+モバイル）責務を追加** |
| | ✅ PC表示確認（記事680px以内、テーブル列幅適正） |
| | ✅ モバイル表示確認（はみ出しなし、カードラベル表示） |
| **2026-02-13** | **Phase 4運用最適化完了: ソース管理システム実装** |
| | ✅ 自動ソース検出・分類・信頼度算出システム |
| | ✅ 既存72記事への一括ソース紐づけ（77%成功率） |
| | ✅ 新規記事作成時の自動ソース登録機能 |
| | ✅ 月次メンテナンス・品質管理cron設定 |
| | ✅ 80件新規ソース自動発見・登録 |
| 2026-02-13 | content-optimizer スキルを追加、5 Phaseワークフローに拡張（UI最適化フェーズ組み込み） |
| 2026-02-12 | 個別記事ワークフローを追加、2種類のワークフロータイプに整理 |
| 2026-02-12 | 初版作成（ワークフロー・スキル・チェックリストの包括整理） |
