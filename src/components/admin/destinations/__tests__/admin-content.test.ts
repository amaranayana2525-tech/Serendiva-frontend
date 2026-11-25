import { describe, expect, it } from 'vitest'
import { addMonths, monthGrid, overlaps, rangeDays } from '../../availability/api'
import { groupKeyOf } from '../../faqs/FaqDrawer'
import {
  emptyDestinationForm,
  errorsByTab,
  tabOfPath,
  toDestinationForm,
  toDestinationWrite,
  validateDestination,
} from '../lib/destinationForm'
import type { AdminDestination } from '@/lib/api/types'

const messages = { required: 'Required', icon: 'Icon', slug: 'Slug', number: 'Number' }

const record = {
  id: 'd1',
  slug: 'ella',
  status: 'published',
  order: 0,
  regionId: 'r1',
  name: { en: 'Ella', zh: '埃拉' },
  headline: null,
  tagline: { en: 'Peaks' },
  summary: { en: 'Summary' },
  description: null,
  metaLabel: null,
  badge: null,
  bestTimeLabel: null,
  curations: { en: ['One', 'Two'] },
  quickFacts: { en: [{ icon: 'sunny', label: 'Best', value: 'Dec' }] },
  guideNote: null,
  experiences: { en: [{ title: 'Walk', text: 'Text', imageId: 'm1' }] },
  cuisine: null,
  stays: null,
  fieldNotes: null,
  interests: { en: ['Tea'] },
  mapPoints: [{ name: 'Bridge', lat: 6.8, lng: 81 }],
  latitude: 6.8,
  longitude: 81,
  elevation: 1041,
  coverId: 'm2',
  cover: { id: 'm2', url: '/u/c.webp', thumbUrl: null, alt: 'Cover' },
  gallery: [{ mediaId: 'm3', media: { id: 'm3', url: '/u/g.webp', thumbUrl: null, alt: '' }, caption: { en: { title: 'T' } } }],
  mediaRefs: { m1: { id: 'm1', url: '/u/e.webp', thumbUrl: null, alt: '' } },
  tourIds: [],
  seoTitle: null,
  seoDescription: null,
  createdAt: '2026-10-05T00:00:00.000Z',
  updatedAt: '2026-10-05T00:00:00.000Z',
} as unknown as AdminDestination

describe('destination form', () => {
  it('round-trips a record, dropping empty locales and blank optional fields', () => {
    const body = toDestinationWrite(toDestinationForm(record))
    expect(body.name).toEqual({ en: 'Ella', zh: '埃拉' })
    expect(body.headline).toBeNull()
    expect(body.tagline).toEqual({ en: 'Peaks' })
    expect(body.curations).toEqual({ en: ['One', 'Two'] })
    expect(body.quickFacts).toEqual({ en: [{ icon: 'sunny', label: 'Best', value: 'Dec', note: undefined }] })
    expect(body.guideNote).toBeNull()
    expect(body.experiences?.en?.[0]).toMatchObject({ title: 'Walk', text: 'Text', imageId: 'm1' })
    expect(body.experiences?.en?.[0]?.kicker).toBeUndefined()
    expect(body.coverId).toBe('m2')
    expect(body.gallery).toEqual([{ mediaId: 'm3', caption: { en: { title: 'T' } } }])
    expect(body.regionId).toBe('r1')
  })

  it('keeps an empty English name so the API reports it, and drops blank list entries', () => {
    const form = emptyDestinationForm()
    form.curations.en = ['', 'Kept', '  ']
    const body = toDestinationWrite(form)
    expect(body.name).toEqual({ en: '' })
    expect(body.curations).toEqual({ en: ['Kept'] })
    expect(body.regionId).toBeNull()
  })

  it('validates required fields and icons only where a locale has content', () => {
    const form = emptyDestinationForm()
    form.quickFacts.zh = [{ icon: '', label: 'x', value: 'y', note: '' }]
    form.mapPoints = [{ name: 'P', lat: null, lng: 80 }]
    const errors = validateDestination(form, messages)
    expect(errors).toMatchObject({
      slug: 'Required',
      'name.en': 'Required',
      'summary.en': 'Required',
      'quickFacts.zh.0.icon': 'Icon',
      'mapPoints.0.lat': 'Number',
    })
    expect(errors['guideNote.zh.heading']).toBeUndefined()
    expect(errorsByTab(errors)).toMatchObject({ overview: 3, highlights: 1, media: 1 })
    expect(tabOfPath('stays.de.2.title')).toBe('food')
  })
})

describe('availability helpers', () => {
  it('builds Monday-first month grids', () => {
    const weeks = monthGrid(2026 * 12 + 9) // October 2026 starts on a Thursday
    expect(weeks[0]).toEqual([null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'])
    expect(weeks.flat().filter(Boolean)).toHaveLength(31)
  })
  it('adds months with end-of-month clamping and counts inclusive days', () => {
    expect(addMonths('2027-01-31', 1)).toBe('2027-02-28')
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15')
    expect(rangeDays('2026-10-09', '2026-10-20')).toBe(12)
    expect(overlaps({ startDate: '2026-10-01', endDate: '2026-10-05' }, { startDate: '2026-10-05', endDate: '2026-10-09' })).toBe(true)
    expect(overlaps({ startDate: '2026-10-01', endDate: '2026-10-04' }, { startDate: '2026-10-05', endDate: '2026-10-09' })).toBe(false)
  })
})

describe('faq groups', () => {
  it('groups scoped FAQs by their tour / destination', () => {
    expect(groupKeyOf({ scope: 'general' })).toBe('general')
    expect(groupKeyOf({ scope: 'tour', tourId: 't1' })).toBe('tour:t1')
    expect(groupKeyOf({ scope: 'destination', destinationId: 'd1' })).toBe('destination:d1')
  })
})
