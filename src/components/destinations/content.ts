import type { DestinationDetail } from '@/lib/api/types'

/** Splits API markdown into paragraphs (blank-line separated). */
export function paragraphs(markdown: string | null | undefined): string[] {
  return (markdown ?? '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
}

/** Strips the inline markdown the CMS allows (emphasis, links, code, headings) → plain text for heroes/meta. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/(\*\*|__|\*|_|`)(.+?)\1/g, '$2')
    .replace(/^\s*[-*+>]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Hero copy + remaining description of a destination: the first description paragraph is the hero tagline
 * (as in Stitch), the rest introduces the signature experiences. Falls back to the summary.
 */
export function splitDescription(destination: Pick<DestinationDetail, 'description' | 'summary'>): {
  lead: string
  rest: string[]
} {
  const parts = paragraphs(destination.description)
  const [first, ...rest] = parts
  return { lead: first ? plainText(first) : destination.summary, rest: first ? rest : [] }
}

/** "Moderate • 1.5 Hours • 05:40 AM Departure" → ["Moderate • 1.5 Hours", "05:40 AM Departure"] (Stitch meta row). */
export function splitExperienceMeta(meta: string | null | undefined): string[] {
  if (!meta) return []
  const parts = meta
    .split(/\s*[•·|]\s*/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length <= 2) return [parts.join(' • ')]
  return [parts.slice(0, 2).join(' • '), parts.slice(2).join(' • ')]
}

export interface MonthOption {
  /** 'YYYY-MM' */
  value: string
  /** "Nov 2026" (select option) */
  label: string
  /** "November 2026" (sent to the API as the travel window) */
  long: string
}

/**
 * The next `count` months starting with the current one, formatted in the UI locale. Computed on the server and
 * passed to the client form so the server HTML and hydration agree.
 */
export function upcomingMonths(locale: string, count = 12, now: Date = new Date()): MonthOption[] {
  const short = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' })
  const long = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1, 12))
    const value = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
    return { value, label: short.format(date), long: long.format(date) }
  })
}
