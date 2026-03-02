import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load env
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

const { data: items, error } = await sb.from('collected_items')
  .select('id, title, title_ja, url, url_hash, published_at, collected_at, source_id, sources!inner(name, source_type)')
  .eq('sources.source_type', 'primary')
  .order('collected_at', { ascending: false })
  .limit(3000);

if (error) { console.error(error); process.exit(1); }

// 1. Duplicate URL analysis
const byHash = new Map();
for (const item of items) {
  const key = item.url_hash;
  if (!byHash.has(key)) byHash.set(key, []);
  byHash.get(key).push(item);
}

const dupeGroups = [...byHash.entries()].filter(([, v]) => v.length > 1);
console.log('=== DUPLICATE URL GROUPS: ' + dupeGroups.length + ' ===');
for (const [hash, group] of dupeGroups.slice(0, 15)) {
  console.log('\n--- Duplicate (' + group.length + 'x): ' + group[0].url.slice(0, 100));
  for (const item of group) {
    console.log('  id=' + item.id.slice(0,8) + ' source=' + item.sources.name + ' collected=' + (item.collected_at || '').slice(0,16));
  }
}

// 2. title_ja quality analysis
console.log('\n\n=== TITLE_JA QUALITY ANALYSIS ===');
let noTitleJa = 0;
let hasTitleJa = 0;
const badTranslations = [];

for (const item of items) {
  if (!item.title_ja) {
    noTitleJa++;
    continue;
  }
  hasTitleJa++;

  // Check for suspicious patterns
  const tj = item.title_ja;
  const orig = item.title;

  // Same as original (no translation)
  if (tj === orig) {
    badTranslations.push({ reason: 'same_as_original', item });
    continue;
  }

  // Very short (likely truncated or meaningless)
  if (tj.length < 5 && orig.length > 20) {
    badTranslations.push({ reason: 'too_short', item });
    continue;
  }

  // Contains odd characters or broken encoding
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(tj)) {
    badTranslations.push({ reason: 'broken_encoding', item });
    continue;
  }
}

console.log('Total primary items: ' + items.length);
console.log('Has title_ja: ' + hasTitleJa);
console.log('Missing title_ja: ' + noTitleJa);
console.log('Bad translations found: ' + badTranslations.length);

// Show samples of title vs title_ja
console.log('\n=== SAMPLE TRANSLATIONS (recent 40) ===');
for (const item of items.slice(0, 40)) {
  if (item.title_ja) {
    console.log('[' + item.sources.name + '] ' + item.title.slice(0, 70));
    console.log('  -> ' + item.title_ja.slice(0, 80));
    console.log('');
  }
}

// 3. Same source same date same title_ja duplicates
console.log('\n=== EXACT TITLE DUPLICATES (same title shown multiple times) ===');
const byTitle = new Map();
for (const item of items) {
  const display = item.title_ja || item.title;
  const dateKey = (item.published_at || item.collected_at || '').slice(0, 10);
  const key = display + '||' + dateKey;
  if (!byTitle.has(key)) byTitle.set(key, []);
  byTitle.get(key).push(item);
}

const titleDupes = [...byTitle.entries()].filter(([, v]) => v.length > 1);
console.log('Title+date duplicate groups: ' + titleDupes.length);
for (const [key, group] of titleDupes.slice(0, 10)) {
  const [title, date] = key.split('||');
  console.log('\n--- "' + title.slice(0, 60) + '" on ' + date + ' (' + group.length + 'x)');
  for (const item of group) {
    console.log('  url=' + item.url.slice(0, 80) + ' source=' + item.sources.name);
  }
}

// Summary
console.log('\n\n========== SUMMARY ==========');
console.log('Total primary collected_items: ' + items.length);
console.log('Duplicate URL groups (same url_hash): ' + dupeGroups.length);
console.log('Total items in duplicate groups: ' + dupeGroups.reduce((s, [,v]) => s + v.length, 0));
console.log('Title+date visual duplicates: ' + titleDupes.length);
console.log('title_ja coverage: ' + hasTitleJa + '/' + items.length + ' (' + Math.round(hasTitleJa/items.length*100) + '%)');
