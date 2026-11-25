import { SLUG_PATTERN } from '@/components/admin/kit/form/SlugField'
import { toGalleryWrite, type GalleryFieldItem } from '@/components/admin/kit/media/GalleryField'
import {
  ADMIN_LOCALES,
  compactOptional,
  compactRequired,
  hasContent,
  type AdminLocale,
  type Translatable,
} from '@/lib/admin/translatable'
import type { AdminDestination, AdminMediaRef, DestinationWrite } from '@/lib/api/types'

/**
 * Editing model of a destination. Every translatable value keeps all three locales as plain strings/lists while
 * editing (`PerLocale`); `toDestinationWrite()` drops untranslated locales right before sending (the API rejects ""
 * for zh/de on required fields). Lists keep their indexes so API errors (`quickFacts.zh.2.icon`) land on the right row.
 */

export type PerLocale<T> = Record<AdminLocale, T>

export interface QuickFact {
  icon: string
  label: string
  value: string
  note: string
}
export interface Perk {
  icon: string
  label: string
}
export interface GuideNote {
  heading: string
  paragraphs: string[]
  perks: Perk[]
}
export interface Feature {
  icon: string
  title: string
  text: string
}
export interface Experience {
  kicker: string
  meta: string
  title: string
  text: string
  tagIcon: string
  tagLabel: string
  imageId: string | null
}
export interface Cuisine {
  heading: string
  intro: string
  items: Feature[]
}
export interface Stay {
  icon: string
  category: string
  title: string
  text: string
  features: string[]
  imageId: string | null
}
export interface MapPoint {
  name: string
  lat: number | null
  lng: number | null
}

export const TEXT_FIELDS = [
  'name',
  'headline',
  'tagline',
  'summary',
  'description',
  'metaLabel',
  'badge',
  'bestTimeLabel',
  'seoTitle',
  'seoDescription',
] as const
export type TextField = (typeof TEXT_FIELDS)[number]

/** The value of every translatable field in ONE locale. */
export interface LocalizedValues extends Record<TextField, string> {
  curations: string[]
  quickFacts: QuickFact[]
  guideNote: GuideNote
  experiences: Experience[]
  cuisine: Cuisine
  stays: Stay[]
  fieldNotes: Feature[]
  interests: string[]
}
export type LocalizedKey = keyof LocalizedValues
export type LocalizedFields = { [K in LocalizedKey]: PerLocale<LocalizedValues[K]> }

export interface DestinationForm extends LocalizedFields {
  slug: string
  status: 'draft' | 'published'
  order: number
  /** '' = no region. */
  regionId: string
  mapPoints: MapPoint[]
  latitude: number | null
  longitude: number | null
  elevation: number | null
  cover: AdminMediaRef | null
  gallery: GalleryFieldItem[]
}

/** Max lengths / counts — mirror destinations.schemas.ts in the API. */
export const LIMITS = {
  name: 120,
  headline: 250,
  tagline: 250,
  summary: 1000,
  description: 50_000,
  metaLabel: 120,
  badge: 80,
  bestTimeLabel: 120,
  seoTitle: 70,
  seoDescription: 170,
  curations: 6,
  curation: 200,
  quickFacts: 8,
  quickFactLabel: 80,
  quickFactValue: 120,
  quickFactNote: 300,
  guideHeading: 200,
  paragraphs: 8,
  paragraph: 2000,
  perks: 6,
  perkLabel: 80,
  experiences: 12,
  experienceKicker: 80,
  experienceMeta: 160,
  experienceTitle: 200,
  experienceText: 1500,
  tagLabel: 80,
  cuisineHeading: 200,
  cuisineIntro: 1500,
  cuisineItems: 8,
  featureTitle: 160,
  featureText: 600,
  stays: 8,
  stayCategory: 80,
  stayTitle: 200,
  stayText: 1500,
  stayFeatures: 8,
  stayFeature: 80,
  fieldNotes: 10,
  interests: 12,
  interest: 60,
  mapPoints: 30,
  mapPointName: 120,
  gallery: 40,
} as const

export const LOCALIZED_KEYS: readonly LocalizedKey[] = [
  ...TEXT_FIELDS,
  'curations',
  'quickFacts',
  'guideNote',
  'experiences',
  'cuisine',
  'stays',
  'fieldNotes',
  'interests',
]

export const ICON_PATTERN = /^[a-z0-9_]{2,60}$/

const perLocale = <T>(make: () => T): PerLocale<T> => ({ en: make(), zh: make(), de: make() })

export const emptyQuickFact = (): QuickFact => ({ icon: '', label: '', value: '', note: '' })
export const emptyPerk = (): Perk => ({ icon: '', label: '' })
export const emptyGuideNote = (): GuideNote => ({ heading: '', paragraphs: [], perks: [] })
export const emptyFeature = (): Feature => ({ icon: '', title: '', text: '' })
export const emptyExperience = (): Experience => ({
  kicker: '',
  meta: '',
  title: '',
  text: '',
  tagIcon: '',
  tagLabel: '',
  imageId: null,
})
export const emptyCuisine = (): Cuisine => ({ heading: '', intro: '', items: [] })
export const emptyStay = (): Stay => ({ icon: '', category: '', title: '', text: '', features: [], imageId: null })
export const emptyMapPoint = (): MapPoint => ({ name: '', lat: null, lng: null })

export function emptyDestinationForm(): DestinationForm {
  const text = () => perLocale(() => '')
  return {
    slug: '',
    status: 'draft',
    order: 0,
    regionId: '',
    name: text(),
    headline: text(),
    tagline: text(),
    summary: text(),
    description: text(),
    metaLabel: text(),
    badge: text(),
    bestTimeLabel: text(),
    seoTitle: text(),
    seoDescription: text(),
    curations: perLocale(() => []),
    quickFacts: perLocale(() => []),
    guideNote: perLocale(emptyGuideNote),
    experiences: perLocale(() => []),
    cuisine: perLocale(emptyCuisine),
    stays: perLocale(() => []),
    fieldNotes: perLocale(() => []),
    interests: perLocale(() => []),
    mapPoints: [],
    latitude: null,
    longitude: null,
    elevation: null,
    cover: null,
    gallery: [],
  }
}

// ---------------------------------------------------------------------------------------------- API → form

type Rec<T> = Record<string, T> | null | undefined

function fromRecord<T, U>(value: Rec<T>, map: (v: T) => U, empty: () => U): PerLocale<U> {
  const out = {} as PerLocale<U>
  for (const locale of ADMIN_LOCALES) {
    const v = value?.[locale]
    out[locale] = v === undefined || v === null ? empty() : map(v)
  }
  return out
}

const str = (v: string | null | undefined) => v ?? ''

export function toDestinationForm(d: AdminDestination): DestinationForm {
  const text = (v: Rec<string>) => fromRecord(v, (s) => s, () => '')
  return {
    slug: d.slug,
    status: d.status,
    order: d.order,
    regionId: d.regionId ?? '',
    name: text(d.name),
    headline: text(d.headline),
    tagline: text(d.tagline),
    summary: text(d.summary),
    description: text(d.description),
    metaLabel: text(d.metaLabel),
    badge: text(d.badge),
    bestTimeLabel: text(d.bestTimeLabel),
    seoTitle: text(d.seoTitle),
    seoDescription: text(d.seoDescription),
    curations: fromRecord(d.curations, (l) => [...l], () => []),
    quickFacts: fromRecord(
      d.quickFacts,
      (l) => l.map((q) => ({ icon: q.icon, label: q.label, value: q.value, note: str(q.note) })),
      () => [],
    ),
    guideNote: fromRecord(
      d.guideNote,
      (g) => ({ heading: g.heading, paragraphs: [...g.paragraphs], perks: (g.perks ?? []).map((p) => ({ ...p })) }),
      emptyGuideNote,
    ),
    experiences: fromRecord(
      d.experiences,
      (l) =>
        l.map((e) => ({
          kicker: str(e.kicker),
          meta: str(e.meta),
          title: e.title,
          text: e.text,
          tagIcon: str(e.tagIcon),
          tagLabel: str(e.tagLabel),
          imageId: e.imageId ?? null,
        })),
      () => [],
    ),
    cuisine: fromRecord(
      d.cuisine,
      (c) => ({ heading: c.heading, intro: str(c.intro), items: c.items.map((i) => ({ ...i })) }),
      emptyCuisine,
    ),
    stays: fromRecord(
      d.stays,
      (l) =>
        l.map((s) => ({
          icon: str(s.icon),
          category: s.category,
          title: s.title,
          text: s.text,
          features: [...(s.features ?? [])],
          imageId: s.imageId ?? null,
        })),
      () => [],
    ),
    fieldNotes: fromRecord(d.fieldNotes, (l) => l.map((f) => ({ ...f })), () => []),
    interests: fromRecord(d.interests, (l) => [...l], () => []),
    mapPoints: d.mapPoints.map((p) => ({ name: p.name, lat: p.lat, lng: p.lng })),
    latitude: d.latitude,
    longitude: d.longitude,
    elevation: d.elevation,
    cover: d.cover,
    gallery: d.gallery.map((g) => ({ mediaId: g.mediaId, media: g.media, caption: g.caption ?? null })),
  }
}

// ---------------------------------------------------------------------------------------------- form → API

const opt = (v: string) => (v.trim() ? v : undefined)
const strings = (list: readonly string[]) => list.filter((s) => s.trim())

/** Per-locale lists/blocks → `{ en?, zh?, de? }` without empty locales, or null. */
function perLocaleOptional<T, U>(value: PerLocale<T>, map: (v: T) => U): Translatable<U> | null {
  const out: Translatable<U> = {}
  for (const locale of ADMIN_LOCALES) {
    const mapped = map(value[locale])
    if (hasContent(mapped)) out[locale] = mapped
  }
  return Object.keys(out).length ? out : null
}

export function toDestinationWrite(form: DestinationForm): DestinationWrite {
  return {
    slug: form.slug.trim(),
    status: form.status,
    order: form.order,
    regionId: form.regionId || null,
    name: compactRequired(form.name, ''),
    headline: compactOptional(form.headline),
    tagline: compactOptional(form.tagline),
    summary: compactRequired(form.summary, ''),
    description: compactOptional(form.description),
    metaLabel: compactOptional(form.metaLabel),
    badge: compactOptional(form.badge),
    bestTimeLabel: compactOptional(form.bestTimeLabel),
    curations: perLocaleOptional(form.curations, strings),
    quickFacts: perLocaleOptional(form.quickFacts, (l) =>
      l.map((q) => ({ icon: q.icon, label: q.label, value: q.value, note: opt(q.note) })),
    ),
    guideNote: perLocaleOptional(form.guideNote, (g) => ({
      heading: g.heading,
      paragraphs: strings(g.paragraphs),
      perks: g.perks.map((p) => ({ icon: p.icon, label: p.label })),
    })),
    experiences: perLocaleOptional(form.experiences, (l) =>
      l.map((e) => ({
        kicker: opt(e.kicker),
        meta: opt(e.meta),
        title: e.title,
        text: e.text,
        tagIcon: opt(e.tagIcon),
        tagLabel: opt(e.tagLabel),
        imageId: e.imageId,
      })),
    ),
    cuisine: perLocaleOptional(form.cuisine, (c) => ({
      heading: c.heading,
      intro: opt(c.intro),
      items: c.items.map((i) => ({ icon: i.icon, title: i.title, text: i.text })),
    })),
    stays: perLocaleOptional(form.stays, (l) =>
      l.map((s) => ({
        icon: opt(s.icon),
        category: s.category,
        title: s.title,
        text: s.text,
        features: strings(s.features),
        imageId: s.imageId,
      })),
    ),
    fieldNotes: perLocaleOptional(form.fieldNotes, (l) => l.map((f) => ({ icon: f.icon, title: f.title, text: f.text }))),
    interests: perLocaleOptional(form.interests, strings),
    mapPoints: form.mapPoints.map((p) => ({ name: p.name, lat: p.lat ?? Number.NaN, lng: p.lng ?? Number.NaN })),
    latitude: form.latitude,
    longitude: form.longitude,
    elevation: form.elevation,
    coverId: form.cover?.id ?? null,
    gallery: toGalleryWrite(form.gallery),
    seoTitle: compactOptional(form.seoTitle),
    seoDescription: compactOptional(form.seoDescription),
  }
}

// ---------------------------------------------------------------------------------------------- validation

export type FieldErrors = Record<string, string>

export interface ValidationMessages {
  required: string
  icon: string
  slug: string
  number: string
}

/**
 * Client-side checks before sending (the API validates again — its errors use the same paths).
 * Only locales/items that have content are checked, so an untranslated locale never blocks saving.
 */
export function validateDestination(form: DestinationForm, m: ValidationMessages): FieldErrors {
  const errors: FieldErrors = {}
  const need = (path: string, value: string) => {
    if (!value.trim()) errors[path] ??= m.required
  }
  const icon = (path: string, value: string, required = true) => {
    if (!value.trim()) {
      if (required) errors[path] ??= m.icon
    } else if (!ICON_PATTERN.test(value)) errors[path] ??= m.icon
  }

  if (!form.slug.trim()) errors.slug = m.required
  else if (!SLUG_PATTERN.test(form.slug) || form.slug.length < 2) errors.slug = m.slug
  need('name.en', form.name.en)
  need('summary.en', form.summary.en)

  for (const locale of ADMIN_LOCALES) {
    form.quickFacts[locale].forEach((q, i) => {
      const p = `quickFacts.${locale}.${i}`
      icon(`${p}.icon`, q.icon)
      need(`${p}.label`, q.label)
      need(`${p}.value`, q.value)
    })
    const g = form.guideNote[locale]
    if (hasContent(g)) {
      need(`guideNote.${locale}.heading`, g.heading)
      g.perks.forEach((perk, i) => {
        icon(`guideNote.${locale}.perks.${i}.icon`, perk.icon)
        need(`guideNote.${locale}.perks.${i}.label`, perk.label)
      })
    }
    form.fieldNotes[locale].forEach((f, i) => {
      icon(`fieldNotes.${locale}.${i}.icon`, f.icon)
      need(`fieldNotes.${locale}.${i}.title`, f.title)
    })
    form.experiences[locale].forEach((e, i) => {
      need(`experiences.${locale}.${i}.title`, e.title)
      icon(`experiences.${locale}.${i}.tagIcon`, e.tagIcon, false)
    })
    const c = form.cuisine[locale]
    if (hasContent(c)) {
      need(`cuisine.${locale}.heading`, c.heading)
      c.items.forEach((item, i) => {
        icon(`cuisine.${locale}.items.${i}.icon`, item.icon)
        need(`cuisine.${locale}.items.${i}.title`, item.title)
      })
    }
    form.stays[locale].forEach((s, i) => {
      need(`stays.${locale}.${i}.category`, s.category)
      need(`stays.${locale}.${i}.title`, s.title)
      icon(`stays.${locale}.${i}.icon`, s.icon, false)
    })
  }
  form.mapPoints.forEach((p, i) => {
    need(`mapPoints.${i}.name`, p.name)
    if (p.lat === null || !Number.isFinite(p.lat)) errors[`mapPoints.${i}.lat`] = m.number
    if (p.lng === null || !Number.isFinite(p.lng)) errors[`mapPoints.${i}.lng`] = m.number
  })
  return errors
}

// ---------------------------------------------------------------------------------------------- tabs

export const EDITOR_TABS = ['overview', 'highlights', 'experiences', 'food', 'media', 'seo'] as const
export type EditorTab = (typeof EDITOR_TABS)[number]

const TAB_OF: Record<string, EditorTab> = {
  slug: 'overview',
  status: 'overview',
  order: 'overview',
  regionId: 'overview',
  name: 'overview',
  headline: 'overview',
  tagline: 'overview',
  summary: 'overview',
  description: 'overview',
  metaLabel: 'overview',
  badge: 'overview',
  bestTimeLabel: 'overview',
  curations: 'overview',
  latitude: 'overview',
  longitude: 'overview',
  elevation: 'overview',
  quickFacts: 'highlights',
  guideNote: 'highlights',
  fieldNotes: 'highlights',
  interests: 'highlights',
  experiences: 'experiences',
  cuisine: 'food',
  stays: 'food',
  mapPoints: 'media',
  coverId: 'media',
  gallery: 'media',
  seoTitle: 'seo',
  seoDescription: 'seo',
}

/** Tab that shows the field of an error path ('stays.zh.1.title' → 'food'). */
export const tabOfPath = (path: string): EditorTab => TAB_OF[path.split('.')[0] ?? ''] ?? 'overview'

/** Number of errors per tab (tab error dots). */
export function errorsByTab(errors: FieldErrors): Record<EditorTab, number> {
  const out = Object.fromEntries(EDITOR_TABS.map((t) => [t, 0])) as Record<EditorTab, number>
  for (const path of Object.keys(errors)) out[tabOfPath(path)]++
  return out
}

/** Which locales have any content in a per-locale value (LocaleTabs dots). */
export function filledLocales(form: DestinationForm): PerLocale<boolean> {
  const out: PerLocale<boolean> = { en: false, zh: false, de: false }
  for (const locale of ADMIN_LOCALES) {
    out[locale] = LOCALIZED_KEYS.some((f) => hasContent(form[f][locale]))
  }
  return out
}
