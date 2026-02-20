# X API Discovery System (AI Solo Builder)

## 目的

生成AIに関する X 投稿から、ソロビルダーに有用な情報を毎日高速に抽出する。

- 新規性: 直近 24 時間以内の動きに強い
- 実用性: 「今すぐ試せる」情報を優先
- ノイズ耐性: hype / スパムを抑制

---

## 実験CLI

`scripts/discover-x-ai-signals.py`

主な機能:

1. `recent search` で候補収集
2. `Scout / Signal / Critic` の 3 系統スコアでランキング
3. JSON + Markdown レポート出力
4. `seen_ids` を保存して日次で新規投稿を優先

サンプル実行:

```bash
python3 scripts/discover-x-ai-signals.py \
  --sample-file scripts/fixtures/x_recent_search_sample.json \
  --output-dir research/x-discovery
```

本番実行:

```bash
export X_API_BEARER_TOKEN=...
python3 scripts/discover-x-ai-signals.py \
  --sort-order mixed \
  --lookback-hours 24 \
  --top-k 20 \
  --with-usage \
  --output-dir research/x-discovery
```

特定テーマ探索（例: OpenClaw）:

```bash
export X_API_BEARER_TOKEN=...
python3 scripts/discover-x-ai-signals.py \
  --focus OpenClaw \
  --sort-order mixed \
  --lookback-hours 24 \
  --top-k 15
```

---

## スコアリング設計

最終スコアは 0-100。下記を合成して算出する。

- Scout (関連性): AI用語 / ソロビルダー文脈 / 実装可能性キーワード / クエリ一致数
- Signal (反応品質): いいね・リポスト・返信・引用の速度、フォロワー規模を加味した反応密度
- Signal (発信者): フォロワー数、アカウント年数、verified
- Freshness: 投稿からの経過時間
- Critic (減点): hype語、ハッシュタグ過多、低シグナル、リンク欠如

推奨判定:

- `strong` (70+): 即チェック対象
- `good` (55-69): 日次レビュー対象
- `watch` (40-54): 補助候補
- `low` (<40): 原則除外

---

## クエリ戦略

4つの Query Pack を併用する。

- `launch-signals`: 新規公開・ローンチ
- `playbooks`: チュートリアル・実装手順
- `revenue-proof`: 収益/事例
- `ecosystem-watch`: API/SDK/MCP 周辺

`--sort-order mixed` を使うと、以下を同時取得できる。

- `recency`: 新規性重視
- `relevancy`: 質重視

---

## 日次運用ループ

1. 朝: `lookback 24h` でトップ 20 を抽出
2. 昼: `query pack` と `min-score` を微調整
3. 夕: 採用された投稿の特徴を反映して重み更新
4. 週次: false positive / missed hit をレビューして語彙辞書更新

評価KPI:

- Top20 内の採用率
- 投稿発見から意思決定までの時間
- 見逃し率 (後追いで判明した重要投稿)

---

## 運用メモ

- `recent search` は最大 7 日の検索窓なので、日次実行が前提
- state (`.cache/x_discovery_state.json`) を使うと重複監視を抑制できる
- `--with-usage` で API 使用量をレポートに埋め込み、月次上限超過を回避

---

## 公式仕様メモ（2026-02-20確認）

- Recent Search: `GET /2/tweets/search/recent`
- Recent Search の主な制約:
  - 検索窓は直近 7 日
  - `max_results` は 10〜100
  - `sort_order` は `recency` / `relevancy`
- 使用量確認: `GET /2/usage/tweets`
- リアルタイム監視拡張候補: Filtered Stream (`/2/tweets/search/stream`) + ルール管理 (`/2/tweets/search/stream/rules`)

参照:
- [Recent Search](https://docs.x.com/x-api/posts/recent-search)
- [Usage - Tweets](https://docs.x.com/x-api/usage/tweets)
- [Filtered Stream](https://docs.x.com/x-api/posts/filtered-stream/introduction)
- [Filtered Stream Rules](https://docs.x.com/x-api/stream/add-stream-rules)

---

## 次の拡張

- 重要候補のみ LLM 要約を追加（議論ポイントを高精度化）
- `filtered stream` を使った準リアルタイム監視に拡張
- 結果を Supabase に保存し、管理画面でトレンド比較
