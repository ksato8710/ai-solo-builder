# 管理画面利用ガイド

## 現行の主要画面（推奨）

- `/admin/source-intelligence` — ニュースソース統合管理
- `/admin/workflows` — 記事種別 × ソース役割マトリクス
- `/admin/schedules` — ニュースレター配信時刻管理
- `/admin/collection` — 競合ニュースレター受信ログ（`ktlabworks@gmail.com`）

## 情報源管理画面

### アクセス方法

開発環境:
```
http://localhost:3000/admin/sources
```

本番環境:
```
https://ai.essential-navigator.com/admin/sources
```

### 機能一覧

#### 1. 情報源一覧表示
- 全ての情報源を一覧表示
- カテゴリ別・アクティブ状態別フィルタ
- 質・アクセス性のレーティング表示

#### 2. 情報源管理
- **新規追加**: 新しい情報源の追加
- **編集**: 既存情報源の更新（インライン編集）
- **削除**: 不要な情報源の削除
- **初期データ投入**: 推奨情報源の一括追加

#### 3. レーティングシステム

**質のレーティング（1-5⭐）:**
- 5⭐：専門性が高く、一次ソースまたは詳細な調査に基づく
- 4⭐：信頼性が高く、業界標準として認知されている
- 3⭐：一般的に有用だが、情報の深さや信頼性にばらつきがある
- 2⭐：参考程度、要検証
- 1⭐：信頼性に懸念あり

**アクセスしやすさ（1-5⭐）:**
- 5⭐：API提供、RSS完備、制限なし
- 4⭐：RSS/フィードあり、軽い制限
- 3⭐：定期的にスクレイピング可能
- 2⭐：制限あり、技術的工夫が必要
- 1⭐：アクセス困難（有料壁・厳しい制限）

#### 4. フラグ管理
- **is_free**: 無料でアクセス可能か
- **is_active**: 実際に情報収集に利用するか

### カテゴリ一覧

- `tech-community`: プログラマー・起業家コミュニティ
- `dev-tools`: 開発ツール・ライブラリ
- `indie-business`: 独立開発者・ソロビジネス
- `startup`: スタートアップ・資金調達
- `dev-knowledge`: 開発ナレッジ・チュートリアル
- `tech-analysis`: 技術的詳細解説
- `consumer-tech`: コンシューマー向け技術
- `business-innovation`: ビジネス・イノベーション
- `tech-research`: 技術研究・論文
- `tech-culture`: テクノロジーと文化

### 推奨無料ソース（初期データ）

1. **Hacker News** - 最もアクセスしやすく質も高い
2. **GitHub Trending** - 開発ツール情報の一次ソース  
3. **Indie Hackers** - ソロビルダー向けコンテンツに最適
4. **Y Combinator News** - 起業関連の質の高いコンテンツ
5. **TechCrunch** - 資金調達・企業動向の速報
6. **Stack Overflow Blog** - 開発動向・調査レポート
7. **Ars Technica** - 技術的に詳細な解説記事
8. **Product Hunt** - 新プロダクト発見プラットフォーム

### 操作手順

#### 初期設定
1. 管理画面にアクセス
2. "初期データ投入"ボタンをクリック
3. 8つの推奨情報源が自動追加される

#### 新規情報源追加
1. "新規追加"ボタンをクリック
2. 必須項目（名前・URL・カテゴリ）を入力
3. レーティング・フラグを設定
4. "追加"ボタンをクリック

#### 情報源編集
1. 対象情報源の"編集"ボタンをクリック
2. インライン編集でフィールドを更新
3. "保存"ボタンをクリック

#### フィルタ利用
- カテゴリドロップダウンで特定カテゴリに絞り込み
- ステータスドロップダウンでアクティブ/非アクティブに絞り込み

### データベース構造

```sql
CREATE TABLE content_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(1000) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  accessibility_rating INTEGER CHECK (accessibility_rating >= 1 AND accessibility_rating <= 5),
  is_free BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API エンドポイント

- `GET /api/admin/sources` - 情報源一覧取得
- `POST /api/admin/sources` - 新規追加・初期データ投入
- `PUT /api/admin/sources` - 情報源更新
- `DELETE /api/admin/sources?id={id}` - 情報源削除

### 今後の拡張予定

- アクセス制御（認証機能）
- 情報収集ログ・統計表示
- RSS/APIエンドポイント管理
- 自動スクレイピング設定
- ソース評価の履歴管理
