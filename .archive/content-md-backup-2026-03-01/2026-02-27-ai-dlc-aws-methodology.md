---
title: AI-DLC（AI-Driven Development Lifecycle）とは？— AWSが提唱する次世代開発方法論の全貌
slug: ai-dlc-aws-methodology
date: '2026-02-27'
publishedAt: '2026-02-27'
status: published
contentType: news
tags:
  - dev-knowledge
  - AI-DLC
  - AWS
  - 開発方法論
  - Agile
  - AIコーディング
description: >-
  AWSが提唱するAI-DLC（AI-Driven Development
  Lifecycle）の歴史、背景、仕組みを解説。従来のAgileとの違い、3フェーズ構造、対応ツールまで網羅的に紹介。
readTime: 12
source: AWS DevOps Blog
sourceUrl: 'https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/'
image: /thumbnails/ai-dlc-aws-methodology.png
relatedProducts: []
---

# AI-DLC（AI-Driven Development Lifecycle）とは？— AWSが提唱する次世代開発方法論の全貌

「AIでコード生成は速くなった。でも、開発プロセス全体は本当に速くなった？」

この問いに真正面から答えようとしているのが、AWSが2025年7月に公開した**AI-DLC（AI-Driven Development Lifecycle）**だ。単なるAIコーディングツールの話ではない。Agile以来とも言える、**ソフトウェア開発ライフサイクル全体の再設計**を提唱している。

---

## この記事で得られること

- AI-DLCの**歴史と経緯**（いつ、誰が、なぜ作ったか）
- 従来アプローチの**課題**（AI-managed vs AI-assisted）
- AI-DLCの**3フェーズ構造**と新しい用語体系
- **対応ツール**とGitHubリソース
- ソロ開発者にとっての**実践価値**

---

## AI-DLCの歴史と経緯

### タイムライン

| 時期 | イベント |
|------|----------|
| **2024年〜2025年前半** | AWS内部で100以上の顧客実験を実施 |
| **2025年7月31日** | AWS DevOps Blogで公式発表（Raja SP） |
| **2025年8月** | Mediumなどで批評・分析記事が登場 |
| **2025年12月8日** | AWS re:Invent 2025でライブデモ（DVT214セッション） |
| **2026年〜** | コミュニティでの進化・拡張が進行中 |

### 提唱者

**Raja SP**（Principal Solutions Architect, AWS）

> 「100社以上の大規模顧客と協働し、AIを活用したソフトウェア開発の実験を重ねてきた。AI-DLCは、その実験から生まれた実践的な方法論だ」

Raja氏はAWSで18年以上の経験を持ち、Developer Transformationチームを率いている。re:Invent 2025では**Anupam Mishra**（Director of Solutions Architecture）と共同でセッションを担当した。

---

## なぜ新しい方法論が必要だったのか？

### 既存アプローチの限界

AI-DLCが生まれた背景には、**2つのアンチパターン**がある。AWSの顧客実験で繰り返し観察された問題だ。

#### アンチパターン1: AI-Managed（AI任せ）

「複雑なシステムをAIに投げて、全自動で作らせよう」

**問題点:**
- AIは「helpful」になろうとしすぎる（認証、ログ管理など不要な機能まで作る）
- 開発者は大量のコードを渡されるが、自分で書いたわけではないので自信が持てない
- 結局、コードレビューに時間がかかり、本番投入が遅れる

#### アンチパターン2: AI-Assisted（AI補助）

「AIには狭い範囲だけ任せて、設計や計画は人間がやろう」

**問題点:**
- 知的重労働は依然として人間が担う（従来と変わらない）
- プロセス自体は「AI以前」のまま（会議、ドキュメント受け渡し）
- AIで節約した時間が、スクラムミーティングなどで消費される

### 研究データが示す厳しい現実

| 研究元 | 結果 |
|--------|------|
| **ThoughtWorks（2025年）** | AI使用で生産性向上は**10〜15%**程度 |
| **Meter.org実験** | 開発者は「23%向上した」と感じるが、実測では**20%低下** |

この「体感と実測のギャップ」こそ、AI-DLCが解決しようとしている問題の核心だ。

---

## AI-DLCの核心: Plan-Verify-Generateサイクル

AI-DLCの根幹にあるのは、シンプルだが強力なサイクルだ。

```
1. AI: 計画を立てる（Plan）
2. Human: 計画を検証し、軌道修正（Verify）
3. AI: 承認された計画に基づき実装（Generate）
4. Human: 結果を検証
↓
（繰り返し）
```

**ポイント:**
- AIが先に動き、人間がバリデーション
- 「AIに全部任せる」でも「AIを補助に使う」でもない、**協働の第3の道**
- 人間の判断は「コンテキスト理解」「ビジネス要件の把握」に集中

---

## 3つのフェーズ

AI-DLCは開発ライフサイクルを3つのフェーズに分ける。

### Phase 1: Inception（構想）

**目的:** ビジネス意図を要件に変換する

**キーリチュアル:** Mob Elaboration
- チーム全体がリアルタイムでAIの提案を検証
- AIの質問に対して、その場で回答・方向修正

**成果物:**
- ユーザーストーリー
- 非機能要件（NFR）
- Unit of Work定義

### Phase 2: Construction（構築）

**目的:** 設計・実装を行う

**キーリチュアル:** Mob Construction
- AIがアーキテクチャ、ドメインモデル、コード、テストを提案
- チームが技術判断・アーキテクチャ選択をリアルタイムで検証

**成果物:**
- 論理アーキテクチャ
- ドメインモデル
- コード + テスト

### Phase 3: Operations（運用）

**目的:** デプロイ・監視を整備する

**アクティビティ:**
- AIが前フェーズの文脈を活用してIaCを生成
- Runbook、監視設定の提案

**成果物:**
- Infrastructure as Code
- Runbook
- 監視設定

---

## 新しい用語体系

AI-DLCは、Agile時代の用語を刷新した。

| Agile時代 | AI-DLC | 違い |
|-----------|--------|------|
| **Sprint** | **Bolt** | 週単位 → 時間〜日単位 |
| **Epic** | **Unit of Work** | より小さく分解された作業単位 |
| **デイリースタンドアップ** | **Mob Session** | 報告会 → リアルタイム協働 |

**Bolt（ボルト）** という名称は、稲妻のように短く、強烈なサイクルを表している。従来の2週間スプリントが、AI-DLCでは**数時間〜数日**に短縮される。

---

## 対応ツール

AI-DLCは特定のツールに依存しない方法論だが、以下のツールでワークフローが公式提供されている。

### AWS公式サポート

| ツール | 説明 |
|--------|------|
| **Kiro** | AWS製のAI開発エージェント、AI-DLCネイティブ対応 |
| **Amazon Q Developer** | [Amazon Q Developer Rules](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/context-project-rules.html)でAI-DLC設定可能 |

### コミュニティ対応

| ツール | 対応状況 |
|--------|----------|
| **Cursor** | steering filesでAI-DLC実装可能 |
| **Cline** | 同上 |
| **Claude Code** | 同上 |
| **GitHub Copilot** | 同上 |

### GitHub リポジトリ

**公式ワークフロー:** [awslabs/aidlc-workflows](https://github.com/awslabs/aidlc-workflows)

ここには各ツール向けの設定ファイル、プロンプトテンプレート、サンプルプロジェクトが含まれている。

---

## 発表後の実態（2026年2月時点）

2025年7月の発表から約7ヶ月が経過。現時点での状況を調査した。

### GitHubリポジトリの活発度

| 指標 | 数値 |
|------|------|
| **スター数** | 501 |
| **フォーク数** | 109 |
| **オープンissue** | 28件 |
| **最終コミット** | 2026-02-27（毎日更新中） |
| **最新バージョン** | v0.1.5（2026-02-24リリース） |

**直近の開発内容:**
- CodeBuildワークフロー追加
- セキュリティ拡張
- GitHub Copilot / Kiro CLIの修正

→ **AWSは継続的にメンテナンスしており、本気で推進している**

### 生の声（X / Medium）

**@ry0_kaga（日本語Xポスト）:**
> 「AI-DLCが機能するためには、AIに『永続的なプロジェクト知識』を与えることが必要。単発の優れた指示を出すことは本質ではなく、どのような技術スタック・設計規約・ビジネス目標を目指すかをAIに与えること」

→ Memory Bank / steering filesの重要性を的確に指摘

**Harsha Sridhar（Medium, 2025年8月）:**
> 「従来の12週間プロジェクトで、実際にコードを書くのは5週間だけ。AI-DLCはAgile以来の最も重要な進化」

### 導入事例

**判明している事例:**
- **Wipro**: 10〜15倍の生産性向上（re:Invent 2025で言及）
- **Dun & Bradstreet**: 同様の効果報告

**課題:**
- 外部での詳細な導入事例レポートが少ない
- AWS内部実験が中心で、独立した検証データが限定的
- 「本当に10倍速くなるのか」の再現性は未証明

### 現時点での評価

| 観点 | 評価 |
|------|------|
| **コンセプト** | ⭐⭐⭐⭐⭐ 革新的 |
| **ツール成熟度** | ⭐⭐⭐ 活発だが発展途上 |
| **導入事例** | ⭐⭐ まだ限定的 |
| **コミュニティ** | ⭐⭐⭐ 成長中 |
| **日本での認知** | ⭐⭐ これから |

**結論:** コンセプトは革新的だが、実践例はまだこれから。日本では先行者利益を得るチャンス。

---

## 批評と今後の課題

Medium等での批評記事では、以下の点が指摘されている。

### 評価されている点

- 「既存プロセスにAIを後付けする」のではなく、**ゼロから再設計**している点
- 「AIが計画し、人間が検証する」というバランスが、**現在のAI能力に適合**している点
- **Mob Elaboration / Mob Construction**という儀式が、チーム協働を促進する点

### 課題・改善余地（Peter Tilsen, 2025年8月）

1. **理論的説明の不足**
   - 「なぜこの方法論が機能するのか」の説明が薄い
   - 実装手順（プロンプト、フォルダ構造）に偏重

2. **学習・反省の仕組みが未成熟**
   - 「context memory」の実装詳細が不明確
   - 継続的改善ループの設計が不十分

3. **大規模実証が限定的**
   - WiproやDunでの事例が紹介されているが、詳細データは非公開

---

## ソロ開発者にとっての価値

「チームでMob Elaborationって言われても、一人だし……」

その通り。AI-DLCは大規模チームを想定した設計だ。しかし、ソロ開発者にとっても学べる要素は大きい。

### 取り入れるべきエッセンス

1. **Plan-Verify-Generateサイクル**
   - 一人でも「AIに計画を立てさせ → 自分で検証 → 実装」のサイクルは有効
   - 「AIに丸投げ」も「AIは補助」もせず、**協働のリズム**を作る

2. **Bolt（短サイクル）の発想**
   - 週単位で考えるのではなく、**数時間単位で完結する作業**を設計
   - 「今日のBoltで何を達成するか」を明確に

3. **永続的コンテキストの活用**
   - Memory BankやCLAUDE.mdのような仕組みで、**セッションをまたいだ文脈**を保持
   - AIに毎回説明し直さない

### 参考: ソロ向けワークフロー例

```
朝のBolt（2時間）:
1. AIに「今日のゴール」を伝える
2. AIが作業計画を提案
3. 自分で検証・修正
4. AIと共同で実装
5. 成果をコミット

昼のBolt（2時間）:
（同様のサイクル）
```

---

## まとめ

AI-DLCは、Agile以来の**開発ライフサイクル全体の再設計**を提唱する方法論だ。

**覚えておくべき3点:**

1. **2つのアンチパターン**を避ける（AI-managed / AI-assisted）
2. **Plan-Verify-Generateサイクル**でAIと協働する
3. **Bolt**（時間〜日単位）で高速に回す

AWSの顧客実験では**10〜15倍の生産性向上**が報告されている。ただし、これはチーム全体でAI-DLCを実践した場合の数字だ。

ソロ開発者としては、まず**エッセンスを取り入れる**ところから始めてみてはどうだろうか。

---

## 参考リンク

- **公式ブログ:** [AI-Driven Development Life Cycle: Reimagining Software Engineering](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/)
- **公式ホワイトペーパー:** [AI-DLC Whitepaper](https://prod.d13rzhkk8cj2z0.amplifyapp.com/)
- **GitHub:** [awslabs/aidlc-workflows](https://github.com/awslabs/aidlc-workflows)
- **re:Invent 2025セッション:** [DVT214 - Introducing AI-Driven Development Lifecycle](https://www.youtube.com/watch?v=1HNUH6j5t4A)
- **Amazon Q Developer Rules:** [公式ドキュメント](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/context-project-rules.html)
- **Kiro公式:** [kiro.dev](https://kiro.dev/)
