import * as deepl from 'deepl-node';

const JAPANESE_CHAR_REGEX = /[ぁ-んァ-ヶ一-龯々〆ヵヶ]/u;

/**
 * Terms that DeepL should keep as-is (source → target identity mapping).
 * Sorted by length descending so longer phrases match first.
 */
const GLOSSARY_TERMS: Record<string, string> = Object.fromEntries(
  [
    'Model Context Protocol',
    'Mistral Computing',
    'Mistral Compute',
    'Instant Rollback',
    'GitHub Copilot',
    'Claude Code',
    'Google Cloud',
    'Figma Slides',
    'Figma Design',
    'Figma Make',
    'Figma Buzz',
    'Figma Draw',
    'Anthropic',
    'OpenAI',
    'ChatGPT',
    'Claude',
    'Gemini',
    'Mistral',
    'Perplexity',
    'Supabase',
    'Vercel',
    'Next.js',
    'TypeScript',
    'JavaScript',
    'Node.js',
    'React',
    'GitHub',
    'Cursor',
    'Windsurf',
    'Midjourney',
    'ElevenLabs',
    'FigJam',
    'Codex',
    'Sora',
    'Make',
    'HTTP/2',
    'API',
    'SDK',
    'CLI',
    'MCP',
    'RAG',
    'n8n',
  ].map((term) => [term, term])
);

const GLOSSARY_NAME = 'ai-solo-craft-en-ja';
const MAX_DEEPL_BATCH = 50;

let cachedGlossaryId: string | null = null;

function getDeepLClient(): deepl.Translator | null {
  const key = process.env.DEEPL_API_KEY;
  if (!key) return null;
  return new deepl.Translator(key);
}

async function ensureGlossary(client: deepl.Translator): Promise<string> {
  if (cachedGlossaryId) return cachedGlossaryId;

  const existing = await client.listGlossaries();
  const found = existing.find(
    (g) =>
      g.name === GLOSSARY_NAME &&
      g.sourceLang === 'en' &&
      g.targetLang === 'ja'
  );

  if (found) {
    const entries = await client.getGlossaryEntries(found);
    const currentEntries = entries.entries();
    const needsUpdate =
      Object.keys(GLOSSARY_TERMS).length !==
        Object.keys(currentEntries).length ||
      Object.entries(GLOSSARY_TERMS).some(
        ([k, v]) => currentEntries[k] !== v
      );

    if (needsUpdate) {
      await client.deleteGlossary(found);
    } else {
      cachedGlossaryId = found.glossaryId;
      return cachedGlossaryId;
    }
  }

  const glossary = await client.createGlossary(
    GLOSSARY_NAME,
    'en',
    'ja',
    new deepl.GlossaryEntries({ entries: GLOSSARY_TERMS })
  );
  cachedGlossaryId = glossary.glossaryId;
  return cachedGlossaryId;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function hasJapaneseText(value: string): boolean {
  return JAPANESE_CHAR_REGEX.test(value);
}

async function translateWithDeepL(
  client: deepl.Translator,
  texts: string[]
): Promise<string[]> {
  const glossaryId = await ensureGlossary(client);
  const results: string[] = [];

  for (let i = 0; i < texts.length; i += MAX_DEEPL_BATCH) {
    const batch = texts.slice(i, i + MAX_DEEPL_BATCH);
    const translated = await client.translateText(batch, 'en', 'ja', {
      glossary: glossaryId,
      splitSentences: 'off',
    });
    const translatedArray = Array.isArray(translated)
      ? translated
      : [translated];
    results.push(...translatedArray.map((r) => r.text));
  }

  return results;
}

// ---------------------------------------------------------------------------
// Google Translate fallback (kept for environments without DEEPL_API_KEY)
// ---------------------------------------------------------------------------

const MARKER_REGEX = /\[\[ID(\d{5})\]\]/g;
const MAX_BATCH_CHAR_LENGTH = 1_800;
const GLOSSARY_MARKER_REGEX = /\[\[TERM(\d{4})\]\]/g;

const FALLBACK_TERMS = Object.keys(GLOSSARY_TERMS).sort(
  (a, b) => b.length - a.length
);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface TitleCandidate {
  index: number;
  title: string;
  replacements: Map<string, string>;
}

function protectGlossaryTerms(title: string): {
  protectedTitle: string;
  replacements: Map<string, string>;
} {
  let protectedTitle = title;
  const replacements = new Map<string, string>();
  let tokenIndex = 0;

  for (const term of FALLBACK_TERMS) {
    const pattern = new RegExp(escapeRegExp(term), 'gi');
    protectedTitle = protectedTitle.replace(pattern, (matched) => {
      const token = `[[TERM${String(tokenIndex).padStart(4, '0')}]]`;
      tokenIndex += 1;
      replacements.set(token, matched);
      return token;
    });
  }

  return { protectedTitle, replacements };
}

function restoreGlossaryTerms(
  translated: string,
  replacements: Map<string, string>
): string {
  let restored = translated;
  for (const [token, originalTerm] of replacements.entries()) {
    restored = restored.replaceAll(token, originalTerm);
  }
  restored = restored.replace(
    GLOSSARY_MARKER_REGEX,
    (marker) => replacements.get(marker) ?? marker
  );
  return restored;
}

function buildBatchPayload(candidates: TitleCandidate[]): string {
  return candidates
    .map(
      ({ index, title }) =>
        `[[ID${String(index).padStart(5, '0')}]] ${title}`
    )
    .join('\n');
}

function splitIntoBatches(candidates: TitleCandidate[]): TitleCandidate[][] {
  const batches: TitleCandidate[][] = [];
  let current: TitleCandidate[] = [];
  let currentLength = 0;

  for (const candidate of candidates) {
    const lineLength = candidate.title.length + 20;
    if (
      current.length > 0 &&
      currentLength + lineLength > MAX_BATCH_CHAR_LENGTH
    ) {
      batches.push(current);
      current = [];
      currentLength = 0;
    }
    current.push(candidate);
    currentLength += lineLength;
  }

  if (current.length > 0) {
    batches.push(current);
  }

  return batches;
}

function extractTranslatedText(payload: unknown): string {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    return '';
  }
  return payload[0]
    .map((segment: unknown) =>
      Array.isArray(segment) ? String(segment[0] ?? '') : ''
    )
    .join('');
}

function parseMarkedTranslation(
  translatedPayload: string,
  candidates: TitleCandidate[]
): Map<number, string> {
  const matched = [...translatedPayload.matchAll(MARKER_REGEX)];
  const result = new Map<number, string>();

  for (let index = 0; index < matched.length; index += 1) {
    const current = matched[index];
    const next = matched[index + 1];

    const id = Number.parseInt(current[1], 10);
    const start = (current.index ?? 0) + current[0].length;
    const end = next?.index ?? translatedPayload.length;
    const text = normalizeWhitespace(translatedPayload.slice(start, end));

    if (!Number.isNaN(id) && text.length > 0) {
      result.set(id, text);
    }
  }

  for (const candidate of candidates) {
    if (!result.has(candidate.index)) {
      result.set(candidate.index, candidate.title);
    }
  }

  return result;
}

async function requestGoogleTranslate(payload: string): Promise<string> {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'auto',
    tl: 'ja',
    dt: 't',
    q: payload,
  });

  const response = await fetch(
    `https://translate.googleapis.com/translate_a/single?${params.toString()}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(`Translate API failed: ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  return extractTranslatedText(data);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translateWithGoogleFallback(
  titles: string[]
): Promise<string[]> {
  const preprocessed = titles.map((title) => protectGlossaryTerms(title));
  const translatedTitles = [...titles];

  const candidates: TitleCandidate[] = preprocessed
    .map((entry, index) => ({
      title: entry.protectedTitle,
      replacements: entry.replacements,
      index,
    }))
    .filter(
      (candidate) =>
        candidate.title.length > 0 && !hasJapaneseText(titles[candidate.index])
    );

  if (candidates.length === 0) {
    return translatedTitles;
  }

  const batches = splitIntoBatches(candidates);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    const batch = batches[batchIndex];
    const payload = buildBatchPayload(batch);

    try {
      const translatedPayload = await requestGoogleTranslate(payload);
      const parsed = parseMarkedTranslation(translatedPayload, batch);

      for (const candidate of batch) {
        const translated = normalizeWhitespace(
          parsed.get(candidate.index) ?? candidate.title
        );
        const restored = restoreGlossaryTerms(
          translated,
          candidate.replacements
        );
        translatedTitles[candidate.index] = normalizeWhitespace(
          restored || titles[candidate.index]
        );
      }
    } catch (error) {
      console.error('[title-translation] Batch translation failed:', error);
    }

    if (batchIndex < batches.length - 1) {
      await sleep(120);
    }
  }

  return translatedTitles;
}

// ---------------------------------------------------------------------------
// Public API (unchanged interface)
// ---------------------------------------------------------------------------

export async function translateTitlesToJapanese(
  titles: string[]
): Promise<string[]> {
  const normalized = titles.map((t) => normalizeWhitespace(t));
  const needsTranslation = normalized.map(
    (t) => t.length > 0 && !hasJapaneseText(t)
  );
  const toTranslate = normalized.filter((_, i) => needsTranslation[i]);

  if (toTranslate.length === 0) return normalized;

  const client = getDeepLClient();
  let translated: string[];

  if (client) {
    try {
      translated = await translateWithDeepL(client, toTranslate);
      console.log(
        `[title-translation] DeepL: translated ${translated.length} titles`
      );
    } catch (error) {
      console.warn(
        '[title-translation] DeepL failed, falling back to Google Translate:',
        error
      );
      translated = await translateWithGoogleFallback(toTranslate);
    }
  } else {
    translated = await translateWithGoogleFallback(toTranslate);
  }

  const result = [...normalized];
  let translatedIndex = 0;
  for (let i = 0; i < result.length; i++) {
    if (needsTranslation[i]) {
      result[i] = translated[translatedIndex] || normalized[i];
      translatedIndex++;
    }
  }

  return result;
}

export async function translateTitleToJapanese(title: string): Promise<string> {
  const [translated] = await translateTitlesToJapanese([title]);
  return translated || title;
}
