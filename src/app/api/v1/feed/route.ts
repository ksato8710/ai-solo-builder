import { NextResponse } from 'next/server';
import { getAllPosts, getAllProducts, getPostsByCategory } from '@/lib/posts';
import { toApiSummary } from '@/lib/content-api';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

function parseLimit(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(1, Math.min(20, parsed));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = parseLimit(url.searchParams.get('limit'), 8);

    const [allNews, allProducts, morning, evening] = await Promise.all([
      getAllPosts(),
      getAllProducts(),
      getPostsByCategory('morning-summary'),
      getPostsByCategory('evening-summary'),
    ]);

    const nonDigestNews = allNews.filter((post) => post.contentType !== 'digest');

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        sections: {
          morningSummary: morning.slice(0, limit).map(toApiSummary),
          eveningSummary: evening.slice(0, limit).map(toApiSummary),
          latestNews: nonDigestNews.slice(0, limit).map(toApiSummary),
          products: allProducts.slice(0, limit).map(toApiSummary),
          devKnowledge: nonDigestNews
            .filter((post) => (post.tags || []).includes('dev-knowledge'))
            .slice(0, limit)
            .map(toApiSummary),
          caseStudies: nonDigestNews
            .filter((post) => (post.tags || []).includes('case-study'))
            .slice(0, limit)
            .map(toApiSummary),
        },
      },
      {
        headers: {
          'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[api/v1/feed] failed', error);
    return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 });
  }
}
