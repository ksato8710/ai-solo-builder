import { getAllPosts, getAllProducts, getAllContent, getFeaturedPosts, getPostsByCategory, CATEGORIES } from '@/lib/posts';
import NewsCard from '@/components/NewsCard';
import CategorySection from '@/components/CategorySection';

export default function Home() {
  const allContent = getAllContent();
  const allPosts = getAllPosts();
  const allProducts = getAllProducts();
  const featured = getFeaturedPosts();
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
          <span className="text-slate-400 text-sm">朝刊・夕刊 毎日配信中</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-slate-400">
          <span>🌅 朝刊 8:00</span>
          <span>🏷️ プロダクト 12:00</span>
          <span>🌆 夕刊 18:00</span>
        </div>
        <div className="text-xs text-slate-500">
          ニュース: {allPosts.length}本 / プロダクト: {allProducts.length}本
        </div>
      </div>

      {/* Category Sections */}
      {Object.keys(CATEGORIES).map((category) => (
        <CategorySection
          key={category}
          category={category}
          posts={getPostsByCategory(category)}
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
