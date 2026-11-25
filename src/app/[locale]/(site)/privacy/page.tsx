import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { buildMetadata } from '@/lib/seo'
import { LegalPage } from '@/components/legal/LegalPage'

export async function generateMetadata({ params }: PageProps<'/[locale]/privacy'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'legal.privacy' })
  return buildMetadata({
    locale: locale as Locale,
    path: '/privacy',
    title: t('meta.title'),
    description: t('meta.description'),
  })
}

/** /privacy — editorial legal page (content: src/messages/<locale>/legal.json → privacy). */
export default async function PrivacyPage({ params }: PageProps<'/[locale]/privacy'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  return <LegalPage locale={locale as Locale} kind="privacy" />
}
