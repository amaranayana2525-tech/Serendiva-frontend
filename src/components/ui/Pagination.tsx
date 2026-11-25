import type { ComponentProps } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { pageWindow } from '@/lib/pagination'
import { cn } from '@/lib/utils'
import { Icon } from './Icon'

type LinkHref = ComponentProps<typeof Link>['href']

interface BaseProps {
  page: number
  totalPages: number
  className?: string
}

/** Link mode (server-rendered pages: ?page=2) or button mode (client-side lists). */
export type PaginationProps = BaseProps &
  (
    | { hrefFor: (page: number) => LinkHref; onPageChange?: undefined }
    | { onPageChange: (page: number) => void; hrefFor?: undefined }
  )

const itemBase =
  'inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-3 font-label-lg text-label-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface'

/** Numbered pagination with previous/next (accessible labels, aria-current). Renders nothing for a single page. */
export function Pagination(props: PaginationProps) {
  const t = useTranslations('common.a11y.pagination')
  const { page, totalPages, className } = props
  if (totalPages <= 1) return null

  const renderItem = (
    target: number,
    content: React.ReactNode,
    label: string,
    opts: { current?: boolean; disabled?: boolean } = {},
  ) => {
    const classes = cn(
      itemBase,
      opts.current ? 'bg-primary text-on-primary' : 'bg-surface-container text-primary hover:bg-surface-container-high',
      opts.disabled && 'pointer-events-none opacity-40',
    )
    if (opts.disabled) {
      return (
        <span aria-disabled="true" className={classes}>
          {content}
        </span>
      )
    }
    if (props.hrefFor) {
      return (
        <Link
          href={props.hrefFor(target)}
          aria-label={label}
          aria-current={opts.current ? 'page' : undefined}
          className={classes}
        >
          {content}
        </Link>
      )
    }
    return (
      <button
        type="button"
        onClick={() => props.onPageChange(target)}
        aria-label={label}
        aria-current={opts.current ? 'page' : undefined}
        className={classes}
      >
        {content}
      </button>
    )
  }

  return (
    <nav aria-label={t('label')} className={cn('flex items-center justify-center', className)}>
      <ul className="flex flex-wrap items-center gap-space-xs">
        <li>
          {renderItem(page - 1, <Icon name="chevron_left" className="text-xl" />, t('previous'), {
            disabled: page <= 1,
          })}
        </li>
        {pageWindow(page, totalPages).map((p, i) =>
          p === 'gap' ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 font-label-lg text-label-lg text-outline">
              …
            </li>
          ) : (
            <li key={p}>
              {renderItem(p, p, p === page ? t('current', { page: p }) : t('page', { page: p }), {
                current: p === page,
              })}
            </li>
          ),
        )}
        <li>
          {renderItem(page + 1, <Icon name="chevron_right" className="text-xl" />, t('next'), {
            disabled: page >= totalPages,
          })}
        </li>
      </ul>
    </nav>
  )
}
