import type { useTranslations } from 'next-intl'
import { isAdminLocale } from '@/lib/admin/translatable'

type FieldTranslator = ReturnType<typeof useTranslations<'adminTours.editor.fields'>>
type LocaleTranslator = ReturnType<typeof useTranslations<'admin.kit.locales'>>
type FieldKey = Parameters<FieldTranslator>[0]

/** API path segment → field label key (segments not listed are shown as they are). */
const TOP: Record<string, FieldKey> = {
  slug: 'slug',
  title: 'title',
  summary: 'summary',
  description: 'description',
  cardTag: 'cardTag',
  routeSummary: 'routeSummary',
  durationDays: 'durationDays',
  durationNights: 'durationNights',
  route: 'route',
  highlights: 'highlights',
  badges: 'badges',
  overview: 'overview',
  keyFeatures: 'keyFeatures',
  included: 'included',
  notIncluded: 'notIncluded',
  terrains: 'terrains',
  travellerTypes: 'travellerTypes',
  seasons: 'seasons',
  coverId: 'cover',
  gallery: 'gallery',
  categoryIds: 'categories',
  destinationIds: 'destinations',
  seoTitle: 'seoTitle',
  seoDescription: 'seoDescription',
  days: 'days',
}
const NESTED: Record<string, FieldKey> = {
  kicker: 'kicker',
  heading: 'heading',
  quote: 'quote',
  icon: 'icon',
  text: 'text',
  label: 'terrainLabel',
  place: 'terrainPlace',
  note: 'terrainNote',
  caption: 'caption',
}
const DAY: Record<string, FieldKey> = {
  title: 'dayTitle',
  description: 'dayDescription',
  drivingTime: 'drivingTime',
  meals: 'meals',
  overnightArea: 'overnightArea',
  details: 'details',
  stops: 'stops',
  isHighlight: 'isHighlight',
  name: 'stopName',
  lat: 'lat',
  lng: 'lng',
  label: 'detailLabel',
  value: 'detailValue',
}

/** "days.2.title.zh" → "Day 3 · Title (中文)"; "keyFeatures.en.1.text" → "Key features #2 · Text (EN)". */
export function describePath(path: string, tf: FieldTranslator, tl: LocaleTranslator): string {
  const parts = path.split('.')
  const out: string[] = []
  let locale: string | undefined
  const inDays = parts[0] === 'days'
  parts.forEach((part, i) => {
    if (isAdminLocale(part)) {
      locale = tl(`${part}.short`)
      return
    }
    if (/^\d+$/.test(part)) {
      const n = Number(part) + 1
      if (inDays && i === 1) out.splice(0, out.length, tf('dayN', { n }))
      else if (out.length) out[out.length - 1] = `${out[out.length - 1]} #${n}`
      return
    }
    const key = i === 0 ? TOP[part] : inDays ? DAY[part] : NESTED[part]
    out.push(key ? tf(key) : part)
  })
  const label = out.join(' · ') || path
  return locale ? `${label} (${locale})` : label
}
