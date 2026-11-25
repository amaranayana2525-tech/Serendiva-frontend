import { Fragment } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import type { TourDetail } from '@/lib/api/types'
import { localizedUrl } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { breadcrumbListJsonLd } from '@/components/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLdScript'
import { Icon } from '@/components/ui/Icon'

const container = 'mx-auto w-full max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg'

/** Stitch badge tones, in order (UNESCO teal, chauffeur green, VIP cinnamon, blueprint sand). */
const BADGE_TONES = [
  'bg-primary/10 text-primary',
  'bg-tertiary/15 text-tertiary',
  'bg-secondary-fixed text-on-secondary-fixed',
  'bg-surface-container-high text-on-surface-variant',
] as const

/** Tour-detail breadcrumb (caption style, unlike the uppercase hero breadcrumb) + BreadcrumbList JSON-LD. */
export function TourBreadcrumbs({ tour }: { tour: Pick<TourDetail, 'title' | 'slug'> }) {
  const t = useTranslations('tourDetail.breadcrumb')
  const tc = useTranslations('common')
  const locale = useLocale() as Locale
  const items = [
    { label: tc('nav.home'), href: '/' },
    { label: t('tours'), href: '/tours' },
    { label: tour.title, href: undefined },
  ]
  return (
    <section className={cn(container, 'pb-space-sm pt-space-md')}>
      <nav aria-label={tc('a11y.breadcrumb')} className="mb-space-sm">
        <ol className="flex flex-wrap items-center gap-space-xs font-caption text-caption text-on-surface-variant">
          {items.map((item, index) => (
            <Fragment key={index}>
              <li>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="tap-target relative rounded transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="font-semibold text-primary">
                    {item.label}
                  </span>
                )}
              </li>
              {index < items.length - 1 && (
                <li aria-hidden="true" className="flex items-center">
                  <Icon name="chevron_right" className="text-xs" />
                </li>
              )}
            </Fragment>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={breadcrumbListJsonLd(
          items.map((item) => ({
            name: item.label,
            url: localizedUrl(locale, item.href ?? `/tours/${tour.slug}`),
          })),
        )}
      />
    </section>
  )
}

/** Badges, kicker, h1 and the "Expedition Duration" box above the gallery. */
export function TourHeader({ tour }: { tour: TourDetail }) {
  const t = useTranslations('tourDetail.header')
  const tc = useTranslations('common')
  return (
    <div className="mb-space-lg flex flex-col gap-space-sm">
      {tour.badges.length > 0 && (
        <ul aria-label={t('badgesLabel')} className="flex flex-wrap items-center gap-space-xs">
          {tour.badges.map((badge, i) => (
            <li
              key={badge}
              className={cn(
                'rounded-full px-3 py-1 font-label-md text-label-md uppercase tracking-wider',
                BADGE_TONES[i % BADGE_TONES.length],
              )}
            >
              {badge}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
        <div>
          <span className="mb-1 block font-label-lg text-label-lg uppercase tracking-widest text-secondary">
            {t('kicker')}
          </span>
          <h1
            id="tour-title"
            className="font-headline-xl text-headline-xl tracking-tight text-primary md:text-display-lg"
          >
            {tour.title}
          </h1>
        </div>
        <div className="flex items-center gap-space-sm self-start rounded-xl bg-surface-container px-space-md py-space-sm shadow-sm lg:self-auto">
          <Icon name="schedule" className="text-2xl text-primary" />
          <div>
            <div className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
              {t('duration')}
            </div>
            <div className="font-headline-sm text-headline-sm font-bold text-primary">
              {tc('cards.duration', { nights: tour.durationNights, days: tour.durationDays })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** "Route Blueprint" strip under the gallery (ordered list of the route's places). */
export function RouteBlueprint({ route }: { route: string[] }) {
  const t = useTranslations('tourDetail.blueprint')
  if (route.length === 0) return null
  return (
    <div className="mt-space-md flex flex-col justify-between gap-space-sm rounded-xl bg-surface-container-low p-space-md md:flex-row md:items-center">
      <div className="flex shrink-0 items-center gap-space-sm text-primary">
        <Icon name="explore" className="text-xl text-secondary" />
        <span className="font-label-lg text-label-lg font-semibold uppercase tracking-wider">{t('title')}</span>
      </div>
      <ol
        aria-label={t('label')}
        className="flex flex-wrap items-center gap-2 font-body-md text-body-md text-on-surface"
      >
        {route.map((place, i) => (
          <li key={`${place}-${i}`} className="flex items-center gap-2">
            <span className="font-medium text-primary">{place}</span>
            {i < route.length - 1 && <Icon name="east" className="text-sm text-outline-variant" />}
          </li>
        ))}
      </ol>
    </div>
  )
}
