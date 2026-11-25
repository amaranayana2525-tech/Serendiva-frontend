import 'server-only'
import { cache } from 'react'
import { getTranslations } from 'next-intl/server'
import { getGallery } from '@/lib/api/public'
import type { GalleryItem, Locale } from '@/lib/api/types'
import type { GalleryCategoryOption } from './GalleryFilters'

/** Gallery category slugs seeded by the API, in the Stitch chip order. CMS-added slugs follow, alphabetically. */
export const KNOWN_CATEGORIES = ['heritage', 'wildlife', 'tea-country', 'coasts', 'gastronomy', 'portraits'] as const
type KnownCategory = (typeof KNOWN_CATEGORIES)[number]
const isKnown = (slug: string): slug is KnownCategory => (KNOWN_CATEGORIES as readonly string[]).includes(slug)

/** "tea-country" → "Tea Country" for categories without a translated label. */
export const humanizeSlug = (slug: string) =>
  slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

export interface GalleryData {
  images: GalleryItem[]
  videos: GalleryItem[]
  /** Image categories with counts (chips) — only categories that contain photos. */
  categories: GalleryCategoryOption[]
  /** Label for every category slug present (photos and videos). */
  labels: Record<string, string>
}

/** One cached gallery request per render, shared by the hero counter, the chips, the grid and the film row. */
export const loadGallery = cache(async (locale: Locale): Promise<GalleryData> => {
  const [list, t] = await Promise.all([getGallery(locale), getTranslations({ locale, namespace: 'gallery' })])
  const images = list.items.filter((i) => i.type === 'image')
  const videos = list.items.filter((i) => i.type === 'video')

  const slugs = [...new Set(list.items.map((i) => i.category))].sort((a, b) => {
    const ia = KNOWN_CATEGORIES.indexOf(a as KnownCategory)
    const ib = KNOWN_CATEGORIES.indexOf(b as KnownCategory)
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    return a.localeCompare(b)
  })
  const labels = Object.fromEntries(
    slugs.map((slug) => [slug, isKnown(slug) ? t(`categories.${slug}`) : humanizeSlug(slug)]),
  )
  const categories = slugs
    .map((slug) => ({ slug, label: labels[slug]!, count: images.filter((i) => i.category === slug).length }))
    .filter((c) => c.count > 0)

  return { images, videos, categories, labels }
})
