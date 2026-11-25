/** Locale-aware formatting helpers (pure; usable on server and client). */

const displayNamesCache = new Map<string, Intl.DisplayNames>()

/** "GB" → "United Kingdom" (in the given UI locale). Unknown codes are returned unchanged. */
export function countryName(iso: string | null | undefined, locale: string): string {
  if (!iso) return ''
  const code = iso.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return iso
  try {
    let names = displayNamesCache.get(locale)
    if (!names) {
      names = new Intl.DisplayNames([locale], { type: 'region' })
      displayNamesCache.set(locale, names)
    }
    return names.of(code) ?? code
  } catch {
    return code
  }
}

/** "SE" → "🇸🇪" (regional indicator symbols). Returns '' for invalid codes. */
export function flagEmoji(iso: string | null | undefined): string {
  const code = (iso ?? '').trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return ''
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

/** Parses 'YYYY-MM', 'YYYY-MM-DD', ISO strings or Dates. Day-less values are pinned to the 1st (UTC noon, no TZ drift). */
export function toDate(value: string | Date): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const ym = /^(\d{4})-(\d{2})$/.exec(value)
  if (ym) return new Date(Date.UTC(Number(ym[1]), Number(ym[2]) - 1, 1, 12))
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (ymd) return new Date(Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]), 12))
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "2024-02" → "February 2024" (or "Feb 2024" with `month: 'short'`). */
export function formatMonth(
  value: string | Date | null | undefined,
  locale: string,
  month: 'long' | 'short' = 'long',
): string {
  if (!value) return ''
  const date = toDate(value)
  if (!date) return typeof value === 'string' ? value : ''
  return new Intl.DateTimeFormat(locale, { month, year: 'numeric', timeZone: 'UTC' }).format(date)
}

/** "2026-03-14" → "14 March 2026" (style configurable). */
export function formatDate(
  value: string | Date | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
): string {
  if (!value) return ''
  const date = toDate(value)
  if (!date) return typeof value === 'string' ? value : ''
  return new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...options }).format(date)
}

/** Translator for the ICU message `common.cards.duration` (pass `t` from useTranslations/getTranslations('common')). */
export type DurationTranslator = (key: 'cards.duration', values: { nights: number; days: number }) => string

/** "8 Nights / 9 Days" via the `common.cards.duration` ICU message. */
export function durationLabel(nights: number, days: number, t: DurationTranslator): string {
  return t('cards.duration', { nights, days })
}

/** Month keys used by `common.season.months.*` (index 0 = January). */
export const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const
export type MonthKey = (typeof MONTH_KEYS)[number]

/** Formats a number with locale grouping ("2400" → "2,400"). */
export function formatNumber(value: number, locale: string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(value)
}
