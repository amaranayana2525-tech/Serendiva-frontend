import { setRequestLocale } from 'next-intl/server'
import { SiteChrome } from '@/components/layout/SiteChrome'
import type { Locale } from '@/i18n/routing'

/** Public site chrome (Header, Footer, WhatsApp button, sticky inquiry tab, mobile action bar). */
export default async function SiteLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  return <SiteChrome locale={locale as Locale}>{children}</SiteChrome>
}
