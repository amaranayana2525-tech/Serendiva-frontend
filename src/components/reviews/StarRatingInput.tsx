'use client'

import { useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useFieldErrorText } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'

const VALUES = [1, 2, 3, 4, 5] as const
type RatingLabelKey = `${(typeof VALUES)[number]}`

export interface StarRatingInputProps {
  name: string
  value: number | undefined
  onChange: (value: number) => void
  onBlur?: () => void
  /** Validation key or API message. */
  error?: string
  required?: boolean
}

/**
 * Accessible 1–5 star rating: a native radio group inside a <fieldset> (Tab into the group, ←/→ or ↑/↓ to choose),
 * with each option labelled "4 stars — Wonderful". The stars are the visual layer only.
 */
export function StarRatingInput({ name, value, onChange, onBlur, error, required }: StarRatingInputProps) {
  const t = useTranslations('reviews.form.rating')
  const tc = useTranslations('common.form')
  const [hover, setHover] = useState<number | null>(null)
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const errorText = useFieldErrorText(error)
  const shown = hover ?? value ?? 0
  const current = value ? t(`labels.${String(value) as RatingLabelKey}`) : null

  return (
    <fieldset
      aria-describedby={[hintId, errorText ? errorId : null].filter(Boolean).join(' ')}
      aria-invalid={errorText ? true : undefined}
      className="flex flex-col gap-1"
    >
      <legend className="mb-1 flex items-center gap-1 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
        {t('legend')}
        {required && (
          <span aria-hidden="true" className="text-secondary">
            {tc('requiredMark')}
          </span>
        )}
      </legend>
      <div className="flex flex-wrap items-center gap-space-md">
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(null)}>
          {VALUES.map((n) => (
            <label key={n} className="relative cursor-pointer" onMouseEnter={() => setHover(n)}>
              <input
                type="radio"
                name={name}
                value={n}
                checked={value === n}
                onChange={() => onChange(n)}
                onBlur={onBlur}
                required={required}
                className="peer sr-only"
              />
              <span className="sr-only">
                {t('star', { count: n })} — {t(`labels.${String(n) as RatingLabelKey}`)}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full transition-colors',
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface',
                  n <= shown ? 'text-secondary' : 'text-outline-variant hover:text-secondary/60',
                )}
              >
                <Icon name="star" filled={n <= shown} className="text-[32px]" />
              </span>
            </label>
          ))}
        </div>
        <span aria-live="polite" className="font-label-lg text-label-lg text-primary">
          {current}
        </span>
      </div>
      <p id={hintId} className="font-caption text-caption text-on-surface-variant">
        {t('hint')}
      </p>
      {errorText && (
        <p id={errorId} className="flex items-center gap-1 font-caption text-caption text-error">
          <Icon name="error" className="text-sm" />
          {errorText}
        </p>
      )}
    </fieldset>
  )
}
