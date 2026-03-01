# OpenClaw引き継ぎ: 競合ニュースレター収集運用

最終更新: 2026-02-21
対象環境: `ai.essential-navigator.com` / Supabase linked project

## 1. 目的

競合ニュースレターの実配信を収集し、`AI Solo Craft` 朝刊統合の検知レイヤーとして運用する。

初期方針:
- 受信口は単一: `ktlabworks@gmail.com`
- 競合ニュースレターは detector（検知）用途
- 記事化時は verifier（一次情報）と localizer（日本語補足）を必須化

## 2. 現在の実装ステータス

### 2-1. 追加済みDB（本番反映済み）

以下マイグレーションは `npm run db:push` で適用済み。

1. `supabase/migrations/20260221012853_add_source_delivery_observations.sql`
- `source_delivery_observations` テーブル追加
- 受信ログ（source_id, observed_at, subject, from_email, labels, read_online_url 等）を保存

2. `supabase/migrations/20260221151630_add_neuron_and_thebatch_sources.sql`
- `sources` に以下2件を追加/更新
  - The Neuron (`www.theneurondaily.com`)
  - The Batch (`www.deeplearning.ai`)
- `source_delivery_schedules` を追加/更新
- `workflow_source_mappings` を追加/更新

### 2-2. 追加済みAPI/画面

- 受信ログAPI:
  - `src/app/api/admin/source-observations/route.ts`
  - GET/POST/PUT/DELETE 対応

- 管理画面:
  - `src/app/admin/collection/page.tsx`
  - 機能:
    - 手動ログ追加
    - 最新受信ログ一覧
    - 過去24時間の未受信アラート

- 導線追加:
  - `src/app/admin/page.tsx`
  - `src/app/admin/schedules/page.tsx`
  - `src/app/admin/source-intelligence/page.tsx`
  - `src/app/admin/workflows/page.tsx`

## 3. Gmail側の登録状況（ユーザー実施済み）

登録済みニュースレター:
- The Rundown AI: `ktlabworks@gmail.com`
- Superhuman AI: `ktlabworks+nl-superhuman@gmail.com`
- The Neuron: `ktlabworks+nl-neuron@gmail.com`
- TLDR AI: `ktlabworks+nl-tldr@gmail.com`
- Ben’s Bites: `ktlabworks+nl-bensbites@gmail.com`
- The Batch: `ktlabworks+nl-thebatch@gmail.com`

補足:
- Rundownのみ通常アドレス登録のため、Gmailフィルタは `deliveredto` ではなく `from/domain` 条件併用が必要。

## 4. 管理画面運用フロー（日次）

1. 受信確認
- Gmailの競合ラベルを確認
- 新着を `admin/collection` に記録

2. ログ記録
- 必須: source / observed_at / subject / from_email
- 推奨: read_online_url / message_id / labels

3. 欠落監視
- `admin/collection` の未受信アラート（過去24h）を確認
- 欠落時は配信遅延かフィルタ不備を切り分け

4. 朝刊統合
- detector情報を抽出
- Top3候補は verifier + localizer を揃える

## 5. 現在のスケジュール設定（要点）

- Active daily:
  - The Rundown AI
  - Superhuman
  - Ben's Bites
  - The Neuron
  - TLDR AI

- Weekly (inactive 初期値):
  - The Batch (`weekly_primary`, Friday想定)

運用方針:
- The Batch は実受信安定後に `admin/schedules` で `is_active=true` へ変更

## 6. 参照ドキュメント

- `docs/operations/COMPETITOR-NEWSLETTER-COLLECTION.md`
- `docs/operations/NEWSLETTER-CURATION-WORKFLOW.md`
- `docs/operations/MORNING-DIGEST-INTEGRATION-SPEC.md`
- `docs/operations/NEWSLETTER-GUARDRAILS.md`
- `docs/operations/JAPANESE-MEDIA-SOURCES.md`

## 7. OpenClawへ依頼する次アクション

1. Gmailフィルタ最終確認
- 各ニュースレターに `nl/competitor/*` ラベルが確実に付くこと

2. 初回運用データ投入
- 当日分の受信ログを `admin/collection` に最低6件入力

3. 1週間モニタリング
- 未受信アラート件数
- 配信時刻のズレ（fetch_delay調整）

4. 週次判断
- The Batchの `is_active` を有効化するか判定

## 8. 制約・注意

- 本環境のCodex側からGmail操作は不可（Gmail MCP未接続）。
- Gmailの設定変更/購読確認は人手（OpenClawまたはユーザー）が必要。
- 競合本文の転載は禁止。要約＋一次情報リンクで運用。
