import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { buildMetadata } from '@/lib/seo'
import { NewsletterTokenPage } from '@/components/newsletter/NewsletterTokenPage'

export async function generateMetadata({ params }: PageProps<'/[locale]/newsletter/confirm'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'newsletter.meta.confirm' })
  return buildMetadata({
    locale: locale as Locale,
    path: '/newsletter/confirm',
    title: t('title'),
    description: t('description'),
    noindex: true,
  })
}

/** /newsletter/confirm?token=… — link from the newsletter emails (double opt-in). */
export default async function NewsletterConfirmPage({ params }: PageProps<'/[locale]/newsletter/confirm'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  return <NewsletterTokenPage action="confirm" />
}
