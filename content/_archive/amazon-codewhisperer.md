---
title: "Amazon CodeWhisperer — AWSネイティブのAIコーディング支援"
slug: "amazon-codewhisperer"
date: "2026-02-16"
contentType: "product"
type: product
description: "AWSが提供するAIコーディングアシスタント。AWS SDK、Lambda、CDKの補完に強みを持ち、セキュリティスキャン機能を標準搭載。個人利用は無料。"
readTime: 10
image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=420&fit=crop"
tags: ["ai-coding"]
relatedProducts:
  - "github-copilot"
  - "codeium"
  - "cursor"
  - "tabnine"
  - "google-ai-studio"
---

> 最終情報更新: 2026-02-16

| 項目 | 詳細 |
|------|------|
| 種別 | AIコード補完ツール |
| 開発元 | Amazon Web Services (AWS) |
| 料金 | 個人無料 / Professional $19/月 |
| 対応IDE | VS Code、JetBrains、AWS Cloud9 |
| 特徴 | AWS統合、セキュリティスキャン |

## Amazon CodeWhispererとは？

Amazon CodeWhispererは、AWSが提供する**AWSネイティブのAIコーディングアシスタント**。AWS SDK、Lambda、CDK、S3、DynamoDBなど、AWSサービスとの連携コードに特化した補完を提供。

**セキュリティスキャン機能を標準搭載**し、OWASP Top 10、CWEに基づく脆弱性を自動検出。コードを書きながらセキュリティリスクを指摘してくれる。

**個人利用は完全無料**で、月500回のセキュリティスキャンと無制限のコード補完が利用可能。AWSユーザーにとっては、追加コストなしでAI補完を導入できる選択肢。

## こんな人におすすめ

| ターゲット | 適性 | 理由 |
|------------|------|------|
| AWSヘビーユーザー | ⭐⭐⭐ | AWS API補完が最適化 |
| サーバーレス開発者 | ⭐⭐⭐ | Lambda、API Gateway連携 |
| セキュリティ重視 | ⭐⭐⭐ | 脆弱性スキャン標準搭載 |
| コスト重視 | ⭐⭐⭐ | 個人は完全無料 |
| 非AWSユーザー | ⭐ | AWS以外の補完は弱め |

## 主要機能

### AWSサービス統合補完

AWS SDK（boto3、AWS SDK for JavaScript等）、Lambda関数、CDKコード、CloudFormationテンプレートに特化した高精度な補完。AWSのベストプラクティスを反映。

### セキュリティスキャン

コード内の脆弱性を自動検出。SQLインジェクション、XSS、ハードコードされた認証情報、安全でない暗号化など、セキュリティリスクを指摘し修正案を提示。

### リファレンストラッキング

補完コードがオープンソースのコードと類似している場合、元のライセンス情報を表示。ライセンス違反を防止。

### カスタマイズ（Professional）

組織のコードベースを学習し、チーム固有のコーディングパターンを反映した補完を提供。

### 多言語対応

Python、Java、JavaScript、TypeScript、C#、Go、Rust、PHP、Ruby、Kotlin、SQL、Shell、Terraformなど、主要言語をサポート。

## 使い方（Getting Started）

1. **AWS Builder IDを作成**: 無料のAWS Builder IDでサインアップ
2. **拡張機能インストール**: VS CodeならAWS Toolkit拡張機能をインストール
3. **認証**: AWS Builder IDでログイン
4. **有効化**: CodeWhispererを有効化
5. **コーディング開始**: AWS SDKコードを書くと補完が表示される

## 料金プラン（2026年2月時点）

| プラン | 月額 | 主な機能 |
|--------|------|----------|
| **Individual** | $0 | 無制限補完、月500セキュリティスキャン |
| **Professional** | $19/人 | 組織管理、カスタマイズ、監査ログ |

## Pros（メリット）

- ✅ **個人無料**: 無制限補完が0円
- ✅ **AWS特化**: SDK、Lambda、CDKの補完精度が高い
- ✅ **セキュリティスキャン**: 脆弱性を自動検出
- ✅ **リファレンストラッキング**: ライセンス違反を防止
- ✅ **AWS公式**: 長期サポートの安心感
- ✅ **多言語対応**: 主要言語をサポート
- ✅ **Cloud9統合**: ブラウザIDEでも利用可能

## Cons（デメリット）

- ⚠️ **AWS偏重**: 非AWSコードの補完は競合に劣る
- ⚠️ **IDE制限**: Cursorなど一部IDEは非対応
- ⚠️ **エージェント機能なし**: 自律的タスク実行は不可
- ⚠️ **Composer機能なし**: マルチファイル編集は非対応
- ⚠️ **Professional高い**: $19/月はCopilotより高額

## ユーザーの声

> **「AWSをメインで使うなら、CodeWhispererは必須。SDKの補完精度が違う」**
> — AWSユーザー

> **「セキュリティスキャンが地味に便利。レビュー前に脆弱性を潰せる」**
> — セキュリティエンジニア

> **「無料なのはいいけど、AWS以外のコードはCopilotの方が優秀」**
> — フルスタック開発者

> **「Lambda関数を書くときだけCodeWhispererを使う。使い分けが重要」**
> — ソロビルダー

## FAQ

### Q: AWSアカウントがなくても使える？

A: AWS Builder ID（無料）があれば利用可能。AWSの課金アカウントは不要。

### Q: Copilotとの違いは？

A: CodeWhispererはAWSサービス連携に特化、セキュリティスキャン標準搭載、個人無料。CopilotはGitHub連携、より汎用的な補完。

### Q: セキュリティスキャンは何を検出する？

A: SQLインジェクション、XSS、CSRF、ハードコード認証情報、安全でない暗号化、OWASP Top 10、CWEカテゴリの脆弱性。

### Q: リファレンストラッキングとは？

A: 補完コードがOSSのコードと類似している場合、元のリポジトリとライセンス情報を表示。ライセンス違反を未然に防ぐ。

## 競合比較

| ツール | 価格 | AWS統合 | セキュリティ | 特徴 |
|--------|------|---------|--------------|------|
| **CodeWhisperer** | $0 | ◎ | ◎ スキャン搭載 | AWS特化 |
| **Copilot** | $10/月 | △ | ○ | GitHub連携 |
| **Codeium** | $0 | △ | △ | 汎用 |
| **Cursor** | $20/月 | △ | △ | Composer |

## ソロビルダー向けの使いどころ

### AWSサーバーレス開発

Lambda、API Gateway、DynamoDB、S3を使ったサーバーレスアプリ開発で、CodeWhispererの真価を発揮。AWSのベストプラクティスを反映した補完。

### セキュリティ自動チェック

セキュリティレビューのリソースがないソロビルダーにとって、自動スキャンは心強い。本番デプロイ前の脆弱性チェックに活用。

### コスト最適化

無料でAI補完 + セキュリティスキャンが使えるので、AWSユーザーなら導入しない理由がない。

## 公式リンク

- 公式サイト: https://aws.amazon.com/codewhisperer/
- 料金プラン: https://aws.amazon.com/codewhisperer/pricing/
- ドキュメント: https://docs.aws.amazon.com/codewhisperer/
- AWS Builder ID: https://signin.aws.amazon.com/builderID
