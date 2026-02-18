---
title: "Resend完全ガイド — 開発者のためのモダンなメール送信API"
slug: "resend-email-api-guide"
date: "2026-02-19"
contentType: "news"
description: "Resendの特徴、料金、実装方法を解説。React Emailによるテンプレート作成、SendGrid/Postmarkとの比較、ソロビルダーに最適なメール送信APIの選び方"
readTime: 12
tags:
  - "dev-knowledge"
relatedProducts: []
image: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=800&h=420&fit=crop"
---

メール送信は、ほぼすべてのWebアプリケーションで必要になる機能だ。ユーザー登録の確認、パスワードリセット、通知メール...

しかし、SendGridやMailgunの複雑な設定に悩まされた経験はないだろうか？

**Resend**は、そんな開発者の課題を解決するために生まれたモダンなメール送信API。Vercel CEOのGuillermo Rauch氏も「シンプルなインターフェース、簡単な統合、便利なテンプレート。他に何を求めるのか」と評価している。

---

## この記事で得られること

1. Resendの特徴と強み
2. 料金プランの詳細
3. 競合（SendGrid、Postmark、Amazon SES）との比較
4. Next.jsでの実装方法
5. ソロビルダー向けの選び方

---

## Resendとは

**公式サイト:** https://resend.com

Y Combinator出身のスタートアップが開発した、開発者向けメール送信API。

### コンセプト

> 「スパムフォルダではなく、人間に届けるメール」

### 主な特徴

| 特徴 | 説明 |
|------|------|
| **開発者ファースト** | シンプルなAPI、優れたSDK |
| **React Email** | React/Tailwindでメールテンプレート作成 |
| **モダンなダッシュボード** | 直感的なUI、詳細なログ |
| **高い到達率** | DKIM/SPF/DMARC自動設定 |
| **Webhook対応** | 開封、クリック、バウンスをリアルタイム通知 |

---

## 料金プラン

| プラン | 月額 | 日次上限 | カスタムドメイン | データ保持 |
|--------|------|----------|------------------|------------|
| **Free** | $0 | 100通 | 1 | 1日 |
| **Pro** | $20〜 | 無制限 | 10 | 3日 |
| **Scale** | $90〜 | 無制限 | 1,000 | 7日 |
| **Enterprise** | 要相談 | 無制限 | 柔軟 | 柔軟 |

### 無料プランでできること

- 日次100通まで送信
- RESTful API / SMTP
- 公式SDK（Node.js、Python、Ruby等）
- React Email対応
- Webhook 1エンドポイント
- DKIM/SPF/DMARC認証

**ソロビルダーにとって:** 開発・テスト段階なら無料プランで十分。本番稼働後もProプラン（$20〜）でスタートできる。

---

## 競合比較

### メール送信API 4社比較

| 項目 | Resend | SendGrid | Postmark | Amazon SES |
|------|--------|----------|----------|------------|
| **無料枠** | 100通/日 | なし（2024年廃止） | 100通/月 | 62,000通/月（EC2から） |
| **Pro価格** | $20/月〜 | $20/月〜 | $15/月〜 | $0.10/1,000通 |
| **DX（開発体験）** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **テンプレート** | React Email | ビジュアルエディタ | 独自形式 | なし |
| **到達率** | 高 | 中〜高 | 非常に高 | 設定次第 |
| **サポート** | Slack（有料） | チケット | チケット | AWS標準 |

### 選び方の指針

| ユースケース | おすすめ |
|--------------|----------|
| **ソロビルダー・小規模** | Resend or Postmark |
| **React/Next.js開発者** | Resend（React Email） |
| **大量送信・コスト重視** | Amazon SES |
| **マーケティングメール併用** | SendGrid |
| **到達率最優先** | Postmark |

---

## React Email — メールテンプレートの革命

Resendの最大の特徴は、オープンソースの**React Email**との統合。

### 従来のメールテンプレート

```html
<!-- 従来: tableレイアウト地獄 -->
<table width="600" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center">
      <table width="100%">
        <tr>
          <td style="font-family: Arial, sans-serif; font-size: 16px;">
            Hello, World!
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

### React Emailなら

```tsx
// React + Tailwindでメールを書ける！
import { Html, Head, Body, Container, Text, Button } from '@react-email/components';

export default function WelcomeEmail({ username }: { username: string }) {
  return (
    <Html>
      <Head />
      <Body className="bg-white font-sans">
        <Container className="mx-auto p-5">
          <Text className="text-xl">
            Welcome, {username}!
          </Text>
          <Button
            href="https://example.com/get-started"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Get Started
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

**メリット:**
- Reactコンポーネントとして再利用可能
- Tailwind CSSが使える
- TypeScriptで型安全
- プレビュー・テストが容易

---

## Next.jsでの実装

### 1. インストール

```bash
npm install resend @react-email/components
```

### 2. 環境変数

```bash
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxx
```

### 3. API Route作成

```typescript
// app/api/send/route.ts
import { Resend } from 'resend';
import WelcomeEmail from '@/emails/welcome';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { email, username } = await request.json();

  try {
    const { data, error } = await resend.emails.send({
      from: 'noreply@yourdomain.com',
      to: email,
      subject: 'Welcome!',
      react: WelcomeEmail({ username }),
    });

    if (error) {
      return Response.json({ error }, { status: 400 });
    }

    return Response.json({ data });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
```

### 4. フロントエンドから呼び出し

```typescript
const sendEmail = async () => {
  const res = await fetch('/api/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com', username: 'John' }),
  });
  const data = await res.json();
  console.log(data);
};
```

---

## セットアップ手順

### 1. アカウント作成

https://resend.com/signup でアカウント作成（GitHub/Google連携可）

### 2. APIキー取得

ダッシュボード → API Keys → Create API Key

### 3. ドメイン設定（本番用）

1. ダッシュボード → Domains → Add Domain
2. DNS設定（DKIM、SPF、DMARC）
3. 検証完了を待つ（数分〜数時間）

### 4. テスト送信

```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_xxxxxxxxxxxx' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "your@email.com",
    "subject": "Hello World",
    "html": "<p>Test email from Resend</p>"
  }'
```

---

## Webhookでイベント追跡

```typescript
// app/api/webhook/resend/route.ts
export async function POST(request: Request) {
  const payload = await request.json();
  
  switch (payload.type) {
    case 'email.delivered':
      console.log('Email delivered:', payload.data.email_id);
      break;
    case 'email.opened':
      console.log('Email opened:', payload.data.email_id);
      break;
    case 'email.clicked':
      console.log('Link clicked:', payload.data.click.link);
      break;
    case 'email.bounced':
      console.log('Email bounced:', payload.data.email_id);
      // バウンスしたアドレスをDBで無効化
      break;
  }

  return Response.json({ received: true });
}
```

---

## ソロビルダーへのおすすめ構成

### MVP段階

| 項目 | 選択 |
|------|------|
| プラン | Free（100通/日） |
| ドメイン | `@resend.dev`（テスト用） |
| テンプレート | シンプルなテキストメール |

### 本番稼働後

| 項目 | 選択 |
|------|------|
| プラン | Pro（$20/月〜） |
| ドメイン | カスタムドメイン |
| テンプレート | React Email |
| Webhook | 開封率・バウンス追跡 |

---

## まとめ

| ポイント | 内容 |
|----------|------|
| **何ができる** | トランザクションメール送信 |
| **強み** | DX（開発体験）、React Email |
| **無料枠** | 100通/日 |
| **競合との違い** | モダンなAPI設計、React統合 |
| **向いている人** | React/Next.js開発者、DX重視の人 |

**結論:** ソロビルダーがメール送信を実装するなら、**Resend**は最有力候補。React Emailの快適さを一度体験すると、tableレイアウトには戻れない。

---

## 参考リンク

- Resend公式: https://resend.com
- React Email: https://react.email
- Resend Docs: https://resend.com/docs
- Next.js統合ガイド: https://resend.com/docs/send-with-nextjs
