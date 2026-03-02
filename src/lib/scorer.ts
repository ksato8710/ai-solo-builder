/**
 * NVA (News Value Assessment) rule-based scorer.
 *
 * V1: 5-axis weighted average (social, media, community, technical, solo_relevance)
 * V2: 3-component model (workflow_impact×0.45 + signal_strength×0.30 + classification_mod×0.25)
 *     Activated when myTools config is provided.
 *
 * No AI/LLM calls -- purely deterministic rules.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RoutingTarget = 'experiment' | 'content_idea' | 'process_knowledge' | 'skill_knowledge';

export interface NvaScores {
  nva_total: number;
  nva_social: number;
  nva_media: number;
  nva_community: number;
  nva_technical: number;
  nva_solo_relevance: number;
  classification: string;
  classification_confidence: number;
  relevance_tags: string[];
  routing_targets: RoutingTarget[];
  score_reasoning: string;
}

export interface ScoringWeights {
  social: number;
  media: number;
  community: number;
  technical: number;
  solo_relevance: number;
}

export interface MyToolsConfig {
  S: string[];  // daily-use tools (highest relevance)
  A: string[];  // would-try tools
  B: string[];  // might-use tools
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  social: 1.0,
  media: 1.0,
  community: 1.0,
  technical: 1.0,
  solo_relevance: 1.5,
};

// ---------------------------------------------------------------------------
// Keyword definitions
// ---------------------------------------------------------------------------

/** Technical impact keywords with scores */
const TECHNICAL_KEYWORDS: [RegExp, number][] = [
  // High impact: major releases
  [/\b(launch|release|v\d|GA|general\s*availability|ship|announce|debut|unveil)\b/i, 18],
  [/\b(リリース|公開|提供開始|正式版|一般提供)\b/, 18],
  // Research
  [/\b(research|paper|arxiv|breakthrough|state.of.the.art|SOTA|benchmark)\b/i, 16],
  [/\b(研究|論文|ベンチマーク)\b/, 16],
  // Updates
  [/\b(update|upgrade|improve|enhance|new\s*feature|beta|preview)\b/i, 14],
  [/\b(アップデート|改善|新機能|ベータ|プレビュー)\b/, 14],
  // Security
  [/\b(vulnerability|exploit|CVE|security\s*flaw|patch|breach|attack)\b/i, 15],
  [/\b(脆弱性|セキュリティ|パッチ|侵害)\b/, 15],
  // Integrations and ecosystem
  [/\b(integration|plugin|extension|connector|middleware)\b/i, 12],
  [/\b(統合|プラグイン|拡張)\b/, 12],
  // Deprecation / breaking
  [/\b(deprecat|sunset|end.of.life|breaking\s*change|migration)\b/i, 13],
  [/\b(廃止|非推奨|移行)\b/, 13],
];

/** Solo-builder relevance keywords with scores */
const SOLO_RELEVANCE_KEYWORDS: [RegExp, number][] = [
  // High relevance: solo/indie focus
  [/\b(solo|indie|individual|one.?person|side.?project|bootstrapp|solopreneur)\b/i, 20],
  [/\b(個人開発|ソロ|インディー|一人|副業|サイドプロジェクト)\b/, 20],
  // Tools and APIs developers use directly
  [/\b(API|SDK|CLI|library|framework|tool|open.?source|OSS|free\s*tier)\b/i, 16],
  [/\b(ツール|ライブラリ|フレームワーク|オープンソース|無料)\b/, 16],
  // Builder activities
  [/\b(ship|build|deploy|monetiz|revenue|pricing|SaaS|MRR|ARR)\b/i, 15],
  [/\b(収益|マネタイズ|料金|価格|デプロイ)\b/, 15],
  // Productivity and workflow
  [/\b(productivity|workflow|automat|no.?code|low.?code|vibe.?coding|copilot)\b/i, 14],
  [/\b(生産性|ワークフロー|自動化|ノーコード|ローコード|バイブコーディング)\b/, 14],
  // AI coding tools
  [/\b(cursor|claude\s*code|github\s*copilot|windsurf|cline|aider|bolt|v0)\b/i, 17],
  // Enterprise bias (lower relevance for solos)
  [/\b(enterprise|corporate|fortune\s*500|large.?scale|compliance|governance)\b/i, 8],
  [/\b(エンタープライズ|大企業|法人|コンプライアンス)\b/, 8],
];

/** Classification keyword map */
const CLASSIFICATION_RULES: [RegExp, string][] = [
  // Product releases
  [/\b(launch|release|GA|general\s*availability|ship|debut|unveil|introduce|リリース|公開|提供開始)\b/i, 'product-release'],
  // Product updates
  [/\b(update|upgrade|v\d+\.\d|patch|hotfix|improvement|アップデート|改善|修正)\b/i, 'product-update'],
  // Research
  [/\b(paper|research|study|arxiv|findings|experiment|論文|研究|調査)\b/i, 'research-paper'],
  // Funding
  [/\b(funding|rais|series\s*[A-Z]|invest|valuation|IPO|acquisition|acquir|資金調達|買収)\b/i, 'funding-acquisition'],
  // Partnership
  [/\b(partner|collaborat|alliance|joint\s*venture|提携|パートナー|連携)\b/i, 'partnership'],
  // Tutorial
  [/\b(tutorial|guide|how.to|walkthrough|step.by.step|チュートリアル|ガイド|手順)\b/i, 'tutorial-guide'],
  // Opinion/analysis
  [/\b(opinion|editorial|analysis|perspective|commentary|outlook|意見|分析|見解|展望)\b/i, 'opinion-analysis'],
  // Community trend
  [/\b(trend|community|viral|hype|buzz|popular|trending|トレンド|話題)\b/i, 'community-trend'],
  // Security
  [/\b(vulnerability|CVE|security|exploit|breach|attack|脆弱性|セキュリティ)\b/i, 'security-vulnerability'],
  // Regulatory
  [/\b(regulat|policy|law|legislation|compliance|ban|restrict|規制|法律|政策)\b/i, 'regulatory-policy'],
  // Case study
  [/\b(case.study|success.story|how\s+I|built|grew|revenue|MRR|事例|成功)\b/i, 'case-study'],
  // Benchmark
  [/\b(benchmark|comparison|vs\.?|versus|compared|比較|ベンチマーク)\b/i, 'benchmark-comparison'],
];

/** Relevance tag extraction rules */
const RELEVANCE_TAG_RULES: [RegExp, string][] = [
  [/\b(claude|anthropic)\b/i, 'claude'],
  [/\b(GPT|ChatGPT|openai|o1|o3|o4)\b/i, 'openai'],
  [/\b(gemini|google\s*ai|bard)\b/i, 'google-ai'],
  [/\b(llama|meta\s*ai)\b/i, 'meta-ai'],
  [/\b(mistral|mixtral)\b/i, 'mistral'],
  [/\b(cursor)\b/i, 'cursor'],
  [/\b(copilot|github)\b/i, 'github'],
  [/\b(vercel|next\.?js)\b/i, 'vercel'],
  [/\b(supabase)\b/i, 'supabase'],
  [/\b(hugging\s*face)\b/i, 'huggingface'],
  [/\b(vibe.?coding|バイブコーディング)\b/i, 'vibe-coding'],
  [/\b(agent|エージェント)\b/i, 'ai-agent'],
  [/\b(MCP|model\s*context\s*protocol)\b/i, 'mcp'],
  [/\b(RAG|retrieval|検索拡張)\b/i, 'rag'],
  [/\b(fine.?tun|ファインチューニング)\b/i, 'fine-tuning'],
  [/\b(diffusion|stable\s*diffusion|画像生成)\b/i, 'image-gen'],
  [/\b(voice|speech|TTS|音声)\b/i, 'voice-ai'],
  [/\b(open.?source|OSS|オープンソース)\b/i, 'open-source'],
  [/\b(pricing|free|料金|無料)\b/i, 'pricing'],
  [/\b(security|セキュリティ)\b/i, 'security'],
];

// ---------------------------------------------------------------------------
// Scoring functions
// ---------------------------------------------------------------------------

/** Score nva_social based on source tier and optional social signals */
function scoreSocial(
  sourceTier: 'primary' | 'secondary' | 'tertiary',
  contentSummary: string | null,
  engagement?: { likes?: number | null; retweets?: number | null; replies?: number | null; views?: number | null }
): number {
  // X engagement data takes priority when available
  if (engagement?.likes != null) {
    const composite = (engagement.likes ?? 0) + (engagement.retweets ?? 0) * 2 + (engagement.replies ?? 0);
    if (composite >= 5000) return 20;
    if (composite >= 1000) return 18;
    if (composite >= 500) return 16;
    if (composite >= 200) return 14;
    if (composite >= 100) return 12;
    if (composite >= 50) return 10;
    return 8;
  }

  // For HN/Reddit items, try to extract points/upvotes from summary
  if (sourceTier === 'tertiary' && contentSummary) {
    const pointsMatch = contentSummary.match(/(\d+)\s*(points|upvotes)/i);
    if (pointsMatch) {
      const points = parseInt(pointsMatch[1], 10);
      if (points >= 500) return 20;
      if (points >= 200) return 17;
      if (points >= 100) return 14;
      if (points >= 50) return 11;
      return 8;
    }
    // Tertiary without explicit social signal
    return 12;
  }

  // Default per tier
  switch (sourceTier) {
    case 'primary':
      return 10;
    case 'secondary':
      return 10;
    case 'tertiary':
      return 12;
    default:
      return 10;
  }
}

/** Score nva_media based on source tier and entity kind */
function scoreMedia(
  sourceTier: 'primary' | 'secondary' | 'tertiary',
  sourceCredibility: number
): number {
  // Base from tier
  let base: number;
  switch (sourceTier) {
    case 'primary':
      base = 18;
      break;
    case 'secondary':
      base = 13; // Will be refined by credibility
      break;
    case 'tertiary':
      base = 8;
      break;
    default:
      base = 10;
  }

  // Credibility adjustment for secondary: 1-10 scale maps to +/-3
  if (sourceTier === 'secondary' && sourceCredibility > 0) {
    const adj = Math.round((sourceCredibility - 5) * 0.6);
    base = Math.min(20, Math.max(0, base + adj));
  }

  return base;
}

/** Score nva_community based on source tier */
function scoreCommunity(sourceTier: 'primary' | 'secondary' | 'tertiary'): number {
  switch (sourceTier) {
    case 'primary':
      return 10;
    case 'secondary':
      return 12;
    case 'tertiary':
      return 16;
    default:
      return 10;
  }
}

/** Score nva_technical based on keyword analysis */
function scoreTechnical(text: string): { score: number; matchedKeywords: string[] } {
  let maxScore = 10; // default baseline
  const matched: string[] = [];

  for (const [pattern, score] of TECHNICAL_KEYWORDS) {
    if (pattern.test(text)) {
      matched.push(pattern.source.replace(/\\b|\(|\)|\\s\*/g, '').slice(0, 30));
      if (score > maxScore) maxScore = score;
    }
  }

  return { score: Math.min(20, maxScore), matchedKeywords: matched };
}

/** Score nva_solo_relevance based on keyword analysis */
function scoreSoloRelevance(text: string): { score: number; matchedKeywords: string[] } {
  let maxScore = 10; // default baseline
  const matched: string[] = [];
  let hasEnterpriseOnly = false;

  for (const [pattern, score] of SOLO_RELEVANCE_KEYWORDS) {
    if (pattern.test(text)) {
      matched.push(pattern.source.replace(/\\b|\(|\)|\\s\*/g, '').slice(0, 30));
      // Enterprise keywords push score down, not up
      if (score <= 8) {
        hasEnterpriseOnly = true;
      } else if (score > maxScore) {
        maxScore = score;
      }
    }
  }

  // If only enterprise keywords matched and nothing solo-relevant
  if (hasEnterpriseOnly && maxScore <= 10) {
    maxScore = 8;
  }

  return { score: Math.min(20, maxScore), matchedKeywords: matched };
}

/** Classify the item by keyword matching */
function classify(text: string): { classification: string; confidence: number } {
  const matches: { category: string; count: number }[] = [];

  for (const [pattern, category] of CLASSIFICATION_RULES) {
    const allMatches = text.match(new RegExp(pattern, 'gi'));
    if (allMatches) {
      const existing = matches.find((m) => m.category === category);
      if (existing) {
        existing.count += allMatches.length;
      } else {
        matches.push({ category, count: allMatches.length });
      }
    }
  }

  if (matches.length === 0) {
    return { classification: 'community-trend', confidence: 0.5 };
  }

  // Sort by match count descending
  matches.sort((a, b) => b.count - a.count);
  const topCategory = matches[0].category;
  const topCount = matches[0].count;

  // Confidence based on how many keyword matches and ratio to second-best
  let confidence: number;
  if (topCount >= 4) {
    confidence = 0.95;
  } else if (topCount >= 3) {
    confidence = 0.85;
  } else if (topCount >= 2) {
    confidence = 0.75;
  } else {
    confidence = 0.6;
  }

  // Reduce confidence if close competition
  if (matches.length > 1 && matches[1].count >= topCount - 1) {
    confidence = Math.max(0.5, confidence - 0.1);
  }

  return { classification: topCategory, confidence };
}

/** Extract relevance tags from text */
function extractRelevanceTags(text: string): string[] {
  const tags: string[] = [];
  for (const [pattern, tag] of RELEVANCE_TAG_RULES) {
    if (pattern.test(text)) {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
  }
  return tags;
}

// ---------------------------------------------------------------------------
// V2 scoring helpers
// ---------------------------------------------------------------------------

/** Classification → fixed score for classification_modifier component */
const CLASSIFICATION_SCORES: Record<string, number> = {
  'product-release': 90,
  'product-update': 75,
  'security-vulnerability': 80,
  'tutorial-guide': 65,
  'case-study': 60,
  'benchmark-comparison': 55,
  'research-paper': 50,
  'community-trend': 45,
  'opinion-analysis': 40,
  'funding-acquisition': 30,
  'partnership': 25,
  'regulatory-policy': 20,
};

/** Classification → bonus for workflow_impact component */
const CLASSIFICATION_WORKFLOW_BONUS: Record<string, number> = {
  'product-release': 20,
  'product-update': 15,
  'security-vulnerability': 15,
  'tutorial-guide': 10,
  'case-study': 10,
};

/** Compute workflow_impact (0-100) using MyToolsConfig + classification */
function computeWorkflowImpact(
  relevanceTags: string[],
  classification: string,
  myTools: MyToolsConfig,
): number {
  // Find highest tier match
  let base = 20; // no match
  for (const tag of relevanceTags) {
    if (myTools.S.includes(tag)) { base = Math.max(base, 80); break; }
    if (myTools.A.includes(tag)) { base = Math.max(base, 60); }
    if (myTools.B.includes(tag)) { base = Math.max(base, 40); }
  }

  const bonus = CLASSIFICATION_WORKFLOW_BONUS[classification] ?? 0;
  return Math.min(100, base + bonus);
}

/** Compute signal_strength (0-100) from existing social/media/community scores (each 0-20) */
function computeSignalStrength(social: number, media: number, community: number): number {
  const avg = (social + media + community) / 3;
  return Math.min(100, Math.round(avg * 5));
}

/** Compute classification_modifier (0-100) from classification */
function computeClassificationModifier(classification: string): number {
  return CLASSIFICATION_SCORES[classification] ?? 40;
}

// ---------------------------------------------------------------------------
// Routing logic
// ---------------------------------------------------------------------------

const EXPERIMENT_CLASSIFICATIONS = new Set(['product-release', 'product-update']);
const PROCESS_CLASSIFICATIONS = new Set(['tutorial-guide', 'case-study', 'opinion-analysis']);
const SKILL_TAGS = new Set(['mcp', 'ai-agent']);

/** Determine routing targets based on scores, classification, and tags */
function computeRoutingTargets(
  nvaTotal: number,
  nvaSoloRelevance: number,
  classification: string,
  relevanceTags: string[]
): RoutingTarget[] {
  // Items below threshold get no routing
  if (nvaTotal < 40) return [];

  const targets: RoutingTarget[] = [];

  // experiment: product-release/update with high solo relevance
  if (EXPERIMENT_CLASSIFICATIONS.has(classification) && nvaSoloRelevance >= 14) {
    targets.push('experiment');
  }

  // process_knowledge: best-practice/workflow/methodology type content
  if (PROCESS_CLASSIFICATIONS.has(classification)) {
    targets.push('process_knowledge');
  }

  // skill_knowledge: tool-update/open-source with mcp/agent tags
  if (
    (classification === 'product-update' || classification === 'product-release') &&
    relevanceTags.some((tag) => SKILL_TAGS.has(tag))
  ) {
    targets.push('skill_knowledge');
  }

  // content_idea: high total score
  if (nvaTotal >= 60) {
    targets.push('content_idea');
  }

  return targets;
}

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

export function computeNvaScores(
  title: string,
  contentSummary: string | null,
  sourceTier: 'primary' | 'secondary' | 'tertiary',
  sourceCredibility: number,
  weights: ScoringWeights,
  engagement?: { likes?: number | null; retweets?: number | null; replies?: number | null; views?: number | null },
  myTools?: MyToolsConfig | null,
): NvaScores {
  // Combine title and summary for analysis
  const combinedText = [title, contentSummary || ''].join(' ');

  // Compute individual axis scores (used by both V1 and V2)
  const social = scoreSocial(sourceTier, contentSummary, engagement);
  const media = scoreMedia(sourceTier, sourceCredibility);
  const community = scoreCommunity(sourceTier);
  const { score: technical, matchedKeywords: techKeywords } = scoreTechnical(combinedText);
  const { score: soloRelevance, matchedKeywords: soloKeywords } = scoreSoloRelevance(combinedText);

  // Classification
  const { classification, confidence } = classify(combinedText);

  // Relevance tags
  const relevanceTags = extractRelevanceTags(combinedText);

  let nvaTotal: number;
  let reasoningParts: string[];

  if (myTools) {
    // --- V2 path: 3-component model ---
    const workflowImpact = computeWorkflowImpact(relevanceTags, classification, myTools);
    const signalStrength = computeSignalStrength(social, media, community);
    const classificationMod = computeClassificationModifier(classification);

    nvaTotal = Math.round(
      workflowImpact * 0.45 + signalStrength * 0.30 + classificationMod * 0.25
    );

    reasoningParts = [
      `[V2][${sourceTier}] workflow=${workflowImpact} signal=${signalStrength} class_mod=${classificationMod}`,
      `classification=${classification}(${confidence.toFixed(2)})`,
    ];
    if (relevanceTags.length > 0) {
      reasoningParts.push(`tags=[${relevanceTags.join(',')}]`);
    }
    // Find matched tool tier for reasoning
    const matchedTiers: string[] = [];
    for (const tag of relevanceTags) {
      if (myTools.S.includes(tag)) matchedTiers.push(`S:${tag}`);
      else if (myTools.A.includes(tag)) matchedTiers.push(`A:${tag}`);
      else if (myTools.B.includes(tag)) matchedTiers.push(`B:${tag}`);
    }
    if (matchedTiers.length > 0) {
      reasoningParts.push(`tool_match=[${matchedTiers.join(',')}]`);
    }

    // Store V2 component values in existing DB columns:
    // nva_technical ← workflow_impact (0-100 scaled to 0-20)
    // nva_solo_relevance ← classification_modifier (0-100 scaled to 0-20)
    const v2Technical = Math.round(workflowImpact / 5);
    const v2SoloRelevance = Math.round(classificationMod / 5);

    const clampedTotal = Math.min(100, Math.max(0, nvaTotal));
    const routingTargets = computeRoutingTargets(clampedTotal, v2SoloRelevance, classification, relevanceTags);

    if (routingTargets.length > 0) {
      reasoningParts.push(`routing=[${routingTargets.join(',')}]`);
    }

    return {
      nva_total: clampedTotal,
      nva_social: social,
      nva_media: media,
      nva_community: community,
      nva_technical: v2Technical,
      nva_solo_relevance: v2SoloRelevance,
      classification,
      classification_confidence: Math.round(confidence * 100) / 100,
      relevance_tags: relevanceTags,
      routing_targets: routingTargets,
      score_reasoning: reasoningParts.join(' | '),
    };
  }

  // --- V1 path: weighted average ---
  const totalWeight =
    weights.social + weights.media + weights.community + weights.technical + weights.solo_relevance;

  const weightedSum =
    social * weights.social +
    media * weights.media +
    community * weights.community +
    technical * weights.technical +
    soloRelevance * weights.solo_relevance;

  // Scale from 0-20 axis range to 0-100 total range
  nvaTotal = Math.round((weightedSum / totalWeight) * 5);

  // Build reasoning
  reasoningParts = [
    `[${sourceTier}] social=${social} media=${media} community=${community} tech=${technical} solo=${soloRelevance}`,
    `classification=${classification}(${confidence.toFixed(2)})`,
  ];
  if (techKeywords.length > 0) {
    reasoningParts.push(`tech_keywords=[${techKeywords.slice(0, 3).join(',')}]`);
  }
  if (soloKeywords.length > 0) {
    reasoningParts.push(`solo_keywords=[${soloKeywords.slice(0, 3).join(',')}]`);
  }
  if (relevanceTags.length > 0) {
    reasoningParts.push(`tags=[${relevanceTags.join(',')}]`);
  }

  const clampedTotal = Math.min(100, Math.max(0, nvaTotal));
  const routingTargets = computeRoutingTargets(clampedTotal, soloRelevance, classification, relevanceTags);

  if (routingTargets.length > 0) {
    reasoningParts.push(`routing=[${routingTargets.join(',')}]`);
  }

  return {
    nva_total: clampedTotal,
    nva_social: social,
    nva_media: media,
    nva_community: community,
    nva_technical: technical,
    nva_solo_relevance: soloRelevance,
    classification,
    classification_confidence: Math.round(confidence * 100) / 100,
    relevance_tags: relevanceTags,
    routing_targets: routingTargets,
    score_reasoning: reasoningParts.join(' | '),
  };
}
