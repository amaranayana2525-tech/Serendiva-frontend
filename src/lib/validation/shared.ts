import { z } from 'zod'
import { msg } from './messages'

/** Locales accepted by the API. */
export const LOCALE_VALUES = ['en', 'zh', 'de'] as const
export const localeSchema = z.enum(LOCALE_VALUES)

export const TRAVELLER_TYPES = ['couple', 'family', 'group', 'solo', 'corporate'] as const

/** Required trimmed text: 'required' when empty, `minMessage` (default 'tooShort:min') when shorter than min, 'tooLong:max'. */
export const requiredText = (max: number, min = 1, minMessage?: string) =>
  z
    .string({ error: 'required' })
    .trim()
    .min(1, 'required')
    .min(min, minMessage ?? msg('tooShort', min))
    .max(max, msg('tooLong', max))

/** Optional trimmed text; empty strings become `undefined` so they are not sent to the API. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, msg('tooLong', max))
    .optional()
    .transform((v) => (v ? v : undefined))

/** Email (trimmed, ≤ 200). */
export const emailSchema = z
  .string({ error: 'required' })
  .trim()
  .min(1, 'required')
  .max(200, msg('tooLong', 200))
  .pipe(z.email('email'))

/** Optional international phone / WhatsApp number. */
const hasEnoughDigits = (v: string) => v.replace(/\D/g, '').length >= 5

export const optionalPhone = (max = 40) =>
  z
    .string()
    .trim()
    .max(max, msg('tooLong', max))
    .refine((v) => v === '' || (/^\+?[\d\s().-]{5,}$/.test(v) && hasEnoughDigits(v)), 'phone')
    .optional()
    .transform((v) => (v ? v : undefined))

const HAS_COUNTRY_CODE = /^\s*(\+|00)/
/** "0044 …" → "+44 …" (the guide's WhatsApp needs the international form). */
const toInternational = (v: string) => (v.startsWith('00') ? `+${v.slice(2).trimStart()}` : v)

/**
 * WhatsApp number for forms without a calling-code select (tour / destination cards): must start with the
 * country code (+ or 00) — a local number can't be answered on WhatsApp. Empty → undefined.
 */
export const optionalIntlPhone = (max = 40) =>
  z
    .string()
    .trim()
    .max(max, msg('tooLong', max))
    .refine((v) => v === '' || (/^\+?[\d\s().-]{5,}$/.test(v.replace(/^00/, '+')) && hasEnoughDigits(v)), 'phone')
    .refine((v) => v === '' || HAS_COUNTRY_CODE.test(v), 'phoneCountryCode')
    .optional()
    .transform((v) => (v ? toInternational(v) : undefined))

/** Required variant of optionalIntlPhone. */
export const requiredIntlPhone = (min = 5, max = 40) =>
  z
    .string({ error: 'required' })
    .trim()
    .min(1, 'required')
    .min(min, 'phone')
    .max(max, msg('tooLong', max))
    .regex(/^(\+|00)?[\d\s().-]+$/, 'phone')
    .refine(hasEnoughDigits, 'phone')
    .refine((v) => HAS_COUNTRY_CODE.test(v), 'phoneCountryCode')
    .transform(toInternational)

/** Required phone. */
export const requiredPhone = (min = 5, max = 40) =>
  z
    .string({ error: 'required' })
    .trim()
    .min(1, 'required')
    .min(min, 'phone')
    .max(max, msg('tooLong', max))
    .regex(/^\+?[\d\s().-]+$/, 'phone')
    .refine(hasEnoughDigits, 'phone')

/** Optional ISO date 'YYYY-MM-DD'. */
export const optionalIsoDate = z
  .string()
  .trim()
  .refine((v) => v === '' || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))), 'date')
  .optional()
  .transform((v) => (v ? v : undefined))

/** Optional slug (lowercase-kebab-case). */
export const optionalSlug = z
  .string()
  .trim()
  .max(100, msg('tooLong', 100))
  .refine((v) => v === '' || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), 'invalid')
  .optional()
  .transform((v) => (v ? v : undefined))

/** Honeypot: accepted as-is (the API silently drops submissions where it is filled). */
export const honeypot = z.string().max(500).optional()
