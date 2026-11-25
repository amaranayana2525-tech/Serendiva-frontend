'use client'

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import { Button, IconButton } from '@/components/admin/kit/Button'
import { Icon } from '@/components/ui/Icon'
import type { AdminAvailabilityRange } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { addDays, addMonths, dateOf, monthGrid, monthOf } from './api'

export interface RangeCalendarProps {
  ranges: readonly AdminAvailabilityRange[]
  /** Today (YYYY-MM-DD, local). */
  today: string
  /** A day was activated: the ranges covering it (empty = free day). */
  onDayActivate: (day: string, covering: AdminAvailabilityRange[]) => void
  /** Highlight one range (hovered/selected in the list). */
  highlightId?: string | null
}

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] // Mon..Sun (2024-01-01 was a Monday)

/**
 * Admin availability calendar: two months side by side on desktop (one on phones), busy / available ranges as
 * coloured bands, today ringed. Keyboard: arrows move by day/week, Home/End to week start/end, PageUp/PageDown by month,
 * Enter/Space opens the day (edit its range or add a new one).
 */
export function RangeCalendar({ ranges, today, onDayActivate, highlightId }: RangeCalendarProps) {
  const t = useTranslations('adminContent.availability.calendar')
  const format = useFormatter()
  const [start, setStart] = useState(() => monthOf(today))
  const [focusDay, setFocusDay] = useState(today)
  const keyboardMove = useRef(false)
  const gridRef = useRef<HTMLDivElement>(null)

  const coverage = useMemo(() => {
    const map = new Map<string, AdminAvailabilityRange[]>()
    for (const r of ranges) {
      for (let d = r.startDate, guard = 0; d <= r.endDate && guard < 800; d = addDays(d, 1), guard++) {
        const list = map.get(d)
        if (list) list.push(r)
        else map.set(d, [r])
      }
    }
    return map
  }, [ranges])

  useEffect(() => {
    if (!keyboardMove.current) return
    keyboardMove.current = false
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focusDay}"]`)?.focus()
  }, [focusDay, start])

  const moveFocus = (day: string) => {
    keyboardMove.current = true
    const m = monthOf(day)
    // Visible: start (+1 on desktop). Keep the focused day inside the first visible month on phones.
    const wide = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
    if (m < start) setStart(m)
    else if (m > start + (wide ? 1 : 0)) setStart(wide ? m - 1 : m)
    setFocusDay(day)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, day: string) => {
    const weekday = (dateOf(day).getUTCDay() + 6) % 7
    let next: string | null = null
    if (e.key === 'ArrowRight') next = addDays(day, 1)
    else if (e.key === 'ArrowLeft') next = addDays(day, -1)
    else if (e.key === 'ArrowDown') next = addDays(day, 7)
    else if (e.key === 'ArrowUp') next = addDays(day, -7)
    else if (e.key === 'Home') next = addDays(day, -weekday)
    else if (e.key === 'End') next = addDays(day, 6 - weekday)
    else if (e.key === 'PageDown') next = addMonths(day, 1)
    else if (e.key === 'PageUp') next = addMonths(day, -1)
    if (!next) return
    e.preventDefault()
    moveFocus(next)
  }

  const monthLabel = (index: number) =>
    format.dateTime(new Date(Date.UTC(Math.floor(index / 12), index % 12, 15)), { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const weekdayLabel = (n: number, style: 'short' | 'long') =>
    format.dateTime(new Date(Date.UTC(2024, 0, n, 12)), { weekday: style, timeZone: 'UTC' })
  const dayLabel = (day: string) =>
    format.dateTime(dateOf(day), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

  const shift = (delta: number) => {
    setStart((s) => s + delta)
    setFocusDay((day) => addMonths(day, delta))
  }

  const months = [start, start + 1]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <IconButton icon="chevron_left" variant="secondary" label={t('previous')} onClick={() => shift(-1)} />
          <IconButton icon="chevron_right" variant="secondary" label={t('next')} onClick={() => shift(1)} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStart(monthOf(today))
              setFocusDay(today)
            }}
          >
            {t('today')}
          </Button>
        </div>
        <p className="font-body-md text-body-md font-semibold text-primary" aria-live="polite">
          <span className="sr-only lg:hidden">{monthLabel(start)}</span>
          <span className="hidden lg:inline">
            {monthLabel(start)} – {monthLabel(start + 1)}
          </span>
        </p>
      </div>

      <div ref={gridRef} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {months.map((month, mi) => (
          <div key={month} className={cn(mi === 1 && 'hidden lg:block')}>
            <table className="w-full table-fixed border-separate border-spacing-y-1" aria-label={monthLabel(month)}>
              <caption className="mb-1 text-left font-headline-sm text-[18px] text-primary">{monthLabel(month)}</caption>
              <thead>
                <tr>
                  {WEEKDAYS.map((n) => (
                    <th
                      key={n}
                      scope="col"
                      abbr={weekdayLabel(n, 'long')}
                      className="pb-1 text-center font-body-md text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant"
                    >
                      {weekdayLabel(n, 'short')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthGrid(month).map((week, wi) => (
                  <tr key={wi}>
                    {week.map((day, di) => {
                      if (!day) return <td key={di} />
                      const covering = coverage.get(day) ?? []
                      const busy = covering.find((r) => r.type === 'busy')
                      const available = covering.find((r) => r.type === 'available')
                      const main = busy ?? available
                      const conflict = Boolean(busy && available)
                      const past = day < today
                      const isStart = main ? main.startDate === day || di === 0 : false
                      const isEnd = main ? main.endDate === day || di === 6 : false
                      const highlighted = highlightId ? covering.some((r) => r.id === highlightId) : false
                      const label = [
                        dayLabel(day),
                        day === today ? t('todayLabel') : null,
                        covering.length
                          ? covering.map((r) => `${t(`types.${r.type}`)}${r.note ? ` (${r.note})` : ''}`).join(', ')
                          : t('free'),
                        covering.length ? t('pressToEdit') : t('pressToAdd'),
                      ]
                        .filter(Boolean)
                        .join('. ')
                      return (
                        <td key={di} className="p-0">
                          <button
                            type="button"
                            data-day={day}
                            tabIndex={day === focusDay ? 0 : -1}
                            aria-label={label}
                            onFocus={() => setFocusDay(day)}
                            onClick={() => onDayActivate(day, covering)}
                            onKeyDown={(e) => onKeyDown(e, day)}
                            className={cn(
                              'relative flex h-10 w-full items-center justify-center font-body-md text-[13px] tabular-nums transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-11',
                              main
                                ? cn(
                                    busy
                                      ? 'bg-secondary-fixed font-semibold text-on-secondary-fixed-variant hover:bg-secondary-fixed-dim'
                                      : 'bg-tertiary-fixed font-semibold text-on-tertiary-fixed hover:bg-tertiary-fixed-dim',
                                    isStart && 'rounded-l-lg',
                                    isEnd && 'rounded-r-lg',
                                  )
                                : 'rounded-lg text-on-surface hover:bg-surface-container',
                              past && 'opacity-45',
                              highlighted && 'ring-2 ring-inset ring-primary',
                            )}
                          >
                            <span
                              className={cn(
                                'flex h-7 w-7 items-center justify-center rounded-full',
                                day === today && 'bg-primary font-semibold text-on-primary',
                              )}
                            >
                              {Number(day.slice(8))}
                            </span>
                            {conflict && (
                              <span aria-hidden="true" className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-tertiary" />
                            )}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-surface-container pt-3" aria-label={t('legend')}>
        <li className="flex items-center gap-1.5 font-caption text-caption text-on-surface-variant">
          <span className="h-3.5 w-5 rounded bg-secondary-fixed" aria-hidden="true" />
          {t('types.busy')}
        </li>
        <li className="flex items-center gap-1.5 font-caption text-caption text-on-surface-variant">
          <span className="h-3.5 w-5 rounded bg-tertiary-fixed" aria-hidden="true" />
          {t('types.available')}
        </li>
        <li className="flex items-center gap-1.5 font-caption text-caption text-on-surface-variant">
          <span className="h-3.5 w-5 rounded border border-outline-variant" aria-hidden="true" />
          {t('free')}
        </li>
        <li className="flex items-center gap-1.5 font-caption text-caption text-on-surface-variant">
          <span className="h-1.5 w-1.5 rounded-full bg-tertiary" aria-hidden="true" />
          {t('overlap')}
        </li>
        <li className="hidden items-center gap-1.5 font-caption text-caption text-on-surface-variant md:flex">
          <Icon name="keyboard" className="text-[16px]" />
          {t('keyboardHint')}
        </li>
      </ul>
    </div>
  )
}
