import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ClientMessages } from '@/i18n/ClientMessages'
import type { Locale } from '@/i18n/routing'
import { getSettings } from '@/lib/api/public'
import { buildMetadata } from '@/lib/seo'
import { ExplorerHero } from '@/components/destinations/ExplorerHero'
import {
  CurationsSkeleton,
  ExplorerCurations,
  ExplorerFaq,
  ExplorerMapSection,
  FaqSkeleton,
  MapSkeleton,
  QuizBanner,
  SeasonalSection,
} from '@/components/destinations/ExplorerSections'

export async function generateMetadata({ params }: PageProps<'/[locale]/destinations'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'destinations.meta' })
  return buildMetadata({
    locale: locale as Locale,
    path: '/destinations',
    title: t('title'),
    description: t('description'),
  })
}

/** /destinations — stylised island map, region tabs + curated grid, dual-monsoon matrix, quiz teaser, FAQ. */
export default async function DestinationsPage({ params }: PageProps<'/[locale]/destinations'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  // Only the licence number in the hero card depends on settings (already cached by the site layout).
  const settings = await getSettings(locale).catch(() => null)

  return (
    <ClientMessages namespaces={['destinations']}>
      <ExplorerHero license={settings?.guide.operatorLicense || null}>
        <Suspense fallback={<MapSkeleton />}>
          <ExplorerMapSection locale={locale} />
        </Suspense>
      </ExplorerHero>

      <section className="mx-auto w-full max-w-[1440px] px-margin py-space-3xl md:px-margin-md lg:px-margin-lg">
        <Suspense fallback={<CurationsSkeleton />}>
          <ExplorerCurations locale={locale} />
        </Suspense>
      </section>

      <SeasonalSection locale={locale} />
      <QuizBanner locale={locale} />

      <Suspense fallback={<FaqSkeleton />}>
        <ExplorerFaq locale={locale} />
      </Suspense>
    </ClientMessages>
  )
}
