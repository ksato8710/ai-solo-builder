import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  if (line.startsWith('#') || !line.includes('=')) continue;
  const [k, ...rest] = line.split('=');
  env[k.trim()] = rest.join('=').trim();
}

const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Fetch ALL primary items (not just 1000)
const allItems = [];
let offset = 0;
while (true) {
  const { data, error } = await sb.from('collected_items')
    .select('id, title, title_ja, url, url_hash, published_at, collected_at, source_id, sources!inner(id, name, source_type)')
    .eq('sources.source_type', 'primary')
    .order('collected_at', { ascending: false })
    .range(offset, offset + 999);
  if (error) { console.error(error); break; }
  if (!data || data.length === 0) break;
  allItems.push(...data);
  offset += data.length;
  if (data.length < 1000) break;
}

console.log('Total primary items fetched: ' + allItems.length);

// 1. Dedup analysis by (source_id, title) — visual duplicates
const bySourceTitle = new Map();
for (const item of allItems) {
  const key = item.source_id + '||' + item.title;
  if (!bySourceTitle.has(key)) bySourceTitle.set(key, []);
  bySourceTitle.get(key).push(item);
}

const sourceTitleDupes = [...bySourceTitle.entries()].filter(([, v]) => v.length > 1);
console.log('\n=== DUPLICATES BY (source_id, title): ' + sourceTitleDupes.length + ' groups ===');
let totalDupeItems = 0;
for (const [key, group] of sourceTitleDupes.slice(0, 20)) {
  const [srcId, title] = key.split('||');
  totalDupeItems += group.length - 1; // excess copies
  console.log('\n[' + group[0].sources.name + '] "' + title.slice(0, 60) + '" (' + group.length + 'x)');
  for (const item of group) {
    console.log('  url=' + item.url.slice(0, 80));
    console.log('  title_ja=' + (item.title_ja || '(none)').slice(0, 60));
    console.log('  published=' + (item.published_at || '').slice(0, 16) + ' collected=' + (item.collected_at || '').slice(0, 16));
  }
}
console.log('\nTotal excess duplicate items: ' + sourceTitleDupes.reduce((s, [,v]) => s + v.length - 1, 0));

// 2. title_ja quality issues
console.log('\n\n=== TITLE_JA ISSUES ===');
const issues = [];
for (const item of allItems) {
  if (!item.title_ja) continue;
  const tj = item.title_ja;
  const orig = item.title;

  // Product names transliterated badly
  if (/メイク/.test(tj) && /Make/.test(orig) && /Figma|connector/i.test(orig)) {
    issues.push({ type: 'product_name_mistranslated', orig, tj, source: item.sources.name });
  }
  // "コーデックス" for "Codex"
  if (/コーデックス/.test(tj) && /Codex/i.test(orig)) {
    issues.push({ type: 'product_name_mistranslated', orig, tj, source: item.sources.name });
  }
  // Very misleading (check a few patterns)
  if (/陸軍/.test(tj)) {
    issues.push({ type: 'misleading_translation', orig, tj, source: item.sources.name });
  }
  // URL as title_ja
  if (/^https?:\/\//.test(tj)) {
    issues.push({ type: 'url_as_title', orig, tj, source: item.sources.name });
  }
}

console.log('Total title_ja issues found: ' + issues.length);
const byType = {};
for (const issue of issues) {
  byType[issue.type] = (byType[issue.type] || 0) + 1;
}
console.log('By type:', JSON.stringify(byType));
for (const issue of issues.slice(0, 15)) {
  console.log('\n[' + issue.type + '] ' + issue.source);
  console.log('  orig: ' + issue.orig.slice(0, 70));
  console.log('  ja:   ' + issue.tj.slice(0, 70));
}

// 3. Items where title is a URL (no real title)
const urlTitles = allItems.filter(item => /^https?:\/\//.test(item.title));
console.log('\n\n=== URL-only titles: ' + urlTitles.length + ' ===');
for (const item of urlTitles.slice(0, 5)) {
  console.log('  [' + item.sources.name + '] ' + item.title.slice(0, 80));
}

// Summary
console.log('\n\n========== SUMMARY ==========');
console.log('Total primary items: ' + allItems.length);
console.log('(source, title) duplicate groups: ' + sourceTitleDupes.length);
console.log('Excess items to deduplicate: ' + sourceTitleDupes.reduce((s, [,v]) => s + v.length - 1, 0));
console.log('title_ja quality issues: ' + issues.length);
console.log('URL-only titles: ' + urlTitles.length);
