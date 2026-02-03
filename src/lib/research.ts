import fs from 'fs';
import path from 'path';

const researchDirectory = path.join(process.cwd(), 'research');

export interface NewsValueScore {
  slug: string;
  productName: string;
  date: string;
  articleSlug: string;
  snsScore: number;
  mediaSCore: number;
  communitySCore: number;
  techImpactScore: number;
  soloBuilderScore: number;
  totalScore: number;
  tier: string;
  summary: string;
}

function parseTier(score: number): string {
  if (score >= 80) return 'A';
  if (score >= 55) return 'B';
  if (score >= 30) return 'C';
  return 'D';
}

function extractScore(line: string): number {
  const match = line.match(/(\d+)\/20/);
  return match ? parseInt(match[1], 10) : 0;
}

export function getAllAssessments(): NewsValueScore[] {
  if (!fs.existsSync(researchDirectory)) return [];

  const dirs = fs.readdirSync(researchDirectory).filter(d => {
    const full = path.join(researchDirectory, d);
    return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'assessment.md'));
  });

  const assessments: NewsValueScore[] = [];

  for (const dir of dirs) {
    const assessmentPath = path.join(researchDirectory, dir, 'assessment.md');
    const content = fs.readFileSync(assessmentPath, 'utf8');

    // Extract product name from title
    const titleMatch = content.match(/^#\s*ニュースバリュー評価:\s*(.+)/m);
    const productName = titleMatch ? titleMatch[1].trim() : dir;

    // Extract date
    const dateMatch = content.match(/\*\*評価日:\*\*\s*(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : '';

    // Extract article slug
    const articleMatch = content.match(/\*\*対応記事:\*\*\s*content\/news\/(.+?)\.md/);
    const articleSlug = articleMatch ? articleMatch[1].replace(/^\d{4}-\d{2}-\d{2}-/, '') : '';

    // Extract scores from table rows
    const lines = content.split('\n');
    let sns = 0, media = 0, community = 0, tech = 0, solo = 0;

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('sns') || lower.includes('反応量')) sns = extractScore(line);
      else if (lower.includes('メディア') || lower.includes('カバレッジ')) media = extractScore(line);
      else if (lower.includes('コミュニティ')) community = extractScore(line);
      else if (lower.includes('技術') || lower.includes('インパクト')) tech = extractScore(line);
      else if (lower.includes('ソロビルダー') || lower.includes('関連度')) solo = extractScore(line);
    }

    const total = sns + media + community + tech + solo;

    // Extract summary
    const summaryMatch = content.match(/## 総合所見\n\n(.+)/);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';

    // Check for "対象外" (original content, not news)
    if (content.includes('対象外')) continue;

    assessments.push({
      slug: dir,
      productName,
      date,
      articleSlug,
      snsScore: sns,
      mediaSCore: media,
      communitySCore: community,
      techImpactScore: tech,
      soloBuilderScore: solo,
      totalScore: total,
      tier: parseTier(total),
      summary,
    });
  }

  return assessments.sort((a, b) => b.totalScore - a.totalScore);
}
