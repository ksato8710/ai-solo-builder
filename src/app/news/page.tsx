import { getAllPosts, getPostsByCategory, CATEGORIES } from '@/lib/posts';
import NewsCard from '@/components/NewsCard';
import CategorySection from '@/components/CategorySection';

export default async function NewsPage() {
  const allPosts = await getAllPosts();
  const featuredPosts = allPosts.filter(p => p.featured);
  const mainFeatured = featuredPosts[0];
  const sideFeatured = featuredPosts.slice(1, 3);

  // News-specific categories (exclude products)
  const newsCategories = ['morning-summary', 'evening-summary', 'news', 'dev-knowledge', 'case-study'];
  const newsCategorySections = await Promise.all(
    newsCategories.map(async (category) => ({
      category,
      posts: await getPostsByCategory(category),
    }))
  );

  return (
    <div>
      {/* Page Header */}
      <section className="mb-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            📰 AI News Center
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            AIの海から厳選された最新ニュース・分析・トレンドをお届け
          </p>
        </div>
      </section>

      {/* Featured News */}
      {mainFeatured && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">🌟 注目のニュース</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <NewsCard post={mainFeatured} size="large" />
            </div>
            <div className="flex flex-col gap-4">
              {sideFeatured.map((post) => (
                <NewsCard key={post.slug} post={post} size="medium" />
              ))}
              {sideFeatured.length === 0 && allPosts.filter(p => !p.featured).slice(0, 2).map((post) => (
                <NewsCard key={post.slug} post={post} size="medium" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats Bar */}
      <div className="rounded-xl px-6 py-4 mb-12 flex items-center justify-between flex-wrap gap-4"
           style={{ backgroundColor: '#1e293b' }}>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 text-sm font-semibold">📡 LIVE</span>
          <span className="text-slate-400 text-sm">朝刊・夕刊 毎日配信中</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-slate-400">
          <span>🌅 朝刊 8:00</span>
          <span>🌆 夕刊 18:00</span>
        </div>
        <div className="text-xs text-slate-500">
          ニュース: {allPosts.length}本
        </div>
      </div>

      {/* News Category Sections */}
      {newsCategorySections.map(({ category, posts: categoryPosts }) => {
        if (categoryPosts.length === 0) return null;
        
        return (
          <CategorySection
            key={category}
            category={category}
            posts={categoryPosts}
          />
        );
      })}

      {/* All Recent News */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">📅 最新ニュース</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allPosts.slice(0, 12).map((post) => (
            <NewsCard key={post.slug} post={post} size="small" />
          ))}
        </div>
      </section>

      {/* Empty State */}
      {allPosts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">📰</p>
          <h2 className="text-xl font-bold text-white mb-2">ニュース準備中</h2>
          <p className="text-slate-400">まもなくAIニュースが配信されます。</p>
        </div>
      )}
    </div>
  );
}
