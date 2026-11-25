'use client'

import { createContext, useContext, useId, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

/** Shared control classes (inputs, selects, textareas) — white control with outline, teal focus ring. */
export const controlClass =
  'block w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body-md text-body-md text-on-surface placeholder:text-outline transition-colors hover:border-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:opacity-70'
export const controlInvalidClass = 'border-error hover:border-error focus:border-error focus:ring-error/25'

export interface FieldContextValue {
  id: string
  describedBy?: string
  invalid: boolean
  required: boolean
}

const FieldCtx = createContext<FieldContextValue | null>(null)

/** Ids/aria for a control rendered inside <FieldShell>. */
export function useAdminField(): FieldContextValue | null {
  return useContext(FieldCtx)
}

export interface FieldShellProps {
  label: ReactNode
  /** Help text under the control (hidden while an error shows). */
  hint?: ReactNode
  /** Error message (API text or your own). */
  error?: string | null
  required?: boolean
  /** Visually hide the label (still announced). */
  hideLabel?: boolean
  /** Right side of the label row (counter, "Edit" button, locale badge). */
  labelAside?: ReactNode
  /** Explicit control id. */
  id?: string
  className?: string
  /** The control — or a render function receiving `{ id, describedBy, invalid, required }` for custom controls. */
  children: ReactNode | ((field: FieldContextValue) => ReactNode)
}

/** Label + control + hint/error with aria wiring. All kit form controls render inside it. */
export function FieldShell({
  label,
  hint,
  error,
  required = false,
  hideLabel = false,
  labelAside,
  id,
  className,
  children,
}: FieldShellProps) {
  const t = useTranslations('admin.kit.form')
  const generated = useId()
  const controlId = id ?? `af${generated.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const hintId = hint ? `${controlId}-hint` : undefined
  const errorId = error ? `${controlId}-error` : undefined
  const describedBy = [error ? errorId : hintId].filter(Boolean).join(' ') || undefined
  const ctx: FieldContextValue = { id: controlId, describedBy, invalid: Boolean(error), required }
  return (
    <FieldCtx.Provider value={ctx}>
      <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
        <div className={cn('flex items-end justify-between gap-2', hideLabel && !labelAside && 'sr-only')}>
          <label
            htmlFor={controlId}
            className={cn('font-body-md text-[13px] font-semibold text-on-surface', hideLabel && 'sr-only')}
          >
            {label}
            {required && (
              <span className="ml-0.5 text-secondary" aria-hidden="true">
                *
              </span>
            )}
            {required && <span className="sr-only"> {t('required')}</span>}
          </label>
          {labelAside && <div className="flex items-center gap-2">{labelAside}</div>}
        </div>
        {typeof children === 'function' ? children(ctx) : children}
        {error ? (
          <p id={errorId} className="flex items-start gap-1 font-caption text-caption text-error">
            <Icon name="error" className="mt-px text-[14px]" />
            <span>{error}</span>
          </p>
        ) : hint ? (
          <p id={hintId} className="font-caption text-caption text-on-surface-variant">
            {hint}
          </p>
        ) : null}
      </div>
    </FieldCtx.Provider>
  )
}

/** Character counter "42 / 160" (turns cinnamon over the limit). */
export function CharCount({ value, max }: { value: string | null | undefined; max: number }) {
  const t = useTranslations('admin.kit.form')
  const length = value?.length ?? 0
  return (
    <span
      className={cn(
        'font-caption text-caption tabular-nums',
        length > max ? 'font-semibold text-secondary' : 'text-on-surface-variant',
      )}
      aria-label={t('charCount', { count: length, max })}
    >
      {length} / {max}
    </span>
  )
}
