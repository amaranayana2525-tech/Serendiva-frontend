import { getLocale, getTranslations } from 'next-intl/server'
import { SiteChrome } from '@/components/layout/SiteChrome'
import { NotFoundView } from '@/components/sections/NotFoundView'
import { isLocale, defaultLocale } from '@/i18n/routing'

/**
 * 404 for every localised route (unknown paths hit [...rest] → notFound(); detail pages call notFound() for bad slugs).
 *
 * No `generateMetadata` here on purpose: metadata is resolved outside the layout that calls setRequestLocale, so a
 * translated title would make next-intl read request headers — which breaks statically generated detail pages
 * ("Page changed from static to dynamic at runtime"). React 19 hoists the <title>/<meta> below into <head>.
 */
export default async function NotFound() {
  const requested = await getLocale()
  const locale = isLocale(requested) ? requested : defaultLocale
  const t = await getTranslations({ locale, namespace: 'common.notFound' })
  return (
    <SiteChrome locale={locale}>
      <title>{t('metaTitle')}</title>
      <meta name="robots" content="noindex, follow" />
      <NotFoundView />
    </SiteChrome>
  )
}
