import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { countryOptions } from '@/components/reviews/countries'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { ShareAside, ShareHero } from '@/components/reviews/ShareSections'
import { ClientMessages } from '@/i18n/ClientMessages'
import type { Locale } from '@/i18n/routing'
import { getAllTours } from '@/lib/api/public'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata({ params }: PageProps<'/[locale]/reviews/share'>): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = raw as Locale
  const t = await getTranslations({ locale, namespace: 'reviews' })
  return buildMetadata({
    locale,
    path: '/reviews/share',
    title: t('form.meta.title'),
    description: t('form.meta.description'),
  })
}

export default async function ShareReviewPage({ params }: PageProps<'/[locale]/reviews/share'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  // The tour select is optional — the form still works (bespoke journey) if the catalogue cannot be loaded.
  const tours = await getAllTours(locale)
    .then((list) => list.map((tour) => ({ slug: tour.slug, title: tour.title })))
    .catch(() => [])
  const maxMonth = new Date().toISOString().slice(0, 7)

  return (
    <ClientMessages namespaces={['reviews']}>
      <ShareHero />
      <section className="w-full bg-surface py-space-2xl md:py-space-3xl">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-start gap-gutter-lg px-margin md:px-margin-md lg:grid-cols-12 lg:px-margin-lg">
          <div className="rounded-xl bg-surface p-space-lg shadow-xl ring-1 ring-surface-container-high md:p-space-2xl lg:col-span-8">
            <ReviewForm countries={countryOptions(locale)} tours={tours} maxMonth={maxMonth} />
          </div>
          <div className="lg:col-span-4">
            <ShareAside />
          </div>
        </div>
      </section>
    </ClientMessages>
  )
}
