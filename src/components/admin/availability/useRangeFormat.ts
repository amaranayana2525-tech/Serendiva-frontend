'use client'

import { useFormatter } from 'next-intl'
import { dateOf } from './api'

/** Date formatting for availability ranges (calendar dates are UTC-noon based — no timezone drift). */
export function useRangeFormat() {
  const format = useFormatter()
  return {
    /** '2026-10-09', '2026-10-20' → 'Oct 9 – 20, 2026'. */
    range: (start: string, end: string) =>
      start === end
        ? format.dateTime(dateOf(start), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
        : format.dateTimeRange(dateOf(start), dateOf(end), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
    weekday: (iso: string) => format.dateTime(dateOf(iso), { weekday: 'short', timeZone: 'UTC' }),
  }
}
