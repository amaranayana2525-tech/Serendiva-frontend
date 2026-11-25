import { describe, expect, it } from 'vitest'
import type { ReviewCard } from '@/lib/api/types'
import { filterReviews, NO_FILTERS, orderForGrid, parseReviewFilters } from '../filters'
import { pickEndorsement } from '@/components/about/endorsement'
import { reviewParagraphs, reviewPlace } from '../format'

const review = (overrides: Partial<ReviewCard>): ReviewCard => ({
  id: 'r',
  guestName: 'Guest',
  initials: 'G',
  country: 'GB',
  location: null,
  partyLabel: null,
  travellerType: 'couple',
  tourType: null,
  tripLabel: null,
  tour: null,
  rating: 5,
  title: null,
  text: 'A'.repeat(250),
  photo: null,
  tripPhotos: [],
  source: 'direct',
  travelDate: '2024-01-01T00:00:00.000Z',
  isFeatured: false,
  createdAt: '2024-02-01T00:00:00.000Z',
  ...overrides,
})

const reviews = [
  review({ id: 'a', country: 'GB', travellerType: 'couple', tour: { slug: 'cultural-odyssey', title: 'Cultural' } }),
  review({ id: 'b', country: 'IE', travellerType: 'family' }),
  review({ id: 'c', country: 'SE', travellerType: 'family', tour: { slug: 'cultural-odyssey', title: 'Cultural' } }),
  review({ id: 'd', country: 'US', travellerType: 'solo' }),
]

describe('review filters', () => {
  it('parses and validates URL params', () => {
    const params = new URLSearchParams('type=family&tour=cultural-odyssey&origin=se')
    expect(parseReviewFilters(params, ['cultural-odyssey'])).toEqual({
      type: 'family',
      tour: 'cultural-odyssey',
      origin: 'se',
    })
    expect(parseReviewFilters(new URLSearchParams('type=alien&tour=nope&origin=mars'), ['cultural-odyssey'])).toEqual(
      NO_FILTERS,
    )
  })

  it('combines filters with AND and maps origin groups to countries', () => {
    expect(filterReviews(reviews, NO_FILTERS)).toHaveLength(4)
    expect(filterReviews(reviews, { ...NO_FILTERS, origin: 'uk' }).map((r) => r.id)).toEqual(['a', 'b'])
    expect(filterReviews(reviews, { ...NO_FILTERS, origin: 'se' }).map((r) => r.id)).toEqual(['c'])
    expect(filterReviews(reviews, { type: 'family', tour: 'cultural-odyssey', origin: null }).map((r) => r.id)).toEqual(
      ['c'],
    )
  })

  it('puts reviews with trip photos first, keeping API order otherwise', () => {
    const photo = { id: 'p', url: 'x', alt: '', width: null, height: null, blurDataUrl: null, variants: {} }
    const list = [review({ id: '1' }), review({ id: '2', tripPhotos: [photo] }), review({ id: '3' })]
    expect(orderForGrid(list).map((r) => r.id)).toEqual(['2', '1', '3'])
  })
})

describe('review card helpers', () => {
  it('does not repeat the country as the city', () => {
    expect(reviewPlace('Singapore', 'Singapore')).toBe('Singapore')
    expect(reviewPlace('Oxford', 'United Kingdom')).toBe('Oxford, United Kingdom')
    expect(reviewPlace(null, 'Sweden')).toBe('Sweden')
  })

  it('keeps paragraphs', () => {
    expect(reviewParagraphs('One\nline.\n\nTwo.\n\n\n')).toEqual(['One line.', 'Two.'])
  })
})

describe('about endorsement', () => {
  it('prefers a short untitled TripAdvisor family review and never the featured one', () => {
    const picked = pickEndorsement([
      review({ id: 'featured', isFeatured: true, source: 'tripadvisor', travellerType: 'family' }),
      review({ id: 'google', source: 'google' }),
      review({ id: 'ta-family', source: 'tripadvisor', travellerType: 'family' }),
      review({ id: 'ta-titled', source: 'tripadvisor', title: 'Title' }),
    ])
    expect(picked?.id).toBe('ta-family')
  })
})
