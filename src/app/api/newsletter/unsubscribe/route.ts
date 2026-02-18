import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeByToken } from '@/lib/newsletter';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/newsletter/unsubscribed?status=error', request.url));
  }

  const success = await unsubscribeByToken(token);

  if (success) {
    return NextResponse.redirect(
      new URL(`/newsletter/unsubscribed?status=success&token=${token}`, request.url)
    );
  }

  return NextResponse.redirect(new URL('/newsletter/unsubscribed?status=error', request.url));
}
