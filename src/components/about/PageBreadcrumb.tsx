import { Fragment } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { breadcrumbListJsonLd } from '@/components/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLdScript'
import { Icon } from '@/components/ui/Icon'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { localizedUrl } from '@/lib/seo'
import { cn } from '@/lib/utils'

export interface PageBreadcrumbItem {
  label: string
  /** Locale-less path; omit for the current page. */
  href?: string
}

export interface PageBreadcrumbProps {
  items: PageBreadcrumbItem[]
  /** Separator glyph: Stitch about/reviews use a chevron, the gallery a slash. */
  separator?: 'chevron' | 'slash'
  className?: string
  linkClassName?: string
  currentClassName?: string
  separatorClassName?: string
}

/**
 * Breadcrumb in the exact per-screen Stitch styling of the about / gallery / reviews pages (the shared
 * ui/Breadcrumbs uses the tours styling) + BreadcrumbList JSON-LD.
 */
export function PageBreadcrumb({
  items,
  separator = 'chevron',
  className,
  linkClassName,
  currentClassName,
  separatorClassName,
}: PageBreadcrumbProps) {
  const t = useTranslations('common.a11y')
  const locale = useLocale() as Locale
  return (
    <>
      <nav aria-label={t('breadcrumb')} className={className}>
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
                        'tap-target relative rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                        linkClassName,
                      )}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={last ? 'page' : undefined}
                      className={cn('font-semibold text-primary', currentClassName)}
                    >
                      {item.label}
                    </span>
                  )}
                </li>
                {!last && (
                  <li aria-hidden="true" className="flex items-center">
                    {separator === 'chevron' ? (
                      <Icon name="chevron_right" className={cn('text-[14px]', separatorClassName)} />
                    ) : (
                      <span className={cn('text-outline-variant', separatorClassName)}>/</span>
                    )}
                  </li>
                )}
              </Fragment>
            )
          })}
        </ol>
      </nav>
      <JsonLd
        data={breadcrumbListJsonLd(
          items.map((item) => ({ name: item.label, url: item.href ? localizedUrl(locale, item.href) : undefined })),
        )}
      />
    </>
  )
}
