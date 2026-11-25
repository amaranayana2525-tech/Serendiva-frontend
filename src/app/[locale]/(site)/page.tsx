import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { getSettings } from '@/lib/api/public'
import type { PublicSettings } from '@/lib/api/types'
import { publicEnv } from '@/lib/env'
import { buildMetadata, localizedUrl } from '@/lib/seo'
import { CategoriesSection } from '@/components/home/CategoriesSection'
import { CorporateSection } from '@/components/home/CorporateSection'
import { CraftSection } from '@/components/home/CraftSection'
import { DestinationsMosaic } from '@/components/home/DestinationsMosaic'
import { FaqClimateSection } from '@/components/home/FaqClimateSection'
import { FeaturedToursSection } from '@/components/home/FeaturedToursSection'
import { GuideIntro } from '@/components/home/GuideIntro'
import { HomeHero } from '@/components/home/HomeHero'
import { loadSection } from '@/components/home/loadSection'
import { ResponsibleBand } from '@/components/home/ResponsibleBand'
import { ReviewsSection } from '@/components/home/ReviewsSection'
import { StoriesSection } from '@/components/home/StoriesSection'
import { TrustStrip } from '@/components/home/TrustStrip'
import { FinalCta } from '@/components/sections/FinalCta'
import { travelAgencyJsonLd } from '@/components/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLdScript'

/** Settings are already fetched by the (site) layout — React `cache` dedupes this call within the request. */
async function loadSettings(locale: Locale): Promise<PublicSettings | null> {
  const result = await loadSection('settings', () => getSettings(locale))
  return result.ok ? result.data : null
}

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const [t, settings] = await Promise.all([getTranslations({ locale, namespace: 'home.meta' }), loadSettings(locale)])
  return buildMetadata({
    locale,
    path: '/',
    absoluteTitle: settings?.seo.defaultTitle || t('title'),
    description: settings?.seo.defaultDescription || t('description'),
    image: settings?.seo.ogImage ?? settings?.heroSlides[0] ?? null,
  })
}

/** Home — Stitch screen `serendiva_sri_lanka_tours_home_desktop` (13 sections, data from the API). */
export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [settings, t] = await Promise.all([loadSettings(locale), getTranslations({ locale, namespace: 'home' })])
  const contact = settings?.contact
  const whatsappNumber = contact?.whatsappDisplay || contact?.phone
  const tCta = await getTranslations({ locale, namespace: 'common.finalCta' })

  return (
    <>
      {settings && (
        <JsonLd
          data={travelAgencyJsonLd({
            settings,
            siteUrl: publicEnv.siteUrl,
            url: localizedUrl(locale, '/'),
            logoUrl: `${publicEnv.siteUrl}/brand/serendiva-logo.png`,
            imageUrl: settings.seo.ogImage?.url ?? settings.heroSlides[0]?.url,
          })}
        />
      )}
      <HomeHero locale={locale} settings={settings} today={new Date()} />
      <TrustStrip settings={settings} />
      <GuideIntro settings={settings} />
      <CategoriesSection locale={locale} />
      <FeaturedToursSection locale={locale} />
      <CraftSection settings={settings} />
      <DestinationsMosaic locale={locale} />
      <CorporateSection settings={settings} />
      <ReviewsSection locale={locale} />
      <ResponsibleBand />
      <FaqClimateSection locale={locale} />
      <StoriesSection locale={locale} settings={settings} />
      <FinalCta
        contact={contact}
        image={settings?.pageImages['home-cta-mountain-sunrise']}
        eyebrow={t('finalCta.eyebrow')}
        body={
          <>
            {whatsappNumber && (
              <>
                {tCta('whatsappLine')} <strong className="font-semibold text-secondary-fixed">{whatsappNumber}</strong>
                <br />
              </>
            )}
            {contact?.responseTime || tCta('responseLine', { time: tCta('responseDefault') })}
          </>
        }
      />
    </>
  )
}
