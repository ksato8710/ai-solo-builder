import { NextRequest, NextResponse } from 'next/server';
import { confirmSubscriber, notifySlack } from '@/lib/newsletter';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/newsletter/confirmed?status=error', request.url));
  }

  const success = await confirmSubscriber(token);

  if (success) {
    notifySlack(`✅ ニュースレター登録確認完了（メール認証済み）`).catch(() => {});
    return NextResponse.redirect(new URL('/newsletter/confirmed?status=success', request.url));
  }

  return NextResponse.redirect(new URL('/newsletter/confirmed?status=error', request.url));
}
