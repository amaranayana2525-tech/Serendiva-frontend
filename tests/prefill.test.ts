import { describe, expect, it } from 'vitest'
import { buildContactQuery, contactHref, contactPath, parseContactPrefill } from '@/lib/prefill'

describe('contact prefill', () => {
  it('parses and sanitises URLSearchParams', () => {
    const params = new URLSearchParams(
      'tour=cultural-odyssey&destination=Ella!!&interests=Wildlife,Tea%20hills,,Wildlife&month=2027-02&party=family&adults=4&children=2&message=Hi&source=quiz',
    )
    expect(parseContactPrefill(params)).toEqual({
      tour: 'cultural-odyssey',
      interests: ['Wildlife', 'Tea hills'],
      month: '2027-02',
      party: 'family',
      adults: 4,
      children: 2,
      message: 'Hi',
      source: 'quiz',
    })
  })

  it('accepts Next searchParams objects (string | string[])', () => {
    expect(parseContactPrefill({ interests: ['wildlife', 'beach'], adults: '2', tour: undefined })).toEqual({
      interests: ['wildlife', 'beach'],
      adults: 2,
    })
  })

  it('drops invalid values instead of throwing', () => {
    expect(parseContactPrefill({ party: 'pirates', adults: '0', children: '99', tour: '../etc' })).toEqual({})
    expect(parseContactPrefill({ adults: '2.5' })).toEqual({})
  })

  it('serialises in a stable order and round-trips', () => {
    const prefill = {
      destination: 'ella',
      tour: 'cultural-odyssey',
      interests: ['tea', 'trains'],
      adults: 2,
      children: 0,
      source: 'tour-detail',
    }
    const query = buildContactQuery(prefill)
    expect(Object.keys(query)).toEqual(['tour', 'destination', 'interests', 'adults', 'children', 'source'])
    expect(parseContactPrefill(new URLSearchParams(query))).toEqual(prefill)
  })

  it('builds hrefs for next-intl Link and plain paths', () => {
    expect(contactHref({ tour: 'cultural-odyssey' })).toEqual({
      pathname: '/contact',
      query: { tour: 'cultural-odyssey' },
    })
    expect(contactPath()).toBe('/contact')
    expect(contactPath({ tour: 'cultural-odyssey', adults: 2 })).toBe('/contact?tour=cultural-odyssey&adults=2')
  })
})
