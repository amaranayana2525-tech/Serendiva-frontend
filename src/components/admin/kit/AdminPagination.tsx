'use client'

import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

export interface AdminPaginationProps {
  page: number
  totalPages: number
  /** Total rows (shows "Showing 1–25 of 120"). */
  total?: number
  pageSize?: number
  onPageChange: (page: number) => void
  /** Hide the summary text. */
  compact?: boolean
  className?: string
}

/** Compact page numbers with ellipses: [1, '…', 4, 5, 6, '…', 12]. */
export function pageWindow(page: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const set = new Set([1, totalPages, page - 1, page, page + 1])
  if (page <= 3) [2, 3, 4].forEach((p) => set.add(p))
  if (page >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((p) => set.add(p))
  const sorted = [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap')
    out.push(p)
  })
  return out
}

/** Pagination bar for admin lists: summary, prev/next, page numbers (numbers hidden on phones). */
export function AdminPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  compact = false,
  className,
}: AdminPaginationProps) {
  const t = useTranslations('admin.kit.pagination')
  if (totalPages <= 1 && (compact || total === undefined)) return null
  const from = total !== undefined && pageSize ? Math.min(total, (page - 1) * pageSize + 1) : undefined
  const to = total !== undefined && pageSize ? Math.min(total, page * pageSize) : undefined
  const btn =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 font-body-md text-body-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-40'
  return (
    <nav aria-label={t('label')} className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      {!compact && total !== undefined && from !== undefined && to !== undefined ? (
        <p className="font-body-md text-body-md text-on-surface-variant" aria-live="polite">
          {total === 0 ? t('none') : t('summary', { from, to, total })}
        </p>
      ) : (
        <span />
      )}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={cn(btn, 'gap-1 text-primary hover:bg-surface-container')}
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label={t('previous')}
          >
            <Icon name="chevron_left" className="text-[20px]" />
            <span className="hidden sm:inline">{t('previousShort')}</span>
          </button>
          <ul className="hidden items-center gap-1 sm:flex">
            {pageWindow(page, totalPages).map((p, i) =>
              p === 'gap' ? (
                <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-on-surface-variant">
                  …
                </li>
              ) : (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => onPageChange(p)}
                    aria-current={p === page ? 'page' : undefined}
                    aria-label={t('page', { page: p })}
                    className={cn(
                      btn,
                      'tabular-nums',
                      p === page ? 'bg-primary font-semibold text-on-primary' : 'text-on-surface hover:bg-surface-container',
                    )}
                  >
                    {p}
                  </button>
                </li>
              ),
            )}
          </ul>
          <span className="px-2 font-body-md text-body-md tabular-nums text-on-surface-variant sm:hidden">
            {t('pageOf', { page, totalPages })}
          </span>
          <button
            type="button"
            className={cn(btn, 'gap-1 text-primary hover:bg-surface-container')}
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label={t('next')}
          >
            <span className="hidden sm:inline">{t('nextShort')}</span>
            <Icon name="chevron_right" className="text-[20px]" />
          </button>
        </div>
      )}
    </nav>
  )
}
