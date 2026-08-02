import { EmailAPIError, sendLovableEmail } from '@lovable.dev/email-js'

// Server-only: reads LOVABLE_API_KEY. Never import from client components.

const SITE_NAME = 'Reelax Tickets'
const SENDER_DOMAIN = 'notify.reelax-tickets.revente.app'
const FROM_DOMAIN = 'notify.reelax-tickets.revente.app'

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&middot;/g, '·')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim()
}

export interface SendRawEmailInput {
  to: string
  subject: string
  body?: string
  text?: string
  from_name?: string
  label?: string
}

export async function sendRawEmail(input: SendRawEmailInput) {
  const apiKey = process.env['LOVABLE_API_KEY']
  if (!apiKey) throw new Error('LOVABLE_API_KEY is not configured')

  const html = input.body
  const text = input.text || (html ? htmlToText(html) : undefined)
  if (!html && !text) throw new Error('Un contenu HTML ou texte est requis')

  try {
    await sendLovableEmail(
      {
        to: input.to,
        from: `${input.from_name || SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: input.subject,
        ...(html ? { html } : {}),
        ...(text ? { text } : {}),
        purpose: 'transactional',
        label: input.label || 'app-email',
        idempotency_key: crypto.randomUUID(),
      } as Parameters<typeof sendLovableEmail>[0],
      { apiKey, sendUrl: process.env['LOVABLE_SEND_URL'] }
    )
  } catch (error) {
    if (error instanceof EmailAPIError && error.code === 'recipient_suppressed') {
      return { sent: false as const, reason: 'recipient_suppressed' as const }
    }
    throw error
  }

  return { sent: true as const }
}
