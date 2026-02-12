import { getAllPosts, getAllProducts, getAllContent, getFeaturedPosts, getPostsByCategory, CATEGORIES } from '@/lib/posts';
import NewsCard from '@/components/NewsCard';
import CategorySection from '@/components/CategorySection';

export default async function Home() {
  const allContent = await getAllContent();
  const allPosts = await getAllPosts();
  const allProducts = await getAllProducts();
  const featured = await getFeaturedPosts();
  const morningSummaryPosts = await getPostsByCategory('morning-summary');
  const eveningSummaryPosts = await getPostsByCategory('evening-summary');
  const nonDigestCategories = Object.keys(CATEGORIES).filter(
    (category) => category !== 'morning-summary' && category !== 'evening-summary'
  );
  const nonDigestSections = await Promise.all(
    nonDigestCategories.map(async (category) => ({
      category,
      posts: await getPostsByCategory(category),
    }))
  );
  const mainFeatured = featured[0];
  const sideFeatured = featured.slice(1, 3);

  return (
    <div>
      {/* Hero Section */}
      {mainFeatured && (
        <section className="mb-12">
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

      {/* Today's Stats Bar */}
      <div className="rounded-xl px-6 py-4 mb-12 flex items-center justify-between flex-wrap gap-4"
           style={{ backgroundColor: '#1e293b' }}>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 text-sm font-semibold">📡 LIVE</span>
          <span className="text-slate-400 text-sm">朝夕のまとめ 毎日配信中</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-slate-400">
          <span>🌅 朝刊 8:00</span>
          <span>🌆 夕刊 18:00</span>
        </div>
        <div className="text-xs text-slate-500">
          ニュース: {allPosts.length}本 / プロダクト: {allProducts.length}本
        </div>
      </div>

      {/* Digest Summary Section */}
      <section id="digest-summary" className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
          <h2 className="text-lg font-bold text-white">🗞️ 朝夕のまとめ</h2>
          <a href="/news-value"
             className="ml-auto text-xs font-medium hover:underline"
             style={{ color: '#F97316' }}>
            評価を見る →
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-blue-300">🌅 朝刊</h3>
              <a href="/category/morning-summary" className="text-xs text-blue-400 hover:underline">
                一覧 →
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {morningSummaryPosts.slice(0, 2).map((post) => (
                <NewsCard key={post.slug} post={post} size="small" />
              ))}
              {morningSummaryPosts.length === 0 && (
                <div className="rounded-xl px-4 py-6 text-sm text-slate-400"
                     style={{ backgroundColor: '#1e293b' }}>
                  朝刊コンテンツの準備中です。
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-orange-300">🌆 夕刊</h3>
              <a href="/category/evening-summary" className="text-xs text-orange-400 hover:underline">
                一覧 →
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {eveningSummaryPosts.slice(0, 2).map((post) => (
                <NewsCard key={post.slug} post={post} size="small" />
              ))}
              {eveningSummaryPosts.length === 0 && (
                <div className="rounded-xl px-4 py-6 text-sm text-slate-400"
                     style={{ backgroundColor: '#1e293b' }}>
                  夕刊コンテンツの準備中です。
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Category Sections */}
      {nonDigestSections.map(({ category, posts }) => (
        <CategorySection
          key={category}
          category={category}
          posts={posts}
        />
      ))}

      {/* Empty State */}
      {allContent.length === 0 && (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🚀</p>
          <h2 className="text-xl font-bold text-white mb-2">準備中です</h2>
          <p className="text-slate-400">まもなくコンテンツが配信されます。</p>
        </div>
      )}
    </div>
  );
}
