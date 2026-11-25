import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { getSettings } from '@/lib/api/public'
import type { PublicSettings } from '@/lib/api/types'
import { buildMetadata } from '@/lib/seo'
import { CustomTripBanner } from '@/components/tours/CustomTripBanner'
import { ToursCatalogue } from '@/components/tours/ToursCatalogue'
import { ToursClosingCta } from '@/components/tours/ToursClosingCta'
import { ToursFaq } from '@/components/tours/ToursFaq'
import { ToursHero } from '@/components/tours/ToursHero'
import { ToursCatalogueSkeleton, ToursFaqSkeleton } from '@/components/tours/ToursSkeletons'

const HERO_SLOT = 'tours-hero-nine-arches'
const CTA_SLOT = 'tours-cta-tea-valley-mist'

async function loadSettings(locale: Locale): Promise<PublicSettings | null> {
  try {
    return await getSettings(locale)
  } catch {
    return null // photos fall back to the sand placeholder; the rest of the page does not depend on settings
  }
}

export async function generateMetadata({ params }: PageProps<'/[locale]/tours'>): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = raw as Locale
  const t = await getTranslations({ locale, namespace: 'tours.meta' })
  const settings = await loadSettings(locale)
  return buildMetadata({
    locale,
    path: '/tours',
    title: t('title'),
    description: t('description'),
    image: settings?.pageImages?.[HERO_SLOT] ?? null,
  })
}

/** /tours — curated private tours with URL-synced filters (Stitch: serendiva_curated_tours_ceylon_private_journeys). */
export default async function ToursPage({ params }: PageProps<'/[locale]/tours'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const settings = await loadSettings(locale)

  return (
    <div className="flex w-full flex-col">
      <ToursHero image={settings?.pageImages?.[HERO_SLOT] ?? null} />
      <Suspense fallback={<ToursCatalogueSkeleton />}>
        <ToursCatalogue locale={locale} />
      </Suspense>
      <CustomTripBanner />
      <Suspense fallback={<ToursFaqSkeleton />}>
        <ToursFaq locale={locale} />
      </Suspense>
      <ToursClosingCta image={settings?.pageImages?.[CTA_SLOT] ?? null} />
    </div>
  )
}
