'use client'

import NextLink from 'next/link'
import { Fragment, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

export interface Crumb {
  label: string
  href?: string
}

export interface PageHeaderProps {
  /** Page title (the page's only h1, Playfair). */
  title: ReactNode
  description?: ReactNode
  /** Buttons on the right (wrap below the title on mobile). */
  actions?: ReactNode
  /** Breadcrumb trail above the title; the last item is the current page (no href). */
  breadcrumbs?: Crumb[]
  /** Small element after the title (status badge, count). */
  meta?: ReactNode
  className?: string
}

/** Page title block: breadcrumbs, h1, description, meta and actions. */
export function PageHeader({ title, description, actions, breadcrumbs, meta, className }: PageHeaderProps) {
  const t = useTranslations('admin.kit.pageHeader')
  return (
    <header className={cn('flex flex-col gap-3 pb-5 md:flex-row md:items-end md:justify-between md:gap-6', className)}>
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label={t('breadcrumbs')} className="mb-1.5">
            <ol className="flex flex-wrap items-center gap-1 font-caption text-caption text-on-surface-variant">
              {breadcrumbs.map((crumb, i) => (
                <Fragment key={`${crumb.label}-${i}`}>
                  {i > 0 && (
                    <li aria-hidden="true">
                      <Icon name="chevron_right" className="text-[14px] text-outline" />
                    </li>
                  )}
                  <li>
                    {crumb.href ? (
                      <NextLink href={crumb.href} className="rounded hover:text-primary hover:underline">
                        {crumb.label}
                      </NextLink>
                    ) : (
                      <span aria-current="page" className="text-on-surface">
                        {crumb.label}
                      </span>
                    )}
                  </li>
                </Fragment>
              ))}
            </ol>
          </nav>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="font-headline-md text-headline-md font-semibold text-primary md:text-[28px] md:leading-9">
            {title}
          </h1>
          {meta}
        </div>
        {description && (
          <p className="mt-1 max-w-3xl font-body-md text-body-md text-on-surface-variant">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
