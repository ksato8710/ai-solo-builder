import { Post, CATEGORIES } from '@/lib/posts';
import NewsCard from './NewsCard';

interface CategorySectionProps {
  category: string;
  posts: Post[];
}

export default function CategorySection({ category, posts }: CategorySectionProps) {
  const cat = CATEGORIES[category] || CATEGORIES['morning-news'];
  
  if (posts.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: cat.color }} />
        <h2 className="text-lg font-bold text-white">{cat.emoji} {cat.label}</h2>
        <a href={`/category/${category}`} 
           className="ml-auto text-xs font-medium hover:underline"
           style={{ color: cat.color }}>
          すべて見る →
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {posts.slice(0, 5).map((post) => (
          <NewsCard key={post.slug} post={post} size="small" />
        ))}
      </div>
    </section>
  );
}
