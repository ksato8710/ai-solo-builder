#!/usr/bin/env node

/**
 * DB直接投入スクリプト
 * mdファイルを経由せず、直接Supabaseにコンテンツを投入する
 * 
 * 使用方法:
 *   node scripts/create-content-db.mjs --stdin < article.json
 *   echo '{"title":"...","slug":"..."}' | node scripts/create-content-db.mjs --stdin
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

function loadEnv() {
  const envFile = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envFile)) {
    console.error('❌ .env.local not found');
    process.exit(1);
  }
  
  const lines = fs.readFileSync(envFile, 'utf8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) {
      const key = match[1];
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

/**
 * タグIDを取得または作成
 */
async function getOrCreateTag(tagCode) {
  // まず既存タグを検索
  const { data: existing } = await supabase
    .from('tags')
    .select('id')
    .eq('code', tagCode)
    .maybeSingle();
  
  if (existing) return existing.id;
  
  // なければ作成
  const { data: created, error } = await supabase
    .from('tags')
    .insert({ code: tagCode, label: tagCode })
    .select('id')
    .single();
  
  if (error) throw error;
  return created.id;
}

/**
 * プロダクトslugからcontent_idを取得
 */
async function getProductContentId(productSlug) {
  const { data } = await supabase
    .from('contents')
    .select('id')
    .eq('slug', productSlug)
    .eq('content_type', 'product')
    .maybeSingle();
  
  return data?.id || null;
}

/**
 * コンテンツをDBに投入
 */
async function createContent(data) {
  const now = new Date();
  const dateStr = data.date || now.toISOString().split('T')[0];
  
  // checksumを計算
  const checksum = crypto
    .createHash('md5')
    .update(data.body_markdown || '')
    .digest('hex');
  
  // 基本データ
  const contentData = {
    slug: data.slug,
    title: data.title,
    description: data.description || '',
    content_type: data.contentType || data.content_type || 'news',
    status: 'published',
    published_at: data.publishedAt || now.toISOString(),
    date: dateStr,
    read_time: data.readTime || Math.ceil((data.body_markdown || '').length / 1000),
    hero_image_url: data.image || data.hero_image_url || null,
    body_markdown: data.body_markdown || data.content || '',
    legacy_category: data.category || 'news',
    authoring_source: 'db',
    source_path: `db-${dateStr}-${data.slug}`,
    checksum,
    featured: data.featured || false,
    primary_source_id: data.primary_source_id || null,
    source_credibility_score: data.source_credibility_score || null,
    source_verification_note: data.source_verification_note || null,
  };
  
  // contents テーブルに挿入
  const { data: content, error: contentError } = await supabase
    .from('contents')
    .upsert(contentData, { onConflict: 'slug' })
    .select('id, slug')
    .single();
  
  if (contentError) {
    console.error('❌ Failed to create content:', contentError);
    throw contentError;
  }
  
  const contentId = content.id;
  console.log(`✅ Content created: ${content.slug} (${contentId})`);
  
  // Digest詳細
  if (data.contentType === 'digest' || data.content_type === 'digest') {
    const edition = data.digestEdition || 'morning';
    
    // 既存のdigest_detailsを削除
    await supabase
      .from('digest_details')
      .delete()
      .eq('content_id', contentId);
    
    // 新規作成
    const { error: digestError } = await supabase
      .from('digest_details')
      .insert({ content_id: contentId, edition });
    
    if (digestError) console.warn('⚠️ digest_details insert warning:', digestError.message);
  }
  
  // タグ処理
  if (data.tags && data.tags.length > 0) {
    // 既存タグを削除
    await supabase
      .from('content_tags')
      .delete()
      .eq('content_id', contentId);
    
    // 新規タグを追加
    for (const tagCode of data.tags) {
      try {
        const tagId = await getOrCreateTag(tagCode);
        await supabase
          .from('content_tags')
          .insert({ content_id: contentId, tag_id: tagId });
      } catch (e) {
        console.warn(`⚠️ Tag '${tagCode}' warning:`, e.message);
      }
    }
    console.log(`   Tags: ${data.tags.join(', ')}`);
  }
  
  // プロダクトリンク処理
  if (data.relatedProducts && data.relatedProducts.length > 0) {
    // 既存リンクを削除
    await supabase
      .from('content_product_links')
      .delete()
      .eq('content_id', contentId);
    
    // 新規リンクを追加
    for (let i = 0; i < data.relatedProducts.length; i++) {
      const productSlug = data.relatedProducts[i];
      const productContentId = await getProductContentId(productSlug);
      
      if (productContentId) {
        const relationType = i === 0 ? 'primary' : 'related';
        await supabase
          .from('content_product_links')
          .insert({
            content_id: contentId,
            product_content_id: productContentId,
            relation_type: relationType
          });
      } else {
        console.warn(`⚠️ Product not found: ${productSlug}`);
      }
    }
    console.log(`   Related products: ${data.relatedProducts.join(', ')}`);
  }
  
  return content;
}

/**
 * 複数コンテンツを一括投入
 */
async function createContents(contents) {
  const results = [];
  for (const content of contents) {
    try {
      const result = await createContent(content);
      results.push({ success: true, ...result });
    } catch (error) {
      results.push({ success: false, slug: content.slug, error: error.message });
    }
  }
  return results;
}

// メイン処理
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--stdin')) {
    // 標準入力からJSON読み込み
    let input = '';
    process.stdin.setEncoding('utf8');
    
    for await (const chunk of process.stdin) {
      input += chunk;
    }
    
    const data = JSON.parse(input);
    
    if (Array.isArray(data)) {
      const results = await createContents(data);
      console.log('\n📊 Results:');
      console.log(JSON.stringify(results, null, 2));
    } else {
      const result = await createContent(data);
      console.log('\n📊 Result:');
      console.log(JSON.stringify(result, null, 2));
    }
  } else if (args.includes('--file')) {
    const fileIndex = args.indexOf('--file') + 1;
    const filePath = args[fileIndex];
    
    if (!filePath || !fs.existsSync(filePath)) {
      console.error('❌ File not found:', filePath);
      process.exit(1);
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (Array.isArray(data)) {
      const results = await createContents(data);
      console.log('\n📊 Results:');
      console.log(JSON.stringify(results, null, 2));
    } else {
      const result = await createContent(data);
      console.log('\n📊 Result:');
      console.log(JSON.stringify(result, null, 2));
    }
  } else {
    console.log(`
Usage:
  node scripts/create-content-db.mjs --stdin < article.json
  echo '{"title":"...","slug":"...","body_markdown":"..."}' | node scripts/create-content-db.mjs --stdin
  node scripts/create-content-db.mjs --file article.json

Required fields:
  - slug: URL slug
  - title: Article title
  - body_markdown: Markdown content

Optional fields:
  - description: Short description
  - contentType: news | product | digest (default: news)
  - digestEdition: morning | evening (for digest only)
  - date: YYYY-MM-DD
  - publishedAt: ISO timestamp
  - readTime: Minutes to read
  - image: Hero image URL
  - featured: boolean
  - tags: ["tag1", "tag2"]
  - relatedProducts: ["product-slug-1", "product-slug-2"]
    `);
  }
}

main().catch(console.error);
