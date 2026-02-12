# Claude Code ルーティン運用手順（朝刊/夕刊 + Top3）

このドキュメントは、ClaudeCode（openClaw）に日次で記事を作らせるための運用手順です。

運営体制・優先度・ロードマップは次を正本とする:
- `docs/OPERATIONS-PLAN-2026-02-12.md`

## 生成するもの（毎日）
- 朝刊（Digest）: `category: morning-summary`
- 夕刊（Digest）: `category: evening-summary`
- 個別ニュース（Top 3）: `category: news`（DigestのTop 3ぶん）

補足:
- プロダクト辞書（`content/products/*.md`）は、記事内に登場したプロダクトの“前提情報”として随時作成/更新する
- ナレッジ（`dev-knowledge`）/ 事例（`case-study`）は不定期だが、運用ループは同じ

## 役割定義（運用）
- プロダクトオーナー兼編集長: ClaudeCode（openClaw）
- 最終承認者: 人間オーナー
- 実装・自動化: Codex 等の実装エージェント

## 重要ポリシー（必読）
- taxonomy・リンク運用は `specs/content-policy/spec.md` を正とする
- Digestは「ランキングTop 10（最大）」+「Top 3深掘り」+「Top 3は個別ニュース記事」までが1セット
- `/news-value` は最新のDigest記事内のランキング表から自動生成される（特別な更新作業は不要）
- 記事公開は **DB登録完了が前提**。`sync:content:db` に失敗した変更は公開しない

## 環境前提（最初に1回）

`.env.local`（または`.env`）に以下を設定する。`sync:content:db` はこのファイルを自動読込する。

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SECRET_KEY=<secret-key>
```

## ファイル命名（推奨）
- 朝刊: `content/news/YYYY-MM-DD-morning-news-YYYY-MM-DD.md`
  - `slug: "morning-news-YYYY-MM-DD"`
  - `category: "morning-summary"`
- 夕刊: `content/news/YYYY-MM-DD-evening-news-YYYY-MM-DD.md`
  - `slug: "evening-news-YYYY-MM-DD"`
  - `category: "evening-summary"`
- 個別ニュース: `content/news/YYYY-MM-DD-some-slug.md`
  - `slug: "some-slug"`
  - `category: "news"`

## 手順（朝刊/夕刊 共通）

### 1) 候補ニュース収集
- `docs/RESEARCH-SOURCES.md` の巡回先から、直近ウィンドウ内の候補を 8〜15 本集める
- 各候補について、一次ソースURL（公式/原文）を必ず控える

### 2) NVAスコアリング（Top 10作成）
- NVAの5軸でスコアリングし、合計点で並べ替える（最大Top 10）
- Top 10はDigestのランキング表に入れる
- Top 3は **必ず** 個別ニュース記事（`category: news`）を作る

### 3) プロダクト辞書の整備
- 記事に出てくるプロダクトは、本文で `/products/[slug]` にリンクする
- プロダクトページが無い場合は `content/products/[slug].md` を先に作る（または同時に作る）

### 4) Digest執筆（テンプレ厳守）
- Digestには必ず以下を含める:
  - `## 🏁 重要ニュースランキング（NVA）` + 表（最大Top 10）
  - `## 🔥 Top 3 ピックアップ`（Top 3の深掘り）
- ランキング表のTop 3行は、個別ニュース記事へのリンク `(/news/slug)` を必ず入れる

### 5) 個別ニュース執筆（Top 3）
- `EDITORIAL.md` のタイトル原則（何が起きたか）を守る
- 定量データを最低1つ入れる
- 最後にNVA表（5軸 + 合計 + Tier）を入れる
- 関連プロダクトを `/products/[slug]` にリンクする

### 6) ローカル検証 → 公開
```bash
npm run publish:gate
git add -A
git commit -m "publish: YYYY-MM-DD morning/evening"
git push
```

`npm run publish:gate` は以下を順番に実行する:
- `npm run validate:content`
- `npm run sync:content:db`
- `npm run build`

どれか1つでも失敗した場合は公開を中止する（`git push` しない）。

公開後の確認:
- `/news/[digest-slug]`
- `/news-value`（朝/夕の最新ランキングが出ているか）
- `/category/morning-summary` と `/category/evening-summary`

## モデルケース（本日のサンプル）
- 朝刊: `content/news/2026-02-10-morning-news-2026-02-10.md`
- 夕刊: `content/news/2026-02-10-evening-news-2026-02-10.md`
- 個別ニュース（Top 3）:
  - `content/news/2026-02-10-claude-code-project-memory.md`
  - `content/news/2026-02-10-cursor-shared-rules.md`
  - `content/news/2026-02-10-openai-codex-review-mode.md`
- ナレッジ（例）: `content/news/2026-02-10-spec-first-context-pack.md`
- 事例（例）: `content/news/2026-02-10-sleek-design-10k-mrr-case-study.md`
- プロダクト（例）: `content/products/continue-dev.md`
