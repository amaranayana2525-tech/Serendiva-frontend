'use client'

import { useFormatter } from 'next-intl'
import { parseMonth } from '@/lib/admin/format'

/** Formatting helpers for review screens (English admin UI). */
export function useReviewFormat() {
  const format = useFormatter()
  return {
    /** '2026-03' → 'March 2026' ('' when empty/invalid). */
    travelMonth: (value: string | null | undefined): string => {
      const date = value ? parseMonth(value) : null
      return date ? format.dateTime(date, { month: 'long', year: 'numeric', timeZone: 'UTC' }) : ''
    },
    date: (value: string): string => format.dateTime(new Date(value), { dateStyle: 'medium' }),
  }
}
