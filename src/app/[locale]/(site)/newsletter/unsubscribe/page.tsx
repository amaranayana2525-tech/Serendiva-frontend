import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { buildMetadata } from '@/lib/seo'
import { NewsletterTokenPage } from '@/components/newsletter/NewsletterTokenPage'

export async function generateMetadata({ params }: PageProps<'/[locale]/newsletter/unsubscribe'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'newsletter.meta.unsubscribe' })
  return buildMetadata({
    locale: locale as Locale,
    path: '/newsletter/unsubscribe',
    title: t('title'),
    description: t('description'),
    noindex: true,
  })
}

/** /newsletter/unsubscribe?token=… — link from the newsletter emails (double opt-in). */
export default async function NewsletterUnsubscribePage({ params }: PageProps<'/[locale]/newsletter/unsubscribe'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  return <NewsletterTokenPage action="unsubscribe" />
}
