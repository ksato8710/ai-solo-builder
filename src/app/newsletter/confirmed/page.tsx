import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function NewsletterConfirmed({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const isSuccess = status === 'success';

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full text-center">
        {isSuccess ? (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
              登録が完了しました
            </h1>
            <p className="text-[var(--text-secondary)] mb-2">
              AI Solo Builder ニュースレターへようこそ!
            </p>
            <p className="text-sm text-[var(--text-muted)] mb-8">
              毎朝 8:15 にAIの最新ニュースをお届けします。
            </p>
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
              確認に失敗しました
            </h1>
            <p className="text-[var(--text-secondary)] mb-8">
              リンクが無効または期限切れです。もう一度お試しください。
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
    </div>
  );
}
