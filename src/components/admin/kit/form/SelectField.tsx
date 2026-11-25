'use client'

import type { ChangeEvent, ComponentProps, ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'
import { controlClass, controlInvalidClass, FieldShell, useAdminField } from './FieldShell'

export interface SelectOption<V extends string = string> {
  value: V
  label: string
  disabled?: boolean
}

export interface SelectFieldProps<V extends string = string>
  extends Omit<ComponentProps<'select'>, 'value' | 'defaultValue'> {
  label: ReactNode
  options: readonly SelectOption<V>[]
  value?: V | ''
  defaultValue?: V | ''
  /** Receives the selected value (the native `onChange` still works, e.g. with react-hook-form's register()). */
  onValueChange?: (value: V | '') => void
  /** Adds a first empty option ("All tours", "Choose…"). */
  placeholder?: string
  hint?: ReactNode
  error?: string | null
  hideLabel?: boolean
  fieldClassName?: string
}

/** Labelled native <select> with a custom chevron. Use `onValueChange(value)` or the native `onChange`/register(). */
export function SelectField<V extends string = string>({
  label,
  options,
  placeholder,
  hint,
  error,
  hideLabel,
  required,
  id,
  className,
  fieldClassName,
  onChange,
  onValueChange,
  ...props
}: SelectFieldProps<V>) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} hideLabel={hideLabel} id={id} className={fieldClassName}>
      <ShellSelect
        options={options}
        placeholder={placeholder}
        className={className}
        required={required}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
          onChange?.(e)
          onValueChange?.(e.target.value as V | '')
        }}
        {...props}
      />
    </FieldShell>
  )
}

/** Bare select wired to the surrounding FieldShell. */
export function ShellSelect<V extends string = string>({
  options,
  placeholder,
  className,
  required,
  ...props
}: ComponentProps<'select'> & { options: readonly SelectOption<V>[]; placeholder?: string }) {
  const field = useAdminField()
  return (
    <div className="relative">
      <select
        id={props.id ?? field?.id}
        aria-describedby={props['aria-describedby'] ?? field?.describedBy}
        aria-invalid={props['aria-invalid'] ?? (field?.invalid || undefined)}
        aria-required={required || field?.required || undefined}
        {...props}
        className={cn(controlClass, 'cursor-pointer appearance-none pr-9', field?.invalid && controlInvalidClass, className)}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon
        name="expand_more"
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
      />
    </div>
  )
}
