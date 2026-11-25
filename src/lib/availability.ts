import type { AvailabilityCalendar } from '@/lib/api/types'

/** Status of one calendar day for <AvailabilityCalendar>. */
export type DayStatus = 'available' | 'busy' | 'onRequest' | 'past'

const pad = (n: number) => String(n).padStart(2, '0')

/** (2026, 9, 5) → '2026-10-05' (month is 0-based). */
export const isoDay = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

/** 'YYYY-MM[-DD]' → absolute month index (year * 12 + month). */
export const monthIndex = (iso: string) => {
  const [y, m] = iso.split('-').map(Number)
  return (y ?? 1970) * 12 + ((m ?? 1) - 1)
}

/** Busy wins over available; dates before `today` are past; anything not covered is "on request". */
export function dayStatus(day: string, today: string, ranges: AvailabilityCalendar['ranges']): DayStatus {
  if (day < today) return 'past'
  if (ranges.some((r) => r.type === 'busy' && r.startDate <= day && day <= r.endDate)) return 'busy'
  if (ranges.some((r) => r.type === 'available' && r.startDate <= day && day <= r.endDate)) return 'available'
  return 'onRequest'
}

/** Next [start, end] selection after clicking `clicked` on a range-picker calendar. */
export function nextDateRange(currentStart: string, currentEnd: string, clicked: string): { start: string; end: string } {
  if (!currentStart || (currentStart && currentEnd) || clicked < currentStart) {
    return { start: clicked, end: '' }
  }
  return { start: currentStart, end: clicked }
}

/** True when `day` falls strictly between `start` and `end` (when both are set). */
export function isBetweenDates(day: string, start: string, end: string): boolean {
  return Boolean(start && end && day > start && day < end)
}
