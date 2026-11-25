'use client'

import { createContext, useContext, useId, type ComponentProps, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { parseValidationMessage } from '@/lib/validation/messages'
import { Icon } from './Icon'

/*
 * Form controls with Stitch styling. <Field> wires label/hint/error to the control through context:
 *
 *   <Field label={t('form.labels.email')} required error={errors.email?.message}>
 *     <Input type="email" autoComplete="email" {...register('email')} />
 *   </Field>
 *
 * Error strings may be validation keys from src/lib/validation ('required', 'tooLong:120') — they are translated
 * via `common.form.validation.*` — or plain text from the API (shown verbatim).
 */

interface FieldContextValue {
  id: string
  describedBy?: string
  invalid: boolean
  required: boolean
}

const FieldContext = createContext<FieldContextValue | null>(null)

/** Ids/aria for controls rendered inside <Field>. */
export function useFieldContext() {
  return useContext(FieldContext)
}

/** Translates a validation key (or returns API text as-is). */
export function useFieldErrorText(error: string | undefined | null): string | undefined {
  const t = useTranslations('common.form.validation')
  if (!error) return undefined
  const parsed = parseValidationMessage(error)
  return parsed ? t(parsed.key, parsed.values) : error
}

export type ControlVariant = 'surface' | 'white' | 'muted'

const controlVariants: Record<ControlVariant, string> = {
  /** Sand control on sand-container cards (tour sidebar). */
  surface: 'rounded-lg bg-surface px-space-md py-space-sm shadow-sm',
  /** White control on sand (tours search, contact wizard). */
  white: 'rounded-xl bg-surface-container-lowest px-space-md py-space-sm shadow-sm',
  /** Sand-container control on white/frosted panels (hero quick-inquiry bar). */
  muted: 'rounded-xl bg-surface-container px-space-md py-3',
}

const controlBase =
  'w-full font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60 coarse:min-h-11'
const controlInvalid = 'ring-1 ring-error focus:ring-error'

export interface FieldProps {
  label: ReactNode
  /** Material icon shown before the label (hero quick-inquiry bar). */
  labelIcon?: string
  hint?: ReactNode
  error?: string
  required?: boolean
  /** Visually hide the label (still announced). */
  hideLabel?: boolean
  /** Explicit id for the control (otherwise generated). */
  id?: string
  className?: string
  labelClassName?: string
  children: ReactNode
}

/** Label + control + hint + error with aria-describedby / aria-invalid wiring. */
export function Field({
  label,
  labelIcon,
  hint,
  error,
  required = false,
  hideLabel,
  id,
  className,
  labelClassName,
  children,
}: FieldProps) {
  const t = useTranslations('common')
  const generated = useId()
  const controlId = id ?? `f${generated.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const hintId = hint ? `${controlId}-hint` : undefined
  const errorId = error ? `${controlId}-error` : undefined
  const errorText = useFieldErrorText(error)
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <FieldContext.Provider value={{ id: controlId, describedBy, invalid: Boolean(error), required }}>
      <div className={cn('flex flex-col gap-1', className)}>
        <label
          htmlFor={controlId}
          className={cn(
            'flex items-center gap-1 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant',
            hideLabel && 'sr-only',
            labelClassName,
          )}
        >
          {labelIcon && <Icon name={labelIcon} className="text-sm text-secondary" />}
          {label}
          {required && (
            <span aria-hidden="true" className="text-secondary">
              {t('form.requiredMark')}
            </span>
          )}
        </label>
        {children}
        {hint && !error && (
          <p id={hintId} className="font-caption text-caption text-on-surface-variant">
            {hint}
          </p>
        )}
        {errorText && (
          <p id={errorId} className="flex items-center gap-1 font-caption text-caption text-error">
            <Icon name="error" className="text-sm" />
            {errorText}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  )
}

/** Merges Field context into a control's props. Uses aria-required (not `required`) so the browser's native
 *  validation bubbles never fight the Zod messages — forms should still set `noValidate`. */
function useControlProps(props: {
  id?: string
  'aria-required'?: ComponentProps<'input'>['aria-required']
  'aria-describedby'?: string
  'aria-invalid'?: ComponentProps<'input'>['aria-invalid']
}) {
  const ctx = useFieldContext()
  return {
    id: props.id ?? ctx?.id,
    'aria-required': props['aria-required'] ?? (ctx?.required || undefined),
    'aria-describedby': props['aria-describedby'] ?? ctx?.describedBy,
    'aria-invalid': props['aria-invalid'] ?? (ctx?.invalid || undefined),
    invalid: Boolean(props['aria-invalid'] ?? ctx?.invalid),
  }
}

export interface InputProps extends ComponentProps<'input'> {
  variant?: ControlVariant
  /** Leading icon inside the control (search fields). */
  icon?: string
}

/** Text-like input. Pass react-hook-form's `register()` result straight in (React 19 ref-as-prop). */
export function Input({ variant = 'surface', icon, className, ...props }: InputProps) {
  const { invalid, ...aria } = useControlProps(props)
  const input = (
    <input
      {...props}
      {...aria}
      className={cn(controlBase, controlVariants[variant], icon && 'pl-11', invalid && controlInvalid, className)}
    />
  )
  if (!icon) return input
  return (
    <div className="relative w-full">
      <Icon
        name={icon}
        className="pointer-events-none absolute left-space-md top-1/2 -translate-y-1/2 text-xl text-outline"
      />
      {input}
    </div>
  )
}

export interface TextareaProps extends ComponentProps<'textarea'> {
  variant?: ControlVariant
}

export function Textarea({ variant = 'surface', className, rows = 4, ...props }: TextareaProps) {
  const { invalid, ...aria } = useControlProps(props)
  return (
    <textarea
      rows={rows}
      {...props}
      {...aria}
      className={cn(controlBase, controlVariants[variant], 'resize-y', invalid && controlInvalid, className)}
    />
  )
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends ComponentProps<'select'> {
  variant?: ControlVariant
  options?: SelectOption[]
  /** Adds a first empty option (e.g. "Please choose"). */
  placeholder?: string
  /** Custom chevron instead of the native arrow (hero quick bar uses appearance-none). */
  chevron?: boolean
}

export function Select({
  variant = 'surface',
  options,
  placeholder,
  chevron = false,
  className,
  children,
  ...props
}: SelectProps) {
  const { invalid, ...aria } = useControlProps(props)
  const select = (
    <select
      {...props}
      {...aria}
      className={cn(
        controlBase,
        controlVariants[variant],
        'cursor-pointer',
        chevron && 'appearance-none pr-10',
        invalid && controlInvalid,
        className,
      )}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options?.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
      {children}
    </select>
  )
  if (!chevron) return select
  return (
    <div className="relative w-full">
      {select}
      <Icon
        name="expand_more"
        className="pointer-events-none absolute right-space-sm top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
      />
    </div>
  )
}

export interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type'> {
  label: ReactNode
  description?: ReactNode
  error?: string
}

/** Checkbox with its own label (consent, logistics items, "my dates are flexible"). */
export function Checkbox({ label, description, error, className, id, ...props }: CheckboxProps) {
  const generated = useId()
  const inputId = id ?? `c${generated.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const errorText = useFieldErrorText(error)
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label
        htmlFor={inputId}
        className="flex cursor-pointer items-start gap-space-sm font-body-md text-body-md text-on-surface"
      >
        <input
          id={inputId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          {...props}
        />
        <span className="flex flex-col">
          <span>{label}</span>
          {description && <span className="font-caption text-caption text-on-surface-variant">{description}</span>}
        </span>
      </label>
      {errorText && (
        <p id={`${inputId}-error`} className="flex items-center gap-1 font-caption text-caption text-error">
          <Icon name="error" className="text-sm" />
          {errorText}
        </p>
      )}
    </div>
  )
}

export interface RadioCardProps extends Omit<ComponentProps<'input'>, 'type' | 'title'> {
  title: ReactNode
  description?: ReactNode
  icon?: string
  /** 'radio' (single choice) or 'checkbox' (multi-select cards, e.g. quiz interests). */
  type?: 'radio' | 'checkbox'
  cardClassName?: string
}

/** Large selectable card (inquiry wizard, trip quiz). Native radio/checkbox underneath for a11y + RHF. */
export function RadioCard({
  title,
  description,
  icon,
  type = 'radio',
  className,
  cardClassName,
  ...props
}: RadioCardProps) {
  return (
    <label className={cn('relative block cursor-pointer', className)}>
      <input type={type} className="peer sr-only" {...props} />
      <span
        className={cn(
          'flex h-full flex-col gap-space-xs rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-space-md shadow-sm transition-all',
          'hover:border-primary/40 hover:shadow-md',
          'peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-1 peer-checked:ring-primary',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          cardClassName,
        )}
      >
        {icon && (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-secondary">
            <Icon name={icon} className="text-xl" />
          </span>
        )}
        <span className="pr-space-lg font-headline-sm text-headline-sm text-primary">{title}</span>
        {description && <span className="font-body-md text-body-md text-on-surface-variant">{description}</span>}
      </span>
      <Icon
        name="check_circle"
        filled
        className="pointer-events-none absolute right-space-sm top-space-sm text-xl text-primary opacity-0 transition-opacity peer-checked:opacity-100"
      />
    </label>
  )
}
