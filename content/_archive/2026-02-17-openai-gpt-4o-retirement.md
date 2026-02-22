---
title: "OpenAI GPT-4o正式廃止 — GPT-5.2への移行が加速"
slug: "openai-gpt-4o-retirement-2026-02-17"
date: "2026-02-17"
publishedAt: "2026-02-17T08:00:00+09:00"
description: "OpenAIがGPT-4o、GPT-4.1、GPT-4.1 mini、o4-miniをChatGPTから削除。日次利用者0.1%という低利用率を受け、GPT-5.2への本格移行が進む。"
summary: "OpenAIがGPT-4o、GPT-4.1、GPT-4.1 mini、o4-miniをChatGPTから削除。日次利用者0.1%という低利用率を受け、GPT-5.2への本格移行が進む。"
image: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=1200&h=630&fit=crop"
contentType: "news"
readTime: 5
featured: false
tags: ["dev-knowledge", "OpenAI", "GPT", "API移行"]
relatedProducts: ["chatgpt", "openai", "openai-codex"]
---

## 概要

OpenAIは2月13日、GPT-4o、GPT-4.1、GPT-4.1 mini、o4-miniをChatGPTインターフェースから正式に削除した。1月の公式発表から2週間の猶予期間を経ての廃止となる。

**出典:** [TechBriefly](https://techbriefly.com/2026/02/16/why-openai-finally-killed-gpt-4o/) / [OpenAI公式](https://openai.com/index/retiring-gpt-4o-and-older-models/) — 2026-02-13

## 詳細

GPT-4oは2024年に登場し、「会話的で親しみやすい」トーンが特徴だった。一方で「迎合的（sycophantic）」という批判もあり、ユーザーの好みは分かれていた。

2024年8月、OpenAIはGPT-5の登場に伴いGPT-4oを一度廃止したが、ユーザーの強い反発を受けて復活させた経緯がある。今回の廃止は「この機能が永続的に利用可能である保証はない」という当時の注釈通りの措置となった。

### 廃止の理由

OpenAIは以下の理由を挙げている：

- **利用率の低下**: 「ユーザーの大多数がGPT-5.2に移行済み」
- **日次利用者**: GPT-4oを選択するユーザーは全体の0.1%のみ
- **リソース最適化**: レガシーモデルの維持コスト削減

### 法的問題との関連

興味深いことに、GPT-4oの廃止は複数の訴訟問題とも関連している。OpenAIは現在、GPT-4oに言及した複数の「不法死亡訴訟」に直面しているとされる。

## ソロビルダーへの示唆

GPT-4o系のAPIを利用しているプロダクトは、早急にGPT-5.2への移行を検討すべきだ。

**移行時のチェックポイント:**
- プロンプトの互換性確認（GPT-5.2はより論理的なトーン）
- トークン単価の変化を確認
- レスポンス形式の差異テスト

API経由での利用については、ChatGPTインターフェースとは異なるスケジュールで廃止される可能性があるため、OpenAI公式のアナウンスを継続的にウォッチしておこう。

## NVA評価

| 軸 | スコア | 理由 |
|----|--------|------|
| Newsworthiness | 5/5 | メジャーモデルの完全廃止は大きなニュース |
| Value | 5/5 | GPT-4oユーザーに直接影響 |
| Actionability | 5/5 | 移行作業が必要 |
| Credibility | 5/5 | OpenAI公式発表 |
| Timeliness | 5/5 | 2/13に発効済み |
| **合計** | **25/25** | **Tier S** |
