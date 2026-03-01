#!/usr/bin/env node

/**
 * mdファイルをDBに移行するスクリプト
 * Usage: node scripts/migrate-md-to-db.mjs <path-to-md-file>
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  
  const frontmatterStr = match[1];
  const body = match[2];
  
  const frontmatter = {};
  let currentKey = null;
  let currentValue = '';
  let inMultiline = false;
  
  for (const line of frontmatterStr.split('\n')) {
    if (inMultiline) {
      if (line.match(/^\s+/)) {
        currentValue += ' ' + line.trim();
        continue;
      } else {
        frontmatter[currentKey] = currentValue.trim();
        inMultiline = false;
      }
    }
    
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();
      
      if (value === '>-' || value === '|') {
        inMultiline = true;
        currentValue = '';
      } else if (value.startsWith("'") || value.startsWith('"')) {
        frontmatter[currentKey] = value.slice(1, -1);
      } else if (value === '') {
        // array follows
        frontmatter[currentKey] = [];
      } else {
        frontmatter[currentKey] = value;
      }
    } else if (line.match(/^\s+-\s+(.+)$/)) {
      // array item
      const itemMatch = line.match(/^\s+-\s+(.+)$/);
      if (itemMatch && currentKey && Array.isArray(frontmatter[currentKey])) {
        frontmatter[currentKey].push(itemMatch[1].trim());
      }
    }
  }
  
  if (inMultiline) {
    frontmatter[currentKey] = currentValue.trim();
  }
  
  return { frontmatter, body };
}

async function getOrCreateTag(tagCode) {
  const { data: existing } = await supabase
    .from('tags')
    .select('id')
    .eq('code', tagCode)
    .maybeSingle();
  
  if (existing) return existing.id;
  
  const { data: created, error } = await supabase
    .from('tags')
    .insert({ code: tagCode, label: tagCode })
    .select('id')
    .single();
  
  if (error) throw error;
  return created.id;
}

async function migrateFile(filePath) {
  console.log(`\n📄 Processing: ${path.basename(filePath)}`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = parseFrontmatter(content);
  
  if (!parsed) {
    console.error('❌ Failed to parse frontmatter');
    return false;
  }
  
  const { frontmatter, body } = parsed;
  
  // Required fields
  const slug = frontmatter.slug;
  const title = frontmatter.title;
  const date = frontmatter.date;
  
  if (!slug || !title || !date) {
    console.error(`❌ Missing required fields: slug=${slug}, title=${title}, date=${date}`);
    return false;
  }
  
  // Check if already exists
  const { data: existing } = await supabase
    .from('contents')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  
  if (existing) {
    console.log(`⏭️ Already exists in DB: ${slug}`);
    return true;
  }
  
  // Prepare content record
  const record = {
    slug,
    title,
    date,
    content_type: frontmatter.contentType || 'news',
    status: 'published',
    body_markdown: body.trim(),
    description: frontmatter.description || frontmatter.excerpt || '',
    read_time: parseInt(frontmatter.readTime) || 8,
    hero_image_url: frontmatter.image || null,
    featured: false,
  };
  
  // Insert
  const { data: inserted, error } = await supabase
    .from('contents')
    .insert(record)
    .select('id')
    .single();
  
  if (error) {
    console.error(`❌ Insert failed: ${error.message}`);
    return false;
  }
  
  console.log(`✅ Inserted: ${slug} (id: ${inserted.id})`);
  
  // Add tags
  const tags = frontmatter.tags || [];
  for (const tag of tags) {
    try {
      const tagId = await getOrCreateTag(tag);
      await supabase.from('content_tags').insert({
        content_id: inserted.id,
        tag_id: tagId
      });
      console.log(`   🏷️ Tag added: ${tag}`);
    } catch (e) {
      console.log(`   ⚠️ Tag failed: ${tag}`);
    }
  }
  
  return true;
}

// Main
const files = process.argv.slice(2);

if (files.length === 0) {
  console.log('Usage: node scripts/migrate-md-to-db.mjs <file1.md> [file2.md] ...');
  process.exit(1);
}

(async () => {
  let success = 0;
  let failed = 0;
  
  for (const file of files) {
    const result = await migrateFile(file);
    if (result) success++;
    else failed++;
  }
  
  console.log(`\n📊 Results: ${success} success, ${failed} failed`);
})();
