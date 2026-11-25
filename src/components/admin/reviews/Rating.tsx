'use client'

import { useRef, type KeyboardEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

/** Read-only 1–5 stars with an accessible "4 out of 5" label. */
export function RatingStars({ value, size = 'sm', className }: { value: number; size?: 'sm' | 'md'; className?: string }) {
  const t = useTranslations('adminContent.reviews')
  return (
    <span className={cn('inline-flex items-center', className)} role="img" aria-label={t('ratingLabel', { rating: value })}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          filled={n <= value}
          className={cn(size === 'sm' ? 'text-[16px]' : 'text-[20px]', n <= value ? 'text-secondary' : 'text-outline-variant')}
        />
      ))}
    </span>
  )
}

export interface RatingInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  error?: string | null
  required?: boolean
}

/** 1–5 star picker (radio group: click a star, or arrow keys / 1–5 on the keyboard). */
export function RatingInput({ label, value, onChange, error, required }: RatingInputProps) {
  const t = useTranslations('adminContent.reviews')
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const select = (n: number) => {
    const next = Math.min(5, Math.max(1, n))
    onChange(next)
    refs.current[next - 1]?.focus()
  }
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      select(value + 1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      select(value - 1)
    } else if (/^[1-5]$/.test(e.key)) {
      e.preventDefault()
      select(Number(e.key))
    }
  }
  return (
    <div className="flex flex-col gap-1.5">
      <span id="rating-label" className="font-body-md text-[13px] font-semibold text-on-surface">
        {label}
        {required && (
          <span className="ml-0.5 text-secondary" aria-hidden="true">
            *
          </span>
        )}
      </span>
      <div role="radiogroup" aria-labelledby="rating-label" className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            ref={(el) => {
              refs.current[n - 1] = el
            }}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={t('stars', { count: n })}
            tabIndex={value === n || (value < 1 && n === 1) ? 0 : -1}
            onClick={() => select(n)}
            onKeyDown={onKeyDown}
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Icon name="star" filled={n <= value} className={cn('text-[28px]', n <= value ? 'text-secondary' : 'text-outline-variant')} />
          </button>
        ))}
        <span className="ml-2 font-body-md text-body-md tabular-nums text-on-surface-variant">{value ? `${value} / 5` : ''}</span>
      </div>
      {error && (
        <p className="flex items-start gap-1 font-caption text-caption text-error">
          <Icon name="error" className="mt-px text-[14px]" />
          {error}
        </p>
      )}
    </div>
  )
}
