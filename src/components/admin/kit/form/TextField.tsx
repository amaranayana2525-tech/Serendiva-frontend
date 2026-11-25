'use client'

import type { ComponentProps, ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'
import { CharCount, controlClass, controlInvalidClass, FieldShell, useAdminField } from './FieldShell'

export interface TextFieldProps extends Omit<ComponentProps<'input'>, 'size'> {
  label: ReactNode
  hint?: ReactNode
  error?: string | null
  hideLabel?: boolean
  /** Leading icon inside the control. */
  icon?: string
  /** Shows "n / max" next to the label (uses `maxLength` when not given). */
  counter?: boolean
  /** Element at the end of the control (unit, button). */
  suffix?: ReactNode
  labelAside?: ReactNode
  fieldClassName?: string
}

/**
 * Labelled text input. Works controlled (`value`/`onChange`) or with react-hook-form (`{...register('name')}`).
 */
export function TextField({
  label,
  hint,
  error,
  hideLabel,
  icon,
  counter,
  suffix,
  labelAside,
  required,
  id,
  className,
  fieldClassName,
  maxLength,
  ...input
}: TextFieldProps) {
  const counterNode =
    counter && maxLength ? <CharCount value={typeof input.value === 'string' ? input.value : ''} max={maxLength} /> : null
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
      <ShellInput icon={icon} suffix={suffix} required={required} maxLength={maxLength} className={className} {...input} />
    </FieldShell>
  )
}


/** Bare input wired to the surrounding FieldShell (ids/aria). */
export function ShellInput({
  icon,
  suffix,
  className,
  required,
  ...props
}: ComponentProps<'input'> & { icon?: string; suffix?: ReactNode }) {
  const field = useAdminField()
  const input = (
    <input
      id={props.id ?? field?.id}
      aria-describedby={props['aria-describedby'] ?? field?.describedBy}
      aria-invalid={props['aria-invalid'] ?? (field?.invalid || undefined)}
      aria-required={required || field?.required || undefined}
      {...props}
      className={cn(controlClass, icon && 'pl-9', suffix ? 'pr-12' : undefined, field?.invalid && controlInvalidClass, className)}
    />
  )
  if (!icon && !suffix) return input
  return (
    <div className="relative">
      {icon && (
        <Icon
          name={icon}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant"
        />
      )}
      {input}
      {suffix && <div className="absolute inset-y-0 right-1 flex items-center">{suffix}</div>}
    </div>
  )
}
