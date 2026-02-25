#!/usr/bin/env node
/**
 * verify-deploy.mjs
 * 
 * デプロイ後のURL検証をローカルから実行するスクリプト
 * Supabase Edge Functionを呼び出すか、直接検証を行う
 * 
 * Usage:
 *   node scripts/verify-deploy.mjs [--urls url1,url2,...] [--slack]
 *   node scripts/verify-deploy.mjs --latest  # 最新のDigest + Top3を検証
 * 
 * Options:
 *   --urls <urls>     カンマ区切りのURL一覧
 *   --latest          最新のDigestとTop3記事を自動検証
 *   --slack           結果をSlackに通知
 *   --timeout <ms>    各URLのタイムアウト（デフォルト: 10000ms）
 */

import { createClient } from '@supabase/supabase-js';

// dotenvはローカル実行時のみ（CI環境ではsecretsから環境変数が設定される）
try {
  const dotenv = await import('dotenv');
  dotenv.config();
} catch {
  // dotenvが無くても環境変数から読める場合はOK
}

const BASE_URL = 'https://ai.essential-navigator.com';
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || '';

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};
const hasFlag = (name) => args.includes(name);

const TIMEOUT = parseInt(getArg('--timeout') || '10000', 10);
const shouldNotifySlack = hasFlag('--slack');
const isLatestMode = hasFlag('--latest');

async function verifyUrl(url, timeout = TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'AI-Solo-Craft-Verify/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    return {
      url,
      status: response.status,
      ok: response.ok,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      url,
      status: 0,
      ok: false,
      error: error.name === 'AbortError' ? 'Timeout' : error.message,
    };
  }
}

async function getLatestUrls() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️  Supabase credentials not set, using fallback URLs');
    // フォールバック: ホームページと主要ページのみ検証
    return [
      BASE_URL,
      `${BASE_URL}/news`,
      `${BASE_URL}/category/morning-summary`,
    ];
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 最新のDigest（morning/evening）を取得
  const { data: digests, error: digestError } = await supabase
    .from('contents')
    .select('slug, title')
    .eq('content_type', 'digest')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1);

  if (digestError) throw digestError;

  // 最新のニュース記事（Top3相当）を取得
  const { data: news, error: newsError } = await supabase
    .from('contents')
    .select('slug, title')
    .eq('content_type', 'news')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(3);

  if (newsError) throw newsError;

  const urls = [];
  
  // Digest URL
  if (digests && digests.length > 0) {
    urls.push(`${BASE_URL}/news/${digests[0].slug}`);
  }

  // News URLs
  if (news) {
    news.forEach(n => {
      urls.push(`${BASE_URL}/news/${n.slug}`);
    });
  }

  // Home page
  urls.push(BASE_URL);

  return urls;
}

async function sendSlackNotification(results) {
  if (!SLACK_WEBHOOK_URL) {
    console.log('⚠️  Slack webhook URL not configured, skipping notification');
    return;
  }

  const allOk = results.every(r => r.ok);
  const failedUrls = results.filter(r => !r.ok);

  const emoji = allOk ? '✅' : '❌';
  const title = allOk
    ? 'デプロイ検証完了 - 全URL正常'
    : `デプロイ検証警告 - ${failedUrls.length}件のエラー`;

  const urlDetails = results
    .map(r => {
      const statusIcon = r.ok ? '✓' : '✗';
      const statusText = r.error || `HTTP ${r.status}`;
      return `${statusIcon} ${r.url} (${statusText})`;
    })
    .join('\n');

  const message = {
    text: `${emoji} ${title}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${emoji} ${title}` },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `\`\`\`${urlDetails}\`\`\`` },
      },
    ],
  };

  await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });

  console.log('📢 Slack notification sent');
}

async function main() {
  console.log('🔍 デプロイ検証を開始...\n');

  let urls = [];

  if (isLatestMode) {
    console.log('📰 最新記事のURLを取得中...');
    urls = await getLatestUrls();
  } else {
    const urlArg = getArg('--urls');
    if (urlArg) {
      urls = urlArg.split(',').map(u => u.trim());
    } else {
      // デフォルト: ホームページのみ
      urls = [BASE_URL];
    }
  }

  console.log(`検証対象: ${urls.length}件\n`);
  urls.forEach(u => console.log(`  • ${u}`));
  console.log('');

  // 並列で検証
  const results = await Promise.all(urls.map(url => verifyUrl(url)));

  // 結果を表示
  console.log('📋 検証結果:\n');
  results.forEach(r => {
    const icon = r.ok ? '✅' : '❌';
    const status = r.error || `HTTP ${r.status}`;
    console.log(`${icon} ${r.url}`);
    console.log(`   ${status}\n`);
  });

  // サマリー
  const okCount = results.filter(r => r.ok).length;
  const failCount = results.filter(r => !r.ok).length;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 サマリー: ${okCount}/${results.length} 成功`);

  if (failCount > 0) {
    console.log(`\n⚠️  ${failCount}件のエラーがあります`);
  }

  // Slack通知
  if (shouldNotifySlack) {
    await sendSlackNotification(results);
  }

  // 終了コード
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('❌ エラー:', error.message);
  process.exit(1);
});
