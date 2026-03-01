---
title: "Clerk — モダンWebアプリ向け認証プラットフォーム"
slug: "clerk"
date: "2026-02-27"
contentType: "product"
description: "React/Next.js等に対応した認証・ユーザー管理プラットフォーム。プリビルドUIコンポーネントで認証機能を即座に実装可能。2026年2月に無料枠を50,000 MAUに大幅拡大。"
readTime: 6
tags: ["auth", "saas", "nextjs"]
websiteUrl: "https://clerk.com"
pricingSummary: "Hobby 無料（50,000 MAU）, Pro $20/月, Business $250/月"
companyName: "Clerk"
---

# Clerk

**Clerk**は、モダンなWebアプリ向けの**認証・ユーザー管理プラットフォーム**。React/Next.js/Vue等の主要フレームワークに対応し、プリビルドUIコンポーネントで認証機能を即座に実装できる。

## 基本情報

| 項目 | 内容 |
|------|------|
| 開発元 | Clerk |
| 設立 | 2020年 |
| 本社 | サンフランシスコ |
| ベース | B2C/B2B向け認証SaaS |
| 公式サイト | [clerk.com](https://clerk.com) |

## 2026年2月5日の料金改定

大幅な価格引き下げと機能拡充を実施：

### 主な変更点

- **無料枠が10,000 → 50,000 MAUに拡大**（5倍増）
- **MFA（多要素認証）がProプランに統合**（以前は追加料金）
- **Enhanced Authentication Add-on廃止** → Pro機能に組み込み

## 料金プラン（2026年2月改定後）

| プラン | 月額 | 無料ユーザー数 | 特徴 |
|--------|------|---------------|------|
| **Hobby** | **無料** | 50,000 MAU | 基本認証、3ダッシュボードシート |
| **Pro** | $20〜 | 50,000含む（超過$0.02/user） | MFA、Satellite domains、ブランディング削除 |
| **Business** | $250〜 | 同上 | SOC2/HIPAA、10シート、監査ログ |
| **Enterprise** | カスタム | 同上 | 99.99% SLA、専用サポート |

## 認証方法

### パスワードレス認証

- **Email/SMS OTP**（ワンタイムパスコード）
- **Magic Link**（メールリンク認証）
- **Passkeys**（パスキー / FIDO2）

### ソーシャルログイン

Google, GitHub, Apple, Facebook, Twitter, Discord等、**30以上のプロバイダー**に対応。

### Web3認証

MetaMask, Coinbase Wallet, WalletConnect等のウォレット連携。

### エンタープライズSSO

- **SAML 2.0**
- **OIDC**（OpenID Connect）

## B2B機能

| 機能 | 説明 |
|------|------|
| **Organization** | マルチテナント対応、組織単位のユーザー管理 |
| **RBAC** | ロールベースアクセス制御 |
| **招待フロー** | メール招待、ドメイン検証による自動参加 |
| **Impersonation** | サポート用のユーザー代理ログイン |

## 開発者体験

### SDK対応フレームワーク

- **Next.js**（App Router / Pages Router両対応）
- **React**
- **Vue / Nuxt**
- **Remix**
- **Expo（React Native）**
- **Node.js / Express**

### プリビルドUIコンポーネント

```jsx
import { SignIn, SignUp, UserButton } from '@clerk/nextjs';

// これだけでサインインフォームが表示される
<SignIn />
```

完全カスタマイズ可能なUIコンポーネント：
- `<SignIn />` / `<SignUp />`
- `<UserButton />` / `<UserProfile />`
- `<OrganizationSwitcher />`

### Next.js統合例

```typescript
// middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

## ユースケース

### 向いている作業

- **SaaSアプリの認証**: プリビルドUIで即座に実装
- **B2Bアプリ**: Organization機能でマルチテナント対応
- **スタートアップ/MVP**: 50,000 MAU無料で十分な検証可能
- **Next.js/Vercel環境**: 公式サポートで相性◎

### 向いていない作業

- **完全オンプレミス要件**: クラウドサービス前提
- **超大規模（100万MAU+）**: コスト試算が必要

## 他サービスとの比較

| サービス | 特徴 | 無料枠 | B2B機能 |
|----------|------|--------|---------|
| **Clerk** | UIコンポーネント充実、DX重視 | 50,000 MAU | ★★★★☆ |
| **Supabase Auth** | Supabaseエコシステム統合 | 50,000 MAU | ★★☆☆☆ |
| **Auth0** | エンタープライズ向け、機能豊富 | 7,500 MAU | ★★★★★ |
| **WorkOS** | B2B特化、SSO強い | 1M MAU（SSO除く） | ★★★★★ |
| **Firebase Auth** | Googleエコシステム統合 | 無制限（一部制限） | ★★☆☆☆ |

## ソロ開発者向け評価

### メリット

- ✅ **無料枠が大きい**（50,000 MAU）— ほとんどのサイドプロジェクトで十分
- ✅ **UIコンポーネント**で認証画面をゼロから作らなくてOK
- ✅ **Next.js/Vercelとの相性**が非常に良い
- ✅ **セキュリティを任せられる** — 認証は自作するなの鉄則に従える
- ✅ **ドキュメントが充実**

### 注意点

- ⚠️ **スケール時のコスト** — 超過$0.02/userは大規模時に積み上がる
- ⚠️ **SAML/OIDCは従量課金** — エンタープライズ顧客獲得時に追加コスト
- ⚠️ **ベンダーロックイン** — 移行コストを考慮

## 関連リンク

- [公式サイト](https://clerk.com)
- [ドキュメント](https://clerk.com/docs)
- [料金ページ](https://clerk.com/pricing)
- [Next.js クイックスタート](https://clerk.com/docs/quickstarts/nextjs)
- [GitHub](https://github.com/clerk)

---

*最終更新: 2026-02-27（2026年2月料金改定情報反映）*
