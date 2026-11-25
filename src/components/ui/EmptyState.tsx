import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Icon } from './Icon'

export interface EmptyStateProps {
  icon?: string
  /** Defaults to common.states.emptyTitle / emptyBody. */
  title?: ReactNode
  body?: ReactNode
  /** Buttons / links (e.g. reset filters, WhatsApp). */
  action?: ReactNode
  className?: string
}

/** Friendly message for empty lists and filter results. */
export function EmptyState({ icon = 'travel_explore', title, body, action, className }: EmptyStateProps) {
  const t = useTranslations('common.states')
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-space-sm rounded-2xl bg-surface-container-low px-space-lg py-space-2xl text-center',
        className,
      )}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container text-secondary">
        <Icon name={icon} className="text-[28px]" />
      </span>
      <h3 className="font-headline-sm text-headline-sm text-primary">{title ?? t('emptyTitle')}</h3>
      <p className="max-w-md font-body-md text-body-md text-on-surface-variant">{body ?? t('emptyBody')}</p>
      {action && <div className="flex flex-wrap items-center justify-center gap-space-sm pt-space-sm">{action}</div>}
    </div>
  )
}
