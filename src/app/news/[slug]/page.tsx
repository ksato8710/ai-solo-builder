import { getAllPosts, getPostBySlug, CATEGORIES } from '@/lib/posts';
import { notFound } from 'next/navigation';
import ArticleContent from '@/components/ArticleContent';

export async function generateStaticParams() {
  const posts = await getAllPosts();
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

  const cat = CATEGORIES[post.category] || CATEGORIES['morning-summary'];
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <article className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-6">
        <a href="/" className="hover:text-[var(--text-secondary)] transition-colors">ホーム</a>
        <span>/</span>
        <a href={`/category/${post.category}`} className="hover:opacity-80 transition-colors"
           style={{ color: cat.color }}>
          {cat.label}
        </a>
      </div>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: cat.color + '22', color: cat.color }}>
            {cat.emoji} {cat.label}
          </span>
          <span className="text-xs text-[var(--text-muted)]">{formatDate(post.date)}</span>
          <span className="text-xs text-[var(--text-muted)]">・{post.readTime}分で読める</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--text-primary)] leading-tight">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-[var(--text-secondary)] leading-relaxed">
          {post.description}
        </p>
      </header>

      {/* Divider */}
      <div className="border-t border-[var(--border-color)] my-8" />

      {/* Content */}
      <ArticleContent htmlContent={post.htmlContent || ''} />

      {/* Back link */}
      <div className="mt-12 pt-8 border-t border-[var(--border-color)]">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-[var(--accent-blue)] hover:opacity-80 transition-colors">
          ← トップページに戻る
        </a>
      </div>
    </article>
  );
}
