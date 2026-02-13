'use client';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-slate-100">管理画面</h1>
      {/* Admin interface for AI Solo Builder content management */}
      <div className="space-y-6">
        <div className="p-6 border border-slate-600 rounded-lg bg-slate-800/50 backdrop-blur-sm shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-slate-200 flex items-center gap-2">
            ⚡ 利用可能な管理機能
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <a 
                href="/admin/sources" 
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium hover:underline"
              >
                📊 情報源管理
              </a>
              <span className="text-slate-400 text-sm">
                - 5段階レーティング、カテゴリ管理、アクティブ制御
              </span>
            </li>
          </ul>
        </div>
        
        <div className="p-6 bg-gradient-to-br from-slate-800/60 to-slate-700/40 border border-slate-600/50 rounded-lg shadow-lg">
          <h3 className="font-semibold mb-4 text-slate-200 flex items-center gap-2">
            📋 管理機能の詳細
          </h3>
          <div className="text-sm space-y-2 text-slate-300">
            <div className="flex items-start gap-3">
              <span className="text-blue-400">•</span>
              <p>情報源の品質・アクセス性レーティング（1-5⭐）</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-violet-400">•</span>
              <p>カテゴリ別フィルタリング</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-emerald-400">•</span>
              <p>無料/有料フラグ管理</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-amber-400">•</span>
              <p>アクティブ/非アクティブ切り替え</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-rose-400">•</span>
              <p>新規追加・編集・削除機能</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-400">💡</span>
            <h4 className="text-sm font-medium text-blue-300">管理画面について</h4>
          </div>
          <p className="text-sm text-blue-200/80">
            AI Solo Builderのコンテンツ管理を効率化するためのツールです。各機能をクリックして詳細な管理を行ってください。
          </p>
        </div>
      </div>
    </div>
  );
}