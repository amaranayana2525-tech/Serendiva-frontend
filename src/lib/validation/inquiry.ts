import { z } from 'zod'
import type { InquiryBody } from '@/lib/api/types'
import { msg } from './messages'
import {
  emailSchema,
  honeypot,
  localeSchema,
  optionalIsoDate,
  optionalIntlPhone,
  optionalSlug,
  optionalText,
  requiredText,
  TRAVELLER_TYPES,
} from './shared'

/**
 * Inquiry form (contact wizard, tour/destination sidebar cards, hero quick bar) — mirrors the API's InquiryBody:
 * name 2-120, email, whatsapp?, country? ≤80, partyType?, adults 1-50, children 0-50, travelStart/End 'YYYY-MM-DD',
 * travelWindow ≤120, flexibleDates, flexibility ≤120, durationPreference ≤60, pace ≤60, stayStyle ≤80,
 * interests ≤20 × ≤60, tourSlug?, destinationSlug?, message ≤5000, sourcePage ≤300, locale, honeypot, turnstileToken.
 */
export const inquirySchema = z
  .object({
    name: requiredText(120, 2, 'nameTooShort'),
    email: emailSchema,
    whatsapp: optionalIntlPhone(40),
    country: optionalText(80),
    partyType: z.enum(TRAVELLER_TYPES).optional(),
    adults: z.number({ error: 'required' }).int('integer').min(1, msg('min', 1)).max(50, msg('max', 50)),
    children: z.number({ error: 'required' }).int('integer').min(0, msg('min', 0)).max(50, msg('max', 50)),
    travelStart: optionalIsoDate,
    travelEnd: optionalIsoDate,
    travelWindow: optionalText(120),
    flexibleDates: z.boolean().optional(),
    flexibility: optionalText(120),
    durationPreference: optionalText(60),
    pace: optionalText(60),
    stayStyle: optionalText(80),
    interests: z.array(z.string().trim().min(1).max(60, msg('tooLong', 60))).max(20, msg('tooMany', 20)),
    tourSlug: optionalSlug,
    destinationSlug: optionalSlug,
    message: optionalText(5000),
    sourcePage: optionalText(300),
    locale: localeSchema,
    website: honeypot,
    turnstileToken: z.string().max(4096).optional(),
  })
  .refine((v) => !v.travelStart || !v.travelEnd || v.travelEnd >= v.travelStart, {
    message: 'dateOrder',
    path: ['travelEnd'],
  })

/** Values held by react-hook-form (inputs). */
export type InquiryFormValues = z.input<typeof inquirySchema>
/** Parsed values (outputs) — exactly the API body. */
export type InquiryPayload = z.output<typeof inquirySchema>

/** Default form values (pass prefill/locale over them). */
export const inquiryDefaults = (locale: InquiryFormValues['locale']): InquiryFormValues => ({
  name: '',
  email: '',
  whatsapp: '',
  country: '',
  adults: 2,
  children: 0,
  interests: [],
  message: '',
  locale,
  website: '',
})

/** Compile-time check that the parsed payload satisfies the API contract. */
export const toInquiryBody = (payload: InquiryPayload): InquiryBody => payload
