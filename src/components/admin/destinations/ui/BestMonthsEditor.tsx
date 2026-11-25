'use client'

import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { Icon } from '@/components/ui/Icon'
import type { MonthRating } from '@/lib/api/types'
import { cn } from '@/lib/utils'

export const MONTH_RATINGS = ['peak', 'good', 'rain'] as const satisfies readonly MonthRating[]

/** Same colours as the public "best time to visit" matrix (BestTimeMatrix). */
export const RATING_STYLE: Record<MonthRating, { cell: string; dot: string; icon: string }> = {
  peak: { cell: 'bg-secondary text-on-secondary', dot: 'bg-secondary', icon: 'sunny' },
  good: { cell: 'bg-tertiary-fixed-dim text-tertiary', dot: 'bg-tertiary-fixed-dim', icon: 'partly_cloudy_day' },
  rain: { cell: 'bg-surface-container-highest text-on-surface-variant', dot: 'bg-surface-container-highest', icon: 'rainy' },
}

const nextRating = (r: MonthRating): MonthRating => MONTH_RATINGS[(MONTH_RATINGS.indexOf(r) + 1) % MONTH_RATINGS.length]

/** Jan..Dec short + long English month names (admin UI is English). */
export function useMonthNames() {
  return useMemo(() => {
    const short = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' })
    const long = new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' })
    return Array.from({ length: 12 }, (_, m) => {
      const d = new Date(Date.UTC(2026, m, 15))
      return { short: short.format(d), long: long.format(d) }
    })
  }, [])
}

export interface BestMonthsEditorProps {
  /** 12 ratings (Jan..Dec) or [] when not set. */
  value: readonly MonthRating[]
  onChange: (value: MonthRating[]) => void
  error?: string | null
}

/**
 * Month-by-month climate editor: 12 cells cycling Peak → Good → Rain. Keyboard: arrow keys / Home / End move
 * between months (roving focus), Space or Enter cycles, P / G / R set a rating directly.
 */
export function BestMonthsEditor({ value, onChange, error }: BestMonthsEditorProps) {
  const t = useTranslations('adminContent.regions.months')
  const months = useMonthNames()
  const [focused, setFocused] = useState(0)
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const isSet = value.length === 12

  const setAt = (index: number, rating: MonthRating) => onChange(value.map((r, i) => (i === index ? rating : r)))
  const focusAt = (index: number) => {
    setFocused(index)
    refs.current[index]?.focus()
  }
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const key = e.key.toLowerCase()
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      focusAt((index + 1) % 12)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      focusAt((index + 11) % 12)
    } else if (e.key === 'Home') {
      e.preventDefault()
      focusAt(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      focusAt(11)
    } else if (key === 'p' || key === 'g' || key === 'r') {
      e.preventDefault()
      setAt(index, key === 'p' ? 'peak' : key === 'g' ? 'good' : 'rain')
    }
  }

  return (
    <fieldset className="flex min-w-0 flex-col gap-2.5" aria-describedby="best-months-help">
      <legend className="mb-1 flex w-full flex-wrap items-center justify-between gap-2 font-body-md text-[13px] font-semibold text-on-surface">
        {t('label')}
      </legend>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label={t('legend')}>
          {MONTH_RATINGS.map((r) => (
            <li key={r} className="flex items-center gap-1.5 font-caption text-caption text-on-surface-variant">
              <span className={cn('h-3 w-3 rounded-sm', RATING_STYLE[r].dot)} aria-hidden="true" />
              {t(`ratings.${r}`)}
            </li>
          ))}
        </ul>
        {isSet ? (
          <Button size="sm" variant="ghost" icon="restart_alt" onClick={() => onChange([])}>
            {t('clear')}
          </Button>
        ) : null}
      </div>

      {isSet ? (
        <div role="group" aria-label={t('label')} className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
          {value.map((rating, index) => {
            const style = RATING_STYLE[rating]
            return (
              <button
                key={index}
                ref={(el) => {
                  refs.current[index] = el
                }}
                type="button"
                tabIndex={index === focused ? 0 : -1}
                onFocus={() => setFocused(index)}
                onClick={() => setAt(index, nextRating(rating))}
                onKeyDown={(e) => onKeyDown(e, index)}
                aria-label={t('cellLabel', { month: months[index].long, rating: t(`ratings.${rating}`) })}
                title={`${months[index].long}: ${t(`ratings.${rating}`)}`}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-0.5 rounded-lg font-body-md text-[12px] font-semibold transition-[filter,transform] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95',
                  style.cell,
                )}
              >
                <span>{months[index].short}</span>
                <Icon name={style.icon} className="text-[16px]" />
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-outline-variant px-4 py-4">
          <p className="font-body-md text-body-md text-on-surface-variant">{t('notSet')}</p>
          <Button size="sm" icon="calendar_month" onClick={() => onChange(Array.from({ length: 12 }, () => 'good'))}>
            {t('setUp')}
          </Button>
        </div>
      )}
      <p id="best-months-help" className="font-caption text-caption text-on-surface-variant">
        {t('help')}
      </p>
      {error && (
        <p className="flex items-start gap-1 font-caption text-caption text-error">
          <Icon name="error" className="mt-px text-[14px]" />
          {error}
        </p>
      )}
    </fieldset>
  )
}

/** Read-only 12-cell strip for list rows. */
export function BestMonthsStrip({ value, className }: { value: readonly string[]; className?: string }) {
  const t = useTranslations('adminContent.regions.months')
  const months = useMonthNames()
  if (value.length !== 12) return <span className={cn('font-caption text-caption text-outline', className)}>{t('notSetShort')}</span>
  const summary = value
    .map((r, i) => `${months[i].short}: ${MONTH_RATINGS.includes(r as MonthRating) ? t(`ratings.${r as MonthRating}`) : r}`)
    .join(', ')
  return (
    <span className={cn('inline-flex w-max flex-col gap-0.5', className)}>
      <span className="sr-only">{summary}</span>
      <span className="flex gap-0.5" aria-hidden="true">
        {value.map((r, i) => (
          <span
            key={i}
            title={`${months[i].short}: ${r}`}
            className={cn('h-4 w-3 rounded-[3px]', RATING_STYLE[r as MonthRating]?.dot ?? 'bg-surface-container')}
          />
        ))}
      </span>
      <span className="flex justify-between font-caption text-[10px] leading-3 text-outline" aria-hidden="true">
        <span>{months[0].short[0]}</span>
        <span>{months[11].short[0]}</span>
      </span>
    </span>
  )
}
