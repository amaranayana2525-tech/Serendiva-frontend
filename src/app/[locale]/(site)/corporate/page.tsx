import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { CorporateClients, CorporateClientsSkeleton } from '@/components/corporate/CorporateClients'
import { CorporateFaq, CorporateFaqSkeleton } from '@/components/corporate/CorporateFaq'
import { CorporateHero } from '@/components/corporate/CorporateHero'
import { CorporateRfp } from '@/components/corporate/CorporateRfp'
import {
  CorporateBlueprints,
  CorporateFinalCta,
  CorporateGovernance,
  CorporateProcess,
  CorporateServices,
  CorporateTestimonial,
} from '@/components/corporate/CorporateSections'
import { WhatsAppContext } from '@/components/layout/SiteSettingsProvider'
import type { Locale } from '@/i18n/routing'
import { getSettings } from '@/lib/api/public'
import type { PublicSettings } from '@/lib/api/types'
import { buildMetadata } from '@/lib/seo'

async function loadSettings(locale: Locale): Promise<PublicSettings | null> {
  try {
    return await getSettings(locale)
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps<'/[locale]/corporate'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'corporate.meta' })
  const settings = await loadSettings(locale as Locale)
  return buildMetadata({
    locale: locale as Locale,
    path: '/corporate',
    title: t('title'),
    description: t('description'),
    image: settings?.pageImages['corp-hero-boardroom-tea-estate'] ?? null,
  })
}

/** /corporate — corporate retreats & executive incentives (Stitch: corporate_expeditions_executive_retreats). */
export default async function CorporatePage({ params }: PageProps<'/[locale]/corporate'>) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale
  setRequestLocale(locale)

  const settings = await loadSettings(locale)
  const images = settings?.pageImages ?? {}
  const exampleYear = new Date().getFullYear() + 1

  return (
    <>
      <WhatsAppContext corporate />
      <CorporateHero image={images['corp-hero-boardroom-tea-estate'] ?? null} />
      <Suspense fallback={<CorporateClientsSkeleton />}>
        <CorporateClients locale={locale} />
      </Suspense>
      <CorporateServices images={images} />
      <CorporateProcess />
      <CorporateGovernance
        licence={settings?.guide.operatorLicense ?? null}
        guideName={settings?.guide.name.split(' ')[0] ?? null}
      />
      <CorporateBlueprints images={images} />
      <CorporateTestimonial portrait={images['corp-testimonial-portrait'] ?? null} />
      <CorporateRfp
        contact={settings?.contact ?? null}
        guideName={settings?.guide.name ?? null}
        exampleYear={exampleYear}
      />
      <Suspense fallback={<CorporateFaqSkeleton />}>
        <CorporateFaq locale={locale} />
      </Suspense>
      <CorporateFinalCta />
    </>
  )
}
