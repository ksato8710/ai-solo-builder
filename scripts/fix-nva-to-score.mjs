#!/usr/bin/env node
/**
 * NVA → スコア 表記変更スクリプト
 * - ランキング表の「NVA」列 → 「スコア」
 * - 「(Tier A)」「(Tier B)」等の表記を削除
 * - 「ニュースバリュー評価（NVA）」 → 「スコア内訳」
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const newsDir = path.join(__dirname, '..', 'content', 'news');

const files = fs.readdirSync(newsDir).filter(f => f.endsWith('.md'));

let updatedCount = 0;

for (const file of files) {
  const filePath = path.join(newsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // テーブルヘッダー: | NVA | → | スコア |
  content = content.replace(/\|\s*NVA\s*\|/g, '| スコア |');
  
  // 「ニュースバリュー評価（NVA）」→「スコア内訳」
  content = content.replace(/ニュースバリュー評価（NVA）/g, 'スコア内訳');
  content = content.replace(/ニュースバリュー評価\(NVA\)/g, 'スコア内訳');
  
  // 「(Tier A)」「(Tier B)」「(Tier C)」を削除（スコア行末から）
  content = content.replace(/\s*\(Tier [A-C]\)/g, '');
  
  // 「重要ニュースランキング（NVA）」→「重要ニュースランキング」
  content = content.replace(/重要ニュースランキング（NVA）/g, '重要ニュースランキング');
  content = content.replace(/重要ニュースランキング\(NVA\)/g, '重要ニュースランキング');
  
  // description内の「NVAでTop」→「スコアでTop」
  content = content.replace(/NVAでTop/g, 'スコアでTop');
  content = content.replace(/NVAで選定/g, 'スコアで選定');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    updatedCount++;
    console.log(`✓ ${file}`);
  }
}

console.log(`\n完了: ${updatedCount}件の記事を更新`);
