import type { TourCard } from '@/lib/api/types'

/*
 * Pure helpers for the /tours filter bar (category chips, duration bands, free-text search) and its URL contract:
 *   /tours?category=wildlife-safari&duration=4-7&q=leopard
 * The page fetches every published tour once (cached) and filters in memory on the client.
 */

export const DURATION_BANDS = ['1-3', '4-7', '8-11', '12+'] as const
export type DurationBand = (typeof DURATION_BANDS)[number]

export interface TourFilters {
  /** Category slug, or null for "All tours". */
  category: string | null
  duration: DurationBand | null
  /** Free-text query (trimmed). */
  q: string
}

export const EMPTY_FILTERS: TourFilters = { category: null, duration: null, q: '' }

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MAX_QUERY = 100

type ParamsLike = Pick<URLSearchParams, 'get'>

/** Reads (and sanitises) the filters from the URL. Unknown values are ignored, never thrown. */
export function parseTourFilters(params: ParamsLike | null | undefined): TourFilters {
  if (!params) return EMPTY_FILTERS
  const category = params.get('category')?.trim() ?? ''
  const duration = params.get('duration')?.trim() ?? ''
  const q = (params.get('q') ?? '').trim().slice(0, MAX_QUERY)
  return {
    category: category.length <= 80 && SLUG.test(category) ? category : null,
    duration: (DURATION_BANDS as readonly string[]).includes(duration) ? (duration as DurationBand) : null,
    q,
  }
}

/** Serialises filters into query params (stable order, defaults omitted → clean `/tours` URL). */
export function tourFiltersToQuery(filters: TourFilters): Record<string, string> {
  const query: Record<string, string> = {}
  if (filters.category) query.category = filters.category
  if (filters.duration) query.duration = filters.duration
  const q = filters.q.trim()
  if (q) query.q = q.slice(0, MAX_QUERY)
  return query
}

export const hasActiveFilters = (filters: TourFilters) =>
  Boolean(filters.category || filters.duration || filters.q.trim())

/** Whether a tour length (in days) falls inside a duration band. */
export function matchesDuration(days: number, band: DurationBand | null): boolean {
  switch (band) {
    case null:
      return true
    case '1-3':
      return days >= 1 && days <= 3
    case '4-7':
      return days >= 4 && days <= 7
    case '8-11':
      return days >= 8 && days <= 11
    case '12+':
      return days >= 12
  }
}

/** Lower-case, accent-free text for forgiving search ("Polonnaruwa" matches "polonnaruwa", "Café" matches "cafe"). */
export function normalizeText(value: string): string {
  return value.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Everything a visitor might search for on a card: title, summary, route, highlights, categories, card tag. */
export function tourSearchText(tour: TourCard): string {
  return normalizeText(
    [
      tour.title,
      tour.summary,
      tour.cardTag ?? '',
      ...tour.route,
      ...tour.highlights,
      ...tour.categories.flatMap((c) => [c.name, c.shortName]),
    ].join('   '),
  )
}

/** Every whitespace-separated term must appear somewhere in the tour's searchable text. */
export function matchesQuery(tour: TourCard, q: string, haystack = tourSearchText(tour)): boolean {
  const terms = normalizeText(q).split(/\s+/).filter(Boolean)
  return terms.every((term) => haystack.includes(term))
}

export function filterTours(tours: TourCard[], filters: TourFilters): TourCard[] {
  return tours.filter(
    (tour) =>
      (!filters.category || tour.categories.some((c) => c.slug === filters.category)) &&
      matchesDuration(tour.durationDays, filters.duration) &&
      (!filters.q.trim() || matchesQuery(tour, filters.q)),
  )
}

export interface CategoryFacet {
  slug: string
  label: string
  count: number
}

/**
 * Chips for the filter bar: categories in CMS order with the number of published tours in each.
 * Categories without tours are hidden (unless currently selected, so a shared link still shows its chip).
 */
export function categoryFacets(
  categories: { slug: string; name: string; shortName: string }[],
  tours: TourCard[],
  selected?: string | null,
): CategoryFacet[] {
  const counts = new Map<string, number>()
  for (const tour of tours) {
    for (const c of tour.categories) counts.set(c.slug, (counts.get(c.slug) ?? 0) + 1)
  }
  return categories
    .map((c) => ({ slug: c.slug, label: c.shortName || c.name, count: counts.get(c.slug) ?? 0 }))
    .filter((f) => f.count > 0 || f.slug === selected)
}
