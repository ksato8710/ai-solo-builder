# UI Design System — 記事ページUIデザインスキル

## 概要
AI Solo Builder の記事ページにおけるUIデザインパターン・CSS設計ルール。
2025-2026年のモダンUIトレンド（Linear/Vercel/Stripe系）に準拠。

## デザイン原則（5つの柱）

1. **ボーダーで深度を表現** — ダークモードではシャドウが見えにくい。`rgba(255,255,255,0.06-0.12)` の半透明ボーダーが主要な深度シグナル
2. **グラデーション背景** — フラットな単色(`#1e293b`)ではなく、微細なグラデーション（`145deg, rgba alpha 0.08 → 0.03`）で表面に生命感を出す
3. **insetハイライト** — `inset 0 1px 0 rgba(255,255,255,0.03-0.05)` がモダンなガラス風カードの特徴。上辺に光が当たるシミュレーション
4. **大きいborder-radius** — 16-20px。12px以下は2020年代前半の印象
5. **見出しのタイトなletter-spacing** — `-0.01em` 〜 `-0.02em` で意図的・プロフェッショナルな印象

## CSS設計パターン

### H2 見出し
```css
/* グラデーション下線フェード（Linear/Stripe style） */
border-bottom: 1px solid transparent;
border-image: linear-gradient(90deg,
  rgba(59, 130, 246, 0.5) 0%,
  rgba(139, 92, 246, 0.3) 40%,
  transparent 80%
) 1;
letter-spacing: -0.02em;
```
- 左ボーダー(`border-left`)は2018年代パターン。使わない
- `padding-bottom` でテキストと下線の間に余白を確保

### ブロック引用（Blockquote）
```css
/* ガラスカード + グラデーション左アクセント */
border-left: none;
border: 1px solid rgba(139, 92, 246, 0.15);
border-radius: 16px;
font-style: normal;  /* italic は古い印象 */
background: linear-gradient(145deg,
  rgba(139, 92, 246, 0.06) 0%,
  rgba(59, 130, 246, 0.03) 100%
);
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15),
  inset 0 1px 0 rgba(255, 255, 255, 0.03);
```
- `::before` の巨大引用符（`\201C`）は使わない
- `::after` で左端にグラデーションアクセントライン（violet → blue）

### リスト（UL）
```css
/* グラデーションドットバレット */
list-style: none;
li::before {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B82F6, #8B5CF6);
  box-shadow: 0 0 6px rgba(59, 130, 246, 0.3);
}
```

### リスト（OL）
```css
/* バイオレット番号バッジ */
counter-reset: item;
li::before {
  content: counter(item);
  color: #a78bfa;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 6px;
  font-variant-numeric: tabular-nums;
}
```

### デスクトップテーブル
```css
/* 角丸コンテナ + 下線のみ */
border-collapse: separate;
border-spacing: 0;
border-radius: 16px;
overflow: hidden;
border: 1px solid rgba(255, 255, 255, 0.06);
background: rgba(255, 255, 255, 0.02);
/* セル: border-bottom のみ、左右ボーダーなし */
/* ヘッダー: uppercase, letter-spacing: 0.05em */
```

### モバイルカード（Generic Table → Card変換）
```css
/* ガラスグラデーション + 多層シャドウ */
border: 1px solid rgba(255, 255, 255, 0.06);
border-radius: 16px;
background: linear-gradient(145deg,
  rgba(30, 41, 59, 0.8) 0%,
  rgba(30, 41, 59, 0.5) 100%
);
box-shadow:
  0 2px 8px rgba(0, 0, 0, 0.2),
  inset 0 1px 0 rgba(255, 255, 255, 0.04);
```
- ラベル: `text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.6875rem`
- ホバー効果（transform）はモバイルでは不要

### インラインコード
```css
border-radius: 6px;
border: 1px solid rgba(139, 92, 246, 0.12);
background: rgba(139, 92, 246, 0.1);
color: #c4b5fd;
```

### HR 区切り線
```css
/* グラデーションフェード */
background: linear-gradient(90deg,
  transparent,
  rgba(255, 255, 255, 0.1) 20%,
  rgba(255, 255, 255, 0.1) 80%,
  transparent
);
```

## テーブル分類ロジック（ArticleContent.tsx）

`src/components/ArticleContent.tsx` でテーブルを3種に自動分類:

| 分類 | CSSクラス | 判定条件 | モバイル表示 |
|------|-----------|----------|------------|
| ランキング | `table-ranking` | 3列以上 + 1列目が数値（`/^\d{1,3}(位|\.)?$/`） | バッジ付きカード |
| KV | `table-kv` | 2列のみ（80%以上の行が2セル） | コンパクトKVリスト |
| 汎用 | `table-generic` | 上記以外 | ガラスカード |

### 重要な実装ルール
- **汎用カードの1列目にはdata-labelを付与しない**（カードタイトルとして使うため）
- 年号（`2024年`）がランキングと誤判定されないよう、正規表現を `\d{1,3}` に制限
- `headers.length < 3` のガードでKVテーブルとの混同を防止

## タイポグラフィ間隔

| 要素 | margin-top | margin-bottom | 備考 |
|------|-----------|--------------|------|
| h2 | 3rem（モバイル: 2.5rem） | 1.25rem | セクション間に十分な空気 |
| h3 | 2rem | 0.875rem | h2より控えめ |
| p | — | 1.25rem | line-height: 1.85 |
| blockquote | — | — | margin: 2rem 0 |
| table | — | — | margin: 2rem 0 |

## ライトモード対応

ダークモード用CSSの後に `.light` プレフィックスで上書き:
- ボーダー: `rgba(0, 0, 0, 0.06-0.08)`
- 背景: `rgba(248, 250, 252, 0.9)` 系
- シャドウ: `rgba(0, 0, 0, 0.04-0.06)`
- insetハイライト: `rgba(255, 255, 255, 0.5-0.8)`

## 避けるべきパターン（アンチパターン）

| パターン | 理由 | 代替 |
|----------|------|------|
| `border-left: 3px solid` 見出し | 2018年代の印象 | gradient bottom-border |
| `font-style: italic` 引用 | 古い印象 | `font-style: normal` + カード化 |
| `list-style-type: disc` | 地味 | カスタム `::before` グラデーションドット |
| `border-collapse: collapse` テーブル | 角丸が効かない | `border-separate` + `overflow: hidden` |
| `border-radius: 8-12px` | 2020年代前半 | 16-20px |
| 単色カード背景（`#1e293b`） | フラットで生気がない | グラデーション背景 |
| 単層シャドウ（`0 1px 4px`） | 深度が足りない | 2-3層 + insetハイライト |
| hover transform on mobile | 意味がない | 省略またはborder-color変化のみ |

## 参照ファイル

| ファイル | 内容 |
|---------|------|
| `src/app/globals.css` | 全CSSスタイル（記事コンテンツ、テーブル、モバイル対応） |
| `src/components/ArticleContent.tsx` | テーブル分類ロジック + data-label付与 |
| `src/app/news/[slug]/page.tsx` | 記事ページテンプレート |
| `docs/business/BRAND-IDENTITY.md` | カラーパレット・タイポグラフィ定義 |
