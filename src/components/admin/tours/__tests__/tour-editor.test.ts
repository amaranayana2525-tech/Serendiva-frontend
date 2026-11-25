import { describe, expect, it } from 'vitest'
import type { AdminTour } from '@/lib/api/types'
import { parseLatLng } from '../editor/ItineraryTab'
import {
  buildRemainingDays,
  cloneTourForDuplicate,
  LIMITS,
  newDay,
  newTourForm,
  publishWarnings,
  tourReadiness,
  toWrite,
  validate,
} from '../editor/model'

const sampleAdminTour: AdminTour = {
  id: 'tour_1',
  slug: 'cultural-odyssey',
  status: 'published',
  order: 2,
  isFeatured: true,
  isMostPopular: true,
  title: { en: 'The Cultural Odyssey', zh: '文化之旅', de: 'Kulturreise' },
  summary: { en: 'Eight days through ancient kingdoms and tea hills.' },
  description: { en: 'A deep personal journey through Sri Lanka.' },
  cardTag: { en: 'Chauffeur Guide' },
  durationDays: 2,
  durationNights: 1,
  route: ['Sigiriya', 'Kandy'],
  highlights: { en: ['Sigiriya Rock', 'Temple of the Tooth'] },
  badges: null,
  overview: null,
  keyFeatures: null,
  included: { en: [{ icon: 'check_circle', text: 'Private vehicle' }] },
  notIncluded: { en: [{ icon: 'block', text: 'Flights' }] },
  terrains: null,
  routeSummary: { en: '250 km' },
  travellerTypes: ['couple'],
  seasons: ['nov-apr'],
  coverId: 'med_cover',
  cover: { id: 'med_cover', url: '/uploads/cover.webp', thumbUrl: null, alt: 'Cover' },
  gallery: [],
  days: [
    {
      dayNumber: 1,
      title: { en: 'Arrival & Sigiriya' },
      description: { en: 'Meet at BIA.' },
      drivingTime: null,
      meals: null,
      overnightArea: null,
      details: null,
      isHighlight: false,
      stops: [{ name: 'Sigiriya Rock', lat: 7.957, lng: 80.7603 }],
    },
  ],
  categoryIds: ['cat_1'],
  destinationIds: ['dest_1'],
  seoTitle: null,
  seoDescription: null,
  publishedAt: '2026-10-02T00:00:00.000Z',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-05T00:00:00.000Z',
}

describe('TourEditor model helpers', () => {
  it('clones a tour into a draft copy without publishing flags or colliding slug', () => {
    const cloned = cloneTourForDuplicate(sampleAdminTour)
    expect(cloned.status).toBe('draft')
    expect(cloned.isFeatured).toBe(false)
    expect(cloned.isMostPopular).toBe(false)
    expect(cloned.order).toBe(0)
    expect(cloned.slug).toBe('cultural-odyssey-copy')
    expect(cloned.title).toEqual({
      en: 'The Cultural Odyssey (Copy)',
      zh: '文化之旅 (副本)',
      de: 'Kulturreise (Kopie)',
    })
    expect(cloned.days).toHaveLength(1)
    expect(cloned.cover?.id).toBe('med_cover')
  })

  it('builds remaining skeleton days safely within LIMITS.days', () => {
    const existing = [newDay()]
    existing[0].title.en = 'Arrival in Colombo'
    const extended = buildRemainingDays(existing, 3)
    expect(extended).toHaveLength(3)
    expect(extended[0].title.en).toBe('Arrival in Colombo')
    expect(extended[1].title.en).toBe('Day 2')
    expect(extended[2].title.en).toBe('Day 3')

    const clamped = buildRemainingDays([], LIMITS.days + 25)
    expect(clamped).toHaveLength(LIMITS.days)
  })

  it('reports readiness items, missing publish warnings, validation errors, and toWrite normalisation', () => {
    const empty = newTourForm()
    expect(publishWarnings(empty)).toEqual(['cover', 'itinerary', 'description'])
    expect(validate(empty)).toMatchObject({
      slug: 'required',
      'title.en': 'required',
      'summary.en': 'required',
      durationDays: 'required',
      durationNights: 'required',
    })

    const ready = cloneTourForDuplicate(sampleAdminTour)
    ready.days = buildRemainingDays(ready.days, 2)
    expect(publishWarnings(ready)).toEqual([])
    const checks = tourReadiness(ready)
    expect(checks.every((c) => c.ok)).toBe(true)

    const body = toWrite(ready)
    expect(body.days).toHaveLength(2)
    expect(body.days?.[1]?.dayNumber).toBe(2)
    expect(body.days?.[1]?.title).toEqual({ en: 'Day 2' })
  })

  it('parses valid coordinate pairs and rejects out-of-range coordinates', () => {
    expect(parseLatLng('7.2936, 80.6413')).toEqual({ lat: 7.2936, lng: 80.6413 })
    expect(parseLatLng('7.1808 79.8841')).toEqual({ lat: 7.1808, lng: 79.8841 })
    expect(parseLatLng('95.0, 80.0')).toBeNull()
    expect(parseLatLng('not coordinates')).toBeNull()
  })
})
