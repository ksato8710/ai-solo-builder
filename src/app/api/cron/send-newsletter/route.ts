import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import {
  getActiveSubscribers,
  getLatestMorningDigest,
  createSendLog,
  updateSendLog,
  hasAlreadySentToday,
} from '@/lib/newsletter';
import { MorningDigestEmail } from '@/emails/morning-digest';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai.essential-navigator.com';

// Lazy initialization to avoid build-time errors when RESEND_API_KEY is not set
let resend: Resend | null = null;
function getResend(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const BATCH_SIZE = 50;

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if already sent today
    if (await hasAlreadySentToday(today)) {
      return NextResponse.json({ message: 'Already sent today', skipped: true });
    }

    // Get latest morning digest
    const digest = await getLatestMorningDigest();
    if (!digest) {
      return NextResponse.json({ message: 'No morning digest found', skipped: true });
    }

    // Get active subscribers
    const subscribers = await getActiveSubscribers();
    if (subscribers.length === 0) {
      return NextResponse.json({ message: 'No active subscribers', skipped: true });
    }

    const subject = `${digest.title}`;
    const digestUrl = `${SITE_URL}/news/${digest.slug}`;

    // Create send log
    const logId = await createSendLog({
      digestContentId: digest.id,
      subject,
      sendDate: today,
      totalRecipients: subscribers.length,
    });

    let successCount = 0;
    let failCount = 0;
    const errors: { email: string; error: string }[] = [];

    // Send in batches
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (subscriber) => {
          const unsubscribeUrl = `${SITE_URL}/api/newsletter/unsubscribe?token=${subscriber.unsubscribe_token}`;

          await getResend().emails.send({
            from: 'AI Solo Builder <newsletter@ai.essential-navigator.com>',
            to: subscriber.email,
            subject,
            react: MorningDigestEmail({
              title: digest.title,
              date: digest.date,
              description: digest.description,
              digestUrl,
              rankingItems: digest.rankingItems,
              unsubscribeUrl,
            }),
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          });
        })
      );

      for (let j = 0; j < results.length; j++) {
        if (results[j].status === 'fulfilled') {
          successCount++;
        } else {
          failCount++;
          const reason = results[j] as PromiseRejectedResult;
          errors.push({
            email: batch[j].email,
            error: String(reason.reason),
          });
        }
      }
    }

    // Update send log
    if (logId) {
      await updateSendLog(logId, {
        successfulSends: successCount,
        failedSends: failCount,
        errors,
      });
    }

    return NextResponse.json({
      message: 'Newsletter sent',
      total: subscribers.length,
      success: successCount,
      failed: failCount,
    });
  } catch (error) {
    console.error('[cron] Send newsletter error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
