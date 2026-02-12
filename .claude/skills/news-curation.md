# News Curation — ニュースキュレーションスキル

## 概要
グローバルのAI情報ソースを効率的に巡回し、記事化すべきニュースを選定する手順。

## 巡回手順

### Step 1: 主要ソースのスキャン
1. **Hacker News** — AI関連でupvote 100+の記事を抽出
2. **Reddit** — r/solopreneur, r/SideProject, r/artificial の直近24h人気投稿
3. **X** — @levelsio, @marc_louvion, @dannypostma 等の投稿 + "AI tool" "vibe coding" 検索
4. **Product Hunt** — デイリーAI系ランキング上位

### Step 2: 一次スクリーニング
以下の基準で候補を5-10本に絞る:
- コミュニティの反応量（upvote/RT/コメント数）
- ソロビルダーとの関連度
- 情報の鮮度（24h以内を優先）
- 既存記事との重複チェック

### Step 3: NVA概算スコアリング
各候補にNVAの5軸でざっくりスコアをつける:
- SNS反応量 (0-20)
- メディアカバレッジ (0-20)
- コミュニティ反応 (0-20)
- 技術的インパクト (0-20)
- ソロビルダー関連度 (0-20)

### Step 4: 記事化決定
- Digestに載せる重要ニュースを選び、NVAでランキング化する（Top 10まで表示、Top 3を確定）
- Tier A (80+): Digestの上位枠で優先、原則Top 3候補（個別ニュース記事化）
- Tier B (55-79): Digest掲載候補。枠に応じてTop 3入り or 一覧枠
- Tier C (30-54): Digestの「一覧」枠で補完するか検討
- Tier D (1-29): 原則スキップ

### Step 5: プロダクト記事チェック
- プロダクトに関するニュースの場合、/products/[slug] の有無を確認
- 無ければ先にプロダクト記事を作成し、Digest/ニュースからリンクする
- 関連プロダクトのslug候補を `relatedProducts` 用に明示して引き渡す

## ソースデータの保存
- research/YYYY-MM-DD-slug/ に sources.md を作成
- URL・数値・引用原文を保存（将来のリファレンス資産）

## 参照ドキュメント
- docs/RESEARCH-SOURCES.md — 巡回先の詳細リスト
- docs/CONTENT-STRATEGY.md — カテゴリ別の選定基準
