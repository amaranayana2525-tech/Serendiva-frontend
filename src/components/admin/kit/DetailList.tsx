import type { ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

export interface DetailItem {
  label: ReactNode
  /** null/undefined/'' renders the `emptyText` dash. */
  value: ReactNode
  /** Span both columns (long text). */
  wide?: boolean
}

export interface DetailListProps {
  items: readonly DetailItem[]
  /** Hide rows without a value instead of showing "—". */
  hideEmpty?: boolean
  emptyText?: string
  columns?: 1 | 2
  className?: string
}

const isEmpty = (v: ReactNode) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)

/** Label/value grid for detail drawers (`<dl>`). */
export function DetailList({ items, hideEmpty = false, emptyText = '—', columns = 2, className }: DetailListProps) {
  const visible = hideEmpty ? items.filter((i) => !isEmpty(i.value)) : items
  return (
    <dl className={cn('grid grid-cols-1 gap-x-6 gap-y-3', columns === 2 && 'sm:grid-cols-2', className)}>
      {visible.map((item, i) => (
        <div key={i} className={cn('flex min-w-0 flex-col gap-0.5', item.wide && 'sm:col-span-2')}>
          <dt className="font-body-md text-[12px] font-semibold uppercase tracking-wide text-on-surface-variant">
            {item.label}
          </dt>
          <dd className="min-w-0 break-words font-body-md text-body-md text-on-surface">
            {isEmpty(item.value) ? <span className="text-outline">{emptyText}</span> : item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export interface DetailSectionProps {
  title: ReactNode
  icon?: string
  /** Right side of the heading (small buttons). */
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/** Titled group inside a drawer/detail view (h3 + content), separated by a hairline. */
export function DetailSection({ title, icon, actions, children, className }: DetailSectionProps) {
  return (
    <section className={cn('flex flex-col gap-3 border-t border-surface-container-high pt-4 first:border-t-0 first:pt-0', className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 font-body-md text-[13px] font-semibold uppercase tracking-wider text-primary">
          {icon && <Icon name={icon} className="text-[18px] text-secondary" />}
          {title}
        </h3>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      {children}
    </section>
  )
}
