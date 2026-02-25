import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Button,
  Hr,
  Preview,
  Img,
} from '@react-email/components';

interface RankingArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  keyPoints: string[];
  whyItMatters: string | null;
  primarySourceUrl: string | null;
  japaneseSourceUrl: string | null;
}

interface RankingItem {
  rank: number;
  headline: string;
  nva_total: number;
  source_url?: string | null;
  article?: RankingArticle | null;
}

interface MorningDigestEmailProps {
  title: string;
  date: string;
  description: string;
  digestUrl: string;
  digestBody?: string | null;
  siteUrl: string;
  rankingItems: RankingItem[];
  unsubscribeUrl: string;
}

const TOP_SUMMARY_MAX = 210;
const TOP_WHY_MAX = 150;
const TOP_POINT_MAX = 92;
const QUICK_HIT_MIN_NVA = 75;

function toPlainText(input: string): string {
  return input
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1')
    .replace(/https?:\/\/[^\s)]+/g, '')
    .replace(/[*_`>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clampSentence(input: string, max: number): string {
  const text = toPlainText(input);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function buildTopSummary(description?: string | null, points: string[] = []): string | null {
  const candidates = [description || '', ...points]
    .map((line) => toPlainText(line))
    .filter((line) => line.length > 0);
  if (candidates.length === 0) return null;
  const primary = candidates[0];
  if (primary.length >= 100) return clampSentence(primary, TOP_SUMMARY_MAX);
  const merged = candidates.slice(0, 2).join(' ');
  return clampSentence(merged, TOP_SUMMARY_MAX);
}

function buildWhyText(why?: string | null, fallback?: string | null): string | null {
  const candidate = why || fallback;
  if (!candidate) return null;
  return clampSentence(candidate, TOP_WHY_MAX);
}

function buildKeyPoints(points: string[], fallback?: string | null): string[] {
  const normalized = points
    .map((line) => clampSentence(line, TOP_POINT_MAX))
    .filter((line) => line.length >= 20);

  if (normalized.length > 0) return normalized.slice(0, 3);

  if (!fallback) return [];
  return [clampSentence(fallback, TOP_POINT_MAX)];
}

function formatDate(date: string): string {
  const parsed = new Date(`${date}T09:00:00+09:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

// craftGarden Design System — Quiet Garden
const c = {
  bgCream: '#FAFAF5',
  bgWarm: '#F5F2EC',
  bgCard: '#F0EDE6',
  textDeep: '#2D3B2E',
  textMuted: '#5C7260',
  textLight: '#8A9E8C',
  accentLeaf: '#6B8F71',
  accentSage: '#9BB09E',
  accentMoss: '#4A7051',
  accentBark: '#8B7355',
  accentBloom: '#C4926B',
};

export function MorningDigestEmail({
  title,
  date,
  description,
  digestUrl,
  siteUrl,
  rankingItems,
  unsubscribeUrl,
}: MorningDigestEmailProps) {
  const top3 = rankingItems.slice(0, 3);
  const quickHits = rankingItems
    .slice(3, 10)
    .filter((item) => item.nva_total >= QUICK_HIT_MIN_NVA && Boolean(item.source_url));

  return (
    <Html>
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Nunito:wght@600;700;800&display=swap');
        `}</style>
      </Head>
      <Preview>{title}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={brandStyle}>🌱 AI SOLO CRAFT</Text>
            <Text style={editionStyle}>朝刊ダイジェスト</Text>
          </Section>

          {/* Hero */}
          <Section style={heroStyle}>
            <Text style={dateTextStyle}>{formatDate(date)}</Text>
            <Text style={heroTitleStyle}>{title}</Text>
            <Text style={heroDescStyle}>{description}</Text>
            <Link href={digestUrl} style={heroLinkStyle}>
              Web版で全文を読む →
            </Link>
          </Section>

          {/* Divider with leaf motif */}
          <Section style={dividerSectionStyle}>
            <Text style={dividerStyle}>✦ ✦ ✦</Text>
          </Section>

          {/* Top Stories */}
          {top3.map((item) => {
            const articleUrl = item.article?.slug ? `${siteUrl}/news/${item.article.slug}` : null;
            const primaryUrl = item.article?.primarySourceUrl || item.source_url;
            const japaneseUrl = item.article?.japaneseSourceUrl || null;
            const keyPoints = item.article?.keyPoints || [];
            const summaryText = buildTopSummary(item.article?.description, keyPoints);
            const whyText = buildWhyText(item.article?.whyItMatters, item.article?.description);
            const renderedPoints = buildKeyPoints(keyPoints, summaryText);

            return (
              <Section key={`top-${item.rank}`} style={storyStyle}>
                <Text style={rankBadgeStyle}>#{item.rank}</Text>
                <Text style={storyTitleStyle}>{item.headline}</Text>
                
                {summaryText && (
                  <Text style={storyTextStyle}>{summaryText}</Text>
                )}

                {whyText && (
                  <Section style={whyBoxStyle}>
                    <Text style={whyTextStyle}>
                      <span style={{ color: c.accentLeaf, fontWeight: 600 }}>💡</span> {whyText}
                    </Text>
                  </Section>
                )}

                {renderedPoints.length > 0 && (
                  <Section style={pointsStyle}>
                    {renderedPoints.map((point, idx) => (
                      <Text key={idx} style={pointStyle}>• {point}</Text>
                    ))}
                  </Section>
                )}

                <Section style={linksStyle}>
                  {primaryUrl && (
                    <Link href={primaryUrl} style={primaryLinkStyle}>公式発表</Link>
                  )}
                  {japaneseUrl && (
                    <Link href={japaneseUrl} style={secondaryLinkStyle}>日本語解説</Link>
                  )}
                  {articleUrl && (
                    <Link href={articleUrl} style={tertiaryLinkStyle}>詳細記事</Link>
                  )}
                </Section>
              </Section>
            );
          })}

          {/* Quick Hits */}
          {quickHits.length > 0 && (
            <Section style={quickHitsStyle}>
              <Text style={sectionTitleStyle}>その他のニュース</Text>
              {quickHits.map((item) => (
                <Text key={`quick-${item.rank}`} style={quickHitStyle}>
                  <span style={{ color: c.accentBloom }}>#{item.rank}</span> {item.headline}
                </Text>
              ))}
            </Section>
          )}

          {/* CTA */}
          <Section style={ctaStyle}>
            <Text style={ctaTextStyle}>
              各トピックの詳細分析を読む
            </Text>
            <Button href={digestUrl} style={ctaButtonStyle}>
              サイトで続きを読む
            </Button>
          </Section>

          {/* Footer */}
          <Hr style={footerDividerStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              AI Solo Craft — 毎朝、AIソロ開発者に必要な情報を届けます
            </Text>
            <Link href={unsubscribeUrl} style={unsubLinkStyle}>配信停止</Link>
            <Text style={copyrightStyle}>
              © {new Date().getFullYear()} AI Solo Craft
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

export default MorningDigestEmail;

// ─────────────────────────────────────────────────────────────
// craftGarden Quiet Garden Styles
// ─────────────────────────────────────────────────────────────

const bodyStyle: React.CSSProperties = {
  backgroundColor: c.bgCream,
  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  margin: 0,
  padding: 0,
};

const containerStyle: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '40px 24px',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const brandStyle: React.CSSProperties = {
  fontFamily: "'Nunito', -apple-system, sans-serif",
  fontSize: '13px',
  fontWeight: 700,
  color: c.accentLeaf,
  letterSpacing: '0.08em',
  margin: '0 0 4px',
};

const editionStyle: React.CSSProperties = {
  fontFamily: "'Nunito', -apple-system, sans-serif",
  fontSize: '24px',
  fontWeight: 800,
  color: c.textDeep,
  margin: 0,
};

const heroStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const dateTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: c.textLight,
  margin: '0 0 12px',
};

const heroTitleStyle: React.CSSProperties = {
  fontFamily: "'Nunito', -apple-system, sans-serif",
  fontSize: '22px',
  fontWeight: 700,
  lineHeight: '1.4',
  color: c.textDeep,
  margin: '0 0 12px',
};

const heroDescStyle: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.7',
  color: c.textMuted,
  margin: '0 0 16px',
};

const heroLinkStyle: React.CSSProperties = {
  fontSize: '14px',
  color: c.accentLeaf,
  textDecoration: 'none',
  fontWeight: 600,
};

const dividerSectionStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const dividerStyle: React.CSSProperties = {
  fontSize: '12px',
  color: c.accentSage,
  letterSpacing: '8px',
  margin: 0,
};

const storyStyle: React.CSSProperties = {
  backgroundColor: c.bgCard,
  borderRadius: '16px',
  padding: '24px',
  marginBottom: '16px',
};

const rankBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  fontFamily: "'Nunito', -apple-system, sans-serif",
  fontSize: '12px',
  fontWeight: 700,
  color: c.accentLeaf,
  backgroundColor: 'rgba(107, 143, 113, 0.1)',
  borderRadius: '999px',
  padding: '4px 12px',
  margin: '0 0 12px',
};

const storyTitleStyle: React.CSSProperties = {
  fontFamily: "'Nunito', -apple-system, sans-serif",
  fontSize: '17px',
  fontWeight: 700,
  lineHeight: '1.4',
  color: c.textDeep,
  margin: '0 0 12px',
};

const storyTextStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '1.7',
  color: c.textMuted,
  margin: '0 0 12px',
};

const whyBoxStyle: React.CSSProperties = {
  backgroundColor: c.bgWarm,
  borderRadius: '12px',
  borderLeft: `3px solid ${c.accentLeaf}`,
  padding: '12px 16px',
  marginBottom: '12px',
};

const whyTextStyle: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '1.6',
  color: c.textMuted,
  margin: 0,
};

const pointsStyle: React.CSSProperties = {
  marginBottom: '16px',
};

const pointStyle: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '1.6',
  color: c.textMuted,
  margin: '0 0 6px',
  paddingLeft: '4px',
};

const linksStyle: React.CSSProperties = {
  marginTop: '16px',
};

const primaryLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#fff',
  backgroundColor: c.accentLeaf,
  borderRadius: '999px',
  padding: '8px 16px',
  textDecoration: 'none',
  marginRight: '8px',
  marginBottom: '8px',
};

const secondaryLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '12px',
  fontWeight: 600,
  color: c.accentMoss,
  backgroundColor: 'rgba(107, 143, 113, 0.1)',
  borderRadius: '999px',
  padding: '8px 16px',
  textDecoration: 'none',
  marginRight: '8px',
  marginBottom: '8px',
};

const tertiaryLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '12px',
  fontWeight: 600,
  color: c.textMuted,
  backgroundColor: c.bgWarm,
  borderRadius: '999px',
  padding: '8px 16px',
  textDecoration: 'none',
  marginBottom: '8px',
};

const quickHitsStyle: React.CSSProperties = {
  backgroundColor: c.bgWarm,
  borderRadius: '16px',
  padding: '20px 24px',
  marginBottom: '24px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "'Nunito', -apple-system, sans-serif",
  fontSize: '14px',
  fontWeight: 700,
  color: c.textDeep,
  margin: '0 0 12px',
};

const quickHitStyle: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '1.7',
  color: c.textMuted,
  margin: '0 0 8px',
};

const ctaStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const ctaTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: c.textMuted,
  margin: '0 0 16px',
};

const ctaButtonStyle: React.CSSProperties = {
  fontFamily: "'Nunito', -apple-system, sans-serif",
  fontSize: '15px',
  fontWeight: 700,
  color: '#fff',
  backgroundColor: c.accentLeaf,
  borderRadius: '999px',
  padding: '14px 32px',
  textDecoration: 'none',
  boxShadow: '0 4px 16px rgba(107, 143, 113, 0.25)',
};

const footerDividerStyle: React.CSSProperties = {
  borderColor: 'rgba(107, 143, 113, 0.1)',
  marginBottom: '24px',
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center' as const,
};

const footerTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: c.textLight,
  margin: '0 0 12px',
  lineHeight: '1.6',
};

const unsubLinkStyle: React.CSSProperties = {
  fontSize: '12px',
  color: c.accentLeaf,
  textDecoration: 'underline',
};

const copyrightStyle: React.CSSProperties = {
  fontSize: '11px',
  color: c.textLight,
  margin: '12px 0 0',
};
