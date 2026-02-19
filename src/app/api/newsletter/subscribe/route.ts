import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { isValidEmail, isRateLimited, subscribe, getSubscriberByEmail } from '@/lib/newsletter';
import { VerificationEmail } from '@/emails/verification';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, _hp } = body as { email?: string; _hp?: string };

    // Honeypot check
    if (_hp) {
      return NextResponse.json({ ok: true, message: '確認メールを送信しました。' });
    }

    // Email validation
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, message: '有効なメールアドレスを入力してください。' },
        { status: 400 }
      );
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    const limited = await isRateLimited(ip);
    if (limited) {
      return NextResponse.json(
        { ok: false, message: '登録の上限に達しました。しばらくしてからお試しください。' },
        { status: 429 }
      );
    }

    // Subscribe
    const userAgent = request.headers.get('user-agent') || '';
    const result = await subscribe(email, ip, userAgent);

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: 500 });
    }

    // Send verification email (unless already active)
    if (!result.alreadyActive) {
      const subscriber = await getSubscriberByEmail(email);
      if (subscriber?.verify_token) {
        const confirmUrl = `${SITE_URL}/api/newsletter/confirm?token=${subscriber.verify_token}`;

        try {
          await getResend().emails.send({
            from: 'AI Solo Builder <newsletter@ai.essential-navigator.com>',
            to: email.toLowerCase(),
            subject: '【AI Solo Builder】ニュースレター登録の確認',
            react: VerificationEmail({ confirmUrl }),
          });
        } catch (emailError) {
          console.error('[newsletter] Verification email failed:', emailError);
          // Don't fail the subscription even if email fails
          console.log('[newsletter] Verification URL (fallback):', confirmUrl);
        }
      }
    }

    return NextResponse.json({ ok: true, message: result.message });
  } catch (error) {
    console.error('[newsletter] Subscribe error:', error);
    const errorDetail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, message: '予期しないエラーが発生しました。', debug: errorDetail },
      { status: 500 }
    );
  }
}
