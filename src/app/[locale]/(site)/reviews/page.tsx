import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import {
  ReviewsBrowserBlock,
  ReviewsCta,
  ReviewsFaq,
  ReviewsHero,
  ReviewsShareCta,
  ReviewVideos,
} from '@/components/reviews/ReviewsSections'
import { ClientMessages } from '@/i18n/ClientMessages'
import type { Locale } from '@/i18n/routing'
import { getReviewSummary, getSettings } from '@/lib/api/public'
import type { PublicSettings } from '@/lib/api/types'
import { buildMetadata } from '@/lib/seo'

async function loadSettings(locale: Locale): Promise<PublicSettings | null> {
  try {
    return await getSettings(locale)
  } catch (error) {
    console.error('[reviews] settings unavailable:', error instanceof Error ? error.message : error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps<'/[locale]/reviews'>): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = raw as Locale
  const t = await getTranslations({ locale, namespace: 'reviews' })
  const summary = await getReviewSummary().catch(() => null)
  return buildMetadata({
    locale,
    path: '/reviews',
    title: t('meta.title'),
    description:
      summary && summary.count > 0
        ? t('meta.description', { average: summary.average.toFixed(1), count: summary.count })
        : t('meta.descriptionFallback'),
  })
}

export default async function ReviewsPage({ params }: PageProps<'/[locale]/reviews'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const settings = await loadSettings(locale)

  return (
    <ClientMessages namespaces={['reviews']}>
      <ReviewsHero />
      <ReviewsBrowserBlock locale={locale} settings={settings} />
      <ReviewVideos locale={locale} />
      <ReviewsShareCta settings={settings} />
      <ReviewsFaq locale={locale} />
      <ReviewsCta />
    </ClientMessages>
  )
}
