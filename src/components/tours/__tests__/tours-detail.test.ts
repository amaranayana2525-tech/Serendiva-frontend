import { describe, expect, it } from 'vitest'
import { buildRouteStops, groupMarkers, stopsByDay } from '../route-stops'
import {
  mapInquiryFieldErrors,
  tourInquiryDefaults,
  tourInquirySchema,
  toTourInquiryBody,
  upcomingMonths,
} from '../tour-inquiry'

const airport = { name: 'Bandaranaike International Airport', lat: 7.1808, lng: 79.8841 }
const negombo = { name: 'Negombo', lat: 7.2083, lng: 79.8358 }
const sigiriya = { name: 'Sigiriya Lion Rock', lat: 7.957, lng: 80.7603 }

describe('route stops', () => {
  const days = [
    { dayNumber: 2, stops: [negombo, sigiriya] },
    { dayNumber: 1, stops: [airport, negombo] },
    { dayNumber: 3, stops: [sigiriya, { name: 'Broken', lat: Number.NaN, lng: 0 }, airport] },
  ]

  it('numbers every stop in day order and skips back-to-back repeats and invalid coordinates', () => {
    const stops = buildRouteStops(days)
    expect(stops.map((s) => [s.number, s.name, s.day])).toEqual([
      [1, airport.name, 1],
      [2, 'Negombo', 1],
      [3, 'Sigiriya Lion Rock', 2],
      [4, airport.name, 3],
    ])
  })

  it('merges stops at the same place into one pin', () => {
    const markers = groupMarkers(buildRouteStops(days))
    expect(markers).toHaveLength(3)
    expect(markers[0]).toMatchObject({ numbers: [1, 4], names: [airport.name] })
  })

  it('groups stops by day for the text list', () => {
    expect(stopsByDay(buildRouteStops(days)).map((g) => [g.day, g.stops.length])).toEqual([
      [1, 2],
      [2, 1],
      [3, 1],
    ])
  })
})

describe('tour inquiry form', () => {
  const valid = {
    ...tourInquiryDefaults(),
    name: '  Claire Montgomery ',
    email: 'claire@example.com',
    whatsapp: '+44 7911 123456',
    month: '2027-03',
    adults: '2',
    children: '1',
    message: '',
  }

  it('requires name and email (WhatsApp optional) with translatable message keys', () => {
    const result = tourInquirySchema.safeParse(tourInquiryDefaults())
    expect(result.success).toBe(false)
    const issues = result.success ? [] : result.error.issues.map((i) => `${i.path.join('.')}:${i.message}`)
    expect(issues).toEqual(expect.arrayContaining(['name:required', 'email:required']))
    expect(issues.some((i) => i.startsWith('whatsapp'))).toBe(false)
    expect(tourInquirySchema.safeParse({ ...valid, whatsapp: '' }).success).toBe(true)
    expect(tourInquirySchema.safeParse({ ...valid, whatsapp: '07911 123456' }).success).toBe(false) // no country code
    expect(tourInquirySchema.safeParse({ ...valid, month: '2027-13' }).success).toBe(false)
    expect(tourInquirySchema.safeParse({ ...valid, whatsapp: 'call me' }).success).toBe(false)
  })

  it('maps the form to the POST /inquiries body (tour, party, travel window, source page)', () => {
    const values = tourInquirySchema.parse(valid)
    expect(
      toTourInquiryBody(values, {
        tourSlug: 'cultural-odyssey',
        locale: 'en',
        sourcePage: '/tours/cultural-odyssey',
        monthLabel: 'March 2027',
        flexibleLabel: 'Flexible dates',
      }),
    ).toEqual({
      name: 'Claire Montgomery',
      email: 'claire@example.com',
      whatsapp: '+44 7911 123456',
      partyType: 'family',
      adults: 2,
      children: 1,
      interests: [],
      tourSlug: 'cultural-odyssey',
      locale: 'en',
      website: '',
      travelWindow: 'March 2027',
      sourcePage: '/tours/cultural-odyssey',
    })
  })

  it('marks flexible dates and keeps optional fields out of the body', () => {
    const values = tourInquirySchema.parse({ ...valid, month: 'flexible', adults: '1', children: '0', message: 'Vegetarian' })
    const body = toTourInquiryBody(values, { tourSlug: 'x', locale: 'de', flexibleLabel: 'Flexible dates' })
    expect(body).toMatchObject({ flexibleDates: true, travelWindow: 'Flexible dates', partyType: 'solo', adults: 1 })
    expect(body.message).toBe('Vegetarian')
    expect(body).not.toHaveProperty('sourcePage')
  })

  it('maps API field paths onto the form fields', () => {
    expect(mapInquiryFieldErrors({ email: 'bad', travelWindow: 'too long', adults: 'max', partyType: 'x' })).toEqual({
      email: 'bad',
      month: 'too long',
      adults: 'max',
    })
  })

  it('lists the upcoming months starting next month', () => {
    const months = upcomingMonths(new Date(Date.UTC(2026, 11, 15)), 'en', 3)
    expect(months).toEqual([
      { value: '2027-01', label: 'January 2027' },
      { value: '2027-02', label: 'February 2027' },
      { value: '2027-03', label: 'March 2027' },
    ])
  })
})
