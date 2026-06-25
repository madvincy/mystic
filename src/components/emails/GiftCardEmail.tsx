// src/components/emails/GiftCardEmail.tsx
import {
  Html,
  Body,
  Container,
  Text,
  Link,
  Preview,
  Heading,
  Section,
  Img,
  Row,
  Column,
  Hr,
} from '@react-email/components'

interface GiftCardEmailProps {
  card: {
    code: string
    amount: number
    recipient_name: string
    sender_name: string
    message: string
    expires_at: string
  }
  giftCardUrl: string
  companyName: string
  companyLogo: string
}

export function GiftCardEmail({
  card,
  giftCardUrl,
  companyName,
  companyLogo,
}: GiftCardEmailProps) {
  const formattedDate = new Date(card.expires_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Html>
      <Preview>
        🎁 You've received a gift card from {card.sender_name || companyName}!
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            {companyLogo && (
              <Img
                src={companyLogo}
                alt={companyName}
                width="64"
                height="64"
                style={logoStyle}
              />
            )}
            <Text style={headerTitleStyle}>🎁 You've received a Gift Card!</Text>
          </Section>

          {/* Content */}
          <Section style={contentStyle}>
            <Text style={greetingStyle}>Dear {card.recipient_name},</Text>

            <Text style={messageStyle}>
              <strong>{card.sender_name || companyName}</strong> has sent you a
              gift card for{' '}
              <strong style={amountStyle}>
                KSh {card.amount.toLocaleString()}
              </strong>
            </Text>

            {card.message && (
              <Section style={messageBoxStyle}>
                <Text style={messageQuoteStyle}>"{card.message}"</Text>
                <Text style={messageSenderStyle}>— {card.sender_name}</Text>
              </Section>
            )}

            {/* Gift Card Code Box */}
            <Section style={codeBoxStyle}>
              <Text style={codeLabelStyle}>Gift Card Code</Text>
              <Text style={codeValueStyle}>{card.code}</Text>
              <Link href={giftCardUrl} style={buttonStyle}>
                Redeem Your Gift Card
              </Link>
            </Section>

            {/* Details Grid */}
            <Section style={detailsGridStyle}>
              <Row>
                <Column style={detailsColumnStyle}>
                  <Text style={detailsLabelStyle}>Amount</Text>
                  <Text style={detailsValueStyle}>
                    KSh {card.amount.toLocaleString()}
                  </Text>
                </Column>
                <Column style={detailsColumnStyle}>
                  <Text style={detailsLabelStyle}>Expires On</Text>
                  <Text style={detailsValueStyle}>{formattedDate}</Text>
                </Column>
              </Row>
            </Section>

            <Text style={termsStyle}>
              This gift card can only be used once and cannot be exchanged for
              cash. Please keep this code secure.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              © {new Date().getFullYear()} {companyName}. All rights reserved.
            </Text>
            <Text style={footerLinksStyle}>
              <Link href="https://mysticwines.co.ke" style={footerLinkStyle}>
                Visit our store
              </Link>
              {' · '}
              <Link
                href="mailto:support@mysticwines.co.ke"
                style={footerLinkStyle}
              >
                Contact Support
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ============================================
// STYLES (inline for email compatibility)
// ============================================

const bodyStyle: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: '20px 0',
}

const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}

const headerStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #db2777, #7c3aed)',
  padding: '40px 20px',
  textAlign: 'center',
}

const logoStyle: React.CSSProperties = {
  borderRadius: '50%',
  backgroundColor: '#ffffff',
  padding: '8px',
  marginBottom: '12px',
}

const headerTitleStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: 0,
}

const contentStyle: React.CSSProperties = {
  padding: '32px 40px',
}

const greetingStyle: React.CSSProperties = {
  fontSize: '18px',
  color: '#1f2937',
  marginBottom: '16px',
}

const messageStyle: React.CSSProperties = {
  fontSize: '16px',
  color: '#374151',
  lineHeight: '1.6',
  marginBottom: '20px',
}

const amountStyle: React.CSSProperties = {
  fontSize: '24px',
  color: '#db2777',
}

const messageBoxStyle: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  padding: '16px 20px',
  borderRadius: '8px',
  marginBottom: '24px',
  borderLeft: '4px solid #db2777',
}

const messageQuoteStyle: React.CSSProperties = {
  fontSize: '15px',
  color: '#4b5563',
  fontStyle: 'italic',
  margin: '0 0 8px 0',
}

const messageSenderStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
  margin: 0,
}

const codeBoxStyle: React.CSSProperties = {
  backgroundColor: '#fdf2f8',
  padding: '24px',
  borderRadius: '8px',
  textAlign: 'center',
  border: '2px solid #fbcfe8',
  marginBottom: '24px',
}

const codeLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginBottom: '8px',
}

const codeValueStyle: React.CSSProperties = {
  fontSize: '32px',
  fontFamily: 'monospace',
  fontWeight: 'bold',
  color: '#db2777',
  letterSpacing: '4px',
  marginBottom: '16px',
}

const buttonStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#db2777',
  color: '#ffffff',
  padding: '12px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: '600',
}

const detailsGridStyle: React.CSSProperties = {
  marginBottom: '24px',
}

const detailsColumnStyle: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  padding: '16px',
  borderRadius: '8px',
  textAlign: 'center',
  width: '50%',
}

const detailsLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '4px',
}

const detailsValueStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: 0,
}

const termsStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
  textAlign: 'center',
  marginTop: '8px',
}

const footerStyle: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  padding: '24px 40px',
  textAlign: 'center',
  borderTop: '1px solid #e5e7eb',
}

const footerTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
  marginBottom: '8px',
}

const footerLinksStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
}

const footerLinkStyle: React.CSSProperties = {
  color: '#db2777',
  textDecoration: 'underline',
}

export default GiftCardEmail