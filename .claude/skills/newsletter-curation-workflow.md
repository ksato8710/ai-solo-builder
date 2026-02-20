# Newsletter Curation Workflow — ニュースレター検知再編集スキル

## 概要
複数ニュースレターを購読し、配信後にトピックを検知して、一次情報検証 + 日本語ローカライズを行い、
AI Solo Builder向けのニュースレターを作成するための運用スキル。

## 使うタイミング
- 「複数ニュースレターを統合して配信したい」
- 「公式発表（原文） + 日本語の解説記事を併記したい」
- 「速報をソロビルダー向けに再編集したい」

## 基本原則
1. ニュースレターは **検知レイヤー** として扱う（最終ソースにしない）。
2. 重要トピックは必ず **一次情報（公式）** で事実確認する。
3. 日本向け配信では **日本語の解説記事リンク** を併記する。
4. 1トピックにつき最低2リンク（公式発表（原文） + 日本語の解説記事）。
5. 日本向け配信では、他媒体の固有見出し語を残さない。
6. 受信口は当面 `ktlabworks@gmail.com` の単一構成で運用する。

## 実行手順

### Step 1: 検知
- `ktlabworks@gmail.com` で受信した競合ニュースレターを確認。
- `/admin/collection` に受信ログを記録（source / observed_at / subject / from）。
- 同じ話題が複数レターで言及されているかを確認。

### Step 2: 一次情報検証
- 公式発表・原典へ遷移し、数値・日付・機能差分を確認。
- 「ニュースレター側の言い回し」をそのまま断定文にしない。

### Step 3: 日本語ローカライズ
- `docs/operations/JAPANESE-MEDIA-SOURCES.md` の優先メディアからJP文脈を補完。
- JP一次がない場合は、JP編集メディアを補助参照として明示。

### Step 4: 記事種別へ振り分け
- digest: 速報統合（Top10 + Top3）
- news(dev-knowledge): 実装手順重視
- news(case-study): 事例分解重視
- product: 辞書更新

### Step 5: 出力フォーマット
各トピックを以下で統一:
- 何が起きたか（1行）
- なぜ重要か（2行）
- Solo Builderへの影響（1行）
- 今日やること（3ステップ）
- 公式発表（原文）リンク / 日本語の解説記事リンク

### Step 6: 配信前チェック
- `docs/operations/NEWSLETTER-GUARDRAILS.md` の必須項目を確認。
- One-click unsubscribe ヘッダー、送信ログ、同日重複送信防止を確認。

## 連携先
- 受信運用: `docs/operations/COMPETITOR-NEWSLETTER-COLLECTION.md`
- ワークフロー定義: `docs/operations/NEWSLETTER-CURATION-WORKFLOW.md`
- 朝刊統合仕様: `docs/operations/MORNING-DIGEST-INTEGRATION-SPEC.md`
- 法務/配信: `docs/operations/NEWSLETTER-GUARDRAILS.md`
- 日本メディア管理: `docs/operations/JAPANESE-MEDIA-SOURCES.md`
- 全体フロー: `docs/operations/WORKFLOW-OVERVIEW.md`
