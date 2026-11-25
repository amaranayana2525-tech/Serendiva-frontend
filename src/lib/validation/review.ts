import { z } from 'zod'
import type { ReviewSubmissionBody } from '@/lib/api/types'
import { msg } from './messages'
import {
  emailSchema,
  honeypot,
  localeSchema,
  optionalSlug,
  optionalText,
  requiredText,
  TRAVELLER_TYPES,
} from './shared'

/**
 * "Share your experience" form — mirrors POST /reviews (ReviewSubmissionBody): guestName 2-120, email, country ISO-2,
 * location ≤120, travellerType, tourSlug?, rating 1-5, title ≤160, text 20-3000, travelDate 'YYYY-MM'.
 */
export const reviewSchema = z.object({
  guestName: requiredText(120, 2, 'nameTooShort'),
  email: emailSchema,
  country: z
    .string({ error: 'country' })
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, 'country'),
  location: optionalText(120),
  travellerType: z.enum(TRAVELLER_TYPES, { error: 'required' }),
  tourSlug: optionalSlug,
  rating: z.number({ error: 'rating' }).int('rating').min(1, 'rating').max(5, 'rating'),
  title: optionalText(160),
  text: z
    .string({ error: 'required' })
    .trim()
    .min(1, 'required')
    .min(20, 'reviewTooShort')
    .max(3000, msg('tooLong', 3000)),
  travelDate: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{4}-(0[1-9]|1[0-2])$/.test(v), 'month')
    .optional()
    .transform((v) => (v ? v : undefined)),
  locale: localeSchema,
  website: honeypot,
  turnstileToken: z.string().max(4096).optional(),
})

export type ReviewFormValues = z.input<typeof reviewSchema>
export type ReviewPayload = z.output<typeof reviewSchema>

export const toReviewBody = (payload: ReviewPayload): ReviewSubmissionBody => payload
