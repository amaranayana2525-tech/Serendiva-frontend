import { z } from 'zod'
import type { NewsletterSubscribeBody } from '@/lib/api/types'
import { emailSchema, honeypot, localeSchema, optionalText } from './shared'

/** Newsletter sign-up (footer, newsletter banners) — mirrors POST /newsletter/subscribe. */
export const newsletterSchema = z.object({
  email: emailSchema,
  locale: localeSchema,
  source: optionalText(120),
  website: honeypot,
  turnstileToken: z.string().max(4096).optional(),
})

export type NewsletterFormValues = z.input<typeof newsletterSchema>
export type NewsletterPayload = z.output<typeof newsletterSchema>

export const toNewsletterBody = (payload: NewsletterPayload): NewsletterSubscribeBody => payload
