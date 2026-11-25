'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { clamp, cn } from '@/lib/utils'
import { controlClass, controlInvalidClass, FieldShell } from './FieldShell'

export interface NumberFieldProps {
  label: ReactNode
  /** null = empty. */
  value: number | null
  onChange: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  /** Allow decimals (latitude/longitude). Default false (integers). */
  decimal?: boolean
  /** Show −/+ stepper buttons (default true for integers). */
  stepper?: boolean
  hint?: ReactNode
  error?: string | null
  required?: boolean
  hideLabel?: boolean
  placeholder?: string
  /** Unit after the value ("days", "km"). */
  unit?: string
  disabled?: boolean
  id?: string
  className?: string
}

const toText = (v: number | null) => (v === null || Number.isNaN(v) ? '' : String(v))

/** Numeric input bound to `number | null` with optional −/+ steppers, min/max clamping on blur and decimals. */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  decimal = false,
  stepper,
  hint,
  error,
  required,
  hideLabel,
  placeholder,
  unit,
  disabled,
  id,
  className,
}: NumberFieldProps) {
  const t = useTranslations('admin.kit.form')
  const [draft, setDraft] = useState<{ text: string; for: number | null } | null>(null)
  // Show the user's in-progress text while it still corresponds to the current value.
  const text = draft && draft.for === value ? draft.text : toText(value)
  const showStepper = stepper ?? !decimal
  const bounded = (n: number) => clamp(n, min ?? -Infinity, max ?? Infinity)

  const commit = (raw: string) => {
    const trimmed = raw.trim().replace(',', '.')
    if (trimmed === '' || trimmed === '-') {
      onChange(null)
      setDraft({ text: raw, for: null })
      return
    }
    const parsed = decimal ? Number.parseFloat(trimmed) : Number.parseInt(trimmed, 10)
    if (Number.isNaN(parsed)) {
      setDraft({ text: raw, for: value })
      return
    }
    onChange(parsed)
    setDraft({ text: raw, for: parsed })
  }

  const stepBy = (dir: 1 | -1) => {
    const next = bounded((value ?? min ?? 0) + dir * step)
    const rounded = decimal ? Math.round(next * 1e6) / 1e6 : Math.round(next)
    onChange(rounded)
    setDraft(null)
  }

  return (
    <FieldShell label={label} hint={hint} error={error} required={required} hideLabel={hideLabel} id={id} className={className}>
      {({ id: controlId, describedBy, invalid }) => (
        <div className="flex items-stretch gap-1.5">
          {showStepper && (
            <button
              type="button"
              onClick={() => stepBy(-1)}
              disabled={disabled || (min !== undefined && value !== null && value <= min)}
              aria-label={t('decrease')}
              className="flex w-10 shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-primary hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
            >
              <Icon name="remove" className="text-[18px]" />
            </button>
          )}
          <div className="relative min-w-0 flex-1">
            <input
              id={controlId}
              type="text"
              inputMode={decimal ? 'decimal' : 'numeric'}
              value={text}
              placeholder={placeholder}
              disabled={disabled}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              aria-required={required || undefined}
              onChange={(e) => commit(e.target.value)}
              onBlur={() => {
                if (value !== null && (value !== bounded(value))) onChange(bounded(value))
                setDraft(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  stepBy(1)
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  stepBy(-1)
                }
              }}
              className={cn(controlClass, 'tabular-nums', showStepper && 'text-center', unit && 'pr-12', invalid && controlInvalidClass)}
            />
            {unit && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-caption text-caption text-on-surface-variant">
                {unit}
              </span>
            )}
          </div>
          {showStepper && (
            <button
              type="button"
              onClick={() => stepBy(1)}
              disabled={disabled || (max !== undefined && value !== null && value >= max)}
              aria-label={t('increase')}
              className="flex w-10 shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-primary hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
            >
              <Icon name="add" className="text-[18px]" />
            </button>
          )}
        </div>
      )}
    </FieldShell>
  )
}
