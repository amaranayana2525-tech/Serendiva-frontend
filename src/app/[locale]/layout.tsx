import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { pickMessages } from '@/i18n/messages'
import { routing } from '@/i18n/routing'
import { publicEnv } from '@/lib/env'
import { DEFAULT_OG_IMAGE } from '@/lib/seo'
import { fontVariables } from '../fonts'
import '../globals.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const viewport: Viewport = {
  themeColor: '#fff9ee',
  width: 'device-width',
  initialScale: 1,
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const t = await getTranslations({ locale, namespace: 'common.meta' })
  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: { default: t('defaultTitle'), template: t('titleTemplate') },
    description: t('defaultDescription'),
    applicationName: t('siteName'),
    formatDetection: { telephone: false, email: false, address: false },
    openGraph: {
      type: 'website',
      siteName: t('siteName'),
      title: t('defaultTitle'),
      description: t('defaultDescription'),
      images: [{ ...DEFAULT_OG_IMAGE, alt: t('ogImageAlt') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('defaultTitle'),
      description: t('defaultDescription'),
      images: [DEFAULT_OG_IMAGE.url],
    },
  }
}

/** Root layout for every public (localised) route: <html lang>, fonts, next-intl provider (common messages only). */
export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html lang={locale} data-scroll-behavior="smooth" className={fontVariables}>
      <body className="relative min-h-screen bg-surface font-body-lg text-on-surface antialiased">
        <noscript>
          <style>{'[data-reveal]{opacity:1!important;transform:none!important}'}</style>
        </noscript>
        {/* Only `common` goes to the browser; pages wrap client islands that need their own namespace in <ClientMessages>. */}
        <NextIntlClientProvider messages={pickMessages(messages, ['common'])}>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
