'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import type { FormFailure } from '@/lib/api/forms'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'

/** Friendly message for a failed submission (network / 429 / server / validation). */
export function useFormFailureMessage() {
  const t = useTranslations('common.form.status')
  return (failure: FormFailure): string => {
    switch (failure.kind) {
      case 'network':
        return t('network')
      case 'rate_limited':
        return failure.retryAfterSeconds
          ? t('rateLimitedSeconds', { seconds: failure.retryAfterSeconds })
          : t('rateLimited')
      case 'validation':
        return Object.keys(failure.fieldErrors).length > 0 || !failure.message ? t('fixErrors') : failure.message
      default:
        return t('server')
    }
  }
}

export type FormStatusState =
  | { kind: 'success'; title?: ReactNode; body?: ReactNode; reference?: string }
  | { kind: 'error'; message: ReactNode }
  | null

export interface FormStatusProps {
  state: FormStatusState
  /** 'card' = large success panel replacing the form · 'inline' = compact line under the form. */
  variant?: 'card' | 'inline'
  /** Extra content (e.g. "Send another message" button, WhatsApp link). */
  children?: ReactNode
  className?: string
}

/** Success (with reference code) or error feedback after submitting a form. Announced politely / assertively. */
export function FormStatus({ state, variant = 'inline', children, className }: FormStatusProps) {
  const t = useTranslations('common.form.status')
  if (!state) return <div aria-live="polite" className="sr-only" />

  if (state.kind === 'error') {
    return (
      <div
        role="alert"
        className={cn(
          'flex items-start gap-2 rounded-lg bg-error-container/60 p-space-sm font-body-md text-body-md text-on-error-container',
          className,
        )}
      >
        <Icon name="error" className="mt-0.5 text-[18px]" />
        <div className="flex flex-col gap-1">
          <span>{state.message}</span>
          {children}
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'flex items-start gap-2 rounded-lg bg-tertiary/10 p-space-sm font-body-md text-body-md text-tertiary',
          className,
        )}
      >
        <Icon name="check_circle" className="mt-0.5 text-[18px]" />
        <div className="flex flex-col gap-1">
          <span>{state.title ?? t('successTitle')}</span>
          {state.reference && <span className="font-semibold">{t('reference', { reference: state.reference })}</span>}
          {children}
        </div>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center gap-space-md rounded-2xl bg-surface-container-low p-space-xl text-center',
        className,
      )}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-tertiary-container/15 text-tertiary">
        <Icon name="task_alt" className="text-[32px]" />
      </span>
      <h3 className="font-headline-md text-headline-md text-primary">{state.title ?? t('successTitle')}</h3>
      <p className="max-w-md font-body-md text-body-md text-on-surface-variant">{state.body ?? t('successBody')}</p>
      {state.reference && (
        <p className="rounded-full bg-surface-container px-space-md py-space-xs font-label-lg text-label-lg tracking-wider text-primary">
          {t('reference', { reference: state.reference })}
        </p>
      )}
      {state.reference && <p className="font-caption text-caption text-on-surface-variant">{t('keepReference')}</p>}
      {children}
    </div>
  )
}
