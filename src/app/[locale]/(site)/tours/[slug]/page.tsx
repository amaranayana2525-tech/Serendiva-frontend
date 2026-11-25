import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ClientMessages } from '@/i18n/ClientMessages'
import type { Locale } from '@/i18n/routing'
import { getAllTours, getSettings, getTour } from '@/lib/api/public'
import type { TourDetail } from '@/lib/api/types'
import { buildMetadata, localizedUrl } from '@/lib/seo'
import { WhatsAppContext } from '@/components/layout/SiteSettingsProvider'
import { FaqSection } from '@/components/sections/FaqSection'
import { InquirySidebarCard } from '@/components/sections/InquirySidebarCard'
import { touristTripJsonLd } from '@/components/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLdScript'
import { RelatedTours } from '@/components/tours/RelatedTours'
import { buildRouteStops } from '@/components/tours/route-stops'
import { StickySidebar } from '@/components/tours/StickySidebar'
import { TourAvailability, TourAvailabilitySkeleton } from '@/components/tours/TourAvailability'
import { TourGallery } from '@/components/tours/TourGallery'
import { RouteBlueprint, TourBreadcrumbs, TourHeader } from '@/components/tours/TourHeader'
import { TourInclusions } from '@/components/tours/TourInclusions'
import { upcomingMonths } from '@/components/tours/tour-inquiry'
import { TourInquiryForm } from '@/components/tours/TourInquiryForm'
import { TourItinerary } from '@/components/tours/TourItinerary'
import { TourOverview } from '@/components/tours/TourOverview'
import { TourReviews } from '@/components/tours/TourReviews'
import { TourRouteSection } from '@/components/tours/TourRouteSection'
import type { TourSectionId } from '@/components/tours/TourSubNav'
import { TourSubNav } from '@/components/tours/TourSubNav'

const container = 'mx-auto w-full max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg'

/** Every published tour slug for each locale (the [locale] layout generates the locales). */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  try {
    const tours = await getAllTours(params.locale as Locale)
    return tours.map((tour) => ({ slug: tour.slug }))
  } catch {
    return [] // API unreachable at build time → pages are rendered on demand (ISR)
  }
}

async function loadTour(locale: Locale, slug: string): Promise<TourDetail | null> {
  return getTour(locale, slug)
}

export async function generateMetadata({ params }: PageProps<'/[locale]/tours/[slug]'>): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  const tour = await loadTour(locale, slug).catch(() => null)
  if (!tour) {
    const tn = await getTranslations({ locale, namespace: 'common.notFound' })
    return { title: tn('metaTitle'), robots: { index: false, follow: true } }
  }
  const t = await getTranslations({ locale, namespace: 'tourDetail.meta' })
  return buildMetadata({
    locale,
    path: `/tours/${tour.slug}`,
    title: tour.seo.title || t('titleFallback', { title: tour.title }),
    description: tour.seo.description || tour.summary,
    image: tour.seo.image ?? tour.cover,
  })
}

/** /tours/[slug] — tour detail (Stitch: the_cultural_odyssey_8n_9d_tour_detail_serendiva). */
export default async function TourPage({ params }: PageProps<'/[locale]/tours/[slug]'>) {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  setRequestLocale(locale)

  const tour = await loadTour(locale, slug) // API errors bubble to error.tsx
  if (!tour) notFound()

  const [settings, allTours] = await Promise.all([
    getSettings(locale).catch(() => null),
    getAllTours(locale).catch(() => null),
  ])

  const gallery =
    tour.gallery.length > 0 ? tour.gallery : tour.cover ? [{ image: tour.cover, title: tour.title, caption: null }] : []
  const hasRoute = buildRouteStops(tour.days).length > 0 || tour.terrains.length > 0
  const sections: TourSectionId[] = [
    'overview',
    ...(tour.days.length > 0 ? (['itinerary'] as const) : []),
    ...(tour.included.length + tour.notIncluded.length > 0 ? (['inclusions'] as const) : []),
    ...(hasRoute ? (['route'] as const) : []),
    ...(tour.faqs.length > 0 ? (['faq'] as const) : []),
    ...(tour.reviews.length > 0 ? (['reviews'] as const) : []),
  ]
  const t = await getTranslations({ locale, namespace: 'tourDetail.faq' })

  return (
    <ClientMessages namespaces={['tourDetail']}>
      <div className="flex w-full flex-col">
        <WhatsAppContext tourTitle={tour.title} />
        <JsonLd data={touristTripJsonLd(tour, localizedUrl(locale, `/tours/${tour.slug}`))} />

        <TourBreadcrumbs tour={tour} />

        {/* Header block, editorial gallery, route blueprint */}
        <section aria-labelledby="tour-title" className={`${container} pb-space-xl`}>
          <TourHeader tour={tour} />
          <TourGallery items={gallery} tourTitle={tour.title} />
          <RouteBlueprint route={tour.route} />
        </section>

        <TourSubNav sections={sections} />

        <div className={`${container} py-space-2xl`}>
          <div className="grid grid-cols-1 items-start gap-space-xl lg:grid-cols-12">
            <div className="flex min-w-0 flex-col gap-space-3xl lg:col-span-8">
              <TourOverview tour={tour} guide={settings?.guide ?? null} />
              {sections.includes('itinerary') && <TourItinerary days={tour.days} />}
              {sections.includes('inclusions') && <TourInclusions tour={tour} />}
              {sections.includes('route') && <TourRouteSection tour={tour} />}
              {sections.includes('faq') && (
                <FaqSection
                  id="faq"
                  className="scroll-mt-36"
                  items={tour.faqs}
                  eyebrow={t('eyebrow')}
                  title={t('title')}
                  headingSize="lg"
                  openFirst={false}
                  accordionClassNames={{
                    itemClassName: 'shadow-none',
                    buttonClassName: 'font-medium',
                    iconClassName: 'text-primary',
                    panelClassName: 'leading-relaxed',
                  }}
                />
              )}
              {sections.includes('reviews') && <TourReviews tour={tour} />}
            </div>

            {/* Sticky inquiry card (after the content on phones) + availability */}
            <aside className="min-w-0 lg:col-span-4 lg:self-stretch">
              <StickySidebar className="flex flex-col gap-space-lg">
                <InquirySidebarCard id="tour-inquiry">
                  <TourInquiryForm
                    tourSlug={tour.slug}
                    tourTitle={tour.title}
                    months={upcomingMonths(new Date(), locale)}
                  />
                </InquirySidebarCard>
                <Suspense fallback={<TourAvailabilitySkeleton />}>
                  <TourAvailability />
                </Suspense>
              </StickySidebar>
            </aside>
          </div>
        </div>

        <RelatedTours tours={tour.related} totalTours={allTours?.length} />
      </div>
    </ClientMessages>
  )
}
