#!/usr/bin/env node
/**
 * DB直接投入スクリプト
 * 使い方: node scripts/create-content-db.mjs --stdin < /tmp/article.json
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }
  
  const data = JSON.parse(input);
  
  // 必須フィールド検証
  if (!data.slug || !data.title || !data.body_markdown) {
    console.error('❌ 必須フィールド不足: slug, title, body_markdown');
    process.exit(1);
  }
  
  const record = {
    slug: data.slug,
    title: data.title,
    description: data.description || '',
    content_type: data.contentType || 'news',
    digest_edition: data.digestEdition || null,
    date: data.date || new Date().toISOString().split('T')[0],
    hero_image_url: data.image || null,
    featured: data.featured || false,
    body_markdown: data.body_markdown,
    read_time: data.readTime || 5,
    status: 'published',
    authoring_source: 'db',
  };
  
  const { data: result, error } = await supabase
    .from('contents')
    .upsert(record, { onConflict: 'slug' })
    .select()
    .single();
  
  if (error) {
    console.error('❌ DB投入エラー:', error.message);
    process.exit(1);
  }
  
  console.log(`✅ 投入成功: ${result.slug}`);
  
  // タグ処理
  if (data.tags && data.tags.length > 0) {
    // 既存タグリンクを削除
    await supabase.from('content_tags').delete().eq('content_id', result.id);
    
    for (const tagName of data.tags) {
      // タグを取得または作成
      let { data: tag } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tagName)
        .single();
      
      if (!tag) {
        const { data: newTag } = await supabase
          .from('tags')
          .insert({ name: tagName, slug: tagName.toLowerCase().replace(/\s+/g, '-') })
          .select()
          .single();
        tag = newTag;
      }
      
      if (tag) {
        await supabase.from('content_tags').insert({
          content_id: result.id,
          tag_id: tag.id,
        });
      }
    }
    console.log(`   タグ: ${data.tags.join(', ')}`);
  }
  
  // 関連プロダクト処理
  if (data.relatedProducts && data.relatedProducts.length > 0) {
    await supabase.from('content_product_links').delete().eq('content_id', result.id);
    
    for (const productSlug of data.relatedProducts) {
      const { data: product } = await supabase
        .from('products')
        .select('id')
        .eq('slug', productSlug)
        .single();
      
      if (product) {
        await supabase.from('content_product_links').insert({
          content_id: result.id,
          product_id: product.id,
        });
      }
    }
    console.log(`   関連プロダクト: ${data.relatedProducts.join(', ')}`);
  }
  
  console.log(`\n📰 公開URL: https://ai.essential-navigator.com/news/${result.slug}`);
}

main().catch(err => {
  console.error('❌ エラー:', err.message);
  process.exit(1);
});
