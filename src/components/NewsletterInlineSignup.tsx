'use client';

import NewsletterForm from './NewsletterForm';

export default function NewsletterInlineSignup() {
  return (
    <section className="mb-12 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500/10 via-violet-500/8 to-emerald-500/5 border border-[var(--border-color)]">
      <div className="px-6 py-8 sm:px-8 sm:py-10">
        <div className="max-w-lg mx-auto text-center">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500/25 to-violet-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
          </div>

          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1.5">
            AIニュースを毎朝お届け
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-5">
            グローバルのAI最新情報を、毎朝 8:15 にメールで受け取りましょう。
          </p>

          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-5">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400">
              無料
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400">
              毎朝 8:15 配信
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/15 text-violet-400">
              解除はいつでも
            </span>
          </div>

          <NewsletterForm variant="inline" />
        </div>
      </div>
    </section>
  );
}
