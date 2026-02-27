# AI Solo Craft

**AI ソロビルダー向け日本語ニュースキュレーションサイト（124+ ソース自動収集・NVA 5 軸評価）**

[![Deploy](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)](https://ai-solo-craft.craftgarden.studio)
[![Next.js](https://img.shields.io/badge/Next.js-15%2F16-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)

> **Live**: [ai-solo-craft.craftgarden.studio](https://ai-solo-craft.craftgarden.studio)

![AI Solo Craft Screenshot](screenshot.png)

---

## Why / Background

AI ツールを活用してひとりでプロダクト開発を行う「AI ソロビルダー」が増えている。しかし、必要な情報は英語圏のブログ、X ポスト、ニュースレター、技術コミュニティなど 100 以上のソースに散在し、毎日追いかけるのは現実的でない。AI Solo Craft は **124 以上のソースから自動収集**し、**NVA 5 軸スコアリング**で関連度を評価、**毎朝の Digest 配信**で効率的な情報収集を実現する。

## Features

- **124+ ソース自動収集** -- RSS / API / Scrape の3方式で一次・二次・三次ソースから自動収集
- **NVA 5 軸スコアリング** -- social / media / community / technical / solo_relevance の5軸で 0-100 評価
- **デイリーダイジェスト生成** -- 毎朝 6:00 に自動収集、23:15 にニュースレター配信
- **3 階層ソース分類** -- 一次（公式）/ 二次（メディア）/ 三次（コミュニティ）の体系的分類
- **マルチプラットフォーム投稿** -- 記事のクロスポスト管理
- **管理画面** -- 収集データ管理、スコアリング統計、Source Intelligence、ワークフロー管理
- **GA4 アナリティクス** -- Google Analytics 4 によるアクセス計測
- **Search Console SEO** -- Google Search Console でインデックス状況を監視
- **コンテンツ検証 + 公開ゲート** -- `validate:content` + `publish:gate` でコンテンツ品質を担保

## Tech Stack

| カテゴリ | 技術 |
|---------|------|
| Framework | Next.js 15/16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript |
| DB | Supabase (PostgreSQL) |
| AI | Anthropic API (Sonnet / Haiku) |
| Email | Resend |
| Translation | DeepL API |
| Image | OpenAI (サムネイル生成) |
| Deploy | Vercel |
| Cron | Vercel Cron Jobs |
| Analytics | GA4, Google Search Console |

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Supabase プロジェクト
- Anthropic API キー

### Installation

```bash
git clone https://github.com/ksato8710/ai-solo-craft.git
cd ai-solo-craft
npm install
```

### Environment Variables

`.env.local` を作成し、以下を設定:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SECRET_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Vercel Cron 認証
CRON_SECRET=your_cron_secret

# AI API
ANTHROPIC_API_KEY=sk-ant-...

# Email（Resend）
RESEND_API_KEY=re_...

# 翻訳（DeepL）
DEEPL_API_KEY=...

# 画像生成（OpenAI）
OPENAI_API_KEY=sk-...
```

### Quick Start

```bash
# 開発サーバー起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

## Architecture

### News Pipeline

```
Vercel Cron (06:00 JST)
        │
        ▼
/api/cron/collect-sources
        │
        ├── RSS フィード収集
        ├── API 経由収集
        └── Web スクレイピング
                │
                ▼
        NVA 5 軸ルールベーススコアリング
        (social / media / community / technical / solo_relevance)
        (各 0-20 → 加重平均 x5 → 0-100)
                │
                ▼
        collected_items テーブル（Supabase）
                │
                ▼
Vercel Cron (23:15 JST)
        │
        ▼
/api/cron/send-newsletter → ニュースレター配信
```

### Agent System

| エージェント | モデル | 役割 |
|------------|-------|------|
| news-scout | Sonnet | ニュースソースのスカウト・評価 |
| article-writer | Sonnet | 記事の執筆・編集 |
| quality-checker | Haiku | コンテンツ品質チェック |
| publisher | Haiku | 公開前の最終確認・投稿 |

### Directory Tree

```
ai-solo-craft/
├── src/
│   ├── app/
│   │   ├── page.tsx                          # トップページ（最新ニュース一覧）
│   │   ├── layout.tsx                        # ルートレイアウト
│   │   ├── articles/
│   │   │   ├── page.tsx                      # 記事一覧
│   │   │   └── [slug]/
│   │   │       └── page.tsx                  # 記事詳細
│   │   ├── admin/
│   │   │   ├── page.tsx                      # 管理ダッシュボード
│   │   │   ├── collected-items/
│   │   │   │   └── page.tsx                  # 収集データ管理
│   │   │   ├── scoring/
│   │   │   │   └── page.tsx                  # NVA スコアリング管理
│   │   │   ├── source-intelligence/
│   │   │   │   └── page.tsx                  # ソース分析
│   │   │   └── workflows/
│   │   │       └── page.tsx                  # ワークフロー管理
│   │   └── api/
│   │       ├── v1/
│   │       │   └── contents/
│   │       │       ├── route.ts              # コンテンツ一覧 API
│   │       │       └── [slug]/
│   │       │           └── route.ts          # コンテンツ詳細 API
│   │       ├── cron/
│   │       │   ├── collect-sources/
│   │       │   │   └── route.ts              # 自動収集 (Cron)
│   │       │   └── send-newsletter/
│   │       │       └── route.ts              # ニュースレター配信 (Cron)
│   │       └── admin/
│   │           ├── collected-items/
│   │           │   └── route.ts              # 収集データ管理 API
│   │           └── scoring-config/
│   │               └── route.ts              # スコアリング設定 API
│   ├── lib/
│   │   ├── crawler.ts                        # クローラー（RSS/API/Scrape）
│   │   ├── scorer.ts                         # NVA スコアラー
│   │   └── supabase.ts                       # Supabase クライアント
│   ├── components/                           # UI コンポーネント
│   └── types/                                # 型定義
├── docs/
│   ├── business/                             # ビジネス資料
│   │   ├── concept.md                        #   コンセプト
│   │   ├── lean-canvas.md                    #   リーンキャンバス
│   │   └── brand.md                          #   ブランドガイドライン
│   ├── operations/                           # 運用資料
│   │   ├── workflow.md                       #   ワークフロー定義
│   │   └── editorial.md                      #   編集方針
│   └── technical/                            # 技術資料
│       ├── architecture.md                   #   アーキテクチャ設計
│       ├── DATABASE.md                       #   DB 設計詳細
│       └── api.md                            #   API 仕様
├── specs/                                    # 仕様書
│   ├── content-policy.md                     #   コンテンツポリシー
│   └── db-schema.md                          #   DB スキーマ仕様
├── skills/                                   # スキル定義
│   ├── news-curation/                        #   ニュースキュレーション
│   ├── article-template/                     #   記事テンプレート
│   ├── brand-voice/                          #   ブランドボイス
│   ├── editorial-standards/                  #   編集基準
│   ├── nva-process/                          #   NVA プロセス
│   └── site-config/                          #   サイト設定
├── vercel.json                               # Cron スケジュール設定
├── package.json
├── tsconfig.json
└── next.config.ts
```

### Key Files

| ファイル | 役割 |
|---------|------|
| `src/lib/crawler.ts` | 124+ ソースからのデータ収集エンジン |
| `src/lib/scorer.ts` | NVA 5 軸スコアリングロジック |
| `src/app/api/cron/collect-sources/route.ts` | 自動収集 Cron エントリポイント |
| `src/app/api/cron/send-newsletter/route.ts` | ニュースレター配信 Cron |
| `src/app/admin/` | 管理画面（収集データ・スコアリング・ソース分析） |
| `docs/technical/DATABASE.md` | DB 設計の詳細仕様 |
| `vercel.json` | Cron スケジュール定義 |

### DB Schema (Supabase PostgreSQL)

| テーブル | 説明 |
|---------|------|
| `contents` | 公開コンテンツ（記事） |
| `sources` | 124 ソース定義 |
| `source_crawl_configs` | ソースごとのクロール設定 |
| `collected_items` | 収集データ + NVA スコア |
| `scoring_config` | スコアリング重み設定 |

### API

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/v1/contents` | コンテンツ一覧 |
| GET | `/api/v1/contents/[slug]` | コンテンツ詳細 |
| POST | `/api/cron/collect-sources` | 自動収集 (Cron) |
| POST | `/api/cron/send-newsletter` | ニュースレター配信 (Cron) |
| GET | `/api/admin/collected-items` | 収集データ管理 |
| GET | `/api/admin/scoring-config` | スコアリング設定 |

## Commands

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run validate:content` | コンテンツ検証 |
| `npm run sync:content:db` | Markdown コンテンツを DB に同期 |
| `npm run publish:gate` | 公開ゲート（DB 検証 + ビルド） |
| `npm run x:discover` | X ソースの自動発見 |
| `npm run generate:thumbnails:missing` | 未生成サムネイルの一括生成 |
| `npm run db:push` | マイグレーション適用 |
| `npm run db:migrations:list` | マイグレーションステータス確認 |
| `npm run db:types` | Supabase 型生成 |

### Cron Schedule (vercel.json)

| 時刻 (JST) | パス | 内容 |
|------------|------|------|
| 06:00 | `/api/cron/collect-sources` | 124+ ソースから自動収集 + NVA スコアリング |
| 23:15 | `/api/cron/send-newsletter` | ニュースレター配信 |

## Deploy

Vercel にデプロイ済み。`main` ブランチへの push で自動デプロイ。

```bash
git push origin main  # Vercel 自動デプロイ
```

サブドメイン `ai-solo-craft.craftgarden.studio` は Vercel + AWS Route 53 で管理。

### CI/CD

- Vercel Preview Deploy: PR ごとにプレビュー環境を自動生成
- `npm run publish:gate`: 公開前の必須チェック（DB 検証 + ビルド成功）

## Testing

| コマンド | 説明 |
|---------|------|
| `npm run build` | TypeScript 型チェック + Next.js ビルド検証 |
| `npm run validate:content` | コンテンツの frontmatter・構造検証 |
| `npm run publish:gate` | 公開ゲート（DB 同期 + ビルド成功を確認） |
| `npm run check:images` | 画像パス・OGP 画像の存在チェック |
| `npm run lint` | ESLint による静的解析 |

Vercel Preview Deploy が PR ごとのプレビュー検証環境として機能。

## Documentation

詳細なドキュメントは `docs/` ディレクトリに整備:

| ディレクトリ | 内容 |
|-------------|------|
| `docs/business/` | コンセプト、リーンキャンバス、ブランドガイドライン |
| `docs/operations/` | ワークフロー定義、編集方針 |
| `docs/technical/` | アーキテクチャ設計、DB 詳細、API 仕様 |
| `specs/` | コンテンツポリシー、DB スキーマ仕様 |

## Related Projects

| プロジェクト | 説明 |
|-------------|------|
| [product-hub](https://github.com/ksato8710/product-hub) | プロダクトエコシステム管理ダッシュボード |
| [content-studio](https://github.com/ksato8710/content-studio) | コンテンツ管理・マルチプラットフォーム投稿 |
| [orcha](https://github.com/ksato8710/orcha) | 開発プロセス比較コンテンツサイト |
| [conf-hub](https://github.com/ksato8710/conf-hub) | 技術カンファレンス集約サービス |

## Changelog

| 日付 | 変更内容 |
|------|----------|
| 2026-02 | GA4 アナリティクス・Search Console SEO 統合 |
| 2026-02 | NVA 5 軸スコアリング、管理画面（Source Intelligence、ワークフロー管理） |
| 2026-02 | 初期リリース -- 124+ ソース収集パイプライン、デイリーダイジェスト、ニュースレター配信 |

## Roadmap

- [ ] AI 要約精度の向上（Sonnet → Opus 切替検証）
- [ ] ユーザーパーソナライズ（関心分野ベースのフィード）
- [ ] ソース品質スコアの自動更新
- [ ] コミュニティ投稿（読者のニュース投稿受付）
- [ ] Podcast / 音声ダイジェスト生成
- [ ] 週次トレンドレポートの自動生成
- [ ] 多言語対応（英語版ダイジェスト）

## Contributing

Issue や Pull Request は歓迎です。ソースの追加提案は Issue で受け付けています。

## License

MIT
