---
title: "Microsoft 2月Patch Tuesday — 58脆弱性修正、6件のゼロデイ含む"
slug: "microsoft-patch-tuesday-february-2026"
date: "2026-02-12"
publishedAt: "2026-02-12T08:00:00+09:00"
description: "Microsoftが2月の定例セキュリティ更新をリリース。58件の脆弱性を修正し、うち6件は既に悪用が確認されたゼロデイ。開発環境にも影響。"
summary: "Microsoftが2月の定例セキュリティ更新をリリース。58件の脆弱性を修正し、うち6件は既に悪用が確認されたゼロデイ。開発環境にも影響。"
image: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&h=420&fit=crop"
contentType: "news"
readTime: 4
featured: false
tags: ["other"]
relatedProducts: []
---

## 概要

Microsoftは2026年2月11日（米国時間）、月例セキュリティ更新「Patch Tuesday」をリリースした。58件の脆弱性が修正され、うち6件は既に攻撃に悪用されているゼロデイ脆弱性。

**出典:** [BleepingComputer](https://www.bleepingcomputer.com/news/microsoft/microsoft-february-2026-patch-tuesday-fixes-6-zero-days-58-flaws/) — 2026-02-11

## 修正内容

### 脆弱性の内訳

| 深刻度 | 件数 |
|--------|------|
| Critical（緊急） | 5件 |
| Important（重要） | 51件 |
| Moderate（中） | 2件 |
| **合計** | **58件** |

### 悪用確認済みゼロデイ（6件）

1. Windows NTLM関連
2. Windows Remote Access Connection Manager
3. Windows Remote Desktop
4. Microsoft Exchange Server
5. Microsoft Graphics Component
6. その他1件

### 開発者に影響する脆弱性

- **CVE-2026-21256**: GitHub CopilotおよびVisual Studioのリモートコード実行（RCE）
- **CVE-2026-21528**: Azure IoT Explorer SDKの情報漏洩

## ソロビルダーへの影響

**今日やるべきこと:**

1. **Windows Update実行**  
   設定 → Windows Update → 更新プログラムのチェック

2. **Visual Studio更新**  
   GitHub Copilot/VS Code利用者は最新版へ更新

3. **Azure利用者**  
   IoT Explorer SDK利用時は更新確認

## 背景

Patch Tuesdayは毎月第2火曜日にMicrosoftがセキュリティ更新をリリースする定例日。今月はゼロデイが6件と多く、即時対応が推奨される。

## NVA評価

| 軸 | スコア | 理由 |
|----|--------|------|
| Newsworthiness | 3/5 | 定例更新（ただしゼロデイ多め） |
| Value | 4/5 | 開発環境のセキュリティに直結 |
| Actionability | 5/5 | 今日更新すべき |
| Credibility | 5/5 | Microsoft公式 |
| Timeliness | 5/5 | 発表当日、即時対応推奨 |
| **合計** | **22/25** | **Tier A** |

## 参考リンク

- **BleepingComputer:** [Microsoft February 2026 Patch Tuesday](https://www.bleepingcomputer.com/news/microsoft/microsoft-february-2026-patch-tuesday-fixes-6-zero-days-58-flaws/)
- **Qualys分析:** [Microsoft Patch Tuesday February 2026](https://blog.qualys.com/vulnerabilities-threat-research/2026/02/10/microsoft-patch-tuesday-february-2026-security-update-review)
