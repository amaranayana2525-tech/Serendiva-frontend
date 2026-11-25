import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { Icon } from './Icon'

export interface ErrorStateProps {
  title?: ReactNode
  body?: ReactNode
  /** Link that retries (usually the current page path). */
  retryHref?: string
  /** Client-side retry (e.g. error.tsx `reset`). Only usable from client components. */
  onRetry?: () => void
  /** Extra actions (WhatsApp link …). */
  action?: ReactNode
  /** 'section' (inline card) or 'page' (large, centred). */
  size?: 'section' | 'page'
  className?: string
}

/** Shown when a data-driven section (or page) fails to load. Never exposes technical details. */
export function ErrorState({ title, body, retryHref, onRetry, action, size = 'section', className }: ErrorStateProps) {
  const t = useTranslations('common')
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-space-sm rounded-2xl bg-surface-container-low text-center',
        size === 'page' ? 'px-space-lg py-space-3xl' : 'px-space-lg py-space-xl',
        className,
      )}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary-fixed text-secondary">
        <Icon name="cloud" className="text-[28px]" />
      </span>
      <h3
        className={cn(
          'text-primary',
          size === 'page' ? 'font-headline-lg text-headline-lg' : 'font-headline-sm text-headline-sm',
        )}
      >
        {title ?? (size === 'page' ? t('states.pageErrorTitle') : t('states.errorTitle'))}
      </h3>
      <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
        {body ?? (size === 'page' ? t('states.pageErrorBody') : t('states.errorBody'))}
      </p>
      {(retryHref !== undefined || onRetry || action) && (
        <div className="flex flex-wrap items-center justify-center gap-space-sm pt-space-sm">
          {onRetry ? (
            <Button variant="primary" leadingIcon="refresh" onClick={onRetry}>
              {t('buttons.retry')}
            </Button>
          ) : retryHref !== undefined ? (
            <Button variant="primary" leadingIcon="refresh" href={retryHref}>
              {t('buttons.retry')}
            </Button>
          ) : null}
          {action}
        </div>
      )}
    </div>
  )
}
