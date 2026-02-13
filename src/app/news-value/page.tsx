import { getLatestDigestRanking } from '@/lib/digest';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ニュースバリューランキング（NVA） | AI Solo Builder',
  description: '朝・夕のまとめごとに更新されるニュースバリューランキング（NVA）。重要ニュースを最大Top 10まで表示し、Top 3を深掘りして紹介します。',
};

function parseTier(score: number): string {
  if (score >= 80) return 'A';
  if (score >= 55) return 'B';
  if (score >= 30) return 'C';
  return 'D';
}

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

function RankingSection({
  title,
  icon,
  ranking,
}: {
  title: string;
  icon: string;
  ranking: ReturnType<typeof getLatestDigestRanking>;
}) {
  if (!ranking) {
    return (
      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-3">{icon} {title}</h2>
        <div className="rounded-xl p-6 border border-white/5" style={{ backgroundColor: '#1e293b' }}>
          <p className="text-sm text-slate-400">まだランキングがありません。</p>
          <p className="text-xs text-slate-500 mt-2">
            Digest記事に <code className="text-slate-300">## 🏁 重要ニュースランキング（NVA）</code> の表を追加すると反映されます。
          </p>
        </div>
      </section>
    );
  }

  const top3 = ranking.items.slice(0, 3);

  return (
    <section className="mb-10">
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-4">
        <h2 className="text-lg font-bold text-white">{icon} {title}</h2>
        <a
          href={`/news/${ranking.digest.slug}`}
          className="text-xs text-slate-400 hover:text-blue-400 transition-colors"
        >
          Digest: {ranking.digest.date} →
        </a>
      </div>

      {/* Top 3 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {top3.map((i) => (
            <div key={`${ranking.digest.slug}-${i.rank}`} className="rounded-xl p-4 border border-white/5" style={{ backgroundColor: '#1e293b' }}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs text-slate-400">#{i.rank}</span>
                {tierBadge(parseTier(i.nva))}
              </div>
              <div className="text-sm font-bold text-white leading-snug line-clamp-3">
                {i.newsUrl ? (
                  <a href={i.newsUrl} className="hover:text-blue-400 transition-colors">
                    {i.title}
                  </a>
                ) : (
                  i.title
                )}
              </div>
              <div className="mt-2 text-xs text-slate-500">NVA: {i.nva}</div>
            </div>
          ))}
        </div>
      )}

      {/* Top 10 Table */}
      <div className="rounded-xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wider" style={{ backgroundColor: '#1e293b' }}>
                <th className="px-4 py-3 font-semibold text-center w-16">順位</th>
                <th className="px-3 py-3 font-semibold text-center w-20">NVA</th>
                <th className="px-3 py-3 font-semibold text-center w-24">Tier</th>
                <th className="px-4 py-3 font-semibold min-w-[320px]">ニュース</th>
                <th className="px-4 py-3 font-semibold">出典</th>
                <th className="px-4 py-3 font-semibold">関連プロダクト</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ranking.items.map((i) => (
                <tr key={`${ranking.digest.slug}-${i.rank}`} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-center text-slate-400">{i.rank || '—'}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-lg font-bold ${
                      i.nva >= 80 ? 'text-emerald-400' :
                      i.nva >= 55 ? 'text-blue-400' :
                      i.nva >= 30 ? 'text-amber-400' :
                      'text-slate-500'
                    }`}>
                      {i.nva || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">{tierBadge(parseTier(i.nva))}</td>
                  <td className="px-4 py-3">
                    {i.newsUrl ? (
                      <a href={i.newsUrl} className="font-medium text-white hover:text-blue-400 transition-colors">
                        {i.title}
                      </a>
                    ) : (
                      <span className="font-medium text-white">{i.title}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {i.sourceUrl ? (
                      <a href={i.sourceUrl} className="text-xs text-slate-400 hover:text-blue-400 transition-colors">
                        リンク
                      </a>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {i.relatedProductUrl ? (
                      <a href={i.relatedProductUrl} className="text-xs text-slate-400 hover:text-violet-300 transition-colors">
                        /products
                      </a>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {ranking.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    ランキング表を読み取れませんでした。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default function NewsValuePage() {
  const morning = getLatestDigestRanking('morning-summary');
  const evening = getLatestDigestRanking('evening-summary');

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <a href="/" className="hover:text-slate-300 transition-colors">ホーム</a>
          <span>/</span>
          <span className="text-slate-400">ニュースバリューランキング</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
          🎯 ニュースバリューランキング（NVA）
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
          朝・夕のまとめ（Digest）ごとに、重要ニュースをNVA（ニュースバリュー評価）でランク付けします。
          ランキングは<strong className="text-slate-300">最大Top 10</strong>まで表示し、Top 3を深掘りして紹介します。
        </p>
      </div>

      <RankingSection title="朝のまとめ（最新）" icon="🌅" ranking={morning} />
      <RankingSection title="夕のまとめ（最新）" icon="🌆" ranking={evening} />

      {/* Methodology */}
      <div className="mt-12 rounded-xl p-6" style={{ backgroundColor: '#1e293b' }}>
        <h2 className="text-lg font-bold text-white mb-3">📐 評価方法について</h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          各ニュースの<strong className="text-slate-300">元ネタ自体</strong>（我々が編集する前の一次情報）について、
          公開情報をもとに5軸×各20点、100点満点で評価しています。
          評価はDigest公開時点のスナップショットであり、SNS反応やメディアカバレッジは時間とともに変化します。
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

      {/* Content Sources Management Section */}
      <div className="mt-12 rounded-xl p-6 border border-white/5" style={{ backgroundColor: '#1e293b' }}>
        <h2 className="text-lg font-bold text-white mb-3">📊 情報源管理</h2>
        <p className="text-sm text-slate-400 mb-4">
          ニュース収集に使用する情報源の品質評価・管理を行います。
        </p>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-white/5">
              <h3 className="font-semibold text-white mb-2">📈 品質レーティング</h3>
              <div className="space-y-1 text-xs text-slate-400">
                <div>⭐⭐⭐⭐⭐ 5: 専門性が高く、一次ソース</div>
                <div>⭐⭐⭐⭐ 4: 信頼性が高く、業界標準</div>
                <div>⭐⭐⭐ 3: 一般的に有用</div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-white/5">
              <h3 className="font-semibold text-white mb-2">🔗 アクセス性評価</h3>
              <div className="space-y-1 text-xs text-slate-400">
                <div>⭐⭐⭐⭐⭐ 5: API提供、制限なし</div>
                <div>⭐⭐⭐⭐ 4: RSS/フィードあり</div>
                <div>⭐⭐⭐ 3: 定期スクレイピング可能</div>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <h4 className="font-semibold text-emerald-400 mb-2">✅ アクティブ情報源 (8ソース)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">Hacker News</span>
                <span className="text-emerald-400">4⭐ / 5⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">GitHub Trending</span>
                <span className="text-emerald-400">4⭐ / 4⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Y Combinator News</span>
                <span className="text-emerald-400">5⭐ / 4⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Ars Technica</span>
                <span className="text-emerald-400">5⭐ / 3⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Indie Hackers</span>
                <span className="text-emerald-400">4⭐ / 4⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">TechCrunch</span>
                <span className="text-emerald-400">4⭐ / 3⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Stack Overflow Blog</span>
                <span className="text-emerald-400">4⭐ / 4⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Product Hunt</span>
                <span className="text-emerald-400">3⭐ / 4⭐</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400">
            <strong>📋 管理機能:</strong> 情報源の追加・編集・レーティング変更・アクティブ制御は`/api/admin/sources`で利用可能
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
