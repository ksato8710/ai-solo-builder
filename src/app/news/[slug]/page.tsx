import { getAllPosts, getPostBySlug, CATEGORIES } from '@/lib/posts';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Not Found' };
  return {
    title: `${post.title} | AI Solo Builder`,
    description: post.description,
  };
}

export default async function NewsArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const cat = CATEGORIES[post.category] || CATEGORIES['morning-news'];
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <article className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <a href="/" className="hover:text-slate-300 transition-colors">ホーム</a>
        <span>/</span>
        <a href={`/category/${post.category}`} className="hover:text-slate-300 transition-colors"
           style={{ color: cat.color }}>
          {cat.label}
        </a>
      </div>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: cat.color + '22', color: cat.color }}>
            {cat.emoji} {cat.label}
          </span>
          <span className="text-xs text-slate-500">{formatDate(post.date)}</span>
          <span className="text-xs text-slate-500">・{post.readTime}分で読める</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-slate-400 leading-relaxed">
          {post.description}
        </p>
      </header>

      {/* Divider */}
      <div className="border-t border-white/10 my-8" />

      {/* Content */}
      <div className="article-content" dangerouslySetInnerHTML={{ __html: post.htmlContent || '' }} />

      {/* Back link */}
      <div className="mt-12 pt-8 border-t border-white/10">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
          ← トップページに戻る
        </a>
      </div>
    </article>
  );
}
