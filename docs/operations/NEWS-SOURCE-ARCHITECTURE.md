# ニュースソース アーキテクチャ設計書

*作成日: 2026-02-18*
*作成者: ティファ（AI Solo Builder編集長）*

---

## 📌 背景と目的

**課題:**
- ニュースソースが複数の場所に分散（sources DB、watchlist.json、cronジョブ内）
- Xアカウント監視と従来のWebソース管理が統合されていない
- ソースの追加・変更がコード変更を伴う

**目的:**
- 全ソースをDB一元管理し、運用効率と拡張性を向上
- 速報検知・日次Digest・API配信を統一ソースで駆動

---

## 📊 現状分析

### 既存テーブル: `sources`

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | uuid | 主キー |
| name | text | ソース名（OpenAI Blog等） |
| url | text | WebサイトURL |
| domain | text | ドメイン |
| source_type | enum | primary/secondary/tertiary |
| credibility_score | int | 信頼性スコア（1-10） |
| verification_level | enum | official/editorial/community |
| description | text | 説明 |

**現在のデータ:** 約20件（OpenAI Blog, TechCrunch, Hacker News等）

### 不足している機能

1. **Xアカウント監視:** @AnthropicAI, @sama 等のソーシャル監視
2. **監視キーワード:** 製品名・アクショントリガー
3. **優先度・閾値設定:** 速報判定の閾値
4. **検知ログ:** 何をいつ検知したかの履歴

---

## 🏗️ 提案アーキテクチャ

### 概念図

```
┌─────────────────────────────────────────────────────────────┐
│                    news_sources (統合テーブル)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Web Sources │  │  X Accounts  │  │   Keywords   │       │
│  │  (website)   │  │  (x_account) │  │  (keyword)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    source_detections (検知ログ)             │
│  - どのソースから何を検知したか                              │
│  - エンゲージメント数値                                      │
│  - 記事化したかどうか                                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    contents (既存)                          │
│  - source_detections.id を参照                              │
│  - 一次ソース情報の紐付け                                    │
└─────────────────────────────────────────────────────────────┘
```

### テーブル設計

#### 1. `news_sources` - 統合ソーステーブル

```sql
CREATE TABLE public.news_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基本情報
  name text NOT NULL,
  description text,
  
  -- ソース種別
  source_category text NOT NULL CHECK (source_category IN (
    'website',      -- Webサイト（ブログ、メディア）
    'x_account',    -- Xアカウント
    'keyword',      -- 監視キーワード
    'rss_feed'      -- RSSフィード（将来拡張）
  )),
  
  -- Webサイト用
  url text,
  domain text,
  
  -- Xアカウント用
  x_handle text,              -- @なしのハンドル
  x_account_type text,        -- official / keyperson / influencer / japanese
  affiliated_company text,    -- 所属企業（CEO等の場合）
  
  -- キーワード用
  keyword text,
  keyword_type text,          -- product / action_trigger / topic
  keyword_locale text,        -- en / ja
  
  -- 共通評価
  tier int NOT NULL DEFAULT 2 CHECK (tier BETWEEN 1 AND 3),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('highest', 'high', 'medium', 'low')),
  credibility_score int CHECK (credibility_score BETWEEN 1 AND 10),
  
  -- 閾値設定
  auto_publish_enabled boolean DEFAULT false,
  notify_threshold_likes int,
  notify_threshold_retweets int,
  
  -- 管理
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- インデックス
CREATE INDEX idx_news_sources_category ON public.news_sources (source_category);
CREATE INDEX idx_news_sources_tier ON public.news_sources (tier);
CREATE INDEX idx_news_sources_active ON public.news_sources (is_active);
CREATE UNIQUE INDEX idx_news_sources_x_handle ON public.news_sources (x_handle) WHERE x_handle IS NOT NULL;
CREATE UNIQUE INDEX idx_news_sources_domain ON public.news_sources (domain) WHERE domain IS NOT NULL;
```

#### 2. `source_detections` - 検知ログテーブル

```sql
CREATE TABLE public.source_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ソース参照
  source_id uuid REFERENCES public.news_sources(id),
  
  -- 検知内容
  detection_type text NOT NULL CHECK (detection_type IN (
    'x_post',       -- X投稿
    'rss_item',     -- RSS記事
    'web_page',     -- Webページ
    'api_event'     -- API経由のイベント
  )),
  
  -- X投稿の場合
  x_post_id text,
  x_post_url text,
  x_post_content text,
  x_likes int,
  x_retweets int,
  x_replies int,
  x_views int,
  
  -- Webページの場合
  page_url text,
  page_title text,
  
  -- 共通
  detected_at timestamptz DEFAULT now(),
  importance_score int,           -- 自動計算された重要度
  
  -- 処理状態
  status text NOT NULL DEFAULT 'detected' CHECK (status IN (
    'detected',     -- 検知済み
    'notified',     -- Slack通知済み
    'published',    -- 記事化済み
    'ignored'       -- 無視
  )),
  content_id uuid REFERENCES public.contents(id),  -- 記事化した場合
  
  -- メタデータ
  raw_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- インデックス
CREATE INDEX idx_source_detections_source ON public.source_detections (source_id);
CREATE INDEX idx_source_detections_status ON public.source_detections (status);
CREATE INDEX idx_source_detections_detected_at ON public.source_detections (detected_at DESC);
CREATE UNIQUE INDEX idx_source_detections_x_post ON public.source_detections (x_post_id) WHERE x_post_id IS NOT NULL;
```

---

## 📋 データ移行計画

### Phase 1: テーブル作成

```sql
-- マイグレーション: 20260218_create_news_sources.sql
-- 上記のCREATE TABLE文を実行
```

### Phase 2: 既存データ移行

```sql
-- 既存sourcesテーブルからの移行
INSERT INTO public.news_sources (
  name, description, source_category, url, domain,
  tier, priority, credibility_score, is_active
)
SELECT 
  name, description, 'website', url, domain,
  CASE source_type 
    WHEN 'primary' THEN 1 
    WHEN 'secondary' THEN 2 
    ELSE 3 
  END,
  CASE source_type 
    WHEN 'primary' THEN 'highest' 
    WHEN 'secondary' THEN 'high' 
    ELSE 'medium' 
  END,
  credibility_score,
  true
FROM public.sources;
```

### Phase 3: watchlist.json からの移行

```sql
-- Xアカウント
INSERT INTO public.news_sources (name, source_category, x_handle, x_account_type, tier, priority, auto_publish_enabled)
VALUES 
  ('Anthropic', 'x_account', 'AnthropicAI', 'official', 1, 'highest', true),
  ('OpenAI', 'x_account', 'OpenAI', 'official', 1, 'highest', true),
  ('Cursor', 'x_account', 'cursor_ai', 'official', 1, 'highest', true),
  ('Figma', 'x_account', 'figma', 'official', 1, 'highest', true),
  ('Vercel', 'x_account', 'vercel', 'official', 1, 'highest', true),
  ('Supabase', 'x_account', 'supabase', 'official', 1, 'highest', true),
  -- キーパーソン
  ('Sam Altman', 'x_account', 'sama', 'keyperson', 2, 'high', false),
  ('Dylan Field', 'x_account', 'dylanf', 'keyperson', 2, 'high', false),
  ('Andrej Karpathy', 'x_account', 'karpathy', 'keyperson', 2, 'high', false),
  -- 日本語発信者
  ('kgsi', 'x_account', 'kgsi', 'japanese', 3, 'medium', false),
  ('y_matsuwitter', 'x_account', 'y_matsuwitter', 'japanese', 3, 'medium', false);

-- 監視キーワード
INSERT INTO public.news_sources (name, source_category, keyword, keyword_type, keyword_locale, tier, priority)
VALUES 
  ('Claude', 'keyword', 'Claude', 'product', 'en', 1, 'highest'),
  ('Claude Code', 'keyword', 'Claude Code', 'product', 'en', 1, 'highest'),
  ('MCP', 'keyword', 'MCP', 'product', 'en', 1, 'high'),
  ('Cursor', 'keyword', 'Cursor', 'product', 'en', 1, 'high'),
  ('just launched', 'keyword', 'just launched', 'action_trigger', 'en', 1, 'highest'),
  ('now available', 'keyword', 'now available', 'action_trigger', 'en', 1, 'highest'),
  ('新機能', 'keyword', '新機能', 'action_trigger', 'ja', 2, 'high');
```

---

## 🔄 運用フロー変更

### Before (現状)

```
cron → watchlist.json読み込み → Grok API → Slack通知/記事作成
```

### After (新アーキテクチャ)

```
cron → news_sources テーブル読み込み
     ↓
     Xアカウント + キーワードでGrok API検索
     ↓
     source_detections に検知ログ保存
     ↓
     重要度判定 → Slack通知 and/or 記事作成
     ↓
     contents.source_detection_id で紐付け
```

### メリット

1. **運用の可視化:** 管理画面で全ソースを一覧・編集可能
2. **検知履歴:** 何を検知して何を記事化したかの履歴が残る
3. **閾値調整:** DB上で閾値を調整、コード変更不要
4. **拡張性:** RSSフィード、Webhook等の追加が容易

---

## 🎯 実装優先度

| 優先度 | タスク | 工数 |
|--------|--------|------|
| 🔴 P0 | news_sources テーブル作成 | 30min |
| 🔴 P0 | 既存データ移行 | 30min |
| 🟡 P1 | source_detections テーブル作成 | 30min |
| 🟡 P1 | cronジョブをDB参照に変更 | 1h |
| 🟢 P2 | 管理画面（ソース一覧/編集） | 2h |
| 🟢 P2 | 検知履歴ダッシュボード | 2h |

---

## ❓ 確認事項

1. **既存sourcesテーブルの扱い:**
   - A) news_sources に統合し、旧テーブルは廃止
   - B) 並行運用（APIは旧テーブルを参照）
   
2. **contents との紐付け方法:**
   - 現在: content_sources テーブルで紐付け
   - 新規: source_detections 経由で紐付け（どちらか選択）

3. **管理画面の優先度:**
   - すぐに必要か、cronジョブ動作後でよいか

---

*「ソースを一元管理して、速報配信の精度と効率を上げる」*
