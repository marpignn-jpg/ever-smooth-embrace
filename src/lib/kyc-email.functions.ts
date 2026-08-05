import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { sendTemplateEmail } from './email-templates/send-email'

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(8).max(120),
  buyerName: z.string().max(120).optional(),
  eventName: z.string().max(160).optional(),
  deadline: z.string().max(80).optional(),
  message: z.string().max(600).optional(),
  orderId: z.string().max(80).optional(),
})

const SITE_URL = 'https://reelax-tickets.revente.app'

export const sendKycRequestEmail = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const landingUrl = `${SITE_URL}/kyc?t=${encodeURIComponent(data.token)}`

    const result = await sendTemplateEmail('kyc-verification', data.email, {
      templateData: {
        buyerName: data.buyerName,
        eventName: data.eventName,
        kycUrl: landingUrl,
        deadline: data.deadline,
        message: data.message,
      },
      idempotencyKey: `kyc-verification-${data.orderId ?? data.email}-${Date.now()}`,
    })

    if (!result.sent) {
      return {
        sent: false as const,
        reason:
          "Ce destinataire est bloqué (désabonnement, plainte ou adresse invalide). L'e-mail n'a pas été envoyé.",
      }
    }

    return { sent: true as const }
  })
