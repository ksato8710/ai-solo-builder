---
title: "Sentry"
slug: "sentry"
date: "2026-02-27"
contentType: product
description: "エラー監視・パフォーマンス分析プラットフォーム。リアルタイムでアプリケーションの問題を検出・診断し、開発者の生産性を向上させる。"
tags:
  - error-tracking
  - performance
  - monitoring
  - debugging
  - observability
websiteUrl: "https://sentry.io"
pricingSummary: "Freemium（5,000エラー/月無料）"
---

## 概要

**Sentry**は、アプリケーションのエラー監視・パフォーマンス分析を行うプラットフォーム。リアルタイムでエラーを検出し、スタックトレース・ブレッドクラム・コンテキスト情報を提供して、問題の特定と修正を効率化する。

ソロ開発者にとって、本番環境のバグを素早く発見・修正できることは生産性に直結する。Sentryは無料枠でも十分に使え、導入も簡単なため、個人開発の必須ツールといえる。

## 主な機能

### エラーモニタリング

- **リアルタイムエラー検出**: アプリケーションのエラーを即座にキャプチャ
- **スタックトレース**: 完全なスタックトレースでエラー箇所を特定
- **ブレッドクラム**: エラー発生前のユーザー行動を追跡
- **コンテキスト情報**: OS、ブラウザ、デバイス情報を自動収集
- **重複排除**: 同一エラーをグループ化して整理

### パフォーマンスモニタリング（Tracing）

- **分散トレーシング**: サービス間のリクエストを追跡
- **パフォーマンスボトルネック特定**: 遅いトランザクションを可視化
- **Web Vitals**: Core Web Vitalsの計測

### Session Replay

- **実ユーザーセッション再生**: エラー発生時のユーザー操作を動画で確認
- **プライバシー保護**: 機密情報のマスキング機能

### Seer（AI Debugger）

- **根本原因分析**: AIによるエラー原因の自動特定
- **修正提案**: コード修正案の自動生成
- **コードレビュー**: PRに対するエラー予測

### その他

- **Cron Monitoring**: 定期ジョブの監視・障害検知
- **Uptime Monitoring**: サービス稼働状況の監視
- **Logs**: アプリケーションログの収集・分析

## 料金プラン

| プラン | 月額 | エラー数 | 特徴 |
|--------|------|----------|------|
| **Developer** | 無料 | 5,000/月 | 1ユーザー、基本機能 |
| **Team** | $26〜 | カスタム | 無制限ユーザー、90日保持 |
| **Business** | $80〜 | カスタム | SAML SSO、高度なフィルタリング |
| **Enterprise** | カスタム | カスタム | SLA、専用サポート |

**従量課金（超過時）:**
- エラー: $0.000290/イベント
- Logs: $0.50/GB
- Cron監視: $0.78/モニター
- Uptime監視: $1.00/アラート

## 対応プラットフォーム

### フロントエンド
- **JavaScript**: React, Vue, Angular, Svelte, Next.js, Nuxt, Remix, Astro等
- **モバイル**: React Native, Flutter, iOS (Swift), Android (Kotlin/Java)

### バックエンド
- **サーバー**: Node.js, Python, Ruby, Go, Java, PHP, .NET, Rust, Elixir
- **サーバーレス**: AWS Lambda, Azure Functions, Google Cloud Functions, Cloudflare Workers

### デスクトップ・ゲーム
- **デスクトップ**: Electron, .NET (WPF/WinForms), macOS
- **ゲーム**: Unity, Unreal Engine, Godot

## ソロ開発者向けのポイント

### メリット

1. **無料枠が十分**: 5,000エラー/月は個人プロジェクトに十分
2. **導入が簡単**: SDKをインストールして数行で設定完了
3. **即座に問題発見**: ユーザー報告前にエラーを検知
4. **コンテキスト豊富**: 再現困難なバグも原因特定しやすい
5. **MCP Server対応**: AIエージェントとの連携が可能

### 導入例（Next.js）

```bash
npx @sentry/wizard@latest -i nextjs
```

これだけで基本設定が完了。エラーが発生すると自動的にSentryに送信される。

### 活用のコツ

- **Source Maps設定**: 本番コードでも読みやすいスタックトレースに
- **Release Tracking**: デプロイごとにエラー傾向を把握
- **Slack連携**: 重要なエラーを即座に通知
- **Performance Budgets**: パフォーマンス劣化を検知

## 競合比較

| サービス | 特徴 | 無料枠 |
|----------|------|--------|
| **Sentry** | 総合的、AI機能充実 | 5,000エラー/月 |
| **LogRocket** | Session Replay特化 | 1,000セッション/月 |
| **Bugsnag** | モバイル向け強い | 7,500イベント/月 |
| **Rollbar** | 自動グループ化が優秀 | 5,000イベント/月 |

## 関連リンク

- [公式サイト](https://sentry.io)
- [ドキュメント](https://docs.sentry.io)
- [料金ページ](https://sentry.io/pricing/)
- [MCP Server](https://mcp.sentry.dev)
- [GitHub](https://github.com/getsentry/sentry)
