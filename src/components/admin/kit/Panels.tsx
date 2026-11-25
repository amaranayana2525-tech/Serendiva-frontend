'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { useAdminErrorMessage } from '@/lib/admin/hooks'
import { cn } from '@/lib/utils'
import { Button } from './Button'

export interface EmptyPanelProps {
  icon?: string
  title?: ReactNode
  body?: ReactNode
  /** Buttons (create, reset filters). */
  action?: ReactNode
  /** 'card' = own white card, 'inline' = inside an existing card/table. */
  variant?: 'card' | 'inline'
  className?: string
}

/** Empty state for lists ("No inquiries yet", "Nothing matches these filters"). */
export function EmptyPanel({ icon = 'inbox', title, body, action, variant = 'inline', className }: EmptyPanelProps) {
  const t = useTranslations('admin.kit.panels')
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 px-6 py-12 text-center',
        variant === 'card' && 'shadow-ambient rounded-xl bg-surface-container-lowest',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-secondary">
        <Icon name={icon} className="text-[24px]" />
      </span>
      <p className="font-body-lg text-body-lg font-semibold text-primary">{title ?? t('emptyTitle')}</p>
      <p className="max-w-md font-body-md text-body-md text-on-surface-variant">{body ?? t('emptyBody')}</p>
      {action && <div className="flex flex-wrap justify-center gap-2 pt-2">{action}</div>}
    </div>
  )
}

export interface ErrorPanelProps {
  /** The error (AdminApiError or anything) — mapped to a friendly sentence. */
  error?: unknown
  title?: ReactNode
  onRetry?: () => void
  variant?: 'card' | 'inline'
  className?: string
}

/** Load failure with a retry button. Never shows stack traces. */
export function ErrorPanel({ error, title, onRetry, variant = 'card', className }: ErrorPanelProps) {
  const t = useTranslations('admin.kit.panels')
  const describe = useAdminErrorMessage()
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-2 px-6 py-10 text-center',
        variant === 'card' && 'shadow-ambient rounded-xl bg-surface-container-lowest',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-fixed text-secondary">
        <Icon name="cloud_off" className="text-[24px]" />
      </span>
      <p className="font-body-lg text-body-lg font-semibold text-primary">{title ?? t('errorTitle')}</p>
      <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
        {error ? describe(error) : t('errorBody')}
      </p>
      {onRetry && (
        <Button variant="primary" icon="refresh" onClick={onRetry} className="mt-2">
          {t('retry')}
        </Button>
      )}
    </div>
  )
}

export interface LoadingPanelProps {
  /** Skeleton shape. */
  variant?: 'table' | 'cards' | 'form' | 'detail' | 'stats' | 'spinner'
  /** Rows / items. */
  rows?: number
  /** Wrap in a white card. */
  card?: boolean
  className?: string
}

const bar = 'animate-pulse rounded-md bg-surface-container-high/80'

/** Skeleton placeholder announced as "Loading…" to screen readers. */
export function LoadingPanel({ variant = 'table', rows = 6, card = true, className }: LoadingPanelProps) {
  const t = useTranslations('admin.kit.panels')
  let body: ReactNode
  switch (variant) {
    case 'spinner':
      body = (
        <div className="flex items-center justify-center gap-2 py-12 text-on-surface-variant">
          <Icon name="progress_activity" className="animate-spin text-[22px] text-primary" />
          <span className="font-body-md text-body-md">{t('loading')}</span>
        </div>
      )
      break
    case 'stats':
      body = (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-4">
              <div className={cn(bar, 'h-3 w-24')} />
              <div className={cn(bar, 'h-7 w-16')} />
            </div>
          ))}
        </div>
      )
      break
    case 'cards':
      body = (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl border border-surface-container p-3">
              <div className={cn(bar, 'aspect-[4/3] w-full rounded-lg')} />
              <div className={cn(bar, 'h-4 w-3/4')} />
              <div className={cn(bar, 'h-3 w-1/2')} />
            </div>
          ))}
        </div>
      )
      break
    case 'form':
    case 'detail':
      body = (
        <div className="flex flex-col gap-5">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className={cn(bar, 'h-3 w-28')} />
              <div className={cn(bar, variant === 'form' ? 'h-10 w-full' : 'h-4 w-2/3')} />
            </div>
          ))}
        </div>
      )
      break
    default:
      body = (
        <div className="flex flex-col">
          <div className={cn(bar, 'mb-3 h-4 w-full max-w-md')} />
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex items-center gap-4 border-t border-surface-container py-3.5">
              <div className={cn(bar, 'h-4 w-24')} />
              <div className={cn(bar, 'h-4 flex-1')} />
              <div className={cn(bar, 'hidden h-4 w-32 md:block')} />
              <div className={cn(bar, 'h-5 w-16 rounded-full')} />
            </div>
          ))}
        </div>
      )
  }
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(card && 'shadow-ambient rounded-xl bg-surface-container-lowest p-4 md:p-5', className)}
    >
      <span className="sr-only">{t('loading')}</span>
      <div aria-hidden="true">{body}</div>
    </div>
  )
}
