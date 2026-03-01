# Digest ワークフロー（朝刊）

朝刊 Digest の 5 Phase パイプライン詳細手順。

> **全体像:** `docs/operations/WORKFLOW-OVERVIEW.md`
> **品質チェック:** `docs/operations/CHECKLIST.md`
> **taxonomy:** `specs/content-policy/spec.md`

---

## 概要

**目的:** 前回Digest以降の重要ニュースをTop10形式で配信し、Top3を個別記事化

**特徴:**
- 5 Phase の自動化されたパイプライン
- NVAスコアリングによる客観的評価
- cron による定時実行（朝 07:30）

---

## 5 Phase 構成

```
Phase 1          Phase 2          Phase 3          Phase 4           Phase 5
[調査] ──────▶ [評価・選定] ──────▶ [記事作成] ──────▶ [UI最適化] ──────▶ [公開]
   │                │                  │                 │                 │
   ▼                ▼                  ▼                 ▼                 ▼
news_candidates  selected候補      Markdown記事       最適化記事        本番公開
(DB保存)         (NVA付き)          (Top3個別含む)     (読みやすさ向上)   (Vercel)
```

---

## Phase 詳細

### Phase 1: 調査（→ `news-research` スキル）

| 項目 | 内容 |
|------|------|
| 責務 | 一次ソース特定・日付確認・自動ソース検出/分類・DB保存 |
| 入力 | ソース巡回（X/Reddit/HN/PH/メディア） |
| 出力 | `news_candidates` テーブルに 8〜15件保存（status=collected） |

**手順:**
1. ソース巡回（RSS/検索）
2. 一次ソース特定・日付確認
3. `news_candidates` テーブルに保存

**完了条件:** 8〜15件の候補がDB保存済み、全件に一次ソースURL・発表日あり

### Phase 2: 評価（→ `news-evaluation` スキル）

| 項目 | 内容 |
|------|------|
| 責務 | 期間フィルタ・ソース信頼度考慮NVA・事実確認 |
| 入力 | collected 候補 |
| 出力 | selected 候補（Top10/Top3確定） |

**手順:**
1. 期間適切性フィルタ（前日朝刊〜今朝刊）
2. 事実確認（誇張・歪曲チェック）
3. NVAスコアリング → Top10/Top3選定

**完了条件:** Top10が `status=selected`、Top3が確定

### Phase 3: 記事作成（→ `digest-writer` スキル）

| 項目 | 内容 |
|------|------|
| 責務 | Digest + Top3個別記事執筆・ソース情報自動登録 |
| 入力 | selected 候補 |
| 出力 | Markdown ファイル（Digest 1本 + Top3個別記事 3本） |

**手順:**
1. Digest記事作成（テンプレート厳守）
2. Top3個別記事作成
3. プロダクトリンク整備

**完了条件:** Digest 1本 + Top3個別記事 3本作成済み

### Phase 4: UI最適化（→ `content-optimizer` スキル）

| 項目 | 内容 |
|------|------|
| 責務 | 表組み・構造・視覚的メリハリの改善 |
| 入力 | Markdown ファイル（初稿） |
| 出力 | 最適化記事（読みやすさ向上） |

**手順:**
1. テーブルレイアウト最適化（NVAランキング表等）
2. ビジュアル階層の調整
3. 可読性の向上（見出し・余白・リスト構造）

**完了条件:** Digest・個別記事のレイアウトが読みやすく整っている

### Phase 5: 公開（→ `publish-gate` スキル）

| 項目 | 内容 |
|------|------|
| 責務 | チェックリスト照合・ソース整合性チェック・デプロイ・UI確認（PC+モバイル） |
| 入力 | 最適化記事 |
| 出力 | 本番サイト公開 |

```bash
npm run publish:gate
git add -A
git commit -m "publish: YYYY-MM-DD morning"
git push
```

**完了条件:** デプロイ完了、PC/モバイル表示確認済み、Slack報告済み

---

## 日次スケジュール

### 朝刊（07:30開始 → 08:00公開目標）

```
07:30  Phase 1: news-research (morning)
       ├─ ソース巡回（前日夕刊〜今朝刊の期間）
       └─ news_candidates に8-15件保存

07:40  Phase 2: news-evaluation
       ├─ 期間フィルタ
       ├─ NVAスコアリング
       └─ Top10/Top3選定

07:48  Phase 3: digest-writer
       ├─ Digest記事作成
       ├─ Top3個別記事作成
       └─ プロダクトリンク整備

07:53  Phase 4: content-optimizer
       ├─ 表組み最適化
       └─ 視覚的メリハリ改善

07:57  Phase 5: publish-gate
       ├─ チェックリスト照合
       ├─ npm run publish:gate
       ├─ git push
       └─ Slack報告

08:00  公開完了
```

---

## 生成するもの（毎日）

- 朝刊 Digest: `contentType: digest`, `digestEdition: morning`
- 個別ニュース（Top 3）: `contentType: news`（DigestのTop 3ぶん）

> **Note:** taxonomy の正規定義は `specs/content-policy/spec.md` を参照。

---

## ファイル命名規約

- 朝刊: `content/news/YYYY-MM-DD-morning-news-YYYY-MM-DD.md`
  - `slug: "morning-news-YYYY-MM-DD"`
  - `contentType: "digest"`, `digestEdition: "morning"`
- 個別ニュース: `content/news/YYYY-MM-DD-some-slug.md`
  - `slug: "some-slug"`
  - `contentType: "news"`

補足:
- プロダクト辞書（`content/products/*.md`）は、記事内に登場したプロダクトの"前提情報"として随時作成/更新
- ナレッジ（`dev-knowledge`）/ 事例（`case-study`）は不定期だが、運用ループは同じ

---

## 役割定義

- **プロダクトオーナー兼編集長:** ClaudeCode（openClaw）
- **最終承認者:** 人間オーナー
- **実装・自動化:** Codex 等の実装エージェント

---

## 重要ポリシー

- taxonomy・リンク運用は `specs/content-policy/spec.md` を正とする
- Digest は「ランキングTop 10（最大）」+「Top 3深掘り」+「Top 3は個別ニュース記事」までが1セット
- `/news-value` は最新のDigest記事内のランキング表から自動生成される
- 記事公開は **DB登録完了が前提**。`sync:content:db` に失敗した変更は公開しない

---

## 環境前提

`.env.local`（または`.env`）に以下を設定する。`sync:content:db` はこのファイルを自動読込する。

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SECRET_KEY=<secret-key>
```

---

## モデルケース

- 朝刊: `content/news/2026-02-10-morning-news-2026-02-10.md`
- 個別ニュース（Top 3）:
  - `content/news/2026-02-10-claude-code-project-memory.md`
  - `content/news/2026-02-10-cursor-shared-rules.md`
  - `content/news/2026-02-10-openai-codex-review-mode.md`

---

*統合元: WORKFLOW-ARCHITECTURE.md (Digest部分) + CLAUDE-CODE-ROUTINE.md*
*更新: 2026-02-16*
