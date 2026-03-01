import { getAllPosts, getAllProducts, getAllContent, getFeaturedPosts, getPostsByCategory } from '@/lib/posts';
import NewsCard from '@/components/NewsCard';
import CategorySection from '@/components/CategorySection';
import NewsletterInlineSignup from '@/components/NewsletterInlineSignup';

export default async function Home() {
  const allContent = await getAllContent();
  const allPosts = await getAllPosts();
  const allProducts = await getAllProducts();
  const featured = await getFeaturedPosts();

  // 統合ニュースセクション用のデータ取得
  const newsCategories = ['news', 'dev-knowledge', 'case-study'];
  const allNewsPosts = (await Promise.all(
    newsCategories.map(cat => getPostsByCategory(cat))
  )).flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // プロダクトセクション
  const productPosts = await getPostsByCategory('products');

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
      <div className="rounded-xl px-6 py-4 mb-12 flex items-center justify-between flex-wrap gap-4 bg-bg-card">
        <div className="flex items-center gap-2">
          <span className="text-accent-moss text-sm font-semibold">📡 LIVE</span>
          <span className="text-text-muted text-sm">ダイジェスト 毎日配信中</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-text-muted">
          <span>🗞️ ダイジェスト 毎朝 8:00</span>
        </div>
        <div className="text-xs text-text-light">
          ニュース: {allPosts.length}本 / プロダクト: {allProducts.length}本
        </div>
      </div>

      {/* 統合ニュースセクション */}
      {allNewsPosts.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full bg-accent-bark" />
            <h2 className="text-lg font-bold font-heading text-text-deep">📰 最新ニュース</h2>
            <a href="/news"
               className="ml-auto text-xs font-medium hover:underline text-accent-bark">
              すべて見る →
            </a>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {allNewsPosts.slice(0, 8).map((post) => (
              <NewsCard key={post.slug} post={post} size="small" />
            ))}
          </div>
        </section>
      )}

      {/* Newsletter Inline Signup */}
      <NewsletterInlineSignup />

      {/* プロダクトセクション */}
      {productPosts.length > 0 && (
        <CategorySection category="products" posts={productPosts} />
      )}

      {/* Empty State */}
      {allContent.length === 0 && (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🚀</p>
          <h2 className="text-xl font-bold font-heading text-text-deep mb-2">準備中です</h2>
          <p className="text-text-muted">まもなくコンテンツが配信されます。</p>
        </div>
      )}
    </div>
  );
}
