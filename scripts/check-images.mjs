#!/usr/bin/env node
/**
 * Check images in DB:
 * 1. All news/digest have hero_image_url set
 * 2. No duplicate image URLs across articles
 * 3. (optional) Verify image URLs return HTTP 200 (--verify-urls flag)
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const verifyUrls = process.argv.includes('--verify-urls');

async function checkImageUrl(url) {
  try {
    if (url.startsWith('/')) {
      const localPath = path.join(process.cwd(), 'public', url);
      return fs.existsSync(localPath);
    }
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (e) {
    return false;
  }
}

async function checkImages() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠ SUPABASE env vars not set, skipping check');
    process.exit(0);
  }

  const errors = [];
  const warnings = [];

  // Fetch all published contents from DB
  console.log('🗄️ Checking DB for image issues...');
  
  const response = await fetch(
    `${supabaseUrl}/rest/v1/contents?select=slug,title,content_type,hero_image_url&status=eq.published`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    }
  );

  if (!response.ok) {
    console.error(`❌ DB fetch failed: ${response.status}`);
    process.exit(1);
  }

  const contents = await response.json();
  console.log(`📊 Found ${contents.length} published articles`);

  const imageUrls = new Map(); // url -> [slugs]
  const urlsToVerify = [];

  for (const article of contents) {
    const { slug, content_type, hero_image_url } = article;

    // Check 1: hero_image_url exists for news/digest
    if (!hero_image_url) {
      if (content_type === 'digest' || content_type === 'news') {
        errors.push(`❌ ${slug}: ${content_type}記事にhero_image_urlがありません`);
      } else {
        warnings.push(`⚠ ${slug}: hero_image_urlがありません（推奨）`);
      }
    } else {
      // Track for duplicate check
      if (!imageUrls.has(hero_image_url)) {
        imageUrls.set(hero_image_url, []);
      }
      imageUrls.get(hero_image_url).push(slug);

      if (verifyUrls) {
        urlsToVerify.push({ url: hero_image_url, slug });
      }
    }
  }

  // Check 2: No duplicate images in news/digest
  for (const [url, usedIn] of imageUrls) {
    if (usedIn.length > 1) {
      // Filter to only news/digest duplicates
      const newsDigestSlugs = usedIn.filter(slug => {
        const article = contents.find(c => c.slug === slug);
        return article && (article.content_type === 'news' || article.content_type === 'digest');
      });
      if (newsDigestSlugs.length > 1) {
        warnings.push(`⚠ 画像重複 (news/digest): ${newsDigestSlugs.join(', ')}`);
      }
    }
  }

  // Check 3: Verify URLs (if --verify-urls)
  if (verifyUrls && urlsToVerify.length > 0) {
    console.log(`\n🔍 Verifying ${urlsToVerify.length} image URLs...`);
    
    const uniqueUrls = [...new Set(urlsToVerify.map(u => u.url))];
    const urlStatus = new Map();
    
    await Promise.all(uniqueUrls.map(async (url) => {
      const isValid = await checkImageUrl(url);
      urlStatus.set(url, isValid);
    }));
    
    for (const { url, slug } of urlsToVerify) {
      if (!urlStatus.get(url)) {
        errors.push(`❌ ${slug}: 画像URLが無効（404）\n   URL: ${url}`);
      }
    }
    
    const invalidCount = [...urlStatus.values()].filter(v => !v).length;
    if (invalidCount > 0) {
      console.log(`⚠ ${invalidCount}/${uniqueUrls.length} URLs are invalid`);
    } else {
      console.log(`✅ All ${uniqueUrls.length} URLs are valid`);
    }
  }

  // Output
  if (warnings.length > 0) {
    console.log('\n📋 Warnings:');
    warnings.forEach(w => console.log(w));
  }

  if (errors.length > 0) {
    console.log('\n🚨 Errors:');
    errors.forEach(e => console.log(e));
    console.log(`\n❌ check:images failed with ${errors.length} error(s)`);
    process.exit(1);
  }

  console.log(`\n✅ check:images passed (${contents.length} articles, ${imageUrls.size} unique images)`);
}

checkImages().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
