'use client'

import { useFormatter, useNow, useTranslations } from 'next-intl'
import { parseCalendarDate } from '@/lib/admin/format'

/** Formatting helpers shared by the inquiry/proposal lists, drawers and the dashboard. */
export function useLeadFormat() {
  const format = useFormatter()
  const t = useTranslations('admin.leads')
  // Re-render relative times once a minute.
  const now = useNow({ updateInterval: 60_000 })

  const toDate = (iso: string | null | undefined) => {
    if (!iso) return null
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? null : d
  }

  return {
    /** "5 Oct 2026" */
    date(iso: string | null | undefined): string {
      const d = toDate(iso)
      return d ? format.dateTime(d, { day: 'numeric', month: 'short', year: 'numeric' }) : ''
    },
    /** "5 Oct 2026, 15:09" */
    dateTime(iso: string | null | undefined): string {
      const d = toDate(iso)
      return d ? format.dateTime(d, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
    },
    /** "15:09" */
    time(iso: string | null | undefined): string {
      const d = toDate(iso)
      return d ? format.dateTime(d, { hour: '2-digit', minute: '2-digit' }) : ''
    },
    /** "3 hours ago" */
    relative(iso: string | null | undefined): string {
      const d = toDate(iso)
      return d ? format.relativeTime(d, now) : ''
    },
    /** "12 Jan 2027" for a YYYY-MM-DD calendar date (UTC noon, no TZ shift). */
    calendarDate(isoDay: string | null | undefined): string {
      const d = parseCalendarDate(isoDay)
      return d ? format.dateTime(d, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : ''
    },
    /** "12 Jan – 24 Jan 2027" for two YYYY-MM-DD calendar dates. */
    calendarRange(startDay: string | null | undefined, endDay: string | null | undefined): string {
      const start = parseCalendarDate(startDay)
      const end = parseCalendarDate(endDay)
      const opts = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' } as const
      if (start && end) return format.dateTimeRange(start, end, opts)
      if (start) return t('fromDate', { date: format.dateTime(start, opts) })
      return ''
    },
    /** "12 Jan – 24 Jan 2027", the free travel window, or '' */
    travel(lead: { travelStart: string | null; travelEnd: string | null; travelWindow: string | null }): string {
      const start = parseCalendarDate(lead.travelStart)
      const end = parseCalendarDate(lead.travelEnd)
      const opts = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' } as const
      if (start && end) return format.dateTimeRange(start, end, opts)
      if (start) return t('fromDate', { date: format.dateTime(start, opts) })
      return lead.travelWindow ?? ''
    },
    /** "2 adults · 1 child" */
    guests(adults: number, children: number): string {
      const a = t('adults', { count: adults })
      return children > 0 ? `${a} · ${t('children', { count: children })}` : a
    },
    /** 'de' → "German" */
    language(locale: string): string {
      if (locale === 'en' || locale === 'zh' || locale === 'de') return t(`languages.${locale}`)
      return locale
    },
  }
}
