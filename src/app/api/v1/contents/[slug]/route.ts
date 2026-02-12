import { NextResponse } from 'next/server';
import { getPostBySlug, getProductBySlug } from '@/lib/posts';
import { toApiDetail } from '@/lib/content-api';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

interface Context {
  params: Promise<{ slug: string }>;
}

export async function GET(_: Request, context: Context) {
  try {
    const { slug } = await context.params;

    const newsPost = await getPostBySlug(slug);
    const post = newsPost || (await getProductBySlug(slug));

    if (!post) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json(
      { item: toApiDetail(post) },
      {
        headers: {
          'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[api/v1/contents/[slug]] failed', error);
    return NextResponse.json({ error: 'Failed to load content' }, { status: 500 });
  }
}
