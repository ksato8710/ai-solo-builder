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
} from '@react-email/components';
import { EmailHeader } from './components/email-header';
import { EmailFooter } from './components/email-footer';

interface RankingItem {
  rank: number;
  headline: string;
  nva_total: number;
  source_url?: string | null;
}

interface MorningDigestEmailProps {
  title: string;
  date: string;
  description: string;
  digestUrl: string;
  rankingItems: RankingItem[];
  unsubscribeUrl: string;
}

export function MorningDigestEmail({
  title,
  date,
  description,
  digestUrl,
  rankingItems,
  unsubscribeUrl,
}: MorningDigestEmailProps) {
  const top3 = rankingItems.slice(0, 3);
  const rest = rankingItems.slice(3);

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <EmailHeader />

          <Section>
            <Text style={dateStyle}>{date}</Text>
            <Text style={titleStyle}>{title}</Text>
            <Text style={descriptionStyle}>{description}</Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* Top 3 Headlines */}
          {top3.length > 0 && (
            <Section>
              <Text style={sectionHeadingStyle}>Top 3 ヘッドライン</Text>
              {top3.map((item) => (
                <Section key={item.rank} style={topItemStyle}>
                  <Text style={rankBadgeStyle(item.rank)}>
                    {item.rank}
                  </Text>
                  <Text style={headlineStyle}>
                    {item.headline}
                  </Text>
                  <Text style={nvaScoreStyle}>
                    NVA: {item.nva_total}/100
                  </Text>
                </Section>
              ))}
            </Section>
          )}

          {/* Ranking 4-10 */}
          {rest.length > 0 && (
            <Section>
              <Hr style={dividerStyle} />
              <Text style={sectionHeadingStyle}>NVA ランキング</Text>
              {rest.map((item) => (
                <Text key={item.rank} style={rankListItemStyle}>
                  <span style={rankNumberStyle}>#{item.rank}</span>
                  {' '}{item.headline}
                  {' '}
                  <span style={nvaInlineStyle}>({item.nva_total}pt)</span>
                </Text>
              ))}
            </Section>
          )}

          <Hr style={dividerStyle} />

          {/* CTA */}
          <Section style={ctaContainerStyle}>
            <Button href={digestUrl} style={ctaButtonStyle}>
              サイトで全文を読む
            </Button>
          </Section>

          <EmailFooter unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  );
}

export default MorningDigestEmail;

const bodyStyle: React.CSSProperties = {
  backgroundColor: '#0f172a',
  fontFamily: "'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  margin: '0',
  padding: '0',
};

const containerStyle: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '20px',
};

const dateStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748b',
  margin: '0 0 4px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: '#e2e8f0',
  margin: '0 0 12px',
  lineHeight: '1.4',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.7',
  color: '#94a3b8',
  margin: '0 0 8px',
};

const dividerStyle: React.CSSProperties = {
  borderColor: 'rgba(255, 255, 255, 0.1)',
  margin: '20px 0',
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#3B82F6',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 16px',
};

const topItemStyle: React.CSSProperties = {
  backgroundColor: '#1e293b',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '10px',
};

function rankBadgeStyle(rank: number): React.CSSProperties {
  const colors: Record<number, string> = {
    1: 'linear-gradient(135deg, #FFD700, #FFA500)',
    2: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)',
    3: 'linear-gradient(135deg, #CD7F32, #B87333)',
  };
  return {
    display: 'inline-block',
    width: '28px',
    height: '28px',
    lineHeight: '28px',
    textAlign: 'center' as const,
    borderRadius: '6px',
    background: colors[rank] || '#334155',
    color: rank <= 2 ? '#1a1a1a' : '#ffffff',
    fontWeight: 700,
    fontSize: '14px',
    margin: '0 0 8px',
  };
}

const headlineStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#e2e8f0',
  margin: '0 0 4px',
  lineHeight: '1.5',
};

const nvaScoreStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#8B5CF6',
  fontWeight: 600,
  margin: '0',
};

const rankListItemStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#94a3b8',
  margin: '0 0 10px',
  lineHeight: '1.6',
};

const rankNumberStyle: React.CSSProperties = {
  color: '#3B82F6',
  fontWeight: 700,
};

const nvaInlineStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '12px',
};

const ctaContainerStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '8px 0 24px',
};

const ctaButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(to right, #3B82F6, #8B5CF6)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600,
  padding: '12px 28px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
};
