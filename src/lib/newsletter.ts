import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

function getServiceClient() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error('Missing Supabase credentials');
  }
  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── Validation ──

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254;
}

// ── Rate limiting (IP-based, 5 per hour) ──

export async function isRateLimited(ip: string): Promise<boolean> {
  const supabase = getServiceClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .gte('created_at', oneHourAgo);

  if (error) {
    console.error('[newsletter] Rate limit check failed:', error);
    return false; // fail open
  }

  return (count ?? 0) >= 5;
}

// ── Subscribe ──

export interface SubscribeResult {
  ok: boolean;
  message: string;
  alreadyActive?: boolean;
}

export async function subscribe(
  email: string,
  ip: string,
  userAgent: string
): Promise<SubscribeResult> {
  const supabase = getServiceClient();

  // Check if already exists
  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('id, status, verify_token')
    .eq('email', email.toLowerCase())
    .single();

  if (existing) {
    if (existing.status === 'active') {
      return { ok: true, message: 'このメールアドレスは既に登録済みです。', alreadyActive: true };
    }
    // Re-send verification for pending/unsubscribed
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'pending_verification' as const,
        ip_address: ip,
        user_agent: userAgent,
        unsubscribed_at: null,
      })
      .eq('id', existing.id);

    if (error) {
      console.error('[newsletter] Re-subscribe update failed:', error);
      return { ok: false, message: '登録に失敗しました。もう一度お試しください。' };
    }

    return { ok: true, message: '確認メールを再送しました。メールをご確認ください。' };
  }

  // New subscriber
  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({
      email: email.toLowerCase(),
      ip_address: ip,
      user_agent: userAgent,
    });

  if (error) {
    console.error('[newsletter] Insert failed:', error);
    return { ok: false, message: '登録に失敗しました。もう一度お試しください。' };
  }

  return { ok: true, message: '確認メールを送信しました。メールをご確認ください。' };
}

// ── Get subscriber by email (for sending verification) ──

export async function getSubscriberByEmail(email: string) {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, status, verify_token, unsubscribe_token')
    .eq('email', email.toLowerCase())
    .single();
  return data;
}

// ── Confirm (verify) ──

export async function confirmSubscriber(token: string): Promise<boolean> {
  const supabase = getServiceClient();

  const { data: subscriber } = await supabase
    .from('newsletter_subscribers')
    .select('id, status')
    .eq('verify_token', token)
    .single();

  if (!subscriber) return false;

  if (subscriber.status === 'active') return true; // already verified

  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({
      status: 'active' as const,
      verified_at: new Date().toISOString(),
    })
    .eq('id', subscriber.id);

  return !error;
}

// ── Unsubscribe ──

export async function unsubscribeByToken(
  token: string,
  reason?: string
): Promise<boolean> {
  const supabase = getServiceClient();

  const { data: subscriber } = await supabase
    .from('newsletter_subscribers')
    .select('id, status')
    .eq('unsubscribe_token', token)
    .single();

  if (!subscriber) return false;

  if (subscriber.status === 'unsubscribed') return true;

  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({
      status: 'unsubscribed' as const,
      unsubscribed_at: new Date().toISOString(),
      unsubscribe_reason: reason || null,
    })
    .eq('id', subscriber.id);

  return !error;
}

// ── Get active subscribers ──

export async function getActiveSubscribers() {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, unsubscribe_token')
    .eq('status', 'active');

  if (error) {
    console.error('[newsletter] Fetch active subscribers failed:', error);
    return [];
  }

  return data || [];
}

// ── Get latest morning digest ──

export async function getLatestMorningDigest() {
  const supabase = getServiceClient();

  const { data: digest } = await supabase
    .from('contents')
    .select(`
      id, slug, title, description, date, body_markdown,
      digest_details!inner(edition)
    `)
    .eq('status', 'published')
    .eq('content_type', 'digest')
    .eq('digest_details.edition', 'morning')
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (!digest) return null;

  // Get ranking items
  const { data: ranking } = await supabase
    .from('digest_rankings')
    .select(`
      id,
      digest_ranking_items(rank, headline, nva_total, source_url, news_content_id)
    `)
    .eq('digest_content_id', digest.id)
    .single();

  const rankingItems = ranking?.digest_ranking_items
    ?.sort((a: { rank: number }, b: { rank: number }) => a.rank - b.rank) || [];

  return {
    ...digest,
    rankingItems,
  };
}

// ── Send log ──

export async function createSendLog(params: {
  digestContentId: string | null;
  subject: string;
  sendDate: string;
  totalRecipients: number;
}) {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('newsletter_send_logs')
    .insert({
      digest_content_id: params.digestContentId,
      subject: params.subject,
      send_date: params.sendDate,
      total_recipients: params.totalRecipients,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[newsletter] Create send log failed:', error);
    return null;
  }

  return data?.id;
}

export async function updateSendLog(
  logId: string,
  params: {
    successfulSends: number;
    failedSends: number;
    errors: unknown[];
  }
) {
  const supabase = getServiceClient();

  await supabase
    .from('newsletter_send_logs')
    .update({
      successful_sends: params.successfulSends,
      failed_sends: params.failedSends,
      errors: params.errors,
      completed_at: new Date().toISOString(),
    })
    .eq('id', logId);
}

// ── Check if already sent today ──

export async function hasAlreadySentToday(date: string): Promise<boolean> {
  const supabase = getServiceClient();

  const { count } = await supabase
    .from('newsletter_send_logs')
    .select('*', { count: 'exact', head: true })
    .eq('send_date', date)
    .gt('successful_sends', 0);

  return (count ?? 0) > 0;
}
