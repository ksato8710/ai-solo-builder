# ニュースレター検知・再編集ワークフロー

最終更新: 2026-02-19

対象: `AI Solo Builder` のニュースレター運用（速報 + 実装重視）

## 0. 目的

複数ニュースレターを「最終ソース」ではなく「検知レイヤー」として利用し、
一次情報検証と日本語ローカライズを経て、ソロビルダー向けの意思決定コンテンツを配信する。

## 1. 全体フロー

1. 受信: 競合ニュースレターを `ktlabworks@gmail.com` で受信する。
2. 配信時刻監視: 参照ニュースレターの到着時刻を `source_delivery_schedules` で管理。
3. 観測ログ化: 実受信を `source_delivery_observations` に記録する。
4. 検知: ニュースレター本文から候補トピックを抽出（detector）。
5. 一次検証: 公式発表・原典URLで事実を確定（verifier）。
6. 日本語補足: 日本語情報を収集し、国内向け文脈を補う（localizer）。
7. 記事種別振り分け: `content_workflows` 定義に従って digest/news/product に振り分け。
8. 編集: 「何が起きたか」ではなく「今日何を作るか」まで落とし込む。
9. 配信: 送信ログ、解除導線、再送防止を確認して配信。

## 2. データモデル

### 2-1. ソース本体
- テーブル: `sources`
- 主な追加属性:
  - `entity_kind`: `newsletter | primary_source | japanese_media | ...`
  - `locale`, `region`
  - `is_newsletter`, `newsletter_from_email`, `newsletter_archive_url`
  - `is_japanese_media`, `is_active`, `notes`

### 2-2. 配信時刻
- テーブル: `source_delivery_schedules`
- 主な属性:
  - `source_id`, `schedule_name`
  - `timezone`, `delivery_hour`, `delivery_minute`
  - `delivery_days`, `fetch_delay_minutes`

### 2-3. 受信観測ログ
- テーブル: `source_delivery_observations`
- 主な属性:
  - `source_id`, `collector_inbox`（初期値: `ktlabworks@gmail.com`）
  - `observed_at`, `subject`, `from_email`
  - `message_id_header`, `gmail_labels`
  - `read_online_url`, `archive_url`

### 2-4. 記事作成ワークフロー
- テーブル: `content_workflows`
  - `content_type`, `digest_edition`, `article_tag`
  - `objective`, `output_contract`
- テーブル: `workflow_source_mappings`
  - `role`: `detect | verify | localize | benchmark`
  - `priority`, `is_required`

## 2.5 朝刊統合の契約仕様

- 朝刊の統合条件・情報量基準は以下に準拠する:
  - `docs/operations/MORNING-DIGEST-INTEGRATION-SPEC.md`

## 3. 記事種別ごとのルール

### 3-1. Digest（morning / evening）
- 目的: 速報統合
- 必須: Top10 + Top3 + 「公式発表（原文）」+「日本語の解説記事」の併記
- 優先ロール:
  - `detect`: ニュースレター
  - `verify`: 一次情報
  - `localize`: 日本メディア

### 3-2. News（dev-knowledge / case-study）
- 目的: 実装可能性・再現性
- 必須: 実装手順、意思決定、収益化ヒント
- 優先ロール:
  - `verify`: 一次情報
  - `localize`: 日本メディア
  - `benchmark`: 補助比較ソース

### 3-3. Product
- 目的: 辞書更新とリンク先品質維持
- 必須: 公式差分、価格/仕様、関連記事リンクの整合

## 4. 編集品質の基準

- 1トピック最低2リンク（EN一次 + JP補足）
- ニュースレター原文の転載禁止、要約+独自整理のみ
- 推測は明示（断定禁止）
- 「今やる / 様子見 / 見送り」の3択評価を付与

## 5. 管理画面

- `/admin/source-intelligence`
  - ソース（ニュースレター・一次情報・日本メディア）管理
- `/admin/workflows`
  - 記事種別ごとのソース役割マトリクス管理
- `/admin/schedules`
  - ニュースレター配信時刻とfetch delay管理
- `/admin/collection`
  - `ktlabworks@gmail.com` の受信実績ログと未受信監視

## 6. 参照ドキュメント

- `docs/operations/COMPETITOR-NEWSLETTER-COLLECTION.md`
- `docs/operations/NEWSLETTER-GUARDRAILS.md`
- `docs/operations/WORKFLOW-OVERVIEW.md`
- `docs/technical/NEWSLETTER.md`
