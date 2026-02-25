#!/usr/bin/env node
/**
 * wait-for-ci.mjs
 * 
 * git push後にCI完了を待機し、結果を返すスクリプト
 * 
 * Usage:
 *   node scripts/wait-for-ci.mjs [--timeout 300] [--poll 10]
 * 
 * Options:
 *   --timeout <seconds>  最大待機時間（デフォルト: 300秒）
 *   --poll <seconds>     ポーリング間隔（デフォルト: 10秒）
 * 
 * Exit codes:
 *   0: CI成功
 *   1: CI失敗
 *   2: タイムアウト
 *   3: その他のエラー
 */

import { execSync } from 'child_process';

const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? parseInt(args[idx + 1], 10) : defaultValue;
};

const TIMEOUT_SECONDS = getArg('--timeout', 300);
const POLL_SECONDS = getArg('--poll', 10);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const execCommand = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    return null;
  }
};

const getLatestRunStatus = () => {
  // 最新のワークフロー実行を取得
  const result = execCommand('gh run list --limit 1 --json status,conclusion,headBranch,workflowName,createdAt');
  if (!result) return null;
  
  try {
    const runs = JSON.parse(result);
    if (runs.length === 0) return null;
    return runs[0];
  } catch {
    return null;
  }
};

const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds}秒`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}分${secs}秒` : `${mins}分`;
};

async function main() {
  console.log('🔍 CI実行状況を確認中...');
  console.log(`   タイムアウト: ${formatDuration(TIMEOUT_SECONDS)}`);
  console.log(`   ポーリング間隔: ${formatDuration(POLL_SECONDS)}`);
  console.log('');

  const startTime = Date.now();
  let lastStatus = '';

  while (true) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    if (elapsed >= TIMEOUT_SECONDS) {
      console.error(`\n❌ タイムアウト（${formatDuration(TIMEOUT_SECONDS)}経過）`);
      process.exit(2);
    }

    const run = getLatestRunStatus();
    
    if (!run) {
      console.error('❌ GitHub CLIでワークフロー実行を取得できませんでした');
      console.error('   `gh auth status` で認証状態を確認してください');
      process.exit(3);
    }

    const statusKey = `${run.status}-${run.conclusion}`;
    
    if (statusKey !== lastStatus) {
      const elapsed_str = formatDuration(elapsed);
      console.log(`[${elapsed_str}] ${run.workflowName} (${run.headBranch})`);
      console.log(`        ステータス: ${run.status}${run.conclusion ? ` → ${run.conclusion}` : ''}`);
      lastStatus = statusKey;
    }

    // 完了判定
    if (run.status === 'completed') {
      console.log('');
      
      if (run.conclusion === 'success') {
        console.log('✅ CI成功！');
        process.exit(0);
      } else {
        console.error(`❌ CI失敗: ${run.conclusion}`);
        console.error('');
        console.error('詳細を確認:');
        console.error('  gh run view --log-failed');
        process.exit(1);
      }
    }

    // 進行中の場合は待機
    await sleep(POLL_SECONDS * 1000);
  }
}

main().catch(error => {
  console.error('エラー:', error.message);
  process.exit(3);
});
