---
title: "VercelでSQLite卒業！移行先データベース6選を徹底比較【2026年版】"
slug: "vercel-sqlite-migration-database-comparison"
date: "2026-02-16"
description: "VercelでSQLiteを使っていて「そろそろ限界」を感じた人向け。Turso、Vercel Postgres（Neon）、Supabase、DynamoDB、AWS RDS、Aurora Serverlessの6つを、コスト・移行容易性・Vercel相性で徹底比較。"
publishedAt: "2026-02-16T14:00:00+09:00"
image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1200&h=630&fit=crop"
contentType: "news"
readTime: 12
tags: ["開発ナレッジ", "Vercel", "データベース", "SQLite", "インフラ"]
relatedProducts: []
---

VercelでNext.jsアプリを動かしている。SQLiteでサクッと始めたけど、**サーバーレス環境でファイルシステムが永続化されない**問題にぶつかった。

「どのデータベースに移行すべきか？」

この記事では、**SQLiteからの移行先として人気の6サービス**を、コスト、移行容易性、Vercelとの相性で徹底比較する。

## 🎯 結論を先に

| 優先度 | サービス | おすすめの人 |
|--------|----------|--------------|
| 1位 | **Turso** | SQLiteの書き方を変えたくない人 |
| 2位 | **Vercel Postgres（Neon）** | Vercelエコシステムに統一したい人 |
| 3位 | **Supabase** | 認証・ストレージも一緒に欲しい人 |
| 4位 | **DynamoDB** | AWSに慣れていて、スケール重視の人 |
| 5位 | **AWS RDS** | 安定性・実績を重視する人 |
| 6位 | **Aurora Serverless v2** | 大規模で予算がある人 |

---

## 📊 比較表：全6サービス

| サービス | 月額コスト | SQLiteからの移行 | Vercel相性 | 備考 |
|----------|------------|------------------|------------|------|
| **Turso** | $0（Free Tier） | ほぼそのまま | ⭐5 | SQLite互換。最も自然な移行先 |
| **Vercel Postgres（Neon）** | $0（Free Tier） | スキーマ書き換え要 | ⭐5 | Vercelネイティブ統合 |
| **Supabase** | $0（7日で自動停止）/ $25 | スキーマ書き換え要 | ⭐4 | Free Tierは本番不向き |
| **DynamoDB** | ~$0.01 | NoSQL化が必要 | ⭐4 | 安いが設計変更が大きい |
| **AWS RDS** | ~$14/月 | スキーマ書き換え要 | ⭐2 | 常時起動。小規模にはオーバースペック |
| **Aurora Serverless v2** | ~$44/月 | スキーマ書き換え要 | ⭐3 | ゼロスケールしない。高い |

---

## 1️⃣ Turso — SQLite互換で最も自然な移行先

### 概要

Tursoは**libSQL**（SQLiteのフォーク）をベースにした分散データベース。SQLiteの構文がそのまま使えるため、**既存のクエリをほぼ変更なしで移行**できる。

### 料金（2026年2月時点）

| プラン | 月額 | データベース数 | ストレージ | 読み取り行数 |
|--------|------|----------------|------------|--------------|
| **Free** | $0 | 100 | 5GB | 5億行/月 |
| **Developer** | $29 | 無制限 | 9GB | 25億行/月 |
| **Scaler** | $79 | 無制限 | 24GB | 1000億行/月 |

### Vercelとの相性

- **Edge Runtime対応**: Vercel Edge Functionsから直接アクセス可能
- **グローバルレプリケーション**: 世界中のエッジロケーションにデータを複製
- **コネクションレス**: HTTP経由でアクセス。コネクションプールの心配なし

### SQLiteからの移行

```javascript
// SQLite（ローカル）
import Database from 'better-sqlite3';
const db = new Database('local.db');

// Turso（移行後）
import { createClient } from '@libsql/client';
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// クエリはほぼ同じ！
const users = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
```

### メリット

- ✅ SQLite構文がそのまま使える
- ✅ Free Tierが充実（5GB、5億行読み取り）
- ✅ Embedded Replicas（ローカルキャッシュ）で高速
- ✅ Edge Runtimeで動作

### デメリット

- ⚠️ PostgreSQL/MySQLの機能は使えない
- ⚠️ 新興サービス（2022年設立）
- ⚠️ 書き込みはプライマリリージョンへのラウンドトリップ

### こんな人におすすめ

- SQLiteで書いた既存コードを最小限の変更で移行したい
- Edge Functionsで高速なレスポンスが欲しい
- Free Tierで十分な小〜中規模プロジェクト

---

## 2️⃣ Vercel Postgres（Neon）— Vercelネイティブ統合

### 概要

**2024年12月、Vercel PostgresはNeonに統合**された。Neonは「サーバーレスPostgres」の先駆者で、**ゼロから起動**（コールドスタート）、**オートスケール**に対応。

VercelダッシュボードからNeonを追加すると、環境変数が自動で設定される**ネイティブ統合**が魅力。

### 料金（Neon 2026年2月時点）

| プラン | 月額 | コンピュート時間 | ストレージ | 分岐 |
|--------|------|------------------|------------|------|
| **Free** | $0 | 191時間/月 | 512MB | 10 |
| **Launch** | $19 | 300時間/月 | 10GB | 無制限 |
| **Scale** | $69 | 750時間/月 | 50GB | 無制限 |

### Vercelとの相性

- **ダッシュボード統合**: Vercelから直接Neonをプロビジョニング
- **環境変数自動設定**: `POSTGRES_URL`等が自動で追加
- **Vercel SDK対応**: `@vercel/postgres`パッケージで簡単接続

### SQLiteからの移行

```javascript
// SQLite
db.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);

// Neon（PostgreSQL）
import { sql } from '@vercel/postgres';
await sql`INSERT INTO users (name, email) VALUES (${name}, ${email})`;
```

PostgreSQLへの移行なので、**スキーマの書き換え**が必要：

- `INTEGER PRIMARY KEY` → `SERIAL PRIMARY KEY`
- `AUTOINCREMENT` → `SERIAL`
- `TEXT` は同じ（ただし`VARCHAR`も検討）
- SQLiteの`DATETIME`関数 → PostgreSQLの日付関数

### メリット

- ✅ Vercelとのシームレスな統合
- ✅ ゼロスケール（使わないときは0円）
- ✅ PostgreSQLの豊富な機能（JSONB、全文検索等）
- ✅ ブランチ機能でプレビュー環境ごとにDBを分離

### デメリット

- ⚠️ スキーマ移行が必要
- ⚠️ Free Tierのストレージが512MBと少なめ
- ⚠️ コールドスタート（数百ms〜）がある

### こんな人におすすめ

- Vercelエコシステムに統一したい
- PostgreSQLの機能（JSONB、全文検索）を使いたい
- プレビュー環境ごとにDBを分けたい

---

## 3️⃣ Supabase — BaaS全部入り

### 概要

Supabaseは**PostgreSQLベースのBaaS**（Backend as a Service）。データベースだけでなく、**認証、ストレージ、Edge Functions、リアルタイム**を一括提供。

「データベースだけじゃなく、バックエンド全体を任せたい」人向け。

### 料金（2026年2月時点）

| プラン | 月額 | データベース | ストレージ | 認証ユーザー |
|--------|------|--------------|------------|--------------|
| **Free** | $0 | 500MB（**7日で自動停止**） | 1GB | 50,000 |
| **Pro** | $25 | 8GB | 100GB | 100,000 |
| **Team** | $599 | 8GB | 100GB | 無制限 |

⚠️ **Free Tierの罠**: 7日間アクセスがないと自動停止。本番運用には向かない。

### Vercelとの相性

- **公式Integration**: Vercel Marketplaceから追加可能
- **環境変数**: 自動で`SUPABASE_URL`、`SUPABASE_KEY`が設定
- **REST API**: サーバーレス環境でも使いやすい

### SQLiteからの移行

PostgreSQLなので、Neonと同様の**スキーマ書き換え**が必要。Supabase独自の追加ポイント：

```javascript
// Supabase クライアント
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// クエリ（SQL不要のAPI）
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);
```

### メリット

- ✅ 認証、ストレージ、リアルタイムが一括
- ✅ 管理画面（Table Editor）が使いやすい
- ✅ Row Level Security（RLS）でセキュリティ
- ✅ 活発なコミュニティ

### デメリット

- ⚠️ **Free Tierは7日で自動停止**（本番不向き）
- ⚠️ Pro $25/月は小規模サイトには高い
- ⚠️ BaaS機能が不要なら、Neonの方がシンプル

### こんな人におすすめ

- 認証、ストレージも一緒に欲しい
- 管理画面でデータを操作したい
- Pro $25/月を払う予算がある

---

## 4️⃣ DynamoDB — AWSのNoSQL

### 概要

DynamoDBは**AWSのフルマネージドNoSQLデータベース**。キーバリュー/ドキュメント形式で、**スケーラビリティ**と**低コスト**が魅力。

ただし、**SQLiteからの移行は大きな設計変更**が必要。RDB（リレーショナル）の考え方を捨てて、**アクセスパターン駆動設計**に切り替える必要がある。

### 料金（2026年2月時点）

| 項目 | 料金 |
|------|------|
| 書き込みリクエスト | $1.25 / 100万 |
| 読み取りリクエスト | $0.25 / 100万 |
| ストレージ | $0.25 / GB / 月 |

**オンデマンドモード**なら、使った分だけ課金。小規模サイトなら**月$0.01以下**も可能。

### Vercelとの相性

- **AWS SDK**: `@aws-sdk/client-dynamodb`で接続
- **IAMクレデンシャル**: 環境変数で設定
- **コネクションレス**: HTTPベースなのでサーバーレス向き

### SQLiteからの移行

**完全な設計変更が必要**：

```javascript
// SQLite（リレーショナル）
SELECT u.name, o.total 
FROM users u 
JOIN orders o ON u.id = o.user_id 
WHERE u.id = ?;

// DynamoDB（NoSQL）— JOINはない！
// 1. ユーザーとオーダーを別々に取得、または
// 2. ユーザーとオーダーを1つのアイテムに非正規化
const user = await dynamodb.get({
  TableName: 'Users',
  Key: { PK: 'USER#123', SK: 'PROFILE' }
});
const orders = await dynamodb.query({
  TableName: 'Users',
  KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
  ExpressionAttributeValues: {
    ':pk': 'USER#123',
    ':sk': 'ORDER#'
  }
});
```

### メリット

- ✅ 超低コスト（小規模なら$0.01以下）
- ✅ 無限スケール
- ✅ AWSエコシステム統合

### デメリット

- ⚠️ **NoSQL設計への移行コストが大きい**
- ⚠️ JOINがない
- ⚠️ 学習曲線が高い
- ⚠️ ローカル開発が面倒

### こんな人におすすめ

- AWSに慣れている
- シンプルなキーバリューアクセスが中心
- 将来の大規模スケールを見据えている

---

## 5️⃣ AWS RDS — 安定のマネージドRDB

### 概要

AWS RDSは**マネージドリレーショナルデータベース**。MySQL、PostgreSQL、MariaDB等を選択可能。**常時起動**で安定性が高い。

### 料金（2026年2月時点）

| インスタンス | 月額（概算） |
|--------------|--------------|
| db.t4g.micro（無料枠対象） | 無料枠終了後 ~$14/月 |
| db.t4g.small | ~$28/月 |
| db.t4g.medium | ~$56/月 |

**常時起動**なので、使用量に関わらず固定費がかかる。

### Vercelとの相性

- **VPCの壁**: Vercelから直接RDSに接続するには、**パブリックアクセス**または**VPN/Proxy**が必要
- **コネクションプール**: サーバーレス環境では**RDS Proxy**が推奨
- **レイテンシー**: Vercelのエッジから最寄りのAWSリージョンへのラウンドトリップ

### メリット

- ✅ 安定性・実績
- ✅ MySQL/PostgreSQLの全機能
- ✅ バックアップ、マルチAZ、レプリカ

### デメリット

- ⚠️ 常時起動で固定費がかかる
- ⚠️ Vercelとの接続が面倒
- ⚠️ 小規模サイトにはオーバースペック

### こんな人におすすめ

- 大規模で安定性が必須
- AWSの運用に慣れている
- 固定費を許容できる

---

## 6️⃣ Aurora Serverless v2 — 高い、だが最強

### 概要

Aurora Serverless v2は**AWSの最強サーバーレスRDB**。オートスケール、高可用性、PostgreSQL/MySQL互換。

だが、**ゼロスケールしない**（最小0.5 ACU = 約$44/月）ため、小規模サイトには高すぎる。

### 料金（2026年2月時点）

| 項目 | 料金 |
|------|------|
| 最小ACU（0.5） | ~$0.06/時間 = **$44/月** |
| ストレージ | $0.10/GB/月 |
| I/O | $0.20/100万リクエスト |

### Vercelとの相性

RDSと同様、**VPC/Proxy**の設定が必要。

### メリット

- ✅ 最強の性能・可用性
- ✅ オートスケール
- ✅ PostgreSQL/MySQL互換

### デメリット

- ⚠️ **最低$44/月**
- ⚠️ ゼロスケールしない
- ⚠️ 小規模にはオーバースペック

### こんな人におすすめ

- 大規模で予算がある
- 高可用性が必須

---

## 🏆 ソロビルダーへのおすすめ

### 💰 コスト重視なら

1. **Turso Free** — 5GB、5億行読み取りで$0
2. **Neon Free** — 512MBで$0
3. **DynamoDB** — 使用量次第で$0.01以下

### 🚀 移行の簡単さ重視なら

1. **Turso** — SQLite構文がそのまま使える
2. **Neon** — PostgreSQLへの移行は王道
3. **Supabase** — 管理画面が使いやすい

### 🔗 Vercel統合重視なら

1. **Neon（Vercel Postgres）** — ネイティブ統合
2. **Turso** — Edge Runtime対応
3. **Supabase** — Marketplace統合

---

## 📝 まとめ

| シナリオ | おすすめ |
|----------|----------|
| **SQLiteから最小変更で移行したい** | **Turso** |
| **Vercelエコシステムに統一したい** | **Neon（Vercel Postgres）** |
| **認証・ストレージも欲しい** | **Supabase Pro（$25/月）** |
| **AWSで低コスト運用** | **DynamoDB** |
| **大規模・安定性重視** | **RDS or Aurora** |

SQLiteで始めたプロジェクトを次のステップに進める時、**Turso**か**Neon**が最も自然な選択肢。どちらも**Free Tierが充実**しているので、まずは試してみるのがおすすめ。

**Turso**はSQLiteの構文がそのまま使えるので移行コストが最小。**Neon**はPostgreSQLの豊富な機能とVercelとの統合が魅力。

---

*参考リンク:*
- [Turso公式](https://turso.tech/)
- [Neon公式](https://neon.tech/)
- [Supabase公式](https://supabase.com/)
- [AWS DynamoDB](https://aws.amazon.com/dynamodb/)
