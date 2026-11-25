import { Fragment } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { breadcrumbListJsonLd } from '@/components/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLdScript'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { localizedUrl } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { Icon } from './Icon'

export interface BreadcrumbItem {
  label: string
  /** Locale-less path ('/tours'). Omit for the current page (last item). */
  href?: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  /** 'light' on photo heroes (Stitch tours hero) · 'dark' on sand. */
  tone?: 'light' | 'dark'
  /** Emit BreadcrumbList JSON-LD (default true). */
  jsonLd?: boolean
  className?: string
}

/** Stitch breadcrumb (uppercase label-md, chevrons) + BreadcrumbList structured data. Prepend Home yourself. */
export function Breadcrumbs({ items, tone = 'dark', jsonLd = true, className }: BreadcrumbsProps) {
  const t = useTranslations('common.a11y')
  const locale = useLocale() as Locale
  const light = tone === 'light'
  return (
    <>
      <nav aria-label={t('breadcrumb')} className={cn('mb-space-md', className)}>
        <ol className="flex flex-wrap items-center gap-space-xs">
          {items.map((item, index) => {
            const last = index === items.length - 1
            return (
              <Fragment key={`${item.label}-${index}`}>
                <li className="flex items-center">
                  {item.href && !last ? (
                    <Link
                      href={item.href}
                      className={cn(
                        'tap-target relative font-label-md text-label-md uppercase tracking-widest transition-colors',
                        light ? 'text-surface/80 hover:text-surface' : 'text-on-surface-variant hover:text-primary',
                      )}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={last ? 'page' : undefined}
                      className={cn(
                        'font-label-md text-label-md uppercase tracking-widest',
                        light ? 'text-secondary-fixed' : 'text-secondary',
                      )}
                    >
                      {item.label}
                    </span>
                  )}
                </li>
                {!last && (
                  <li aria-hidden="true" className="flex items-center">
                    <Icon name="chevron_right" className={cn('text-xs', light ? 'text-surface/60' : 'text-outline')} />
                  </li>
                )}
              </Fragment>
            )
          })}
        </ol>
      </nav>
      {jsonLd && (
        <JsonLd
          data={breadcrumbListJsonLd(
            items.map((item) => ({ name: item.label, url: item.href ? localizedUrl(locale, item.href) : undefined })),
          )}
        />
      )}
    </>
  )
}
