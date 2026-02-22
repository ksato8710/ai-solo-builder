---
title: "Turso — SQLite互換のエッジ分散データベース"
slug: "turso"
date: "2026-02-16"
contentType: "product"
type: product
description: "SQLite互換の分散データベース。既存のSQLiteコードをほぼそのまま移行可能。Vercel Edge Functions、Cloudflare Workersなどエッジ環境で高速動作。Free Tierで5GB、5億行読み取り。"
readTime: 12
image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=420&fit=crop"
tags: ["developer-tools", "database"]
relatedProducts: []
---

> 最終情報更新: 2026-02-16

| 項目 | 詳細 |
|------|------|
| 種別 | エッジ分散データベース |
| 開発元 | Turso（旧ChiselStrike） |
| 料金 | 無料版 / Developer $29/月 / Scaler $79/月 |
| ベース技術 | libSQL（SQLiteフォーク） |
| 特徴 | SQLite互換、エッジ分散、Embedded Replicas |

## Tursoとは？

Tursoは、**SQLite互換の分散データベース**。オープンソースの**libSQL**（SQLiteのフォーク）をベースに、**グローバル分散**と**エッジ配信**を実現。

最大の特徴は**SQLite互換**。既存のSQLiteで書いたクエリ、スキーマがほぼそのまま動く。Vercelでローカル開発していたSQLiteアプリを、本番環境に移行する際の**最も自然な選択肢**。

**Embedded Replicas**機能で、データベースのコピーをアプリケーション内にローカルキャッシュ。読み取りは**ローカルのSQLiteファイル**から行い、書き込みだけクラウドに同期。超高速な読み取りと一貫性を両立。

## こんな人におすすめ

| ターゲット | 適性 | 理由 |
|------------|------|------|
| SQLiteユーザー | ⭐⭐⭐ | 構文がそのまま使える |
| Vercelユーザー | ⭐⭐⭐ | Edge Runtime対応 |
| エッジ重視 | ⭐⭐⭐ | グローバル分散 |
| マルチテナント | ⭐⭐⭐ | DB-per-tenant設計に最適 |
| PostgreSQL派 | ⭐⭐ | Neonの方が自然 |

## 主要機能

### SQLite互換

libSQLはSQLiteの完全互換フォーク。既存のSQLiteスキーマ、クエリがそのまま動作。

```sql
-- SQLiteと同じ構文
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE
);

SELECT * FROM users WHERE id = ?;
```

### グローバル分散

世界中のエッジロケーションにデータを複製。ユーザーに最も近いリージョンから読み取り。

### Embedded Replicas

アプリケーション内にSQLiteファイルとしてレプリカを保持。読み取りはローカルから、書き込みはクラウドに同期。

```javascript
import { createClient } from '@libsql/client';

const db = createClient({
  url: 'file:local.db',          // ローカルレプリカ
  syncUrl: process.env.TURSO_DATABASE_URL,  // クラウド同期
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// 読み取りはローカルから（超高速）
const users = await db.execute('SELECT * FROM users');

// 書き込みはクラウドに同期
await db.execute('INSERT INTO users (name) VALUES (?)', ['Alice']);
await db.sync(); // 同期
```

### Database-per-Tenant

テナントごとに独立したデータベースを作成。100〜1000個のデータベースも低コストで運用可能。

### Point-in-Time Recovery

過去の任意の時点にデータベースを復元。Free Tierでも1日分、Developer以上で10〜90日分。

### Edge Functions対応

Vercel Edge Functions、Cloudflare Workers、Deno Deployなどエッジランタイムで直接アクセス可能。コネクションプール不要。

## 使い方（Getting Started）

### 1. CLIインストール

```bash
# macOS
brew install tursodatabase/tap/turso

# Linux
curl -sSfL https://get.tur.so/install.sh | bash
```

### 2. ログイン & データベース作成

```bash
turso auth login
turso db create my-app-db
turso db show my-app-db  # URLを確認
turso db tokens create my-app-db  # トークン取得
```

### 3. アプリから接続

```javascript
// Node.js / Edge
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// クエリ実行
const result = await db.execute('SELECT * FROM users');
console.log(result.rows);
```

### 4. Vercel環境変数設定

```bash
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
```

## 料金（2026年2月時点）

| プラン | 月額 | データベース数 | ストレージ | 読み取り行数 | 書き込み行数 |
|--------|------|----------------|------------|--------------|--------------|
| **Free** | $0 | 100 | 5GB | 5億/月 | 1000万/月 |
| **Developer** | $29 | 無制限 | 9GB | 25億/月 | 2500万/月 |
| **Scaler** | $79 | 無制限 | 24GB | 1000億/月 | 1億/月 |
| **Pro** | $299 | 無制限 | 50GB | 2500億/月 | 2.5億/月 |

### 超過料金

| 項目 | Free超過後 | Developer超過後 |
|------|------------|-----------------|
| ストレージ | - | $0.75/GB |
| 読み取り | - | $1/10億行 |
| 書き込み | - | $1/100万行 |
| Embedded Replicas同期 | - | $0.35/GB |

## Pros（メリット）

- ✅ **SQLite互換**: 既存コードをほぼそのまま移行
- ✅ **Free Tier充実**: 5GB、5億行読み取りで$0
- ✅ **Edge対応**: Vercel Edge Functionsで動作
- ✅ **Embedded Replicas**: ローカル読み取りで超高速
- ✅ **DB-per-Tenant**: マルチテナントに最適
- ✅ **コネクションレス**: HTTP経由でプール不要
- ✅ **オープンソース**: libSQLはOSS

## Cons（デメリット）

- ⚠️ **PostgreSQL非互換**: pg特有の機能（JSONB等）は使えない
- ⚠️ **書き込みレイテンシ**: プライマリリージョンへのラウンドトリップ
- ⚠️ **新興サービス**: 2022年設立、実績はまだ浅い
- ⚠️ **エコシステム**: ORMサポートは発展途上
- ⚠️ **Write Heavy**: 大量書き込みにはRDS等が適切

## ユーザーの声

> **「SQLiteで書いたコードがそのまま動いた。移行が楽すぎる」**
> — Vercelユーザー

> **「Embedded Replicasで読み取りが爆速。体感が変わった」**
> — フルスタック開発者

> **「マルチテナントSaaSで100個のDB運用。Tursoなら低コスト」**
> — SaaS開発者

> **「Free Tierで十分すぎる。課金の必要性を感じない」**
> — インディー開発者

## FAQ

### Q: SQLiteのファイルをそのまま移行できる？

A: `turso db create --from-file local.db` でローカルのSQLiteファイルをインポート可能。

### Q: Drizzle ORMは使える？

A: 対応済み。`drizzle-orm` + `@libsql/client` で使用可能。

### Q: Prismaは使える？

A: 実験的サポートあり。`@prisma/adapter-libsql` で対応。

### Q: Vercel Edge Functionsで動く？

A: 動く。`@libsql/client` はEdge Runtime対応。

### Q: 書き込みのレイテンシは？

A: プライマリリージョンまでのラウンドトリップ（20-100ms）。読み取りはEmbedded Replicasで<10ms。

### Q: Supabase/Neonとの違いは？

A: TursoはSQLite互換、Supabase/NeonはPostgreSQL。SQLiteから移行ならTurso、PostgreSQLの機能が必要ならNeon。

## 競合比較

| ツール | ベース | 価格 | 特徴 |
|--------|--------|------|------|
| **Turso** | SQLite（libSQL） | $0-299/月 | SQLite互換、エッジ分散 |
| **Neon** | PostgreSQL | $0-69/月 | サーバーレスPostgres |
| **PlanetScale** | MySQL | $0-99/月 | ブランチング、スキーマレス |
| **Supabase** | PostgreSQL | $0-25/月 | BaaS全部入り |
| **D1** | SQLite | $0-5/月 | Cloudflare専用 |

## ソロビルダー向けの使いどころ

### VercelでのSQLite移行

ローカル開発でSQLiteを使っていたNext.jsアプリを、本番環境に移行。クエリの書き換えなしで移行完了。

### エッジファーストのアプリ

Vercel Edge FunctionsやCloudflare Workersで動作するアプリに最適。コールドスタートなし、低レイテンシ。

### マルチテナントSaaS

顧客ごとにデータベースを分離。100〜1000個のDBをFree Tierの範囲内で運用。

### Embedded Replicasで高速化

読み取り頻度が高いアプリで、Embedded Replicasを活用。DBアクセスを<10msに。

## 公式リンク

- 公式サイト: https://turso.tech/
- 料金プラン: https://turso.tech/pricing
- ドキュメント: https://docs.turso.tech/
- GitHub（libSQL）: https://github.com/tursodatabase/libsql
- CLI: https://docs.turso.tech/cli/introduction
- Discord: https://discord.gg/turso

---

## 💡 これから試す人へのTips

### 最速セットアップ（5分）

```bash
# 1. CLIインストール
brew install tursodatabase/tap/turso

# 2. ログイン（GitHubアカウントでOK）
turso auth login

# 3. DB作成
turso db create my-first-db

# 4. シェルで試す
turso db shell my-first-db
> CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT);
> INSERT INTO test (name) VALUES ('hello');
> SELECT * FROM test;
```

### Vercel + Next.jsの構成例

```typescript
// lib/db.ts
import { createClient } from '@libsql/client';

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// app/api/users/route.ts
import { db } from '@/lib/db';

export async function GET() {
  const result = await db.execute('SELECT * FROM users');
  return Response.json(result.rows);
}
```

**Free Tierで十分試せるので、まずは触ってみるのがおすすめ！** 🥊
