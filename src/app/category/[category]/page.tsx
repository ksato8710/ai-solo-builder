import { getAllPosts, getPostsByCategory, CATEGORIES } from '@/lib/posts';
import NewsCard from '@/components/NewsCard';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return Object.keys(CATEGORIES).map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = CATEGORIES[category];
  if (!cat) return { title: 'Not Found' };
  return {
    title: `${cat.emoji} ${cat.label} | AI Solo Builder`,
    description: `${cat.label}の最新記事一覧`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = CATEGORIES[category];
  if (!cat) notFound();

  const posts = getPostsByCategory(category);

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: cat.color }} />
        <h1 className="text-2xl font-extrabold text-white">{cat.emoji} {cat.label}</h1>
      </div>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <NewsCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">{cat.emoji}</p>
          <h2 className="text-xl font-bold text-white mb-2">まだ記事がありません</h2>
          <p className="text-slate-400">まもなく配信されます。</p>
        </div>
      )}

      <div className="mt-8">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
          ← トップページに戻る
        </a>
      </div>
    </div>
  );
}
