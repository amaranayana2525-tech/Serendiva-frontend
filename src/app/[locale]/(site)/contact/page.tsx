import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { BookingFaq, BookingFaqSkeleton } from '@/components/contact/BookingFaq'
import { ConciergeCard, ConciergeCardSkeleton } from '@/components/contact/ConciergeCard'
import {
  AvailabilitySkeleton,
  ContactAvailability,
  EditorialPhoto,
  TrustBadges,
} from '@/components/contact/ContactAside'
import { ContactHero } from '@/components/contact/ContactHero'
import { CoverageSection } from '@/components/contact/CoverageSection'
import { InquiryWizard, type WizardAbout } from '@/components/contact/InquiryWizard'
import { addMonthsIso } from '@/components/contact/wizard-dates'
import { PlanningProcess } from '@/components/contact/PlanningProcess'
import { Container } from '@/components/ui/Container'
import { ClientMessages } from '@/i18n/ClientMessages'
import type { Locale } from '@/i18n/routing'
import { getAllTours, getAvailability, getDestination, getDestinations, getSettings, getTour } from '@/lib/api/public'
import type { PublicSettings } from '@/lib/api/types'
import { countryOptions } from '@/lib/countries'
import { parseContactPrefill, type ContactPrefill } from '@/lib/prefill'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata({ params }: PageProps<'/[locale]/contact'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'contact.meta' })
  return buildMetadata({ locale: locale as Locale, path: '/contact', title: t('title'), description: t('description') })
}

async function loadSettings(locale: Locale): Promise<PublicSettings | null> {
  try {
    return await getSettings(locale)
  } catch {
    return null
  }
}

/** Title for the "About: …" chip when the visitor arrives from a tour or destination page. */
async function loadAbout(locale: Locale, prefill: ContactPrefill): Promise<WizardAbout | null> {
  try {
    if (prefill.tour) {
      const tour = await getTour(locale, prefill.tour)
      if (tour) return { kind: 'tour', title: tour.title }
    }
    if (prefill.destination) {
      const destination = await getDestination(locale, prefill.destination)
      if (destination) return { kind: 'destination', title: destination.name }
    }
  } catch {
    // The chip is a nicety — the slug is still sent with the inquiry.
  }
  return null
}

/** /contact — "Plan My Trip" bespoke inquiry (Stitch: plan_my_trip_bespoke_inquiry_serendiva_sri_lanka). */
export default async function ContactPage({ params, searchParams }: PageProps<'/[locale]/contact'>) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale
  setRequestLocale(locale)

  const today = new Date().toISOString().slice(0, 10)
  const prefill = parseContactPrefill(await searchParams)
  const [settings, about, calendar, tourList, destinationList] = await Promise.all([
    loadSettings(locale),
    loadAbout(locale, prefill),
    getAvailability({ from: today, to: addMonthsIso(today, 18) }).catch(() => null),
    getAllTours(locale).catch(() => []),
    getDestinations(locale).catch(() => null),
  ])
  // Busy ranges for the wizard's exact-date warning (same cached call as the sidebar calendar).
  const busy = (calendar?.ranges ?? []).filter((r) => r.type === 'busy').map((r) => ({ start: r.startDate, end: r.endDate }))
  const tours = tourList.map((tour) => ({ slug: tour.slug, title: tour.title, durationDays: tour.durationDays }))
  const destinations = (destinationList?.items ?? []).map((dest) => ({
    slug: dest.slug,
    name: dest.name,
    region: dest.region?.name,
  }))
  const countries = countryOptions(locale)
  const guideName = settings?.guide.name ?? null
  const t = await getTranslations({ locale, namespace: 'contact.concierge' })

  return (
    <div className="relative w-full overflow-x-clip">
      {/* Subtle ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-10 top-96 h-[420px] w-[420px] rounded-full bg-secondary-container/10 blur-3xl"
      />

      <ContactHero guideName={guideName} />

      <Container className="relative pb-space-3xl">
        <div className="grid grid-cols-1 items-start gap-gutter-lg lg:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-space-lg lg:col-span-8">
            <ClientMessages namespaces={['contact']}>
              <InquiryWizard
                prefill={prefill}
                today={today}
                about={about}
                guideName={guideName ?? ''}
                busy={busy}
                countries={countries}
                calendar={calendar}
                tours={tours}
                destinations={destinations}
              />
            </ClientMessages>
            <TrustBadges licence={settings?.guide.licenseNumber ?? null} />
          </div>

          <aside
            aria-label={t('label')}
            className="flex min-w-0 flex-col gap-space-lg lg:sticky lg:top-28 lg:col-span-4"
          >
            <Suspense fallback={<ConciergeCardSkeleton />}>
              <ConciergeCard locale={locale} />
            </Suspense>
            <EditorialPhoto image={settings?.pageImages['plan-tea-train-vista'] ?? null} />
            <Suspense fallback={<AvailabilitySkeleton />}>
              <ContactAvailability locale={locale} calendar={calendar} />
            </Suspense>
          </aside>
        </div>
      </Container>

      <PlanningProcess />
      <CoverageSection locale={locale} contact={settings?.contact ?? null} />
      <Suspense fallback={<BookingFaqSkeleton />}>
        <BookingFaq locale={locale} />
      </Suspense>
    </div>
  )
}
