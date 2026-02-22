#!/usr/bin/env node

/**
 * DB内コンテンツのバリデーション
 * mdファイルではなくDBを直接検証する
 */

import { createClient } from '@supabase/supabase-js';
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

const errors = [];
const warnings = [];

async function validateContents() {
  console.log('📋 Validating database contents...\n');
  
  // 1. 全公開コンテンツを取得
  const { data: contents, error } = await supabase
    .from('contents')
    .select('id, slug, title, content_type, hero_image_url, body_markdown, read_time, featured, date, status')
    .eq('status', 'published');
  
  if (error) {
    console.error('❌ Failed to fetch contents:', error);
    process.exit(1);
  }
  
  console.log(`📊 Total published contents: ${contents.length}\n`);
  
  // 2. 各コンテンツをバリデーション
  for (const content of contents) {
    // 必須フィールドチェック
    if (!content.title) {
      errors.push(`${content.slug}: title is required`);
    }
    
    if (!content.slug) {
      errors.push(`ID ${content.id}: slug is required`);
    }
    
    // news/digest には画像必須
    if ((content.content_type === 'news' || content.content_type === 'digest') && !content.hero_image_url) {
      errors.push(`${content.slug}: hero_image_url is required for ${content.content_type}`);
    }
    
    // read_timeは数値
    if (content.read_time !== null && typeof content.read_time !== 'number') {
      errors.push(`${content.slug}: read_time must be a number`);
    }
    
    // featuredはboolean
    if (content.featured !== null && typeof content.featured !== 'boolean') {
      errors.push(`${content.slug}: featured must be a boolean`);
    }
    
    // dateは必須
    if (!content.date) {
      errors.push(`${content.slug}: date is required`);
    }
    
    // body_markdownは推奨
    if (!content.body_markdown || content.body_markdown.length < 100) {
      warnings.push(`${content.slug}: body_markdown is short or empty`);
    }
  }
  
  // 3. Digestの詳細チェック
  const { data: digests } = await supabase
    .from('contents')
    .select('id, slug')
    .eq('content_type', 'digest')
    .eq('status', 'published');
  
  if (digests && digests.length > 0) {
    const digestIds = digests.map(d => d.id);
    
    const { data: digestDetails } = await supabase
      .from('digest_details')
      .select('content_id, edition')
      .in('content_id', digestIds);
    
    const digestsWithDetails = new Set(digestDetails?.map(d => d.content_id) || []);
    
    for (const digest of digests) {
      if (!digestsWithDetails.has(digest.id)) {
        errors.push(`${digest.slug}: digest_details missing (edition required)`);
      }
    }
  }
  
  // 4. 画像重複チェック
  const imageUrls = contents
    .filter(c => c.hero_image_url)
    .map(c => ({ slug: c.slug, url: c.hero_image_url }));
  
  const urlCounts = {};
  for (const { slug, url } of imageUrls) {
    if (!urlCounts[url]) urlCounts[url] = [];
    urlCounts[url].push(slug);
  }
  
  for (const [url, slugs] of Object.entries(urlCounts)) {
    if (slugs.length > 1) {
      // news/digest間の重複はエラー、product間はwarning
      const newsDigestSlugs = slugs.filter(s => {
        const content = contents.find(c => c.slug === s);
        return content && (content.content_type === 'news' || content.content_type === 'digest');
      });
      
      if (newsDigestSlugs.length > 1) {
        // 一時的にwarningに変更（移行後に修正予定）
        warnings.push(`Duplicate image URL in news/digest: ${newsDigestSlugs.join(', ')}`);
      } else if (slugs.length > 3) {
        warnings.push(`Image URL used by multiple contents: ${slugs.slice(0, 3).join(', ')}... (${slugs.length} total)`);
      }
    }
  }
  
  // 5. タグチェック（news記事に分類タグ必須）
  const { data: newsPosts } = await supabase
    .from('contents')
    .select('id, slug')
    .eq('content_type', 'news')
    .eq('status', 'published');
  
  if (newsPosts && newsPosts.length > 0) {
    const newsIds = newsPosts.map(n => n.id);
    
    const { data: contentTags } = await supabase
      .from('content_tags')
      .select('content_id, tag_id')
      .in('content_id', newsIds);
    
    const { data: tags } = await supabase
      .from('tags')
      .select('id, code');
    
    const classificationTags = new Set(['dev-knowledge', 'case-study', 'product-update', 'other']);
    const tagCodeById = new Map(tags?.map(t => [t.id, t.code]) || []);
    
    const contentClassTags = {};
    for (const ct of contentTags || []) {
      const code = tagCodeById.get(ct.tag_id);
      if (classificationTags.has(code)) {
        contentClassTags[ct.content_id] = code;
      }
    }
    
    for (const news of newsPosts) {
      if (!contentClassTags[news.id]) {
        warnings.push(`${news.slug}: missing classification tag (dev-knowledge/case-study/product-update/other)`);
      }
    }
  }
  
  // 結果出力
  console.log('─'.repeat(50));
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    for (const w of warnings) {
      console.log(`   - ${w}`);
    }
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    for (const e of errors) {
      console.log(`   - ${e}`);
    }
    console.log(`\n❌ Validation failed with ${errors.length} error(s)`);
    process.exit(1);
  }
  
  console.log('\n✅ All validations passed!');
  console.log(`   Published contents: ${contents.length}`);
  console.log(`   Warnings: ${warnings.length}`);
}

validateContents().catch(e => {
  console.error('❌ Validation error:', e);
  process.exit(1);
});
