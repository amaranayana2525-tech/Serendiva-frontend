import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { PageBreadcrumbs } from '@/components/blog/PageBreadcrumbs'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { Skeleton } from '@/components/ui/Skeleton'
import { SmartImage } from '@/components/ui/SmartImage'
import { getSettings } from '@/lib/api/public'
import type { Locale, PublicSettings } from '@/lib/api/types'

/** Faint topographic contour lines behind the masthead (Stitch "Atmospheric Contour Lines"). */
export function ContourLines() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-multiply">
      <svg
        className="h-full w-full"
        fill="none"
        preserveAspectRatio="none"
        stroke="currentColor"
        viewBox="0 0 1440 600"
      >
        <path d="M-100 80 C 300 200, 700 40, 1100 120 C 1300 160, 1500 90, 1600 140" strokeWidth="1.5" />
        <path d="M-100 180 C 250 280, 600 120, 950 210 C 1200 270, 1400 180, 1600 230" strokeWidth="1.5" />
        <path d="M-100 280 C 200 360, 650 220, 1050 310 C 1300 360, 1450 300, 1600 330" strokeWidth="1.5" />
        <path d="M-100 380 C 350 420, 750 310, 1150 400 C 1350 440, 1500 380, 1600 420" strokeWidth="1.5" />
        <path d="M-100 480 C 400 520, 800 400, 1200 490 C 1400 520, 1500 470, 1600 510" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

/** Editorial masthead: breadcrumb, authority badge, h1, intro, live search (`search`) and the curator card (`curator`). */
export function GuideHero({ search, curator }: { search: ReactNode; curator: ReactNode }) {
  const t = useTranslations('travelGuide')
  return (
    <div className="relative w-full overflow-hidden bg-surface-container-low">
      <ContourLines />
      <Container className="relative z-10 pb-space-3xl pt-space-lg">
        <PageBreadcrumbs
          className="mb-space-xl"
          items={[{ label: t('breadcrumb.home'), href: '/' }, { label: t('breadcrumb.current') }]}
        />
        <div className="grid grid-cols-1 items-end gap-gutter-lg xl:grid-cols-12">
          <div className="flex flex-col gap-space-md xl:col-span-8">
            <div className="inline-flex max-w-fit items-center gap-space-xs rounded-full bg-surface-container-high/90 px-space-md py-space-xs shadow-sm">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-secondary" />
              <span className="font-label-md text-label-md uppercase tracking-widest text-on-surface">
                {t('hero.badge')}
              </span>
              <span className="hidden border-l border-on-surface-variant/20 pl-space-xs font-caption text-caption text-on-surface-variant sm:inline">
                {t('hero.updated')}
              </span>
            </div>
            <h1 className="font-display-lg font-headline-xl text-display-lg-mobile tracking-tight text-primary lg:text-display-lg">
              {t('hero.titleLine1')} <br className="hidden sm:block" />
              <span className="font-headline-xl font-normal italic">{t('hero.titleLine2')}</span>
            </h1>
            <p className="max-w-2xl font-body-xl text-body-xl font-light text-on-surface-variant">{t('hero.intro')}</p>
            {search}
          </div>
          <div className="flex max-w-md flex-col justify-end xl:col-span-4 xl:max-w-none">{curator}</div>
        </div>
      </Container>
    </div>
  )
}

/** "Curated by" vignette: guide portrait, name, licence and years from the CMS settings. */
export async function GuideCuratorCard({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'travelGuide.curator' })
  let settings: PublicSettings
  try {
    settings = await getSettings(locale)
  } catch {
    return null
  }
  const { guide, pageImages } = settings
  const portrait = pageImages['guide-portrait-naturalist'] ?? guide.portrait
  return (
    <div className="flex items-center gap-space-md rounded-xl bg-surface-container p-space-md shadow-md">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full shadow-inner">
        <SmartImage image={portrait} fill sizes="64px" className="h-full w-full object-cover object-top" />
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-headline-sm text-headline-sm font-medium text-primary">{guide.name}</span>
          <Icon name="verified" label={t('verified')} className="shrink-0 text-[18px] text-primary-container" />
        </div>
        {guide.licenseNumber && (
          <span className="mt-0.5 truncate font-label-md text-label-md uppercase tracking-widest text-secondary">
            {t('licence', { number: guide.licenseNumber })}
          </span>
        )}
        <p className="mt-1 line-clamp-2 font-caption text-caption text-on-surface-variant">
          {t('years', { years: guide.yearsGuiding })}
        </p>
      </div>
    </div>
  )
}

export function GuideCuratorCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-space-md rounded-xl bg-surface-container p-space-md shadow-md"
    >
      <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
}
