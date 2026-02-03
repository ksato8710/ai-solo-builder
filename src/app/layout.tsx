import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Solo Builder — AIソロ開発者のための日本語ニュース",
  description: "グローバルのAI最新情報が、ここに集約されている。個人でAIエージェントとともにプロダクト開発する人のための、毎日見るサイト。",
  openGraph: {
    title: "AI Solo Builder",
    description: "AIソロ開発者が毎日最初に見るサイト。グローバルのAI最新情報を日本語で。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Solo Builder",
    description: "AIソロ開発者が毎日最初に見るサイト",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/5" style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <a href="/" className="flex items-center gap-2">
                <span className="text-xl font-extrabold bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
                  AI Solo Builder
                </span>
              </a>
              <nav className="hidden sm:flex items-center gap-6 text-sm">
                <a href="/category/morning-news" className="text-slate-400 hover:text-blue-400 transition-colors">🌅 朝刊</a>
                <a href="/category/products" className="text-slate-400 hover:text-violet-400 transition-colors">🏷️ プロダクト</a>
                <a href="/category/dev" className="text-slate-400 hover:text-cyan-400 transition-colors">🛠️ 開発</a>
                <a href="/category/deep-dive" className="text-slate-400 hover:text-emerald-400 transition-colors">🔬 深掘り</a>
                <a href="/category/case-study" className="text-slate-400 hover:text-amber-400 transition-colors">📊 事例</a>
                <a href="/news-value" className="text-slate-400 hover:text-rose-400 transition-colors">🎯 評価</a>
              </nav>
              {/* Mobile nav */}
              <div className="sm:hidden flex items-center gap-3 text-xs">
                <a href="/category/morning-news" className="text-slate-400">🌅</a>
                <a href="/category/products" className="text-slate-400">🏷️</a>
                <a href="/category/dev" className="text-slate-400">🛠️</a>
                <a href="/category/deep-dive" className="text-slate-400">🔬</a>
                <a href="/category/case-study" className="text-slate-400">📊</a>
                <a href="/news-value" className="text-slate-400">🎯</a>
              </div>
              <div className="hidden sm:block text-xs text-slate-500">
                ひとりで作る。AIと一緒に。
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 mt-16 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
            <p>AI Solo Builder — AIソロ開発者のための日本語ニュースキュレーション</p>
            <p className="mt-1">毎日配信: 🌅 朝刊 8:00 ・ 🏷️ プロダクト 12:00 ・ 🛠️ 開発 ・ 🔬 深掘り ・ 🌆 夕刊 18:00</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
