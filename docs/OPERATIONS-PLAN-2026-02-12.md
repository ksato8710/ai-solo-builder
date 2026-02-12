# AI Solo Builder 運営再計画（2026-02-12）

## 1. エグゼクティブサマリー

2026年2月12日時点で、本サービスは以下の状態に到達している。

- コンテンツポリシーは `news / product / digest` の3分類で確定
- Supabase を中核にした DB モデル・マイグレーション・同期基盤を実装済み
- Web は DB-first 読み取り（障害時は Markdown fallback）で稼働
- Web / Flutter 共通の Content API（`/api/v1/*`）を本番反映済み
- Flutter MVP（一覧 + 詳細）を iOS シミュレータで稼働確認済み

一方で、運用上の最重要ギャップは「編集運用の完全定常化」と「canonical frontmatter への移行完了」である。

## 2. 現状スナップショット

### 2-1. コンテンツ在庫（authoring files）

2026-02-12 の実測:

- 総数: 103
- `news`: 45
- `product`: 39
- `digest`: 19
  - morning: 11
  - evening: 8
- ニュースタグ該当（推定）:
  - `dev-knowledge`: 15
  - `case-study`: 4

### 2-2. モデル移行率（canonical frontmatter）

2026-02-12 の実測:

- `contentType`: 0 / 103
- `digestEdition`: 0 / 103
- `tags`: 0 / 103
- `relatedProducts`: 0 / 103
- 依存中の legacy:
  - `category`: 103 / 103
  - `relatedProduct`: 42 / 103

評価:
- 実行系は互換対応済みで稼働している
- ただし canonical 化は未着手で、移行タスクが残っている

### 2-3. 既知の運用ギャップ

- 事例/ナレッジ対象記事で `/products` 参照不足: 1件
  - `content/news/noon-tools-2026-02-11.md`
- Digest slot 重複（同 edition/date）: 1件
  - morning: `2026-02-02`（2本）

## 3. アーキテクチャ現況（多面的整理）

### 3-1. 企画・編集レイヤ

- 方針正本:
  - `specs/content-policy/spec.md`
- Digest 運用:
  - Top10 ランキング + Top3 深掘り + Top3 個別記事化
- プロダクト辞書連動:
  - ニュース/事例/ナレッジで必ず `/products/[slug]` と接続

### 3-2. データレイヤ

- Supabase プロジェクト: `jvmvaxobseoqeqjjpdcr`
- 主要テーブル: `contents`, `digest_details`, `products`, `tags`, `content_tags`, `content_product_links` 他
- 同期:
  - `npm run sync:content:db`
- バリデーション:
  - `npm run validate:content`

### 3-3. 配信レイヤ

- Web: `src/lib/posts.ts` による DB-first 取得
- API: `src/app/api/v1/*`
  - `GET /api/v1/feed`
  - `GET /api/v1/contents`
  - `GET /api/v1/contents/[slug]`
- Mobile (Flutter): API 経由で取得

### 3-4. 品質・運用レイヤ

- Build: 通過
- Flutter analyze/test: 通過
- `npm run lint`: 既存警告/エラーを残しており、基準未統一

## 4. 今後の運営体制（ClaudeCode / openClaw を PO兼編集長に設定）

### 4-1. 役割定義

- ClaudeCode（openClaw）:
  - プロダクトオーナー兼編集長
  - 企画優先順位、記事テーマ選定、NVA 評価、配信判定、公開後レビューを主導
- 人間オーナー（最終責任者）:
  - 事業判断、ブランド方針、法務/規約リスク承認、最終 Go/No-Go
- 実装エージェント（Codex 等）:
  - 開発、運用自動化、データ整備、検証、障害対応

### 4-2. 編集意思決定ルール

- 記事採用は NVA とソロビルダー実用性を優先
- Digest は「期間内主要トピックの把握」を最優先価値とする
- Top3 は必ず個別記事化（速報より解像度を重視）
- プロダクト辞書未整備のまま公開しない

### 4-3. 発行頻度（推奨運用）

最低ライン（必須）:

- 毎日:
  - 朝刊 Digest 1本（08:00 JST）
  - 夕刊 Digest 1本（18:00 JST）
  - Top3 個別ニュース 3本 x 2回 = 6本

推奨ライン（品質/成長の両立）:

- 週2本: AI開発ナレッジ（`news + tag: dev-knowledge`）
- 週2本: ソロビルダー事例（`news + tag: case-study`）
- 週5件以上: プロダクト辞書更新（新規/更新合算）

### 4-4. 1日の標準運用フロー（openClaw 主導）

1. 候補収集（朝/夕それぞれ 8〜15件）
2. NVA 採点・Top10 生成
3. Top3 選定と個別記事ドラフト生成
4. 関連プロダクトページの存在確認・不足分作成
5. Digest 本文作成（ランキング + Top3 深掘り）
6. 品質ゲート実行
   - `npm run validate:content`
   - `npm run sync:content:db`
   - `npm run build`
7. 公開・確認
   - `/category/morning-summary` or `/category/evening-summary`
   - `/news-value`
   - `/api/v1/feed`

## 5. 直近ロードマップ（再計画）

### Phase A（即時: 2026-02-12 〜 2026-02-16）

目的: 運用安定化と事故防止

- A1. canonical frontmatter 変換バッチを作成し、全103件に適用
- A2. `noon-tools-2026-02-11` の `/products` 参照不足を解消
- A3. digest duplicate slot（2026-02-02 morning）を解消
- A4. Digest/Top3 公開時のチェックリストを PR テンプレ化
- A5. `npm run lint` の基準を一旦通る状態に整理（重大エラーから優先）

### Phase B（短期: 2026-02-17 〜 2026-03-07）

目的: 配信品質と運営効率の向上

- B1. `digest_rankings` / `digest_ranking_items` への同期実装
- B2. `/news-value` の DB 参照化（Markdown パース依存を縮小）
- B3. openClaw 用日次運用コマンド（朝刊/夕刊自動ルーチン）整備
- B4. API のエラーハンドリング標準化（JSON エラー形式統一）
- B5. Flutter のカテゴリ別一覧画面追加

### Phase C（中期: 2026-03-08 〜 2026-04-15）

目的: スケール前提の運用基盤化

- C1. API 認証/レート制御（公開 API 方針の確定）
- C2. モバイル向け差分同期 API（`updated_at` ベース）
- C3. 監視ダッシュボード（公開失敗・同期失敗・空配信検知）
- C4. 週次編集レビュー（CTR/読了率/再訪率）を定例化

## 6. KPI / 運用SLO（初期案）

- 毎日朝刊・夕刊の公開達成率: 95%以上
- Top3 個別記事の同日公開率: 100%
- プロダクトリンク欠落率: 0%
- API 可用性（`/api/v1/feed`）: 99.9%以上
- 重大誤リンク・404混入: 0件/週

## 7. 次に実行すべき具体アクション（優先順）

1. canonical frontmatter 一括移行（A1）
2. リンク不足1件と digest 重複1件の修正（A2/A3）
3. 朝刊/夕刊の運用テンプレを openClaw 実行用プロンプト化（A4）
4. lint エラーの段階的解消計画を合意（A5）
