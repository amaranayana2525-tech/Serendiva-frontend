import { Fragment, type ComponentProps } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { breadcrumbListJsonLd } from '@/components/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLdScript'
import { Icon } from '@/components/ui/Icon'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { localizedUrl } from '@/lib/seo'
import { cn } from '@/lib/utils'

type Href = ComponentProps<typeof Link>['href']

export interface DestinationCrumb {
  label: string
  /** Omit for the current page (last item). */
  href?: Href
}

export interface DestinationBreadcrumbsProps {
  items: DestinationCrumb[]
  /**
   * 'slash' — explorer hero on sand (caption, "/" separators, teal current page)
   * 'hero'  — detail photo hero (uppercase caption, chevrons, white current page)
   */
  variant: 'slash' | 'hero'
  className?: string
}

const hrefPath = (href: Href): string => {
  if (typeof href === 'string') return href
  const query = href.query ? new URLSearchParams(href.query as Record<string, string>).toString() : ''
  return `${href.pathname}${query ? `?${query}` : ''}`
}

/**
 * Local variant of ui/Breadcrumbs with the two Stitch destination styles (the shared component renders the
 * label-md tours style). Emits BreadcrumbList JSON-LD as well.
 */
export function DestinationBreadcrumbs({ items, variant, className }: DestinationBreadcrumbsProps) {
  const t = useTranslations('common.a11y')
  const locale = useLocale() as Locale
  const hero = variant === 'hero'
  return (
    <>
      <nav aria-label={t('breadcrumb')} className={className}>
        <ol
          className={cn(
            'flex flex-wrap items-center gap-space-xs font-caption text-caption',
            hero ? 'uppercase tracking-wider text-on-primary-container' : 'text-on-surface-variant',
          )}
        >
          {items.map((item, index) => {
            const last = index === items.length - 1
            return (
              <Fragment key={`${item.label}-${index}`}>
                <li className="flex items-center">
                  {item.href && !last ? (
                    <Link
                      href={item.href}
                      className={cn(
                        'tap-target relative rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2',
                        hero
                          ? 'hover:text-on-primary focus-visible:ring-on-primary'
                          : 'hover:text-primary focus-visible:ring-primary',
                      )}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={last ? 'page' : undefined}
                      className={cn('font-semibold', hero ? 'text-on-primary' : 'text-primary')}
                    >
                      {item.label}
                    </span>
                  )}
                </li>
                {!last && (
                  <li aria-hidden="true" className="flex items-center">
                    {hero ? <Icon name="chevron_right" className="text-xs" /> : <span className="text-outline">/</span>}
                  </li>
                )}
              </Fragment>
            )
          })}
        </ol>
      </nav>
      <JsonLd
        data={breadcrumbListJsonLd(
          items.map((item) => ({
            name: item.label,
            url: item.href ? localizedUrl(locale, hrefPath(item.href)) : undefined,
          })),
        )}
      />
    </>
  )
}
