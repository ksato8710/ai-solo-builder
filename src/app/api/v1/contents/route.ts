import { NextRequest, NextResponse } from 'next/server';
import { getAllContent } from '@/lib/posts';
import {
  filterPosts,
  matchesQuery,
  parseBoolean,
  parseInteger,
  parseTags,
  toApiSummary,
  type ApiContentType,
  type ContentListQuery,
} from '@/lib/content-api';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const contentTypeRaw = searchParams.get('contentType');
    const digestEditionRaw = searchParams.get('digestEdition');

    const contentType: ApiContentType | undefined =
      contentTypeRaw === 'news' || contentTypeRaw === 'product' || contentTypeRaw === 'digest'
        ? contentTypeRaw
        : undefined;

    const digestEdition = digestEditionRaw === 'morning' || digestEditionRaw === 'evening'
      ? digestEditionRaw
      : undefined;

    const limit = parseInteger(searchParams.get('limit'), 20, { min: 1, max: 100 });
    const offset = parseInteger(searchParams.get('offset'), 0, { min: 0 });

    const query: ContentListQuery = {
      contentType,
      category: searchParams.get('category') || undefined,
      digestEdition,
      tags: parseTags(searchParams.get('tags')),
      featured: parseBoolean(searchParams.get('featured')),
      q: searchParams.get('q') || undefined,
      limit,
      offset,
    };

    const allContent = await getAllContent();

    const total = allContent.filter((post) => matchesQuery(post, query)).length;

    const items = filterPosts(allContent, query).map(toApiSummary);

    return NextResponse.json(
      {
        total,
        limit,
        offset,
        items,
      },
      {
        headers: {
          'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[api/v1/contents] failed', error);
    return NextResponse.json({ error: 'Failed to load contents' }, { status: 500 });
  }
}
