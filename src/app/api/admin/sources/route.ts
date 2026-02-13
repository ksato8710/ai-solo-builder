import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Supabase client creation with environment check
function createSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase credentials not available');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const supabase = createSupabaseClient();

// 初期データ
const INITIAL_SOURCES = [
  {
    name: 'Hacker News',
    url: 'https://news.ycombinator.com',
    category: 'tech-community',
    quality_rating: 4,
    accessibility_rating: 5,
    is_free: true,
    is_active: true,
    description: 'プログラマー・起業家コミュニティによる技術ニュースのランキングサイト'
  },
  {
    name: 'GitHub Trending',
    url: 'https://github.com/trending',
    category: 'dev-tools',
    quality_rating: 4,
    accessibility_rating: 4,
    is_free: true,
    is_active: true,
    description: 'GitHubで注目されているオープンソースプロジェクトのトレンド'
  },
  {
    name: 'Indie Hackers',
    url: 'https://www.indiehackers.com',
    category: 'indie-business',
    quality_rating: 4,
    accessibility_rating: 4,
    is_free: true,
    is_active: true,
    description: '独立開発者・ソロ起業家のコミュニティ。収益化事例・運営ノウハウ'
  },
  {
    name: 'Y Combinator News',
    url: 'https://www.ycombinator.com/blog',
    category: 'startup',
    quality_rating: 5,
    accessibility_rating: 4,
    is_free: true,
    is_active: true,
    description: 'YCによる起業家向けアドバイス・業界動向'
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com',
    category: 'startup',
    quality_rating: 4,
    accessibility_rating: 3,
    is_free: true,
    is_active: true,
    description: 'スタートアップ・投資・テック業界のニュースメディア'
  },
  {
    name: 'Stack Overflow Blog',
    url: 'https://stackoverflow.blog',
    category: 'dev-knowledge',
    quality_rating: 4,
    accessibility_rating: 4,
    is_free: true,
    is_active: true,
    description: 'プログラマーQ&Aサイトによる開発動向・調査レポート'
  },
  {
    name: 'Ars Technica',
    url: 'https://arstechnica.com',
    category: 'tech-analysis',
    quality_rating: 5,
    accessibility_rating: 3,
    is_free: true,
    is_active: true,
    description: '技術的に詳細で信頼性の高い解説記事'
  },
  {
    name: 'Product Hunt',
    url: 'https://www.producthunt.com',
    category: 'startup',
    quality_rating: 3,
    accessibility_rating: 4,
    is_free: true,
    is_active: true,
    description: '新しいプロダクト・サービスの投稿・発見プラットフォーム'
  }
];

// GET: 全ての情報源を取得
export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Database connection not available',
        sources: [] 
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const active = searchParams.get('active');

    let query = supabase
      .from('content_sources')
      .select('*')
      .order('name');

    if (category) {
      query = query.eq('category', category);
    }

    if (active === 'true') {
      query = query.eq('is_active', true);
    } else if (active === 'false') {
      query = query.eq('is_active', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sources:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sources: data });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: 新しい情報源を追加、または初期データを投入
export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Database connection not available' 
      }, { status: 503 });
    }

    const body = await request.json();

    // 初期データ投入の特別なケース
    if (body.action === 'initialize') {
      const { data, error } = await supabase
        .from('content_sources')
        .upsert(INITIAL_SOURCES, { onConflict: 'url' })
        .select();

      if (error) {
        console.error('Error initializing sources:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        message: `Initialized ${data.length} sources`, 
        sources: data 
      });
    }

    // 通常の新規追加
    const { name, url, category, quality_rating, accessibility_rating, is_free, is_active, description } = body;

    if (!name || !url || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('content_sources')
      .insert([{
        name,
        url,
        category,
        quality_rating: quality_rating || 3,
        accessibility_rating: accessibility_rating || 3,
        is_free: is_free ?? true,
        is_active: is_active ?? false,
        description: description || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating source:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ source: data }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: 情報源を更新
export async function PUT(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Database connection not available' 
      }, { status: 503 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing source ID' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('content_sources')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating source:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ source: data });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: 情報源を削除
export async function DELETE(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Database connection not available' 
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing source ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('content_sources')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting source:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Source deleted successfully' });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}