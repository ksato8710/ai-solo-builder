import { getTimelineItems, getAllSources, getCompanies } from '@/lib/timeline';
import TimelineView from '@/components/TimelineView';

export const revalidate = 300; // ISR 5 minutes

export const metadata = {
  title: '📡 ソースタイムライン | AI Solo Craft',
  description: '公式発表 + 厳選コミュニティソースをリアルタイムで追跡',
};

export default async function TimelinePage() {
  const [groups, sources, companies] = await Promise.all([
    getTimelineItems(),
    getAllSources(),
    getCompanies(),
  ]);

  return (
    <div>
      {/* Page Header */}
      <section className="mb-8">
        <div className="h-1 w-12 rounded-full bg-accent-leaf mb-4" />
        <h1 className="text-3xl font-extrabold font-heading text-text-deep mb-2">
          📡 ソースタイムライン
        </h1>
        <p className="text-text-muted">
          公式発表 + 厳選コミュニティソースをリアルタイムで追跡
        </p>
      </section>

      <TimelineView groups={groups} sources={sources} companies={companies} />

      {/* Back Link */}
      <div className="mt-8">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-accent-leaf hover:opacity-80 transition-colors"
        >
          ← トップページに戻る
        </a>
      </div>
    </div>
  );
}
