import {
  Section,
  Text,
} from '@react-email/components';

export function EmailHeader() {
  return (
    <Section style={headerStyle}>
      <Text style={logoStyle}>
        AI Solo Builder
      </Text>
    </Section>
  );
}

const headerStyle: React.CSSProperties = {
  padding: '24px 0 16px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  marginBottom: '24px',
};

const logoStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 800,
  background: 'linear-gradient(to right, #3B82F6, #8B5CF6, #10b981)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  margin: '0',
  textAlign: 'center' as const,
};
