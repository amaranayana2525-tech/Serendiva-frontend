import { ISO_COUNTRIES } from './countries'

/**
 * WhatsApp number helpers for the inquiry forms. The guide replies on WhatsApp, so a number saved with the wrong
 * country code is a lost lead: these pick a sensible default code, read it from the visitor's country, and turn
 * whatever was typed into an international number.
 */

/** Regions with their own entry in the wizard's calling-code select (wizard-config CALLING_CODES). */
export const REGION_CALLING_CODES: Readonly<Record<string, string>> = {
  GB: '+44',
  US: '+1',
  CA: '+1',
  AU: '+61',
  NZ: '+64',
  DE: '+49',
  AT: '+43',
  CH: '+41',
  FR: '+33',
  BE: '+32',
  NL: '+31',
  IT: '+39',
  ES: '+34',
  SE: '+46',
  NO: '+47',
  DK: '+45',
  PL: '+48',
  RU: '+7',
  CN: '+86',
  HK: '+852',
  JP: '+81',
  KR: '+82',
  SG: '+65',
  MY: '+60',
  IN: '+91',
  AE: '+971',
  SA: '+966',
  QA: '+974',
  ZA: '+27',
  LK: '+94',
}

/** Free-text country names visitors commonly type that Intl.DisplayNames would not match. */
const COUNTRY_ALIASES: Readonly<Record<string, string>> = {
  uk: 'GB',
  england: 'GB',
  scotland: 'GB',
  wales: 'GB',
  'great britain': 'GB',
  britain: 'GB',
  'northern ireland': 'GB',
  usa: 'US',
  'u.s.': 'US',
  'u.s.a.': 'US',
  america: 'US',
  'united states of america': 'US',
  uae: 'AE',
  emirates: 'AE',
  dubai: 'AE',
  holland: 'NL',
  'the netherlands': 'NL',
  deutschland: 'DE',
  schweiz: 'CH',
  suisse: 'CH',
  'sri lanka': 'LK',
  ceylon: 'LK',
  china: 'CN',
  中国: 'CN',
}

/** Calling code for a region: its own select entry, or 'other' (the visitor types the full +number). */
export function callingCodeForRegion(region: string | null | undefined): string | null {
  if (!region) return null
  return REGION_CALLING_CODES[region.toUpperCase()] ?? 'other'
}

/** First region found in the browser languages ("en-AU" → "AU"); null when none carries one. */
export function regionFromLanguages(languages: readonly string[]): string | null {
  for (const tag of languages) {
    try {
      const region = new Intl.Locale(tag).maximize().region
      // maximize() guesses a region for bare "en" (US) / "de" (DE): only trust explicit regions.
      if (region && new Intl.Locale(tag).region) return region
    } catch {
      // ignore malformed tags
    }
  }
  return null
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

/** Region of a typed country name ("Australia", "UK", "Deutschland") — null when unknown. */
export function regionFromCountryName(name: string, locales: readonly string[] = ['en']): string | null {
  const n = norm(name)
  if (n.length < 2) return null
  if (COUNTRY_ALIASES[n]) return COUNTRY_ALIASES[n]!
  for (const locale of locales) {
    let names: Intl.DisplayNames
    try {
      names = new Intl.DisplayNames([locale], { type: 'region' })
    } catch {
      continue
    }
    for (const region of ISO_COUNTRIES) {
      if (norm(names.of(region) ?? '') === n) return region
    }
  }
  return null
}

/** "0044 7700…" → "+44 7700…"; anything else unchanged (trimmed). */
export function normalizeInternational(raw: string): string {
  const n = raw.trim()
  return n.startsWith('00') ? `+${n.slice(2).trimStart()}` : n
}

/**
 * Selected code + typed number → international number.
 *  - "+44 7700 900123" / "0044 7700 900123" typed in full → kept (as +…)
 *  - code "other" → as typed
 *  - "447700900123" with +44 selected (code typed again, without +) → "+447700900123", not "+44 447700…"
 *  - "07700 900123" with +44 → "+44 7700 900123" (trunk 0 dropped)
 */
export function combineWhatsApp(code: string, number: string): string {
  const n = normalizeInternational(number)
  if (!n) return ''
  if (code === 'other' || n.startsWith('+')) return n
  const codeDigits = code.replace(/\D/g, '')
  const digits = n.replace(/\D/g, '')
  if (codeDigits && digits.startsWith(codeDigits) && digits.length >= codeDigits.length + 8) return `+${n.replace(/^\D+/, '')}`
  return `${code} ${n.replace(/^0+/, '')}`
}

/** True when the number carries its country code ("+…" or "00…"). */
export const hasCountryCode = (raw: string) => /^\s*(\+|00)/.test(raw)

/** True when a raw phone/WhatsApp input has only valid phone characters and at least 5 digits. */
export function isValidPhoneInput(raw: string): boolean {
  return /^\+?[\d\s().-]+$/.test(raw) && raw.replace(/\D/g, '').length >= 5
}
