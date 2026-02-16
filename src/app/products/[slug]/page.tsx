import { getAllProducts, getProductBySlug, getPostsByRelatedProduct, CATEGORIES } from '@/lib/posts';
import { notFound } from 'next/navigation';
import RelatedArticleCard from '@/components/RelatedArticleCard';
import RelatedProductCard from '@/components/RelatedProductCard';
import Carousel from '@/components/Carousel';
import ArticleContent from '@/components/ArticleContent';

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
  
  // 関連プロダクトを取得
  const allProducts = await getAllProducts();
  const relatedProductSlugs = product.relatedProducts || [];
  const relatedProducts = relatedProductSlugs
    .map(s => allProducts.find(p => p.slug === s))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);
  
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
        <div className="flex items-center gap-3 mb-4 flex-wrap">
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
      <ArticleContent htmlContent={product.htmlContent || ''} />

      {/* Related Articles Carousel */}
      {relatedArticles.length > 0 && (
        <Carousel title="関連ニュース" icon="📰">
          {relatedArticles.map((article) => (
            <div key={article.slug} className="flex-shrink-0 w-[280px] snap-start">
              <RelatedArticleCard post={article} />
            </div>
          ))}
        </Carousel>
      )}

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <Carousel title="関連プロダクト" icon="🔗">
          {relatedProducts.map((p) => (
            <RelatedProductCard key={p.slug} product={p} />
          ))}
        </Carousel>
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
