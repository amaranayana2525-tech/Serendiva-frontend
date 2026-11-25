import type { Metadata } from 'next'
import { getPathname } from '@/i18n/navigation'
import { enabledLocales, type Locale } from '@/i18n/routing'
import type { ApiImage } from '@/lib/api/types'
import { publicEnv } from './env'

/** Open Graph locale codes. */
const OG_LOCALE: Record<Locale, string> = { en: 'en_GB', zh: 'zh_CN', de: 'de_DE' }

export const DEFAULT_OG_IMAGE = { url: '/brand/og-default.jpg', width: 1200, height: 630 }

/** Absolute URL of a locale-specific path ('/tours' → 'https://site/zh/tours' for zh; no prefix for en). */
export function localizedUrl(locale: Locale, path: string): string {
  const pathname = getPathname({ locale, href: path || '/' })
  return `${publicEnv.siteUrl}${pathname === '/' ? '' : pathname}` || publicEnv.siteUrl
}

/** hreflang map for the enabled locales (+ x-default = English). */
export function languageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const l of enabledLocales) languages[l] = localizedUrl(l, path)
  languages['x-default'] = localizedUrl('en', path)
  return languages
}

export interface BuildMetadataOptions {
  locale: Locale
  /** Locale-less path of the page, e.g. '/tours/cultural-odyssey' ('/' for home). */
  path: string
  /** Page title (the layout's template appends " · Serendiva"). Use `absoluteTitle` to skip the template. */
  title?: string
  absoluteTitle?: string
  description?: string
  /** API image or absolute/relative URL for og:image (defaults to /brand/og-default.jpg). */
  image?: ApiImage | string | null
  /** Exclude from search engines (thank-you pages, previews, the UI kit…). */
  noindex?: boolean
  /** og:type — 'article' for blog posts. */
  type?: 'website' | 'article'
  /** Article timestamps (ISO). */
  publishedTime?: string
  modifiedTime?: string
}

/**
 * Per-page metadata: canonical URL, hreflang alternates (enabled locales only), Open Graph and Twitter cards.
 *
 *   export async function generateMetadata({ params }: PageProps<'/[locale]/tours'>) {
 *     const { locale } = await params
 *     const t = await getTranslations({ locale, namespace: 'tours' })
 *     return buildMetadata({ locale, path: '/tours', title: t('meta.title'), description: t('meta.description') })
 *   }
 */
/** Search engines show ~160 characters; cut longer descriptions on a word boundary. */
export function clampDescription(text: string | undefined, max = 160): string | undefined {
  if (!text || text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > 100 ? cut.slice(0, space) : cut).replace(/[\s,;:.–—-]+$/, '')}…`
}

export function buildMetadata(options: BuildMetadataOptions): Metadata {
  const { locale, path, title, absoluteTitle, image, noindex, type = 'website' } = options
  const description = clampDescription(options.description)
  const url = localizedUrl(locale, path)
  const ogImage =
    image && typeof image === 'object'
      ? { url: image.url, width: image.width ?? undefined, height: image.height ?? undefined, alt: image.alt }
      : image
        ? { url: image }
        : DEFAULT_OG_IMAGE
  const resolvedTitle = absoluteTitle ? { absolute: absoluteTitle } : title
  const socialTitle = absoluteTitle ?? title

  return {
    ...(resolvedTitle ? { title: resolvedTitle } : {}),
    ...(description ? { description } : {}),
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type,
      url,
      locale: OG_LOCALE[locale],
      siteName: 'Serendiva',
      ...(socialTitle ? { title: socialTitle } : {}),
      ...(description ? { description } : {}),
      images: [ogImage],
      ...(type === 'article' && options.publishedTime ? { publishedTime: options.publishedTime } : {}),
      ...(type === 'article' && options.modifiedTime ? { modifiedTime: options.modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      ...(socialTitle ? { title: socialTitle } : {}),
      ...(description ? { description } : {}),
      images: [ogImage.url],
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  }
}
