import { getAllProducts, getProductBySlug, getPostsByRelatedProduct, CATEGORIES } from '@/lib/posts';
import { notFound } from 'next/navigation';
import RelatedArticleCard from '@/components/RelatedArticleCard';

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Not Found' };
  return {
    title: `${product.title} | AI Solo Builder`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const cat = CATEGORIES['products'];
  const relatedArticles = await getPostsByRelatedProduct(slug);
  
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
        <a href="/category/products" className="hover:opacity-80 transition-colors"
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
          <span className="text-xs text-[var(--text-muted)]">情報更新: {formatDate(product.date)}</span>
          <span className="text-xs text-[var(--text-muted)]">・{product.readTime}分で読める</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--text-primary)] leading-tight">
          {product.title}
        </h1>
        <p className="mt-4 text-lg text-[var(--text-secondary)] leading-relaxed">
          {product.description}
        </p>
      </header>

      {/* Divider */}
      <div className="border-t border-[var(--border-color)] my-8" />

      {/* Content */}
      <div className="article-content" dangerouslySetInnerHTML={{ __html: product.htmlContent || '' }} />

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="mt-12 pt-8 border-t border-[var(--border-color)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <span className="text-[var(--accent-blue)]">📰</span>
            関連記事
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relatedArticles.map((article) => (
              <RelatedArticleCard key={article.slug} post={article} />
            ))}
          </div>
        </section>
      )}

      {/* Back link */}
      <div className="mt-12 pt-8 border-t border-[var(--border-color)]">
        <a href="/category/products" className="inline-flex items-center gap-2 text-sm text-[var(--accent-blue)] hover:opacity-80 transition-colors">
          ← プロダクトディレクトリに戻る
        </a>
      </div>
    </article>
  );
}
