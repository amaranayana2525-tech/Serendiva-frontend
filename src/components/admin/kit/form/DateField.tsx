'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { controlClass, controlInvalidClass, FieldShell } from './FieldShell'

export interface DateFieldProps {
  label: ReactNode
  /** 'YYYY-MM-DD' ('' = empty). With `type="month"`: 'YYYY-MM'. */
  value: string
  onChange: (value: string) => void
  type?: 'date' | 'month' | 'datetime-local'
  min?: string
  max?: string
  hint?: ReactNode
  error?: string | null
  required?: boolean
  hideLabel?: boolean
  disabled?: boolean
  id?: string
  className?: string
}

/** Native date / month / datetime-local picker bound to its ISO string ('' when empty). */
export function DateField({
  label,
  value,
  onChange,
  type = 'date',
  min,
  max,
  hint,
  error,
  required,
  hideLabel,
  disabled,
  id,
  className,
}: DateFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} hideLabel={hideLabel} id={id} className={className}>
      {({ id: controlId, describedBy, invalid }) => (
        <input
          id={controlId}
          type={type}
          value={value}
          min={min}
          max={max}
          disabled={disabled}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          aria-required={required || undefined}
          onChange={(e) => onChange(e.target.value)}
          className={cn(controlClass, 'tabular-nums', invalid && controlInvalidClass)}
        />
      )}
    </FieldShell>
  )
}
