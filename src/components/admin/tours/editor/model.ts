import { SLUG_PATTERN } from '@/components/admin/kit/form/SlugField'
import { toGalleryWrite, type GalleryFieldItem } from '@/components/admin/kit/media/GalleryField'
import {
  ADMIN_LOCALES,
  compactOptional,
  compactRequired,
  hasContent,
  localeFromPath,
  localesWithContent,
  toEditable,
  type AdminLocale,
} from '@/lib/admin/translatable'
import type { AdminMediaRef, AdminTour, TourWrite, TravellerType } from '@/lib/api/types'
import type { TourStatus } from '../api'

/**
 * Editing model of the tour editor. Every translatable value keeps all three locales as strings / lists while editing;
 * `toWrite()` normalises right before sending (drops untranslated zh/de, never sends "" for required fields).
 */

export type L = Record<AdminLocale, string>
export type LList<T> = Record<AdminLocale, T[]>

export interface FeatureForm {
  icon: string
  title: string
  text: string
}
export interface IconTextForm {
  icon: string
  text: string
}
export interface TerrainForm {
  label: string
  place: string
  note: string
}
export interface LabelValueForm {
  label: string
  value: string
}
export interface OverviewForm {
  kicker: string
  heading: string
  quote: string
}
export interface StopForm {
  name: string
  lat: number | null
  lng: number | null
}
export interface DayForm {
  title: L
  description: L
  drivingTime: L
  meals: L
  overnightArea: L
  details: LList<LabelValueForm>
  isHighlight: boolean
  stops: StopForm[]
}

export const SEASONS = ['nov-apr', 'may-sep', 'jul-aug', 'year-round'] as const
export type Season = (typeof SEASONS)[number]
export const TRAVELLER_TYPES = ['couple', 'family', 'group', 'solo', 'corporate'] as const satisfies readonly TravellerType[]

export interface TourForm {
  slug: string
  status: TourStatus
  order: number
  isFeatured: boolean
  isMostPopular: boolean
  title: L
  summary: L
  description: L
  cardTag: L
  durationDays: number | null
  durationNights: number | null
  route: string[]
  highlights: LList<string>
  badges: LList<string>
  overview: Record<AdminLocale, OverviewForm>
  keyFeatures: LList<FeatureForm>
  included: LList<IconTextForm>
  notIncluded: LList<IconTextForm>
  terrains: LList<TerrainForm>
  routeSummary: L
  travellerTypes: TravellerType[]
  seasons: Season[]
  cover: AdminMediaRef | null
  gallery: GalleryFieldItem[]
  days: DayForm[]
  categoryIds: string[]
  destinationIds: string[]
  seoTitle: L
  seoDescription: L
}

/** Limits mirrored from the API (tours.schemas.ts / content-schemas.ts). */
export const LIMITS = {
  title: 160,
  summary: 800,
  description: 50_000,
  cardTag: 60,
  routeSummary: 200,
  route: { max: 20, length: 80 },
  highlights: { max: 12, length: 120 },
  badges: { max: 8, length: 60 },
  overview: { kicker: 80, heading: 200, quote: 800 },
  keyFeatures: { max: 8, title: 160, text: 600 },
  included: { max: 20, text: 400 },
  terrains: { max: 6, label: 80, place: 120, note: 400 },
  duration: { min: 1, max: 60 },
  categories: 12,
  destinations: 30,
  gallery: 40,
  travellerTypes: 5,
  days: 60,
  day: { title: 200, description: 10_000, drivingTime: 120, meals: 160, overnightArea: 160 },
  details: { max: 12, label: 80, value: 300 },
  stops: { max: 20, name: 120 },
  seoTitle: 70,
  seoDescription: 170,
} as const

// ------------------------------------------------------------------------------------------------ constructors

export const emptyL = (): L => ({ en: '', zh: '', de: '' })
export const emptyLList = <T>(): LList<T> => ({ en: [], zh: [], de: [] })
const emptyOverview = (): OverviewForm => ({ kicker: '', heading: '', quote: '' })

export const newFeature = (): FeatureForm => ({ icon: 'star', title: '', text: '' })
export const newIncluded = (): IconTextForm => ({ icon: 'check_circle', text: '' })
export const newNotIncluded = (): IconTextForm => ({ icon: 'block', text: '' })
export const newTerrain = (): TerrainForm => ({ label: '', place: '', note: '' })
export const newDetail = (): LabelValueForm => ({ label: '', value: '' })
export const newStop = (): StopForm => ({ name: '', lat: null, lng: null })
export const newDay = (): DayForm => ({
  title: emptyL(),
  description: emptyL(),
  drivingTime: emptyL(),
  meals: emptyL(),
  overnightArea: emptyL(),
  details: emptyLList(),
  isHighlight: false,
  stops: [],
})

export function newTourForm(): TourForm {
  return {
    slug: '',
    status: 'draft',
    order: 0,
    isFeatured: false,
    isMostPopular: false,
    title: emptyL(),
    summary: emptyL(),
    description: emptyL(),
    cardTag: emptyL(),
    durationDays: null,
    durationNights: null,
    route: [],
    highlights: emptyLList(),
    badges: emptyLList(),
    overview: { en: emptyOverview(), zh: emptyOverview(), de: emptyOverview() },
    keyFeatures: emptyLList(),
    included: emptyLList(),
    notIncluded: emptyLList(),
    terrains: emptyLList(),
    routeSummary: emptyL(),
    travellerTypes: [],
    seasons: [],
    cover: null,
    gallery: [],
    days: [],
    categoryIds: [],
    destinationIds: [],
    seoTitle: emptyL(),
    seoDescription: emptyL(),
  }
}

const toL = (value: Record<string, string> | null | undefined): L => toEditable(value)

function toLList<T, R>(value: Record<string, T[]> | null | undefined, map: (item: T) => R): LList<R> {
  return { en: (value?.en ?? []).map(map), zh: (value?.zh ?? []).map(map), de: (value?.de ?? []).map(map) }
}

const isSeason = (value: string): value is Season => (SEASONS as readonly string[]).includes(value)

/** AdminTour (GET /tours/:id) → editing model. */
export function fromAdmin(t: AdminTour): TourForm {
  const overview = { en: emptyOverview(), zh: emptyOverview(), de: emptyOverview() }
  for (const locale of ADMIN_LOCALES) {
    const block = t.overview?.[locale]
    if (block) overview[locale] = { kicker: block.kicker ?? '', heading: block.heading ?? '', quote: block.quote ?? '' }
  }
  return {
    slug: t.slug,
    status: t.status,
    order: t.order,
    isFeatured: t.isFeatured,
    isMostPopular: t.isMostPopular,
    title: toL(t.title),
    summary: toL(t.summary),
    description: toL(t.description),
    cardTag: toL(t.cardTag),
    durationDays: t.durationDays,
    durationNights: t.durationNights,
    route: [...t.route],
    highlights: toLList(t.highlights, (s) => s),
    badges: toLList(t.badges, (s) => s),
    overview,
    keyFeatures: toLList(t.keyFeatures, (f) => ({ icon: f.icon, title: f.title, text: f.text })),
    included: toLList(t.included, (i) => ({ icon: i.icon, text: i.text })),
    notIncluded: toLList(t.notIncluded, (i) => ({ icon: i.icon, text: i.text })),
    terrains: toLList(t.terrains, (i) => ({ label: i.label, place: i.place, note: i.note })),
    routeSummary: toL(t.routeSummary),
    travellerTypes: [...t.travellerTypes],
    seasons: t.seasons.filter(isSeason),
    cover: t.cover,
    gallery: t.gallery.map((g) => ({ mediaId: g.mediaId, media: g.media, caption: g.caption })),
    days: t.days
      .slice()
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .map((d) => ({
        title: toL(d.title),
        description: toL(d.description),
        drivingTime: toL(d.drivingTime),
        meals: toL(d.meals),
        overnightArea: toL(d.overnightArea),
        details: toLList(d.details, (x) => ({ label: x.label, value: x.value })),
        isHighlight: d.isHighlight,
        stops: d.stops.map((s) => ({ name: s.name, lat: s.lat, lng: s.lng })),
      })),
    categoryIds: [...t.categoryIds],
    destinationIds: [...t.destinationIds],
    seoTitle: toL(t.seoTitle),
    seoDescription: toL(t.seoDescription),
  }
}

// ------------------------------------------------------------------------------------------------ normalisation

const trimL = (l: L): L => ({ en: l.en.trim(), zh: l.zh.trim(), de: l.de.trim() })
const required = (l: L) => compactRequired(trimL(l), '')
const optional = (l: L) => compactOptional(trimL(l))

/**
 * Per-locale list normalisation: trims, drops items without any text, and fills empty text fields of zh/de items from
 * the English item at the same position (the site shows a whole locale list, so a blank field would render blank).
 */
function normaliseList<T extends { [K in keyof T]: string }>(value: LList<T>, textKeys: readonly (keyof T)[]): Partial<Record<AdminLocale, T[]>> {
  const clean = (item: T): T => {
    const out = { ...item }
    for (const key of Object.keys(out) as (keyof T)[]) out[key] = String(out[key] ?? '').trim() as T[keyof T]
    return out
  }
  const hasText = (item: T) => textKeys.some((k) => item[k] !== '')
  const en = value.en.map(clean).filter(hasText)
  const out: Partial<Record<AdminLocale, T[]>> = { en }
  for (const locale of ['zh', 'de'] as const) {
    const items = value[locale]
      .map(clean)
      .filter(hasText)
      .map((item, i) => {
        const source = en[i]
        if (!source) return item
        const filled = { ...item }
        for (const k of textKeys) if (filled[k] === '') filled[k] = source[k]
        return filled
      })
    if (items.length) out[locale] = items
  }
  return out
}

function normaliseStrings(value: LList<string>): Partial<Record<AdminLocale, string[]>> {
  const out: Partial<Record<AdminLocale, string[]>> = { en: value.en.map((s) => s.trim()).filter(Boolean) }
  for (const locale of ['zh', 'de'] as const) {
    const items = value[locale].map((s) => s.trim()).filter(Boolean)
    if (items.length) out[locale] = items
  }
  return out
}

/** Required lists keep `en` (possibly empty); optional ones become null when no locale has items. */
function requiredList<T>(value: Partial<Record<AdminLocale, T[]>>): { en: T[]; zh?: T[]; de?: T[] } {
  return { ...value, en: value.en ?? [] }
}
function optionalList<T>(value: Partial<Record<AdminLocale, T[]>>): { en?: T[]; zh?: T[]; de?: T[] } | null {
  const out: Partial<Record<AdminLocale, T[]>> = {}
  for (const locale of ADMIN_LOCALES) {
    const list = value[locale]
    if (list && list.length) out[locale] = list
  }
  return Object.keys(out).length ? out : null
}

function overviewWrite(value: Record<AdminLocale, OverviewForm>): TourWrite['overview'] {
  const out: NonNullable<TourWrite['overview']> = {}
  const enHeading = value.en.heading.trim()
  for (const locale of ADMIN_LOCALES) {
    const kicker = value[locale].kicker.trim()
    const heading = value[locale].heading.trim()
    const quote = value[locale].quote.trim()
    if (!kicker && !heading && !quote) continue
    out[locale] = {
      heading: heading || (locale === 'en' ? '' : enHeading),
      ...(kicker ? { kicker } : {}),
      ...(quote ? { quote } : {}),
    }
  }
  return Object.keys(out).length ? out : null
}

/** Editing model → request body for POST /tours and PUT /tours/:id. */
export function toWrite(form: TourForm): TourWrite {
  return {
    slug: form.slug.trim(),
    status: form.status,
    order: form.order,
    isFeatured: form.isFeatured,
    isMostPopular: form.isMostPopular,
    title: required(form.title),
    summary: required(form.summary),
    description: compactRequired({ en: form.description.en.trim(), zh: form.description.zh.trim(), de: form.description.de.trim() }, ''),
    cardTag: optional(form.cardTag),
    durationDays: form.durationDays ?? 0,
    durationNights: form.durationNights ?? 0,
    route: form.route.map((s) => s.trim()).filter(Boolean),
    highlights: requiredList(normaliseStrings(form.highlights)),
    badges: optionalList(normaliseStrings(form.badges)),
    overview: overviewWrite(form.overview),
    keyFeatures: optionalList(normaliseList(form.keyFeatures, ['title', 'text'])),
    included: requiredList(normaliseList(form.included, ['text'])),
    notIncluded: requiredList(normaliseList(form.notIncluded, ['text'])),
    terrains: optionalList(normaliseList(form.terrains, ['label', 'place', 'note'])),
    routeSummary: optional(form.routeSummary),
    travellerTypes: [...form.travellerTypes],
    seasons: [...form.seasons],
    coverId: form.cover?.id ?? null,
    gallery: toGalleryWrite(form.gallery),
    days: form.days.map((day, index) => ({
      dayNumber: index + 1,
      title: required(day.title),
      description: compactRequired({ en: day.description.en.trim(), zh: day.description.zh.trim(), de: day.description.de.trim() }, ''),
      drivingTime: optional(day.drivingTime),
      meals: optional(day.meals),
      overnightArea: optional(day.overnightArea),
      details: optionalList(normaliseList(day.details, ['label', 'value'])),
      isHighlight: day.isHighlight,
      stops: day.stops.map((s) => ({ name: s.name.trim(), lat: s.lat ?? 0, lng: s.lng ?? 0 })),
    })),
    categoryIds: [...form.categoryIds],
    destinationIds: [...form.destinationIds],
    seoTitle: optional(form.seoTitle),
    seoDescription: optional(form.seoDescription),
  }
}

/** Stable string for dirty checks (same normalisation as the request body). */
export const snapshot = (form: TourForm): string => JSON.stringify(toWrite(form))

// ------------------------------------------------------------------------------------------------ validation

export type ValidationCode = 'required' | 'slug' | 'durationRange' | 'nightsRange' | 'stopName' | 'lat' | 'lng'

/** Client-side checks mirroring the API (same dotted paths as its 400 `details`). */
export function validate(form: TourForm): Record<string, ValidationCode> {
  const errors: Record<string, ValidationCode> = {}
  const slug = form.slug.trim()
  if (!slug) errors.slug = 'required'
  else if (slug.length < 2 || !SLUG_PATTERN.test(slug)) errors.slug = 'slug'
  if (!form.title.en.trim()) errors['title.en'] = 'required'
  if (!form.summary.en.trim()) errors['summary.en'] = 'required'
  const days = form.durationDays
  if (days === null) errors.durationDays = 'required'
  else if (days < LIMITS.duration.min || days > LIMITS.duration.max) errors.durationDays = 'durationRange'
  const nights = form.durationNights
  if (nights === null) errors.durationNights = 'required'
  else if (nights < 0 || nights > LIMITS.duration.max) errors.durationNights = 'nightsRange'
  form.days.forEach((day, i) => {
    if (!day.title.en.trim()) errors[`days.${i}.title.en`] = 'required'
    day.stops.forEach((stop, j) => {
      if (!stop.name.trim()) errors[`days.${i}.stops.${j}.name`] = 'stopName'
      if (stop.lat === null || !Number.isFinite(stop.lat) || stop.lat < -90 || stop.lat > 90) errors[`days.${i}.stops.${j}.lat`] = 'lat'
      if (stop.lng === null || !Number.isFinite(stop.lng) || stop.lng < -180 || stop.lng > 180) errors[`days.${i}.stops.${j}.lng`] = 'lng'
    })
  })
  return errors
}

// ------------------------------------------------------------------------------------------------ tabs & error paths

export const EDITOR_TABS = ['details', 'itinerary', 'gallery', 'destinations', 'seo'] as const
export type EditorTab = (typeof EDITOR_TABS)[number]
export const isEditorTab = (value: unknown): value is EditorTab =>
  typeof value === 'string' && (EDITOR_TABS as readonly string[]).includes(value)

/** Which editor tab shows the field of an API/client validation path. */
export function tabForPath(path: string): EditorTab {
  const head = path.split('.')[0]
  if (head === 'days') return 'itinerary'
  if (head === 'gallery' || head === 'coverId') return 'gallery'
  if (head === 'destinationIds') return 'destinations'
  if (head === 'seoTitle' || head === 'seoDescription') return 'seo'
  return 'details'
}

/** Locale of a path, defaulting to English for non-translatable fields. */
export const localeForPath = (path: string): AdminLocale | undefined => localeFromPath(path)

/** First error message at `path` or below it. */
export function errorUnder(errors: Record<string, string>, prefix: string): string | undefined {
  if (errors[prefix]) return errors[prefix]
  const key = Object.keys(errors).find((p) => p.startsWith(`${prefix}.`))
  return key ? errors[key] : undefined
}

/** Drops errors at/under the given prefixes (after the user edits those fields). */
export function withoutErrors(errors: Record<string, string>, prefixes: readonly string[]): Record<string, string> {
  let changed = false
  const out: Record<string, string> = {}
  for (const [path, message] of Object.entries(errors)) {
    if (prefixes.some((p) => path === p || path.startsWith(`${p}.`))) changed = true
    else out[path] = message
  }
  return changed ? out : errors
}

/** Locales that have content anywhere in the tour (LocaleTabs dots). */
export function filledLocales(form: TourForm): Record<AdminLocale, boolean> {
  return localesWithContent(
    form.title,
    form.summary,
    form.description,
    form.cardTag,
    form.routeSummary,
    form.highlights,
    form.badges,
    form.overview,
    form.keyFeatures,
    form.included,
    form.notIncluded,
    form.terrains,
    form.seoTitle,
    form.seoDescription,
    ...form.gallery.map((g) => g.caption ?? null),
    ...form.days.flatMap((d) => [d.title, d.description, d.drivingTime, d.meals, d.overnightArea, d.details]),
  )
}

/** Extra helpers for duplicating tours, generating itinerary days from duration, and publish readiness. */
export function cloneTourForDuplicate(source: AdminTour): TourForm {
  const copy = fromAdmin(source)
  const enTitle = `${copy.title.en} (Copy)`.slice(0, LIMITS.title)
  const zhTitle = copy.title.zh ? `${copy.title.zh} (副本)`.slice(0, LIMITS.title) : ''
  const deTitle = copy.title.de ? `${copy.title.de} (Kopie)`.slice(0, LIMITS.title) : ''
  const baseSlug = source.slug.slice(0, 75).replace(/-+$/, '') || 'tour'
  return {
    ...copy,
    slug: `${baseSlug}-copy`,
    status: 'draft',
    order: 0,
    isFeatured: false,
    isMostPopular: false,
    title: { en: enTitle, zh: zhTitle, de: deTitle },
  }
}

export function buildRemainingDays(existing: readonly DayForm[], targetCount: number): DayForm[] {
  const clamped = Math.max(1, Math.min(LIMITS.days, Math.floor(targetCount)))
  if (existing.length >= clamped) return [...existing]
  const next = [...existing]
  for (let i = existing.length; i < clamped; i++) {
    const day = newDay()
    day.title = { en: `Day ${i + 1}`, zh: '', de: '' }
    next.push(day)
  }
  return next
}

export type TourReadinessKey =
  | 'basics'
  | 'description'
  | 'cover'
  | 'itinerary'
  | 'classification'
  | 'destinations'
  | 'translations'

export interface TourReadinessItem {
  key: TourReadinessKey
  tab: EditorTab
  ok: boolean
  optional?: boolean
}

export function tourReadiness(form: TourForm): TourReadinessItem[] {
  const slug = form.slug.trim()
  const filled = filledLocales(form)
  return [
    {
      key: 'basics',
      tab: 'details',
      ok: Boolean(
        form.title.en.trim() &&
          form.summary.en.trim() &&
          slug.length >= 2 &&
          SLUG_PATTERN.test(slug) &&
          form.durationDays !== null &&
          form.durationDays >= LIMITS.duration.min &&
          form.durationNights !== null &&
          form.durationNights >= 0,
      ),
    },
    { key: 'description', tab: 'details', ok: form.description.en.trim().length > 0 },
    { key: 'cover', tab: 'gallery', ok: form.cover !== null },
    {
      key: 'itinerary',
      tab: 'itinerary',
      ok: form.days.length > 0 && (form.durationDays === null || form.days.length === form.durationDays),
    },
    {
      key: 'classification',
      tab: 'details',
      ok: form.categoryIds.length > 0 && form.seasons.length > 0,
    },
    { key: 'destinations', tab: 'destinations', ok: form.destinationIds.length > 0 },
    { key: 'translations', tab: 'details', ok: filled.zh || filled.de, optional: true },
  ]
}

export function publishWarnings(form: TourForm): ('cover' | 'itinerary' | 'description')[] {
  const missing: ('cover' | 'itinerary' | 'description')[] = []
  if (!form.cover) missing.push('cover')
  if (form.days.length === 0) missing.push('itinerary')
  if (!form.description.en.trim()) missing.push('description')
  return missing
}

/** True when the zh/de list differs from "not started" (so the editor shows the list instead of the copy prompt). */
export const listStarted = <T>(value: LList<T>, locale: AdminLocale): boolean =>
  locale === 'en' || value[locale].length > 0 || !hasContent(value.en)
