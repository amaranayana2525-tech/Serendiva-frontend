/** Formatting helpers for admin screens (pure functions; pass the formatter/translator from the component). */

/** 12345 → "12.1 KB". */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) return ''
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value >= 10 ? Math.round(value) : Math.round(value * 10) / 10} ${units[unit]}`
}

/** "2027-01-12" → Date at UTC noon (no TZ drift for calendar dates). */
export function parseCalendarDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return null
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12))
}

/** "2026-10" → Date (1st of the month, UTC noon). */
export function parseMonth(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})$/.exec(value)
  if (!m) return null
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1, 12))
}

/** Today as YYYY-MM-DD (local time). */
export function todayIso(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Strips everything but digits from a phone number ("+44 7700 900123" → "447700900123"). */
export const phoneDigits = (value: string | null | undefined): string => (value ?? '').replace(/\D/g, '')

/** First name for greetings ("Emma Thompson" → "Emma"). */
export function firstName(name: string | null | undefined): string {
  return (name ?? '').trim().split(/\s+/)[0] ?? ''
}
