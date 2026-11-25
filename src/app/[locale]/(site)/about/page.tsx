import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AboutCredentials } from '@/components/about/AboutCredentials'
import { AboutCta } from '@/components/about/AboutCta'
import { AboutEndorsement } from '@/components/about/AboutEndorsement'
import { AboutFleet } from '@/components/about/AboutFleet'
import { AboutHero } from '@/components/about/AboutHero'
import { AboutIntroVideo } from '@/components/about/AboutIntroVideo'
import { AboutPillars } from '@/components/about/AboutPillars'
import { AboutStory } from '@/components/about/AboutStory'
import { AboutTravelers } from '@/components/about/AboutTravelers'
import { EndorsementSkeleton } from '@/components/about/AboutSkeletons'
import { aboutPageJsonLd } from '@/components/about/aboutJsonLd'
import { pageImage } from '@/components/about/guide'
import { JsonLd } from '@/components/seo/JsonLdScript'
import type { Locale } from '@/i18n/routing'
import { getSettings } from '@/lib/api/public'
import type { PublicSettings } from '@/lib/api/types'
import { publicEnv } from '@/lib/env'
import { buildMetadata, localizedUrl } from '@/lib/seo'

/** Settings drive the photos, licence, languages and contact details; the page still renders (with placeholders) without them. */
async function loadSettings(locale: Locale): Promise<PublicSettings | null> {
  try {
    return await getSettings(locale)
  } catch (error) {
    console.error('[about] settings unavailable:', error instanceof Error ? error.message : error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps<'/[locale]/about'>): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = raw as Locale
  const t = await getTranslations({ locale, namespace: 'about' })
  const settings = await loadSettings(locale)
  const guide = settings?.guide
  return buildMetadata({
    locale,
    path: '/about',
    title: guide?.name ? t('meta.title', { name: guide.name }) : t('meta.titleFallback'),
    description: guide
      ? t('meta.description', {
          name: guide.name,
          years: guide.yearsGuiding,
          languages: guide.languages.join(', '),
        })
      : undefined,
    image: settings ? pageImage(settings, 'guide-portrait-sigiriya', guide?.portrait) : null,
  })
}

export default async function AboutPage({ params }: PageProps<'/[locale]/about'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'about' })
  const settings = await loadSettings(locale)

  return (
    <>
      <AboutHero settings={settings} />
      <AboutStory settings={settings} />
      <AboutIntroVideo settings={settings} />
      <AboutPillars />
      <AboutCredentials settings={settings} />
      <AboutFleet settings={settings} />
      <AboutTravelers />
      <Suspense fallback={<EndorsementSkeleton />}>
        <AboutEndorsement locale={locale} />
      </Suspense>
      <AboutCta settings={settings} />
      {settings && (
        <JsonLd
          data={aboutPageJsonLd({
            settings,
            url: localizedUrl(locale, '/about'),
            siteUrl: publicEnv.siteUrl,
            description: t('jsonLd.description'),
          })}
        />
      )}
    </>
  )
}

