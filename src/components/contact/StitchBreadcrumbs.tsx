import { Fragment } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { breadcrumbListJsonLd } from '@/components/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLdScript'
import { Icon } from '@/components/ui/Icon'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { localizedUrl } from '@/lib/seo'
import { cn } from '@/lib/utils'

export interface StitchBreadcrumbItem {
  label: string
  /** Locale-less path; omit for the current page. */
  href?: string
}

export interface StitchBreadcrumbsProps {
  items: StitchBreadcrumbItem[]
  /** '/' between items (Plan My Trip) or a chevron (Corporate hero). */
  separator?: 'slash' | 'chevron'
  className?: string
  linkClassName?: string
  currentClassName?: string
  separatorClassName?: string
}

/**
 * Local variant of the shared <Breadcrumbs>: the contact and corporate Stitch screens use their own separators
 * and colours (slash + teal current item on sand; chevron + pale teal on the dark corporate hero).
 * Emits BreadcrumbList JSON-LD like the shared component.
 */
export function StitchBreadcrumbs({
  items,
  separator = 'slash',
  className,
  linkClassName,
  currentClassName,
  separatorClassName,
}: StitchBreadcrumbsProps) {
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
                        'tap-target relative rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current',
                        linkClassName,
                      )}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span aria-current={last ? 'page' : undefined} className={currentClassName}>
                      {item.label}
                    </span>
                  )}
                </li>
                {!last && (
                  <li aria-hidden="true" className={cn('flex items-center', separatorClassName)}>
                    {separator === 'slash' ? '/' : <Icon name="chevron_right" className="text-xs" />}
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
