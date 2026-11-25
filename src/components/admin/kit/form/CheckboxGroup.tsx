'use client'

import { useId, type ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

export interface CheckboxOption<V extends string = string> {
  value: V
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}

export interface CheckboxGroupProps<V extends string = string> {
  legend: ReactNode
  options: readonly CheckboxOption<V>[]
  value: readonly V[]
  onChange: (value: V[]) => void
  hint?: ReactNode
  error?: string | null
  required?: boolean
  /** Grid columns on ≥ sm (default 2). */
  columns?: 1 | 2 | 3 | 4
  hideLegend?: boolean
  className?: string
}

const cols = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' } as const

/** Fieldset of checkboxes bound to a string array (traveller types, seasons, categories…). Keeps option order. */
export function CheckboxGroup<V extends string = string>({
  legend,
  options,
  value,
  onChange,
  hint,
  error,
  required,
  columns = 2,
  hideLegend,
  className,
}: CheckboxGroupProps<V>) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const toggle = (v: V, checked: boolean) => {
    const set = new Set(value)
    if (checked) set.add(v)
    else set.delete(v)
    onChange(options.map((o) => o.value).filter((o) => set.has(o)))
  }
  return (
    <fieldset
      className={cn('flex min-w-0 flex-col gap-2', className)}
      aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className={cn('mb-1.5 font-body-md text-[13px] font-semibold text-on-surface', hideLegend && 'sr-only')}>
        {legend}
        {required && (
          <span className="ml-0.5 text-secondary" aria-hidden="true">
            *
          </span>
        )}
      </legend>
      <div className={cn('grid grid-cols-1 gap-x-4 gap-y-2', cols[columns])}>
        {options.map((option) => {
          const inputId = `${id}-${option.value}`
          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className={cn(
                'flex cursor-pointer items-start gap-2.5 rounded-lg px-1 py-0.5 font-body-md text-body-md text-on-surface',
                option.disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                id={inputId}
                type="checkbox"
                checked={value.includes(option.value)}
                disabled={option.disabled}
                onChange={(e) => toggle(option.value, e.target.checked)}
                className="mt-[3px] h-4 w-4 shrink-0 cursor-pointer rounded accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              />
              <span className="flex flex-col">
                <span>{option.label}</span>
                {option.description && (
                  <span className="font-caption text-caption text-on-surface-variant">{option.description}</span>
                )}
              </span>
            </label>
          )
        })}
      </div>
      {error ? (
        <p id={`${id}-error`} className="flex items-start gap-1 font-caption text-caption text-error">
          <Icon name="error" className="mt-px text-[14px]" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="font-caption text-caption text-on-surface-variant">
          {hint}
        </p>
      ) : null}
    </fieldset>
  )
}
