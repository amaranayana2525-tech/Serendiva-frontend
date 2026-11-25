import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { buildMetadata } from '@/lib/seo'
import { LegalPage } from '@/components/legal/LegalPage'

export async function generateMetadata({ params }: PageProps<'/[locale]/terms'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'legal.terms' })
  return buildMetadata({
    locale: locale as Locale,
    path: '/terms',
    title: t('meta.title'),
    description: t('meta.description'),
  })
}

/** /terms — editorial legal page (content: src/messages/<locale>/legal.json → terms). */
export default async function TermsPage({ params }: PageProps<'/[locale]/terms'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  return <LegalPage locale={locale as Locale} kind="terms" />
}
