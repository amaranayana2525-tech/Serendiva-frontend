import type { ReviewCard, TravellerType } from '@/lib/api/types'

/** Traveller types in the Stitch pill order. */
export const TRAVELLER_FILTERS = [
  'couple',
  'family',
  'group',
  'solo',
  'corporate',
] as const satisfies readonly TravellerType[]

/** "Guest origin" groups (ISO 3166-1 alpha-2), keyed by the Stitch select values. */
export const ORIGIN_GROUPS = {
  uk: ['GB', 'IE'],
  us: ['US', 'CA'],
  au: ['AU', 'NZ'],
  de: ['DE', 'CH', 'AT'],
  sg: ['SG', 'HK'],
  se: ['SE', 'NO', 'DK', 'FI'],
} as const satisfies Record<string, readonly string[]>

export type OriginKey = keyof typeof ORIGIN_GROUPS
export const ORIGIN_KEYS = Object.keys(ORIGIN_GROUPS) as OriginKey[]

/** URL query keys (static page; filtering happens in the browser). */
export const FILTER_PARAMS = { type: 'type', tour: 'tour', origin: 'origin' } as const

export interface ReviewFilters {
  type: TravellerType | null
  tour: string | null
  origin: OriginKey | null
}

export const NO_FILTERS: ReviewFilters = { type: null, tour: null, origin: null }

interface ParamsLike {
  get(name: string): string | null
}

/** Reads (and validates) the filters from the URL — unknown values are ignored. */
export function parseReviewFilters(params: ParamsLike, tourSlugs: readonly string[]): ReviewFilters {
  const type = params.get(FILTER_PARAMS.type)
  const tour = params.get(FILTER_PARAMS.tour)
  const origin = params.get(FILTER_PARAMS.origin)
  return {
    type: (TRAVELLER_FILTERS as readonly string[]).includes(type ?? '') ? (type as TravellerType) : null,
    tour: tour && tourSlugs.includes(tour) ? tour : null,
    origin: origin && origin in ORIGIN_GROUPS ? (origin as OriginKey) : null,
  }
}

export const hasActiveFilters = (f: ReviewFilters) => Boolean(f.type || f.tour || f.origin)

/** Reviews matching every active filter (AND). */
export function filterReviews(reviews: readonly ReviewCard[], f: ReviewFilters): ReviewCard[] {
  const countries: readonly string[] | null = f.origin ? ORIGIN_GROUPS[f.origin] : null
  return reviews.filter(
    (r) =>
      (!f.type || r.travellerType === f.type) &&
      (!f.tour || r.tour?.slug === f.tour) &&
      (!countries || countries.includes(r.country.toUpperCase())),
  )
}

/** Grid order: reviews with trip photos first (the richest reflections, as in the Stitch bento), then API order. */
export function orderForGrid(reviews: readonly ReviewCard[]): ReviewCard[] {
  return reviews
    .map((review, index) => ({ review, index, rich: review.tripPhotos.length > 0 ? 0 : 1 }))
    .sort((a, b) => a.rich - b.rich || a.index - b.index)
    .map((x) => x.review)
}
