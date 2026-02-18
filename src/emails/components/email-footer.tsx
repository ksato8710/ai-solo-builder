import {
  Section,
  Text,
  Link,
} from '@react-email/components';

interface EmailFooterProps {
  unsubscribeUrl?: string;
}

export function EmailFooter({ unsubscribeUrl }: EmailFooterProps) {
  return (
    <Section style={footerStyle}>
      <Text style={footerTextStyle}>
        AI Solo Builder — AIソロ開発者のための日本語ニュースキュレーション
      </Text>
      {unsubscribeUrl && (
        <Text style={unsubscribeStyle}>
          <Link href={unsubscribeUrl} style={unsubscribeLinkStyle}>
            配信停止はこちら
          </Link>
        </Text>
      )}
      <Text style={copyrightStyle}>
        &copy; {new Date().getFullYear()} AI Solo Builder. All rights reserved.
      </Text>
    </Section>
  );
}

const footerStyle: React.CSSProperties = {
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  marginTop: '32px',
  paddingTop: '24px',
};

const footerTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#94a3b8',
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const unsubscribeStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748b',
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const unsubscribeLinkStyle: React.CSSProperties = {
  color: '#64748b',
  textDecoration: 'underline',
};

const copyrightStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#475569',
  margin: '0',
  textAlign: 'center' as const,
};
