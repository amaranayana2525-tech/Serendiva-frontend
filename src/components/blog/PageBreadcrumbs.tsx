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
  /** Locale-less path. Omit for the current page (last item). */
  href?: string
}

export interface PageBreadcrumbsProps {
  items: PageBreadcrumbItem[]
  /** Small house icon before the first item (blog / article meta bar). */
  homeIcon?: boolean
  className?: string
}

/**
 * The slash-separated breadcrumb of the travel-guide, journal and responsible-travel Stitch screens
 * ("HOME / TRAVEL GUIDE & PRACTICALITIES") + BreadcrumbList JSON-LD. The shared ui/Breadcrumbs uses chevrons.
 */
export function PageBreadcrumbs({ items, homeIcon = false, className }: PageBreadcrumbsProps) {
  const t = useTranslations('common.a11y')
  const locale = useLocale() as Locale
  return (
    <>
      <nav
        aria-label={t('breadcrumb')}
        className={cn(
          'min-w-0 font-label-md text-label-md uppercase tracking-[0.16em] text-on-surface-variant',
          className,
        )}
      >
        <ol className="flex min-w-0 flex-wrap items-center gap-space-xs">
          {items.map((item, index) => {
            const last = index === items.length - 1
            return (
              <Fragment key={`${item.label}-${index}`}>
                <li className="flex min-w-0 items-center">
                  {item.href && !last ? (
                    <Link
                      href={item.href}
                      className="tap-target relative flex items-center gap-1 rounded transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {index === 0 && homeIcon && <Icon name="home" className="text-[15px]" />}
                      {item.label}
                    </Link>
                  ) : (
                    <span aria-current={last ? 'page' : undefined} className="truncate font-semibold text-primary">
                      {item.label}
                    </span>
                  )}
                </li>
                {!last && (
                  <li aria-hidden="true" className="opacity-40">
                    /
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
