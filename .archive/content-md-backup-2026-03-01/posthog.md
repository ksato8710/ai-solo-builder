---
title: "PostHog"
slug: "posthog"
date: "2026-02-27"
contentType: product
description: "オールインワンのプロダクト分析プラットフォーム。アナリティクス、セッションリプレイ、A/Bテスト、Feature Flagsを統合。Usage-based pricing で90%以上が無料で利用。"
tags:
  - product-analytics
  - session-replay
  - feature-flags
  - ab-testing
  - data-warehouse
websiteUrl: "https://posthog.com"
pricingSummary: "Freemium（1Mイベント/月無料）"
---

## 概要

**PostHog**は、プロダクトエンジニア向けのオールインワン分析プラットフォーム。Product Analytics、Session Replay、Feature Flags、A/Bテスト、Surveys、Data Warehouseなど10+の製品を統合し、ユーザー行動の理解からプロダクト改善までを一貫して行える。

特筆すべきは**Usage-basedの料金体系**で、90%以上の企業が無料で利用している。クレジットカード不要で始められ、無料枠を超えた場合のみ課金される透明な価格設定が特徴。

## 主な機能

### Product Analytics

- **イベントトラッキング**: ユーザー行動を詳細に記録
- **ファネル分析**: コンバージョンのボトルネックを特定
- **リテンション分析**: ユーザーの継続利用を可視化
- **コホート分析**: ユーザーグループ別の行動比較
- **パス分析**: ユーザーの導線を追跡

### Session Replay

- **Web/モバイル対応**: 実際のユーザー操作を動画で再現
- **プライバシー保護**: 機密情報の自動マスキング
- **エラー連携**: 問題発生時のコンテキストを把握

### Feature Flags

- **段階的ロールアウト**: 機能を一部ユーザーから展開
- **ターゲティング**: 特定条件のユーザーにのみ機能を提供
- **リアルタイム更新**: デプロイなしで機能のON/OFF

### Experiments（A/Bテスト）

- **統計的有意性**: 信頼できるテスト結果
- **多変量テスト**: 複数バリエーションの同時検証
- **Feature Flagsと連携**: シームレスな実験実行

### Surveys

- **ユーザーフィードバック収集**: プロダクト内でアンケート
- **NPS/CSAT**: 顧客満足度の定量化
- **ターゲティング**: 特定ユーザーへの表示

### Data Warehouse

- **統合データ基盤**: 120+のソース/デスティネーション
- **SQLエディタ**: 自由なデータ分析
- **外部データ連携**: Stripe、Zendesk等と統合

### その他

- **Error Tracking**: 例外の検出・分析
- **LLM Analytics**: AI機能の利用状況分析
- **PostHog AI**: 分析の自動化・インサイト生成
- **Workflows**: イベントドリブンな自動化

## 料金プラン

### 無料枠（毎月リセット）

| 製品 | 無料枠 |
|------|--------|
| **Product Analytics** | 1M イベント/月 |
| **Session Replay** | 5K 録画/月 |
| **Feature Flags** | 1M リクエスト/月 |
| **Error Tracking** | 100K 例外/月 |
| **Surveys** | 1,500 回答/月 |
| **Data Warehouse** | 1M 行/月 |
| **LLM Analytics** | 100K イベント/月 |
| **Logs** | 50 GB/月 |

### 従量課金（無料枠超過後）

| 製品 | 単価（スケールで割引） |
|------|------------------------|
| **Analytics** | $0.00005/イベント〜 |
| **Session Replay** | $0.005/録画〜 |
| **Feature Flags** | $0.0001/リクエスト〜 |
| **Error Tracking** | $0.00037/例外〜 |

### プラットフォームパッケージ

| パッケージ | 月額 | 特徴 |
|-----------|------|------|
| **Free** | $0 | 1プロジェクト、1年保持、コミュニティサポート |
| **Pay-as-you-go** | $0〜 | 6プロジェクト、7年保持、メールサポート |
| **Boost** | $250 | 優先サポート |
| **Scale** | $750 | 高度な機能 |
| **Enterprise** | $2,000 | SOC2、HIPAA、SSO強制 |

## 対応プラットフォーム

### フロントエンド
- **JavaScript/TypeScript**: React, Vue, Next.js, Nuxt, Angular等
- **モバイル**: iOS (Swift), Android (Kotlin/Java), React Native, Flutter

### バックエンド
- **サーバー**: Node.js, Python, Ruby, Go, PHP, Java, .NET
- **サーバーレス**: AWS Lambda, Vercel, Cloudflare Workers

## ソロ開発者向けのポイント

### メリット

1. **圧倒的な無料枠**: 1Mイベント/月は個人開発に十分すぎる
2. **オールインワン**: 複数ツールを管理する手間がない
3. **セルフサーブ**: 営業と話す必要なし
4. **オープンソース**: セルフホストも可能（MIT License）
5. **透明な料金**: 予想外の請求がない（上限設定可能）

### 導入例（Next.js）

```bash
npm install posthog-js
```

```typescript
import posthog from 'posthog-js'

posthog.init('<ph_project_api_key>', {
  api_host: 'https://us.i.posthog.com',
})

// イベント送信
posthog.capture('button_clicked', { button_id: 'signup' })
```

### 活用のコツ

- **Feature Flagsから始める**: 安全なデプロイの習慣化
- **Session Replayでバグ調査**: ユーザーが何をしたか一目瞭然
- **ファネル分析でコンバージョン改善**: 離脱ポイントを特定
- **Surveysで直接フィードバック**: 数値だけでは見えない声を収集

## 競合比較

| サービス | 特徴 | 無料枠 |
|----------|------|--------|
| **PostHog** | オールインワン、オープンソース | 1Mイベント/月 |
| **Amplitude** | エンタープライズ向け分析 | 10Mイベント/月 |
| **Mixpanel** | イベント分析特化 | 20Mイベント/月 |
| **Heap** | 自動キャプチャ | 10Kセッション/月 |
| **FullStory** | Session Replay特化 | 1,000セッション/月 |

## 関連リンク

- [公式サイト](https://posthog.com)
- [ドキュメント](https://posthog.com/docs)
- [料金ページ](https://posthog.com/pricing)
- [GitHub](https://github.com/PostHog/posthog)
- [PostHog AI](https://posthog.com/ai)
