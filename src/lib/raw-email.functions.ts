import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { sendRawEmail } from './email-templates/send-raw-email'

const schema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(255),
  body: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
  from_name: z.string().max(80).optional(),
  label: z.string().max(80).optional(),
})

export const sendHtmlEmail = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => sendRawEmail(data))
