import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Preview,
} from '@react-email/components';
import { EmailHeader } from './components/email-header';
import { EmailFooter } from './components/email-footer';

interface VerificationEmailProps {
  confirmUrl: string;
}

export function VerificationEmail({ confirmUrl }: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>AI Solo Builder ニュースレターの登録確認</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <EmailHeader />

          <Section style={contentStyle}>
            <Text style={headingStyle}>
              ニュースレター登録の確認
            </Text>
            <Text style={paragraphStyle}>
              AI Solo Builder ニュースレターへのご登録ありがとうございます。
            </Text>
            <Text style={paragraphStyle}>
              以下のボタンをクリックして、メールアドレスを確認してください。
              確認後、毎朝 8:15 にAIの最新ニュースをお届けします。
            </Text>

            <Section style={buttonContainerStyle}>
              <Button href={confirmUrl} style={buttonStyle}>
                登録を確認する
              </Button>
            </Section>

            <Text style={noteStyle}>
              このメールに心当たりがない場合は、無視していただいて構いません。
            </Text>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

export default VerificationEmail;

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

const contentStyle: React.CSSProperties = {
  padding: '0',
};

const headingStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: '#e2e8f0',
  margin: '0 0 16px',
};

const paragraphStyle: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.7',
  color: '#94a3b8',
  margin: '0 0 12px',
};

const buttonContainerStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '28px 0',
};

const buttonStyle: React.CSSProperties = {
  background: 'linear-gradient(to right, #3B82F6, #8B5CF6)',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 600,
  padding: '14px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
};

const noteStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748b',
  margin: '24px 0 0',
  textAlign: 'center' as const,
};
