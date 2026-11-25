import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Icon } from '@/components/ui/Icon'
import { Skeleton } from '@/components/ui/Skeleton'
import { SmartImage } from '@/components/ui/SmartImage'
import { Link } from '@/i18n/navigation'
import { getSettings } from '@/lib/api/public'
import type { ApiImage, Locale } from '@/lib/api/types'

const PARTNERS = [
  { key: 'weavers', image: 'responsible-dumbara-weaver' },
  { key: 'marine', image: 'responsible-marine-biologist' },
  { key: 'knuckles', image: 'responsible-knuckles-sapling' },
] as const

/** Blog category that collects the responsible-travel field notes. */
export const RESPONSIBLE_BLOG_CATEGORY = 'responsible-travel'

/** Section header (static) + link to the related journal category. */
export function ResponsiblePartnershipsHeader() {
  const t = useTranslations('responsible.partnerships')
  return (
    <div className="mb-space-2xl flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
      <div className="max-w-2xl">
        <span className="font-label-md text-label-md font-semibold uppercase tracking-[0.2em] text-secondary">
          {t('eyebrow')}
        </span>
        <h2 id="partnerships-title" className="mt-space-xs font-headline-xl text-headline-xl text-primary">
          {t('title')}
        </h2>
        <p className="mt-space-xs font-body-md text-body-md text-on-surface-variant">{t('intro')}</p>
      </div>
      <Link
        href={{ pathname: '/blog', query: { category: RESPONSIBLE_BLOG_CATEGORY } }}
        className="tap-target relative inline-flex w-fit shrink-0 items-center gap-1 rounded font-label-md text-label-md font-semibold uppercase tracking-wider text-primary transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <Icon name="menu_book" className="text-[18px] text-secondary" />
        {t('blogLink')}
        <Icon name="arrow_forward" className="text-[16px]" />
      </Link>
    </div>
  )
}

/** The three partnership vignettes; photos come from the CMS page images (sand placeholder if unavailable). */
export async function ResponsiblePartnerCards({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'responsible.partnerships' })
  let images: Record<string, ApiImage> = {}
  try {
    images = (await getSettings(locale)).pageImages
  } catch {
    images = {}
  }
  return (
    <ul className="grid grid-cols-1 gap-gutter md:grid-cols-3">
      {PARTNERS.map((partner) => (
        <li
          key={partner.key}
          className="group flex flex-col overflow-hidden rounded-xl bg-surface-container shadow-[0_16px_36px_-12px_rgba(43,43,43,0.06)]"
        >
          <div className="relative h-64 overflow-hidden">
            <SmartImage
              image={images[partner.image] ?? null}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <span className="absolute left-space-md top-space-md rounded-full bg-surface/90 px-space-sm py-1 font-label-md text-label-md uppercase tracking-wider text-primary backdrop-blur-sm">
              {t(`items.${partner.key}.badge`)}
            </span>
          </div>
          <div className="flex flex-grow flex-col justify-between p-space-lg">
            <div>
              <h3 className="mb-space-xs font-headline-sm text-headline-sm text-primary">
                {t(`items.${partner.key}.title`)}
              </h3>
              <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
                {t(`items.${partner.key}.body`)}
              </p>
            </div>
            <div className="mt-space-lg flex items-center justify-between gap-space-sm pt-space-sm text-secondary">
              <span className="font-label-md text-label-md font-semibold uppercase tracking-wider">
                {t(`items.${partner.key}.metaOne`)}
              </span>
              <span className="text-right font-label-md text-label-md">{t(`items.${partner.key}.metaTwo`)}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function ResponsiblePartnerCardsSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 gap-gutter md:grid-cols-3">
      {PARTNERS.map((partner) => (
        <div key={partner.key} className="flex flex-col overflow-hidden rounded-xl bg-surface-container">
          <Skeleton className="h-64 rounded-none" />
          <div className="flex flex-col gap-space-sm p-space-lg">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
