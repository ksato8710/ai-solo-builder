---
title: "Continue.dev — OSSのAIコーディングアシスタント（IDE拡張）"
slug: continue-dev
date: "2026-02-10"
contentType: "product"
type: product
description: "Continue.devは、VS Code / JetBrainsで使えるオープンソースのAIコーディングアシスタント。モデルを切り替えながら、補完・チャット・リファクタ支援を統合できる。"
readTime: 6
tags: ["ai-coding"]
image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=420&fit=crop"
---

> 最終情報更新: 2026-02-10

| 項目 | 詳細 |
|------|------|
| 種別 | コーディング支援（IDE拡張） |
| 提供形態 | OSS（ローカル実行） + 各種LLM接続 |
| 開発元 | Continue（コミュニティ主導） |
| サービス開始 | 不明（OSSとして継続開発） |
| 料金 | OSS/無料（LLM利用料は別） |
| 利用規模 | 不明（GitHub等を参照） |
| GitHub | https://github.com/continuedev/continue |

## これは何？

Continue.devは、エディタ内で「補完」と「会話」と「編集」を一体化させるタイプのAIコーディング支援。  
強みは、特定ベンダーに固定せず、用途に応じてLLMやプロバイダーを切り替えられる点にある。

ソロ開発では、日々の小改修を高速に回すために「エディタに常駐する相棒」が必要になる。Continueは、ここをOSSで提供し、運用ポリシー（規約や設計方針）をプロジェクト側に寄せて管理できる。

## 主な機能
- IDE内のチャット（コード文脈込み）
- コード補完/提案
- 指定範囲の編集・リファクタ支援
- モデル/プロバイダー切り替え（プロジェクトごとの方針に合わせられる）

## 料金
- Continue自体は無料（OSS）
- 実際のコストは接続するLLM（OpenAI/Anthropic/ローカルモデル等）に依存

## ソロビルダー視点の使いどころ
- 「普段の編集」はContinue（軽いループ）、重い調査や設計は別のエージェント/CLIに寄せる
- リポジトリ内に「AI向けルール（仕様/設計/禁止事項）」を置き、提案のブレを抑える
- モデルを使い分けて、コストと品質のバランスを取る

## 注意点・限界
- モデル選定と権限設計は自分で決める必要がある（自由度の裏返し）
- 生成結果は必ずレビューする（特に依存関係の更新やセキュリティ）

## 公式リンク
- 公式: https://continue.dev/
- GitHub: https://github.com/continuedev/continue

## 参考（出典）
- https://continue.dev/
- https://github.com/continuedev/continue

