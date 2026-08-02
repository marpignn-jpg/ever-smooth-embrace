import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

const LOGO_URL =
  'https://media.base44.com/images/public/6a26deb6bcfd5e626a026084/d31cad38e_image.png'
import type { TemplateEntry } from './registry'

interface Props {
  buyerName?: string
  eventName?: string
  kycUrl?: string
  deadline?: string
  message?: string
}

const Email = ({ buyerName, eventName, kycUrl, deadline, message }: Props) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Vérification d'identité requise pour recevoir vos billets</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="Reelax Tickets" style={logo} />
        <Heading style={heading}>Vérification d'identité requise</Heading>

        <Text style={text}>Bonjour {buyerName || 'et bienvenue'},</Text>

        <Text style={text}>
          Avant de pouvoir vous transmettre vos billets
          {eventName ? ` pour « ${eventName} »` : ''}, nous devons vérifier votre
          identité (procédure KYC). C'est une étape de sécurité obligatoire qui
          protège l'acheteur comme le vendeur, et elle ne prend que quelques
          minutes.
        </Text>

        {message ? <Text style={text}>{message}</Text> : null}

        {kycUrl ? (
          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button style={button} href={kycUrl}>
              Vérifier mon identité
            </Button>
            <Text style={small}>
              Ou copiez ce lien dans votre navigateur :<br />
              <Link href={kycUrl} style={link}>
                {kycUrl}
              </Link>
            </Text>
          </Section>
        ) : null}

        {deadline ? (
          <Text style={notice}>
            Merci de compléter la vérification avant le {deadline}. Passé ce
            délai, la remise des billets peut être suspendue.
          </Text>
        ) : null}

        <Text style={text}>
          Une fois la vérification validée, vos billets vous seront envoyés
          automatiquement par e-mail.
        </Text>

        <Hr style={hr} />
        <Text style={footer}>
          Vous recevez cet e-mail car une commande a été enregistrée à votre nom
          sur Reelax Tickets. Ne communiquez jamais vos identifiants bancaires
          par e-mail.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    data['eventName']
      ? `Vérification d'identité requise — ${data['eventName']}`
      : "Vérification d'identité requise pour recevoir vos billets",
  displayName: 'Demande de vérification KYC',
  previewData: {
    buyerName: 'Camille',
    eventName: 'Concert Olympia',
    kycUrl: 'https://exemple.com/kyc/abc123',
    deadline: '15 août 2026',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 28px' }
const logo = {
  height: '40px',
  margin: '0 0 20px',
  display: 'inline-block',
} as const
const heading = { fontSize: '22px', fontWeight: 700, color: '#111111', margin: '0 0 18px' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#333333', margin: '0 0 14px' }
const small = { fontSize: '12px', lineHeight: '20px', color: '#777777', margin: '16px 0 0' }
const notice = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#7a4a00',
  backgroundColor: '#fff6e5',
  borderRadius: '8px',
  padding: '12px 14px',
  margin: '0 0 14px',
}
const button = {
  backgroundColor: '#111111',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600,
  borderRadius: '8px',
  padding: '13px 26px',
  textDecoration: 'none',
  display: 'inline-block',
}
const link = { color: '#2563eb', wordBreak: 'break-all' as const }
const hr = { borderColor: '#eeeeee', margin: '28px 0 16px' }
const footer = { fontSize: '12px', lineHeight: '18px', color: '#999999', margin: 0 }
