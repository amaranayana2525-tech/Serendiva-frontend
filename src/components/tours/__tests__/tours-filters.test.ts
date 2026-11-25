import { describe, expect, it } from 'vitest'
import type { TourCard } from '@/lib/api/types'
import {
  categoryFacets,
  filterTours,
  hasActiveFilters,
  matchesDuration,
  parseTourFilters,
  tourFiltersToQuery,
} from '../tour-filters'

const tour = (over: Partial<TourCard>): TourCard => ({
  id: over.slug ?? 'x',
  slug: 'x',
  title: 'Tour',
  summary: '',
  cardTag: null,
  durationDays: 8,
  durationNights: 7,
  route: [],
  highlights: [],
  isFeatured: false,
  isMostPopular: false,
  cover: null,
  categories: [],
  travellerTypes: [],
  seasons: [],
  ...over,
})

const wildlife = {
  id: 'c1',
  slug: 'wildlife-safari',
  name: 'Wildlife & Safari Expeditions',
  shortName: 'Wildlife & Safari',
}
const culture = {
  id: 'c2',
  slug: 'cultural-heritage',
  name: 'Cultural & Ancient Kingdoms',
  shortName: 'Cultural & Heritage',
}
const beach = { id: 'c3', slug: 'pristine-beaches', name: 'Pristine Southern Beaches', shortName: 'Pristine Beach' }

const tours = [
  tour({
    slug: 'cultural-odyssey',
    title: 'The Cultural Odyssey',
    durationDays: 9,
    route: ['Colombo', 'Sigiriya', 'Polonnaruwa'],
    categories: [culture],
  }),
  tour({
    slug: 'wild-leopards',
    title: 'Wild Leopards & Untamed Coastlines',
    durationDays: 8,
    highlights: ['Blue Whale Yacht Charter'],
    categories: [wildlife, beach],
  }),
  tour({ slug: 'beaches', title: 'Southern Beaches', durationDays: 6, categories: [beach], cardTag: 'Coastal Luxury' }),
  tour({ slug: 'weekend', title: 'Kandy Weekend', durationDays: 2, categories: [culture] }),
  tour({ slug: 'grand', title: 'Grand Circuit', durationDays: 14, categories: [culture, wildlife] }),
]

describe('tours filter URL contract', () => {
  it('parses valid params and drops invalid ones', () => {
    expect(parseTourFilters(new URLSearchParams('category=wildlife-safari&duration=4-7&q=%20leopard%20'))).toEqual({
      category: 'wildlife-safari',
      duration: '4-7',
      q: 'leopard',
    })
    expect(parseTourFilters(new URLSearchParams('category=Bad Slug!&duration=99'))).toEqual({
      category: null,
      duration: null,
      q: '',
    })
    expect(parseTourFilters(new URLSearchParams('duration=12%2B')).duration).toBe('12+')
    expect(parseTourFilters(null)).toEqual({ category: null, duration: null, q: '' })
  })

  it('serialises only active filters (clean /tours URL by default)', () => {
    expect(tourFiltersToQuery({ category: null, duration: null, q: '  ' })).toEqual({})
    expect(tourFiltersToQuery({ category: 'family', duration: '8-11', q: ' tea ' })).toEqual({
      category: 'family',
      duration: '8-11',
      q: 'tea',
    })
    expect(hasActiveFilters({ category: null, duration: null, q: '' })).toBe(false)
    expect(hasActiveFilters({ category: null, duration: '1-3', q: '' })).toBe(true)
  })
})

describe('filterTours', () => {
  it('matches duration bands by number of days', () => {
    expect(matchesDuration(3, '1-3')).toBe(true)
    expect(matchesDuration(4, '1-3')).toBe(false)
    expect(matchesDuration(7, '4-7')).toBe(true)
    expect(matchesDuration(8, '8-11')).toBe(true)
    expect(matchesDuration(12, '12+')).toBe(true)
    expect(matchesDuration(11, '12+')).toBe(false)
    expect(matchesDuration(30, null)).toBe(true)
  })

  it('combines category, duration and search', () => {
    const slugs = (f: Parameters<typeof filterTours>[1]) => filterTours(tours, f).map((t) => t.slug)
    expect(slugs({ category: null, duration: null, q: '' })).toHaveLength(5)
    expect(slugs({ category: 'wildlife-safari', duration: null, q: '' })).toEqual(['wild-leopards', 'grand'])
    expect(slugs({ category: 'wildlife-safari', duration: '8-11', q: '' })).toEqual(['wild-leopards'])
    expect(slugs({ category: null, duration: '1-3', q: '' })).toEqual(['weekend'])
    expect(slugs({ category: null, duration: null, q: 'polonnaruwa' })).toEqual(['cultural-odyssey'])
    expect(slugs({ category: null, duration: null, q: 'whale yacht' })).toEqual(['wild-leopards'])
    expect(slugs({ category: null, duration: null, q: 'coastal luxury' })).toEqual(['beaches'])
    expect(slugs({ category: null, duration: null, q: 'pristine' })).toEqual(['wild-leopards', 'beaches'])
    expect(slugs({ category: 'cultural-heritage', duration: null, q: 'nothing-matches' })).toEqual([])
  })

  it('ignores case and accents', () => {
    const accented = [tour({ slug: 'cafe', title: 'Café Culture in Galle' })]
    expect(filterTours(accented, { category: null, duration: null, q: 'CAFE' })).toHaveLength(1)
  })
})

describe('categoryFacets', () => {
  const categories = [culture, wildlife, beach, { id: 'c4', slug: 'family', name: 'Family', shortName: '' }]

  it('counts tours per category in CMS order and hides empty ones', () => {
    expect(categoryFacets(categories, tours)).toEqual([
      { slug: 'cultural-heritage', label: 'Cultural & Heritage', count: 3 },
      { slug: 'wildlife-safari', label: 'Wildlife & Safari', count: 2 },
      { slug: 'pristine-beaches', label: 'Pristine Beach', count: 2 },
    ])
  })

  it('keeps the selected chip even without tours and falls back to the full name', () => {
    expect(categoryFacets(categories, tours, 'family').at(-1)).toEqual({ slug: 'family', label: 'Family', count: 0 })
  })
})
