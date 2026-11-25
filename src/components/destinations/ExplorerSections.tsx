import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getFaqs, getSettings } from '@/lib/api/public'
import type { Locale } from '@/lib/api/types'
import { contactHref } from '@/lib/prefill'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { BestTimeMatrix, SeasonLegend } from '@/components/sections/BestTimeMatrix'
import { FaqSection } from '@/components/sections/FaqSection'
import { ErrorState } from '@/components/ui/ErrorState'
import { Icon } from '@/components/ui/Icon'
import { Skeleton } from '@/components/ui/Skeleton'
import { SmartImage } from '@/components/ui/SmartImage'
import { DestinationExplorer, DestinationExplorerStatic, type ExplorerRegion } from './DestinationExplorer'
import { buildMapModel, loadExplorerData } from './explorerData'
import { IslandMap, IslandMapStatic } from './IslandMap'
import { LoadingLabel } from '@/components/ui/LoadingLabel'

const logError = (section: string, error: unknown) =>
  console.error(`[destinations] ${section} unavailable:`, error instanceof Error ? error.message : error)

// ------------------------------------------------------------------------------------------------ map

/** Island map card (hubs from destination coordinates, legend from regions). */
export async function ExplorerMapSection({ locale }: { locale: Locale }) {
  let model
  try {
    model = buildMapModel(await loadExplorerData(locale))
  } catch (error) {
    logError('map', error)
    return <ErrorState retryHref="/destinations" className="bg-surface" />
  }
  return (
    <Suspense fallback={<IslandMapStatic {...model} />}>
      <IslandMap {...model} />
    </Suspense>
  )
}

export function MapSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex w-full flex-col gap-space-xl rounded-2xl bg-surface p-space-lg shadow-md md:p-space-xl lg:flex-row"
    >
      <Skeleton className="h-[460px] w-full rounded-xl md:h-[520px] lg:w-7/12" />
      <div className="flex w-full flex-col gap-space-xs lg:w-5/12">
        <Skeleton className="mb-space-sm h-5 w-56" />
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------------------------------------ curations grid

/** "Handpicked Destination Curations": search + region tabs + asymmetric grid. */
export async function ExplorerCurations({ locale }: { locale: Locale }) {
  let data
  try {
    data = await loadExplorerData(locale)
  } catch (error) {
    logError('curations', error)
    return <ErrorState retryHref="/destinations" />
  }
  const regions: ExplorerRegion[] = data.regions.map((r, i) => ({ slug: r.slug, name: r.name, toneIndex: i }))
  const props = { destinations: data.destinations, regions }
  return (
    <Suspense fallback={<DestinationExplorerStatic {...props} />}>
      <DestinationExplorer {...props} />
    </Suspense>
  )
}

export function CurationsSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col">
      <LoadingLabel />
      <div
        aria-hidden="true"
        className="mb-space-xl flex flex-col justify-between gap-space-md md:flex-row md:items-end"
      >
        <div className="flex flex-col gap-space-xs">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-80 max-w-full" />
        </div>
        <Skeleton className="h-11 w-full rounded-xl md:w-96" />
      </div>
      <Skeleton className="mb-space-2xl h-10 w-full rounded-xl" />
      <div aria-hidden="true" className="grid grid-cols-1 gap-gutter-lg md:grid-cols-2 lg:grid-cols-12">
        {['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-5', 'lg:col-span-7'].map((span, i) => (
          <div key={i} className={`${span} flex flex-col overflow-hidden rounded-2xl bg-surface shadow-sm`}>
            <Skeleton className="h-80 rounded-none" />
            <div className="flex flex-col gap-space-sm p-space-lg">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------------------------------------ seasonal matrix

/** Matrix rows from the regions' month ratings + the guide's personal insight. */
async function SeasonalMatrixBody({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'destinations' })
  let data
  try {
    data = await loadExplorerData(locale)
  } catch (error) {
    logError('seasonal matrix', error)
    return <ErrorState retryHref="/destinations" className="bg-surface" />
  }
  const settings = await getSettings(locale).catch(() => null)
  const guide = settings?.guide
  const portrait = settings?.pageImages['guide-portrait-tea-dusk'] ?? guide?.portrait ?? null
  return (
    <>
      <BestTimeMatrix regions={data.regions} caption={t('season.caption')} />
      {guide && t.has('insight.quote') && (
        <figure className="relative flex flex-col items-center gap-space-lg overflow-hidden rounded-2xl bg-surface p-space-lg shadow-sm md:flex-row md:p-space-xl">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-primary-container shadow-md">
            <SmartImage image={portrait} alt={guide.name} fill sizes="80px" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <span className="font-label-md text-label-md font-bold uppercase tracking-wider text-secondary">
              {t('insight.eyebrow', { name: guide.name })}
            </span>
            <blockquote className="font-headline-sm text-headline-sm font-normal italic text-primary">
              <p>{t('insight.quote')}</p>
            </blockquote>
            <figcaption className="mt-1 font-caption text-caption text-on-surface-variant">
              {t('insight.role', { title: guide.title })}
            </figcaption>
          </div>
          <Link
            href={contactHref({ source: 'destinations-seasonal-matrix' })}
            className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-primary px-space-lg py-space-sm font-label-lg text-label-lg text-on-primary shadow-sm transition-all hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 coarse:min-h-11"
          >
            {t('insight.cta')}
          </Link>
        </figure>
      )}
    </>
  )
}

export async function SeasonalSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'destinations.season' })
  return (
    <section
      aria-labelledby="seasonal-matrix-title"
      className="w-full bg-surface-container-low px-margin py-space-3xl md:px-margin-md lg:px-margin-lg"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col gap-space-2xl">
        <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
          <div className="flex flex-col gap-space-xs">
            <span className="font-label-lg text-label-lg uppercase tracking-wider text-secondary">{t('eyebrow')}</span>
            <h2
              id="seasonal-matrix-title"
              className="font-headline-xl text-headline-xl font-semibold tracking-tight text-primary"
            >
              {t('title')}
            </h2>
            <p className="max-w-2xl font-body-lg text-body-lg text-on-surface-variant">{t('intro')}</p>
          </div>
          <SeasonLegend />
        </div>
        <Suspense
          fallback={
            <div aria-hidden="true" className="flex flex-col gap-space-2xl">
              <Skeleton className="h-[460px] w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          }
        >
          <SeasonalMatrixBody locale={locale} />
        </Suspense>
      </div>
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ quiz banner

export async function QuizBanner({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'destinations.quiz' })
  const tc = await getTranslations({ locale, namespace: 'common.nav' })
  return (
    <section className="mx-auto w-full max-w-[1440px] px-margin py-space-3xl md:px-margin-md lg:px-margin-lg">
      <div className="relative w-full overflow-hidden rounded-2xl bg-primary p-space-xl text-on-primary shadow-xl md:p-space-3xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-secondary/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-tertiary-container/40 blur-3xl"
        />
        <div className="relative z-10 flex max-w-3xl flex-col gap-space-md">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-on-primary/10 px-space-md py-1 font-label-md text-label-md uppercase tracking-wider text-on-primary-container">
            <Icon name="tune" className="text-sm" />
            {t('kicker')}
          </span>
          <h2 className="font-headline-xl text-headline-xl font-semibold tracking-tight text-on-primary md:text-display-lg">
            {t('title')}
          </h2>
          <p className="font-body-xl text-body-xl text-on-primary/80">{t('body')}</p>
          <div className="flex flex-wrap items-center gap-space-md pt-space-sm">
            <Link
              href="/trip-quiz"
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-space-xl py-space-md font-label-lg text-label-lg text-on-secondary shadow-lg transition-all hover:bg-on-secondary-fixed-variant hover:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              <span>{t('cta')}</span>
              <Icon name="arrow_forward" className="text-base" />
            </Link>
            <WhatsAppLink
              page={tc('destinations')}
              className="inline-flex items-center gap-2 rounded-lg bg-on-primary/10 px-space-lg py-space-md font-label-lg text-label-lg text-on-primary backdrop-blur-sm transition-all hover:bg-on-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-primary"
            >
              <Icon name="chat" className="text-base text-tertiary-fixed" />
              <span>{t('whatsapp')}</span>
            </WhatsAppLink>
          </div>
        </div>
      </div>
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ FAQ

/** Regional FAQ block (general-scope FAQs from the CMS). Hidden when there are none. */
export async function ExplorerFaq({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'destinations.faq' })
  let items
  try {
    items = await getFaqs(locale, { scope: 'general' })
  } catch (error) {
    logError('faq', error)
    return (
      <section className="w-full bg-surface px-margin py-space-3xl md:px-margin-md lg:px-margin-lg">
        <div className="mx-auto max-w-[1000px]">
          <ErrorState retryHref="/destinations" />
        </div>
      </section>
    )
  }
  if (items.length === 0) return null
  return (
    <section
      aria-labelledby="destinations-faq-title"
      className="w-full bg-surface px-margin py-space-3xl md:px-margin-md lg:px-margin-lg"
    >
      <div className="mx-auto flex max-w-[1000px] flex-col gap-space-2xl">
        <div className="flex flex-col items-center gap-space-xs text-center">
          <span className="font-label-lg text-label-lg uppercase tracking-wider text-secondary">{t('eyebrow')}</span>
          <h2
            id="destinations-faq-title"
            className="font-headline-xl text-headline-xl font-semibold tracking-tight text-primary"
          >
            {t('title')}
          </h2>
          <p className="max-w-xl font-body-md text-body-md text-on-surface-variant">{t('intro')}</p>
        </div>
        <FaqSection
          items={items}
          title={null}
          openFirst={false}
          accordionClassNames={{
            itemClassName: 'rounded-xl bg-surface-container-low shadow-none transition-all duration-300',
            buttonClassName: 'px-space-lg py-space-md font-headline-sm text-[18px] font-semibold text-primary',
            iconClassName: 'text-primary duration-300',
            panelClassName: 'px-space-lg pb-space-md',
          }}
        />
      </div>
    </section>
  )
}

export function FaqSkeleton() {
  return (
    <div aria-hidden="true" className="mx-auto flex w-full max-w-[1000px] flex-col gap-space-sm px-margin py-space-3xl">
      <Skeleton className="mx-auto mb-space-2xl h-20 w-2/3" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  )
}
