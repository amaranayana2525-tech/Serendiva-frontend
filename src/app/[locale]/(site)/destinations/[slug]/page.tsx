import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ClientMessages } from '@/i18n/ClientMessages'
import type { Locale } from '@/i18n/routing'
import { getDestination, getDestinations, getSettings } from '@/lib/api/public'
import { buildMetadata, localizedUrl } from '@/lib/seo'
import { WhatsAppContext } from '@/components/layout/SiteSettingsProvider'
import { JsonLd } from '@/components/seo/JsonLdScript'
import { splitDescription, upcomingMonths } from '@/components/destinations/content'
import { DestinationHero } from '@/components/destinations/DestinationHero'
import { DestinationInquiryCard } from '@/components/destinations/DestinationInquiryCard'
import {
  CuisineBlock,
  DestinationFaqs,
  DestinationMapSection,
  ExperiencesSection,
  FieldNotes,
  GuideNote,
  QuickFactsBar,
  StaysSection,
} from '@/components/destinations/DetailBlocks'
import { touristDestinationJsonLd } from '@/components/destinations/jsonld'
import { ConnectionsSkeleton, RegionalConnections } from '@/components/destinations/RegionalConnections'
import { RelatedJourneys } from '@/components/destinations/RelatedJourneys'

/** Pre-render every published destination per locale (ISR on demand for new ones; [] when the API is down). */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  try {
    const list = await getDestinations(params.locale as Locale)
    return list.items.map((d) => ({ slug: d.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: PageProps<'/[locale]/destinations/[slug]'>): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  const destination = await getDestination(locale, slug).catch(() => null)
  const path = `/destinations/${slug}`
  if (!destination) {
    const tn = await getTranslations({ locale, namespace: 'common.notFound' })
    return { title: tn('metaTitle'), robots: { index: false, follow: true } }
  }
  const t = await getTranslations({ locale, namespace: 'destinationDetail.meta' })
  return buildMetadata({
    locale,
    path,
    title: destination.seo.title || t('title', { name: destination.name }),
    description: destination.seo.description || destination.summary,
    image: destination.seo.image ?? destination.cover,
  })
}

/** Destination detail template (Stitch "Ella"): every block degrades gracefully when the CMS leaves it empty. */
export default async function DestinationPage({ params }: PageProps<'/[locale]/destinations/[slug]'>) {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  setRequestLocale(locale)

  const destination = await getDestination(locale, slug)
  if (!destination) notFound()
  const settings = await getSettings(locale).catch(() => null)
  const guide = settings?.guide ?? null
  const { lead, rest } = splitDescription(destination)
  const months = upcomingMonths(locale)

  return (
    <ClientMessages namespaces={['destinationDetail']}>
      <WhatsAppContext destinationName={destination.name} />
      <JsonLd
        data={touristDestinationJsonLd(destination, {
          url: localizedUrl(locale, `/destinations/${destination.slug}`),
          description: destination.seo.description || lead,
          regionUrl: destination.region
            ? localizedUrl(locale, `/destinations?region=${destination.region.slug}`)
            : undefined,
        })}
      />

      <DestinationHero destination={destination} lead={lead} />
      <QuickFactsBar name={destination.name} facts={destination.quickFacts} />

      <section className="mx-auto mb-space-3xl mt-space-3xl w-full max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
        <div className="grid grid-cols-1 items-start gap-gutter-lg lg:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-space-3xl lg:col-span-8">
            <GuideNote note={destination.guideNote} guide={guide} />
            <ExperiencesSection destination={destination} intro={rest} />
            <CuisineBlock cuisine={destination.cuisine} />
            <StaysSection name={destination.name} stays={destination.stays} />
            <FieldNotes name={destination.name} notes={destination.fieldNotes} />
            <DestinationMapSection destination={destination} />
            <DestinationFaqs name={destination.name} faqs={destination.faqs} />
          </div>
          <aside className="w-full lg:sticky lg:top-28 lg:col-span-4">
            <DestinationInquiryCard destination={destination} guide={guide} months={months} />
          </aside>
        </div>
      </section>

      <RelatedJourneys name={destination.name} slug={destination.slug} tours={destination.tours} />

      <Suspense fallback={<ConnectionsSkeleton />}>
        <RegionalConnections locale={locale} destination={destination} />
      </Suspense>
    </ClientMessages>
  )
}
