import { getAllAssessments } from '@/lib/research';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ニュースバリュー評価一覧 | AI Solo Builder',
  description: '掲載ニュースの元ネタが世の中でどれくらい注目されているかを100点満点でスコアリング。SNS反応・メディアカバレッジ・コミュニティ反応・技術的インパクト・ソロビルダー関連度の5軸で評価。',
};

function tierBadge(tier: string) {
  const styles: Record<string, { bg: string; text: string; stars: string }> = {
    A: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', stars: '⭐⭐⭐' },
    B: { bg: 'bg-blue-500/20', text: 'text-blue-400', stars: '⭐⭐' },
    C: { bg: 'bg-amber-500/20', text: 'text-amber-400', stars: '⭐' },
    D: { bg: 'bg-slate-500/20', text: 'text-slate-500', stars: '—' },
  };
  const s = styles[tier] || styles.D;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
      Tier {tier} {s.stars}
    </span>
  );
}

function scoreBar(score: number, max: number = 20) {
  const pct = (score / max) * 100;
  const color =
    pct >= 85 ? 'bg-emerald-500' :
    pct >= 65 ? 'bg-blue-500' :
    pct >= 40 ? 'bg-amber-500' :
    'bg-slate-600';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right">{score}</span>
    </div>
  );
}

export default function NewsValuePage() {
  const assessments = getAllAssessments();

  const tierCounts = {
    A: assessments.filter(a => a.tier === 'A').length,
    B: assessments.filter(a => a.tier === 'B').length,
    C: assessments.filter(a => a.tier === 'C').length,
    D: assessments.filter(a => a.tier === 'D').length,
  };

  const avgScore = assessments.length > 0
    ? Math.round(assessments.reduce((sum, a) => sum + a.totalScore, 0) / assessments.length)
    : 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <a href="/" className="hover:text-slate-300 transition-colors">ホーム</a>
          <span>/</span>
          <span className="text-slate-400">ニュースバリュー評価</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
          📊 ニュースバリュー評価一覧
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
          掲載しているニュースの<strong className="text-slate-300">元ネタ自体</strong>が、
          世の中でどれくらい注目されているかを独自にスコアリングしています。
          SNS反応量・メディアカバレッジ・コミュニティ反応・技術的インパクト・ソロビルダー関連度の5軸×各20点、100点満点で評価。
        </p>
      </div>

      {/* Stats Bar */}
      <div className="rounded-xl px-6 py-4 mb-8 grid grid-cols-2 sm:grid-cols-5 gap-4"
           style={{ backgroundColor: '#1e293b' }}>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{assessments.length}</div>
          <div className="text-xs text-slate-400">評価済み</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">{tierCounts.A}</div>
          <div className="text-xs text-slate-400">Tier A</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{tierCounts.B}</div>
          <div className="text-xs text-slate-400">Tier B</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-400">{tierCounts.C}</div>
          <div className="text-xs text-slate-400">Tier C</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{avgScore}</div>
          <div className="text-xs text-slate-400">平均スコア</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-xs text-slate-500">
        <span>Tier A (80-100): 必須カバー</span>
        <span>Tier B (55-79): カバー推奨</span>
        <span>Tier C (30-54): 選択的カバー</span>
        <span>Tier D (1-29): スキップ推奨</span>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wider"
                  style={{ backgroundColor: '#1e293b' }}>
                <th className="px-4 py-3 font-semibold">ニュース</th>
                <th className="px-3 py-3 font-semibold text-center">スコア</th>
                <th className="px-3 py-3 font-semibold text-center">Tier</th>
                <th className="px-3 py-3 font-semibold hidden sm:table-cell">SNS</th>
                <th className="px-3 py-3 font-semibold hidden sm:table-cell">メディア</th>
                <th className="px-3 py-3 font-semibold hidden sm:table-cell">コミュニティ</th>
                <th className="px-3 py-3 font-semibold hidden sm:table-cell">技術</th>
                <th className="px-3 py-3 font-semibold hidden sm:table-cell">ソロビルダー</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {assessments.map((a, i) => (
                <tr key={a.slug} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {a.articleSlug ? (
                        <a href={`/news/${a.articleSlug}`}
                           className="font-medium text-white hover:text-blue-400 transition-colors">
                          {a.productName}
                        </a>
                      ) : (
                        <span className="font-medium text-white">{a.productName}</span>
                      )}
                      <span className="text-xs text-slate-500">{a.date}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-lg font-bold ${
                      a.totalScore >= 80 ? 'text-emerald-400' :
                      a.totalScore >= 55 ? 'text-blue-400' :
                      a.totalScore >= 30 ? 'text-amber-400' :
                      'text-slate-500'
                    }`}>
                      {a.totalScore}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {tierBadge(a.tier)}
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell">{scoreBar(a.snsScore)}</td>
                  <td className="px-3 py-3 hidden sm:table-cell">{scoreBar(a.mediaSCore)}</td>
                  <td className="px-3 py-3 hidden sm:table-cell">{scoreBar(a.communitySCore)}</td>
                  <td className="px-3 py-3 hidden sm:table-cell">{scoreBar(a.techImpactScore)}</td>
                  <td className="px-3 py-3 hidden sm:table-cell">{scoreBar(a.soloBuilderScore)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {assessments.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-3xl mb-3">📊</p>
          <p>評価データがまだありません。</p>
        </div>
      )}

      {/* Methodology */}
      <div className="mt-12 rounded-xl p-6" style={{ backgroundColor: '#1e293b' }}>
        <h2 className="text-lg font-bold text-white mb-3">📐 評価方法について</h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          各ニュースの<strong className="text-slate-300">元ネタ自体</strong>（我々が編集する前の一次情報）について、
          公開情報をもとに5軸で評価しています。評価は記事公開時点のスナップショットであり、
          SNS反応やメディアカバレッジは時間とともに変化します。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-white/5">
            <div className="font-semibold text-white mb-1">SNS反応量</div>
            <div className="text-slate-500">X・Reddit等での言及数・バズ度合い</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5">
            <div className="font-semibold text-white mb-1">メディアカバレッジ</div>
            <div className="text-slate-500">テックメディアの報道数・メディアの格</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5">
            <div className="font-semibold text-white mb-1">コミュニティ反応</div>
            <div className="text-slate-500">HN・Reddit・GitHubでの議論・スター</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5">
            <div className="font-semibold text-white mb-1">技術的インパクト</div>
            <div className="text-slate-500">技術的新規性・業界への影響度</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5">
            <div className="font-semibold text-white mb-1">ソロビルダー関連度</div>
            <div className="text-slate-500">個人開発者にとっての実用性・影響</div>
          </div>
        </div>
      </div>

      {/* Back link */}
      <div className="mt-8">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
          ← トップページに戻る
        </a>
      </div>
    </div>
  );
}
