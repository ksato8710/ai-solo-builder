import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import ShareIcon from "@/components/ShareIcon";

export const metadata: Metadata = {
  title: "AI Solo Builder — AIソロ開発者のための日本語ニュース",
  description: "グローバルのAI最新情報が、ここに集約されている。個人でAIエージェントとともにプロダクト開発する人のための、毎日見るサイト。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI Solo Builder",
  },
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
    <html lang="ja" suppressHydrationWarning>
      <head>
        {/* PWA & App Icons */}
        <meta name="theme-color" content="#6366f1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AI Solo Builder" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.svg" />
        <link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200">
        <ThemeProvider>
          {/* Header */}
          <header className="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--header-bg)] backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-14">
                {/* Logo */}
                <a href="/" className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500 bg-clip-text text-transparent">
                    AI Solo Builder
                  </span>
                </a>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6 text-sm">
                  <a href="/#digest-summary" className="text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors">🗞️ 朝夕のまとめ</a>
                  <a href="/news" className="text-[var(--text-secondary)] hover:text-[var(--accent-violet)] transition-colors">📰 ニュース</a>
                  <a href="/category/products" className="text-[var(--text-secondary)] hover:text-[var(--accent-emerald)] transition-colors">🏷️ プロダクト</a>
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <ShareIcon />
                  <ThemeToggle />
                </div>
              </div>

              {/* Mobile Navigation - Bottom Row */}
              <nav className="md:hidden flex items-center justify-center gap-6 pb-2 text-xs">
                <a href="/#digest-summary" className="text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors">🗞️ まとめ</a>
                <a href="/news" className="text-[var(--text-secondary)] hover:text-[var(--accent-violet)] transition-colors">📰 ニュース</a>
                <a href="/category/products" className="text-[var(--text-secondary)] hover:text-[var(--accent-emerald)] transition-colors">🏷️ プロダクト</a>
              </nav>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-[var(--border-color)] mt-16 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-[var(--text-muted)]">
              <p>AI Solo Builder — AIソロ開発者のための日本語ニュースキュレーション</p>
              <p className="mt-1">毎日配信: 🗞️ 朝刊 8:00 ・ 🗞️ 夕刊 18:00（プロダクトは随時更新）</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
