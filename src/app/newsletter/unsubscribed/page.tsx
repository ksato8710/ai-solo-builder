'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function UnsubscribedContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const token = searchParams.get('token');
  const isSuccess = status === 'success';

  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleFeedback() {
    if (!reason.trim() || !token) return;

    try {
      await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reason }),
      });
    } catch {
      // Best effort
    }
    setSubmitted(true);
  }

  return (
    <div className="max-w-md w-full text-center">
      {isSuccess ? (
        <>
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
            配信を停止しました
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            ニュースレターの配信を停止しました。ご利用ありがとうございました。
          </p>

          {/* Feedback form */}
          {!submitted && token && (
            <div className="mb-8 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-left">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                よろしければ理由をお聞かせください（任意）
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="配信頻度が多い、内容が合わないなど..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              />
              <button
                onClick={handleFeedback}
                className="mt-2 px-4 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors"
              >
                送信
              </button>
            </div>
          )}

          {submitted && (
            <p className="text-sm text-emerald-400 mb-8">
              フィードバックありがとうございます。
            </p>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
            処理に失敗しました
          </h1>
          <p className="text-[var(--text-secondary)] mb-8">
            無効なリンクです。メールに記載のリンクを再度お試しください。
          </p>
        </>
      )}

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 transition-all"
      >
        トップページへ戻る
      </Link>
    </div>
  );
}

export default function NewsletterUnsubscribed() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Suspense fallback={<div className="text-[var(--text-muted)]">読み込み中...</div>}>
        <UnsubscribedContent />
      </Suspense>
    </div>
  );
}
