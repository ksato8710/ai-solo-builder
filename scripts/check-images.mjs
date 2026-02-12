#!/usr/bin/env node
/**
 * Check images in content files:
 * 1. All news/digest have `image` field set
 * 2. No duplicate image URLs across articles
 * 3. (optional) Verify image URLs return HTTP 200 (--verify-urls flag)
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, '../content/news');

// Parse command line args
const verifyUrls = process.argv.includes('--verify-urls');

async function checkImageUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (e) {
    return false;
  }
}

async function checkImages() {
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));
  const errors = [];
  const warnings = [];
  const imageUrls = new Map(); // url -> [files]
  const urlsToVerify = []; // { url, file }

  for (const file of files) {
    const filePath = path.join(contentDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    let frontmatter;
    try {
      frontmatter = matter(content).data;
    } catch (e) {
      errors.push(`❌ ${file}: YAML parse error`);
      continue;
    }

    const { image, contentType } = frontmatter;

    // Check 1: image field exists for news/digest (both required for homepage display)
    if (!image) {
      if (contentType === 'digest' || contentType === 'news') {
        errors.push(`❌ ${file}: ${contentType}記事にimageフィールドがありません（ホーム表示に必須）`);
      } else {
        warnings.push(`⚠ ${file}: imageフィールドがありません（推奨）`);
      }
    } else {
      // Track image URLs for duplicate check
      if (!imageUrls.has(image)) {
        imageUrls.set(image, []);
      }
      imageUrls.get(image).push(file);
      
      // Queue for URL verification
      if (verifyUrls) {
        urlsToVerify.push({ url: image, file });
      }
    }
  }

  // Check 2: No duplicate images (error - each article should have unique image)
  for (const [url, usedIn] of imageUrls) {
    if (usedIn.length > 1) {
      errors.push(`❌ 画像重複: ${url}\n   使用ファイル: ${usedIn.join(', ')}`);
    }
  }

  // Check 3: Verify image URLs are accessible (if --verify-urls flag is set)
  if (verifyUrls && urlsToVerify.length > 0) {
    console.log(`\n🔍 Verifying ${urlsToVerify.length} image URLs...`);
    
    // Check unique URLs only
    const uniqueUrls = [...new Set(urlsToVerify.map(u => u.url))];
    const urlStatus = new Map();
    
    await Promise.all(uniqueUrls.map(async (url) => {
      const isValid = await checkImageUrl(url);
      urlStatus.set(url, isValid);
    }));
    
    // Report failures
    for (const { url, file } of urlsToVerify) {
      if (!urlStatus.get(url)) {
        errors.push(`❌ ${file}: 画像URLが無効です（404 or unreachable）\n   URL: ${url}`);
      }
    }
    
    const invalidCount = [...urlStatus.values()].filter(v => !v).length;
    if (invalidCount > 0) {
      console.log(`⚠ ${invalidCount}/${uniqueUrls.length} URLs are invalid`);
    } else {
      console.log(`✅ All ${uniqueUrls.length} URLs are valid`);
    }
  }

  // Output results
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

  console.log(`\n✅ check:images passed (${files.length} files, ${imageUrls.size} unique images)`);
}

checkImages();
