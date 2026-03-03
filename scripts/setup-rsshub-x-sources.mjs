#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import process from 'process';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const ENV_FILES = ['.env.local', '.env'];
const DEFAULT_WATCHLIST = 'docs/operations/watchlist.json';
const DEFAULT_RSSHUB_BASE_URL = 'http://127.0.0.1:1200';

const TIER_CONFIG = {
  tier1_official: {
    sourceType: 'primary',
    verificationLevel: 'official',
    crawlIntervalMinutes: 30,
  },
  tier2_keyperson: {
    sourceType: 'secondary',
    verificationLevel: 'community',
    crawlIntervalMinutes: 60,
  },
  tier3_japanese: {
    sourceType: 'tertiary',
    verificationLevel: 'community',
    crawlIntervalMinutes: 120,
  },
};

function loadProjectEnvFiles() {
  for (const envFile of ENV_FILES) {
    const absolutePath = path.join(ROOT, envFile);
    if (!fs.existsSync(absolutePath)) continue;

    const lines = fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const match = line.match(/^(export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;

      const key = match[2];
      let value = match[3].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    watchlist: DEFAULT_WATCHLIST,
    dryRun: false,
    rsshubBaseUrl: process.env.RSSHUB_BASE_URL || DEFAULT_RSSHUB_BASE_URL,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--watchlist' && args[i + 1]) {
      options.watchlist = args[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--rsshub-base-url' && args[i + 1]) {
      options.rsshubBaseUrl = args[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
  }

  return options;
}

function normalizeHandle(handle) {
  return String(handle || '')
    .trim()
    .replace(/^@+/, '');
}

function loadWatchlist(filePath) {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Watchlist file not found: ${abs}`);
  }
  const raw = fs.readFileSync(abs, 'utf8');
  return JSON.parse(raw);
}

function buildAccountRecords(watchlist) {
  const result = [];

  for (const tierKey of Object.keys(TIER_CONFIG)) {
    const tierAccounts = watchlist?.accounts?.[tierKey] || [];
    for (const account of tierAccounts) {
      const handle = normalizeHandle(account?.handle);
      if (!handle) continue;

      const config = TIER_CONFIG[tierKey];
      const company = account?.company ? ` (${account.company})` : '';
      result.push({
        tierKey,
        handle,
        sourceType: config.sourceType,
        verificationLevel: config.verificationLevel,
        crawlIntervalMinutes: config.crawlIntervalMinutes,
        name: `X @${handle}`,
        url: `https://x.com/${handle}`,
        domain: `x.com/${handle.toLowerCase()}`,
        description: `X source from watchlist ${tierKey}: ${account?.category || 'unknown'}${company}`,
      });
    }
  }

  return result;
}

function buildCrawlUrl(baseUrl, handle) {
  const cleanedBase = baseUrl.replace(/\/+$/, '');
  const routeParams = 'includeReplies=false&includeRts=false';
  return `${cleanedBase}/twitter/user/${encodeURIComponent(handle)}/${routeParams}`;
}

async function writeSourcesByDomain(supabase, payloads) {
  const domains = payloads.map((item) => item.domain).filter(Boolean);

  const { data: existingRows, error: existingError } = await supabase
    .from('sources')
    .select('id, domain')
    .in('domain', domains);

  if (existingError) {
    return { data: null, error: existingError };
  }

  const existingByDomain = new Map(
    (existingRows || []).map((row) => [row.domain, row.id])
  );

  const insertRows = [];
  const upsertRows = [];

  for (const payload of payloads) {
    const existingId = existingByDomain.get(payload.domain);
    if (existingId) {
      upsertRows.push({ id: existingId, ...payload });
    } else {
      insertRows.push(payload);
    }
  }

  if (insertRows.length > 0) {
    const { error: insertError } = await supabase.from('sources').insert(insertRows);
    if (insertError) {
      return { data: null, error: insertError };
    }
  }

  if (upsertRows.length > 0) {
    const { error: updateError } = await supabase
      .from('sources')
      .upsert(upsertRows, { onConflict: 'id' });
    if (updateError) {
      return { data: null, error: updateError };
    }
  }

  const { data, error } = await supabase
    .from('sources')
    .select('id, name, url, domain, source_type')
    .in('domain', domains);

  return { data: data || [], error };
}

async function upsertSources(supabase, payloads) {
  const firstAttempt = await writeSourcesByDomain(supabase, payloads);
  if (!firstAttempt.error) {
    return { data: firstAttempt.data, error: null, usedFallbackSourceType: false };
  }

  if (!/invalid input value for enum source_type/i.test(firstAttempt.error.message)) {
    return { data: null, error: firstAttempt.error, usedFallbackSourceType: false };
  }

  // Fallback for environments where source_type enum does not include
  // primary/secondary/tertiary yet.
  const fallbackPayloads = payloads.map((item) => ({
    ...item,
    source_type: 'social',
  }));

  const fallbackAttempt = await writeSourcesByDomain(supabase, fallbackPayloads);

  return {
    data: fallbackAttempt.data,
    error: fallbackAttempt.error,
    usedFallbackSourceType: true,
  };
}

async function ensureSourceLookup(supabase, domains) {
  const { data, error } = await supabase
    .from('sources')
    .select('id, domain')
    .in('domain', domains);

  if (error) {
    throw new Error(`Failed to read sources after upsert: ${error.message}`);
  }

  const lookup = new Map();
  for (const row of data || []) {
    lookup.set(row.domain, row.id);
  }
  return lookup;
}

async function main() {
  loadProjectEnvFiles();
  const options = parseArgs();
  const watchlist = loadWatchlist(options.watchlist);
  const accountRecords = buildAccountRecords(watchlist);

  if (accountRecords.length === 0) {
    console.log('No X accounts found in watchlist.');
    return;
  }

  const sourcePayloads = accountRecords.map((item) => ({
    name: item.name,
    url: item.url,
    domain: item.domain,
    source_type: item.sourceType,
    verification_level: item.verificationLevel,
    description: item.description,
    entity_kind: 'social',
    locale: item.tierKey === 'tier3_japanese' ? 'ja' : 'en',
    region: item.tierKey === 'tier3_japanese' ? 'jp' : 'global',
    is_active: true,
  }));

  // Home timeline source (algorithmic discovery)
  const homeTimelineSource = {
    tierKey: '_home_timeline',
    handle: '_home_timeline',
    sourceType: 'tertiary',
    verificationLevel: 'community',
    crawlIntervalMinutes: 120,
    name: 'X Home Timeline',
    url: 'https://x.com/home',
    domain: 'x.com/_home_timeline',
    description: 'X home timeline (latest) for discovering new accounts and content',
  };

  const homeTimelineSourcePayload = {
    name: homeTimelineSource.name,
    url: homeTimelineSource.url,
    domain: homeTimelineSource.domain,
    source_type: homeTimelineSource.sourceType,
    verification_level: homeTimelineSource.verificationLevel,
    description: homeTimelineSource.description,
    entity_kind: 'social',
    locale: 'en',
    region: 'global',
    is_active: true,
  };

  sourcePayloads.push(homeTimelineSourcePayload);
  accountRecords.push(homeTimelineSource);

  const crawlPayloadPreview = accountRecords.map((item) => ({
    domain: item.domain,
    crawl_method: item.handle === '_home_timeline' ? 'json_feed' : 'rss',
    crawl_url: item.handle === '_home_timeline'
      ? `${options.rsshubBaseUrl.replace(/\/+$/, '')}/twitter/home_latest?format=json`
      : buildCrawlUrl(options.rsshubBaseUrl, item.handle),
    crawl_interval_minutes: item.crawlIntervalMinutes,
  }));

  if (options.dryRun) {
    console.log(
      JSON.stringify(
        {
          dry_run: true,
          watchlist: options.watchlist,
          rsshub_base_url: options.rsshubBaseUrl,
          sources_to_upsert: sourcePayloads,
          crawl_configs_to_upsert: crawlPayloadPreview,
        },
        null,
        2
      )
    );
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).'
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const sourceUpsert = await upsertSources(supabase, sourcePayloads);
  if (sourceUpsert.error) {
    throw new Error(`Failed to upsert sources: ${sourceUpsert.error.message}`);
  }

  const domainToSourceId = await ensureSourceLookup(
    supabase,
    accountRecords.map((item) => item.domain)
  );

  const crawlPayloads = accountRecords
    .map((item) => {
      const sourceId = domainToSourceId.get(item.domain);
      if (!sourceId) return null;
      const isHomeTimeline = item.handle === '_home_timeline';
      return {
        source_id: sourceId,
        crawl_method: isHomeTimeline ? 'json_feed' : 'rss',
        crawl_url: isHomeTimeline
          ? `${options.rsshubBaseUrl.replace(/\/+$/, '')}/twitter/home_latest?format=json`
          : buildCrawlUrl(options.rsshubBaseUrl, item.handle),
        crawl_config: isHomeTimeline
          ? { via: 'rsshub', type: 'home_timeline' }
          : {
              x_handle: item.handle,
              watchlist_tier: item.tierKey,
              via: 'rsshub',
              include_replies: false,
              include_rts: false,
            },
        crawl_interval_minutes: item.crawlIntervalMinutes,
        is_active: true,
      };
    })
    .filter(Boolean);

  const { error: crawlError } = await supabase
    .from('source_crawl_configs')
    .upsert(crawlPayloads, { onConflict: 'source_id' });

  if (crawlError) {
    throw new Error(`Failed to upsert crawl configs: ${crawlError.message}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        rsshub_base_url: options.rsshubBaseUrl,
        sources_upserted: sourcePayloads.length,
        crawl_configs_upserted: crawlPayloads.length,
        used_fallback_source_type: sourceUpsert.usedFallbackSourceType,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
