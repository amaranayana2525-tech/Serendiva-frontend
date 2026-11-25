'use client'

import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { CharCount, controlClass, controlInvalidClass, FieldShell, useAdminField } from './FieldShell'

export interface TextAreaProps extends ComponentProps<'textarea'> {
  label: ReactNode
  hint?: ReactNode
  error?: string | null
  hideLabel?: boolean
  /** "n / max" counter (controlled mode; uses maxLength). */
  counter?: boolean
  labelAside?: ReactNode
  fieldClassName?: string
}

/** Labelled multi-line input (controlled or `register()`), vertical resize, optional counter. */
export function TextArea({
  label,
  hint,
  error,
  hideLabel,
  counter,
  labelAside,
  required,
  id,
  rows = 4,
  className,
  fieldClassName,
  maxLength,
  ...props
}: TextAreaProps) {
  const counterNode =
    counter && maxLength ? <CharCount value={typeof props.value === 'string' ? props.value : ''} max={maxLength} /> : null
  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
      id={id}
      className={fieldClassName}
      labelAside={
        labelAside || counterNode ? (
          <>
            {labelAside}
            {counterNode}
          </>
        ) : undefined
      }
    >
      <ShellTextarea rows={rows} maxLength={maxLength} required={required} className={className} {...props} />
    </FieldShell>
  )
}

/** Bare textarea wired to the surrounding FieldShell. */
export function ShellTextarea({ className, required, ...props }: ComponentProps<'textarea'>) {
  const field = useAdminField()
  return (
    <textarea
      id={props.id ?? field?.id}
      aria-describedby={props['aria-describedby'] ?? field?.describedBy}
      aria-invalid={props['aria-invalid'] ?? (field?.invalid || undefined)}
      aria-required={required || field?.required || undefined}
      {...props}
      className={cn(controlClass, 'min-h-[2.75rem] resize-y leading-relaxed', field?.invalid && controlInvalidClass, className)}
    />
  )
}
