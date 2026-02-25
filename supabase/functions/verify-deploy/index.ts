/**
 * verify-deploy Edge Function
 * 
 * Vercel Deploy Hookから呼び出され、デプロイ後のURL検証を行う
 * 検証結果をSlackに通知する
 * 
 * POST /functions/v1/verify-deploy
 * Body: { urls: string[], slackWebhook?: string }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const SLACK_WEBHOOK_URL = Deno.env.get('SLACK_WEBHOOK_URL') || ''
const VERIFY_SECRET = Deno.env.get('VERIFY_DEPLOY_SECRET') || ''

interface VerifyRequest {
  urls: string[]
  slackWebhook?: string
  secret?: string
}

interface UrlResult {
  url: string
  status: number
  ok: boolean
  error?: string
}

async function verifyUrl(url: string): Promise<UrlResult> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'AI-Solo-Craft-Verify-Bot/1.0',
      },
    })
    
    return {
      url,
      status: response.status,
      ok: response.ok,
    }
  } catch (error) {
    return {
      url,
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function sendSlackNotification(
  webhookUrl: string,
  results: UrlResult[]
): Promise<void> {
  const allOk = results.every(r => r.ok)
  const failedUrls = results.filter(r => !r.ok)
  
  const emoji = allOk ? '✅' : '❌'
  const title = allOk 
    ? 'デプロイ検証完了 - 全URL正常'
    : `デプロイ検証警告 - ${failedUrls.length}件のエラー`
  
  const urlDetails = results.map(r => {
    const statusIcon = r.ok ? '✓' : '✗'
    const statusText = r.error || `HTTP ${r.status}`
    return `${statusIcon} ${r.url} (${statusText})`
  }).join('\n')
  
  const message = {
    text: `${emoji} ${title}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} ${title}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`\`\`${urlDetails}\`\`\``,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `検証時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
          },
        ],
      },
    ],
  }
  
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  })
}

serve(async (req) => {
  // CORSヘッダー
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  // POST以外は拒否
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body: VerifyRequest = await req.json()
    
    // シークレット検証（設定されている場合）
    if (VERIFY_SECRET && body.secret !== VERIFY_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Invalid secret' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // URLリストの検証
    if (!body.urls || !Array.isArray(body.urls) || body.urls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'urls array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 各URLを検証
    const results = await Promise.all(body.urls.map(verifyUrl))
    
    // Slack通知（webhook URLが指定されている場合）
    const webhookUrl = body.slackWebhook || SLACK_WEBHOOK_URL
    if (webhookUrl) {
      await sendSlackNotification(webhookUrl, results)
    }
    
    const allOk = results.every(r => r.ok)
    
    return new Response(
      JSON.stringify({
        success: allOk,
        results,
        summary: {
          total: results.length,
          ok: results.filter(r => r.ok).length,
          failed: results.filter(r => !r.ok).length,
        },
      }),
      { 
        status: allOk ? 200 : 207,  // 207 = Multi-Status
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
