import type { MetadataRoute } from 'next'
import { enabledLocales } from '@/i18n/routing'
import { getSitemapData } from '@/lib/api/public'
import { languageAlternates, localizedUrl } from '@/lib/seo'

/** Static public routes (locale-less). */
const STATIC_ROUTES: {
  path: string
  priority: number
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
}[] = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/tours', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/destinations', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/corporate', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/reviews', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/gallery', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/travel-guide', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/responsible-travel', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/trip-quiz', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.2, changeFrequency: 'yearly' },
]

export const revalidate = 3600

/** sitemap.xml — static routes + tours/destinations/blog from GET /sitemap-data, for every enabled locale with hreflang. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []
  const push = (path: string, extra: Omit<MetadataRoute.Sitemap[number], 'url'>) => {
    for (const locale of enabledLocales) {
      entries.push({ url: localizedUrl(locale, path), alternates: { languages: languageAlternates(path) }, ...extra })
    }
  }

  for (const route of STATIC_ROUTES)
    push(route.path, { changeFrequency: route.changeFrequency, priority: route.priority })

  try {
    const data = await getSitemapData()
    for (const t of data.tours)
      push(`/tours/${t.slug}`, { lastModified: t.updatedAt, changeFrequency: 'monthly', priority: 0.8 })
    for (const d of data.destinations)
      push(`/destinations/${d.slug}`, { lastModified: d.updatedAt, changeFrequency: 'monthly', priority: 0.7 })
    for (const b of data.blog)
      push(`/blog/${b.slug}`, { lastModified: b.updatedAt, changeFrequency: 'monthly', priority: 0.6 })
  } catch (error) {
    console.error('[sitemap] API unavailable — static routes only:', error instanceof Error ? error.message : error)
  }
  return entries
}
