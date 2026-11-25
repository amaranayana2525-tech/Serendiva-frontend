import { Fragment, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { PageBreadcrumbs } from '@/components/blog/PageBreadcrumbs'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'
import { getSettings } from '@/lib/api/public'
import type { ApiImage, Locale } from '@/lib/api/types'
import { listEntries, loose } from '@/lib/page-content/lists'

const STATS = [
  { key: 'plastic', icon: 'water_drop' },
  { key: 'commission', icon: 'volunteer_activism' },
  { key: 'saplings', icon: 'forest' },
] as const

/** Breadcrumb strip with the commitment status on the right (Stitch "Top Scrim & Breadcrumbs Flow"). */
export function ResponsibleBreadcrumbBar() {
  const t = useTranslations('responsible')
  return (
    <div className="w-full bg-surface-container-low py-space-sm">
      <Container className="flex items-center justify-between gap-space-md">
        <PageBreadcrumbs items={[{ label: t('breadcrumb.home'), href: '/' }, { label: t('breadcrumb.current') }]} />
        <div className="hidden items-center gap-space-xs font-label-md text-label-md tracking-wider text-tertiary sm:flex">
          <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-tertiary-fixed-dim" />
          <span>{t('status')}</span>
        </div>
      </Container>
    </div>
  )
}

/** Deep-teal editorial hero over the rainforest photo (`photo` = <ResponsibleHeroPhoto/> in Suspense). */
export function ResponsibleHero({ photo }: { photo: ReactNode }) {
  const t = useTranslations('responsible.hero')
  const tl = loose(t)
  const stats = listEntries(tl.raw('stats'), STATS)
  return (
    <section aria-labelledby="responsible-title" className="relative w-full overflow-hidden bg-primary text-on-primary">
      <div aria-hidden="true" className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity">
        {photo}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-gradient-to-t from-primary via-primary/80 to-transparent"
      />
      <Container className="relative z-10 flex flex-col justify-end py-space-3xl lg:py-[7rem]">
        <div className="flex max-w-3xl flex-col gap-space-md">
          <div className="inline-flex items-center gap-space-xs self-start rounded-full bg-tertiary-container/80 px-space-md py-1.5 text-tertiary-fixed backdrop-blur-md">
            <Icon name="eco" filled className="shrink-0 text-[15px]" />
            <span className="font-label-md text-label-md uppercase tracking-[0.18em]">{t('badge')}</span>
          </div>
          <h1 id="responsible-title" className="font-display-lg text-display-lg tracking-tight text-on-primary">
            {t('title')}
          </h1>
          <p className="max-w-2xl font-body-xl text-body-xl font-light leading-relaxed text-on-primary/85">
            {t('intro')}
          </p>
          <div className="flex flex-wrap items-center gap-space-lg pt-space-md">
            {stats.map(({ key, icon }, index) => (
              <Fragment key={key}>
                {index > 0 && <span aria-hidden="true" className="hidden h-8 w-px bg-white/20 sm:block" />}
                <p className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                    {icon && <Icon name={icon} className="text-[20px]" />}
                  </span>
                  <span className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm leading-none">
                      {tl(`stats.${key}.value`)}
                    </span>
                    <span className="mt-1 font-caption text-caption uppercase tracking-wider text-on-primary/70">
                      {tl(`stats.${key}.label`)}
                    </span>
                  </span>
                </p>
              </Fragment>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}

/** CMS photo behind the hero (settings.pageImages['responsible-sinharaja-hero']); nothing if unavailable. */
export async function ResponsibleHeroPhoto({ locale }: { locale: Locale }) {
  let image: ApiImage | null = null
  try {
    image = (await getSettings(locale)).pageImages['responsible-sinharaja-hero'] ?? null
  } catch {
    image = null
  }
  if (!image) return null
  // Decorative: the photo sits under a 40% luminosity blend and a teal scrim.
  return <SmartImage image={image} alt="" fill priority sizes="100vw" className="scale-105 object-cover" />
}
