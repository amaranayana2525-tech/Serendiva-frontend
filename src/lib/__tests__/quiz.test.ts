import { describe, expect, it } from 'vitest'
import type { TourCard } from '@/lib/api/types'
import {
  EMPTY_ANSWERS,
  MAX_PASSIONS,
  clampStep,
  daysOutsideBand,
  firstIncompleteStep,
  parseQuizHash,
  passionCategorySlugs,
  rankTours,
  scoreTour,
  seasonMonth,
  serializeQuizHash,
  toContactPrefill,
  toContactQuery,
  togglePassion,
  type QuizAnswers,
} from '@/lib/quiz'

let seq = 0
function tour(partial: Omit<Partial<TourCard>, 'categories'> & { slug: string; categories?: string[] }): TourCard {
  seq += 1
  const { categories = [], ...rest } = partial
  return {
    id: `t${seq}`,
    title: partial.slug,
    summary: '',
    cardTag: null,
    durationDays: 9,
    durationNights: 8,
    route: [],
    highlights: [],
    isFeatured: false,
    isMostPopular: false,
    cover: null,
    travellerTypes: ['couple', 'family', 'group', 'solo'],
    seasons: ['nov-apr'],
    ...rest,
    categories: categories.map((slug) => ({ id: slug, slug, name: slug, shortName: slug })),
  }
}

/** A copy of the seeded catalogue (slug, days, traveller types, seasons, categories, flags). */
const CATALOGUE: TourCard[] = [
  tour({
    slug: 'cultural-odyssey',
    durationDays: 9,
    isMostPopular: true,
    seasons: ['nov-apr', 'jul-aug'],
    categories: ['cultural-heritage', 'hill-country'],
  }),
  tour({
    slug: 'grand-ceylon-odyssey',
    durationDays: 11,
    isMostPopular: true,
    isFeatured: true,
    categories: ['cultural-heritage', 'wildlife-safari', 'pristine-beaches', 'hill-country'],
  }),
  tour({
    slug: 'wild-leopards-untamed-coastlines',
    durationDays: 8,
    isFeatured: true,
    seasons: ['nov-apr', 'may-sep'],
    categories: ['wildlife-safari', 'pristine-beaches'],
  }),
  tour({
    slug: 'tea-mist-monasteries-colonial-charms',
    durationDays: 7,
    isFeatured: true,
    seasons: ['nov-apr', 'jul-aug'],
    categories: ['hill-country'],
  }),
  tour({ slug: 'southern-beaches-whale-trails', durationDays: 6, categories: ['pristine-beaches', 'family'] }),
  tour({
    slug: 'bespoke-ceylon-honeymoon',
    durationDays: 10,
    travellerTypes: ['couple'],
    categories: ['honeymoon', 'ayurveda-wellness'],
  }),
  tour({
    slug: 'highland-trekking-cloud-forest-peaks',
    durationDays: 8,
    travellerTypes: ['solo', 'couple', 'group'],
    categories: ['trekking-adventure'],
  }),
  tour({
    slug: 'sacred-ramayana-heritage-trail',
    durationDays: 7,
    seasons: ['year-round'],
    categories: ['ramayana-trail'],
  }),
  tour({
    slug: 'ceylon-family-wonder-discovery',
    durationDays: 11,
    travellerTypes: ['family', 'group'],
    seasons: ['nov-apr', 'jul-aug'],
    categories: ['family'],
  }),
  tour({
    slug: 'ayurveda-healing-forest-silence',
    durationDays: 9,
    isFeatured: true,
    travellerTypes: ['solo', 'couple'],
    seasons: ['year-round'],
    categories: ['ayurveda-wellness'],
  }),
]

const answers = (a: Partial<QuizAnswers>): QuizAnswers => ({ ...EMPTY_ANSWERS, ...a })
const slugs = (list: { tour: TourCard }[]) => list.map((m) => m.tour.slug)

describe('scoreTour', () => {
  it('gives 100% when every answer matches', () => {
    const t = tour({ slug: 'perfect', durationDays: 9, categories: ['cultural-heritage', 'wildlife-safari'] })
    const m = scoreTour(
      t,
      answers({ party: 'solo', duration: 'balanced', passions: ['citadels', 'safari'], season: 'nov-apr' }),
    )
    expect(m.points).toBe(100)
    expect(m.maxPoints).toBe(100)
    expect(m.percent).toBe(100)
    expect(m.breakdown).toEqual({
      interests: { points: 45, max: 45 },
      party: { points: 20, max: 20 },
      duration: { points: 20, max: 20 },
      season: { points: 15, max: 15 },
    })
    expect(m.matchedPassions).toEqual(['citadels', 'safari'])
  })

  it('averages passion strength (full, related = half, none)', () => {
    const t = tour({ slug: 'mix', categories: ['cultural-heritage', 'honeymoon'] })
    const m = scoreTour(t, answers({ passions: ['citadels', 'coast', 'safari'] }))
    // (1 + 0.5 + 0) / 3 * 45 = 22.5
    expect(m.breakdown.interests).toEqual({ points: 22.5, max: 45 })
    expect(m.reasons).toEqual([
      { kind: 'passion', passion: 'citadels', strength: 'full' },
      { kind: 'passion', passion: 'coast', strength: 'partial' },
    ])
  })

  it('leaves unanswered questions out of the maximum', () => {
    const t = tour({ slug: 'x', durationDays: 9 })
    const m = scoreTour(t, answers({ duration: 'balanced' }))
    expect(m.maxPoints).toBe(20)
    expect(m.percent).toBe(100)
    expect(m.breakdown.party).toBeNull()
    expect(m.breakdown.interests).toBeNull()
  })

  it('returns 0% (not NaN) when nothing is answered', () => {
    const m = scoreTour(tour({ slug: 'x' }), EMPTY_ANSWERS)
    expect(m.points).toBe(0)
    expect(m.maxPoints).toBe(0)
    expect(m.percent).toBe(0)
  })

  it('deducts 6 points per day outside the duration band and never goes negative', () => {
    expect(daysOutsideBand(7, 'balanced')).toBe(1)
    expect(daysOutsideBand(12, 'balanced')).toBe(2)
    expect(daysOutsideBand(30, 'grand')).toBe(0)
    const pts = (days: number) =>
      scoreTour(tour({ slug: `d${days}`, durationDays: days }), answers({ duration: 'balanced' })).breakdown.duration
        ?.points
    expect(pts(9)).toBe(20)
    expect(pts(11)).toBe(14)
    expect(pts(6)).toBe(8)
    expect(pts(13)).toBe(2)
    expect(pts(20)).toBe(0)
  })

  it('marks near-miss durations as adjustable and omits far misses from the reasons', () => {
    const near = scoreTour(
      tour({ slug: 'near', durationDays: 11, durationNights: 10 }),
      answers({ duration: 'balanced' }),
    )
    expect(near.reasons).toContainEqual({ kind: 'duration', days: 11, nights: 10, band: 'balanced', fit: 'adjustable' })
    const far = scoreTour(tour({ slug: 'far', durationDays: 21 }), answers({ duration: 'short' }))
    expect(far.reasons.some((r) => r.kind === 'duration')).toBe(false)
  })

  it('rewards specialist tours for couples and families', () => {
    const honeymoon = tour({ slug: 'h', travellerTypes: ['couple'], categories: ['honeymoon'] })
    const generic = tour({ slug: 'g', travellerTypes: ['couple'], categories: ['cultural-heritage'] })
    expect(scoreTour(honeymoon, answers({ party: 'couple' })).breakdown.party?.points).toBe(20)
    expect(scoreTour(generic, answers({ party: 'couple' })).breakdown.party?.points).toBe(15)
    // Solo travellers have no specialist category: listed = full points.
    expect(scoreTour(generic, answers({ party: 'solo' })).breakdown.party).toEqual({ points: 0, max: 20 })
    const soloTour = tour({ slug: 's', travellerTypes: ['solo'] })
    expect(scoreTour(soloTour, answers({ party: 'solo' })).breakdown.party?.points).toBe(20)
  })

  it('adapts group tours for corporate parties', () => {
    const groupTour = tour({ slug: 'grp', travellerTypes: ['group'] })
    const coupleTour = tour({ slug: 'cpl', travellerTypes: ['couple'] })
    const corp = answers({ party: 'corporate' })
    expect(scoreTour(groupTour, corp).breakdown.party?.points).toBe(12)
    expect(scoreTour(groupTour, corp).reasons).toContainEqual({ kind: 'party', party: 'corporate', fit: 'adapted' })
    expect(scoreTour(coupleTour, corp).breakdown.party?.points).toBe(0)
  })

  it('handles seasons: exact, nested Jul–Aug in May–Sep, year-round, partial overlap, unknown, flexible', () => {
    const s = (seasons: string[], season: QuizAnswers['season']) =>
      scoreTour(tour({ slug: 'season', seasons }), answers({ season })).breakdown.season?.points
    expect(s(['nov-apr'], 'nov-apr')).toBe(15)
    expect(s(['may-sep'], 'jul-aug')).toBe(15)
    expect(s(['year-round'], 'may-sep')).toBe(15)
    expect(s(['jul-aug'], 'may-sep')).toBe(8)
    expect(s([], 'nov-apr')).toBe(8)
    expect(s(['nov-apr'], 'may-sep')).toBe(0)
    expect(s(['nov-apr'], 'flexible')).toBe(15)
  })

  it('adds a "popular" reason without changing the score', () => {
    const a = scoreTour(tour({ slug: 'a', isMostPopular: true }), answers({ season: 'nov-apr' }))
    const b = scoreTour(tour({ slug: 'b' }), answers({ season: 'nov-apr' }))
    expect(a.points).toBe(b.points)
    expect(a.reasons.at(-1)).toEqual({ kind: 'popular' })
  })

  it('ignores duplicate and surplus passions', () => {
    const t = tour({ slug: 'p', categories: ['wildlife-safari'] })
    const m = scoreTour(
      t,
      answers({ passions: ['safari', 'safari', 'tea', 'coast', 'citadels'] as QuizAnswers['passions'] }),
    )
    // Only the first three distinct passions count: safari (1), tea (0), coast (0) → 15
    expect(m.breakdown.interests?.points).toBe(15)
  })
})

describe('rankTours', () => {
  it('returns the top match plus two alternatives by default', () => {
    const result = rankTours(
      CATALOGUE,
      answers({ party: 'couple', duration: 'balanced', passions: ['citadels', 'tea', 'safari'], season: 'nov-apr' }),
    )
    expect(result).toHaveLength(3)
    expect(result.map((r) => r.rank)).toEqual([1, 2, 3])
    // Covers all three passions (one day longer than the band) beats the exact-length heritage tour.
    expect(slugs(result)[0]).toBe('grand-ceylon-odyssey')
    expect(slugs(result)).toContain('cultural-odyssey')
    expect(result[0].points).toBeGreaterThanOrEqual(result[1].points)
    expect(result[1].points).toBeGreaterThanOrEqual(result[2].points)
  })

  it('puts the honeymoon route first for a wellness & coast couple', () => {
    const [top] = rankTours(
      CATALOGUE,
      answers({ party: 'couple', duration: 'balanced', passions: ['wellness', 'coast'], season: 'nov-apr' }),
    )
    expect(top.tour.slug).toBe('bespoke-ceylon-honeymoon')
  })

  it('finds the wildlife & coast route for a family travelling in July', () => {
    const [top] = rankTours(
      CATALOGUE,
      answers({ party: 'family', duration: 'balanced', passions: ['safari', 'coast'], season: 'jul-aug' }),
    )
    expect(top.tour.slug).toBe('wild-leopards-untamed-coastlines')
  })

  it('finds the trekking route for a solo hiker', () => {
    const [top] = rankTours(
      CATALOGUE,
      answers({ party: 'solo', duration: 'balanced', passions: ['trekking'], season: 'nov-apr' }),
    )
    expect(top.tour.slug).toBe('highland-trekking-cloud-forest-peaks')
  })

  it('breaks ties by matched passions, then "most popular", then featured, then closeness to the band, then API order', () => {
    const base = { durationDays: 9, categories: ['cultural-heritage'] }
    const plain = tour({ slug: 'plain', ...base })
    const featured = tour({ slug: 'featured', ...base, isFeatured: true })
    const popular = tour({ slug: 'popular', ...base, isMostPopular: true })
    const a = answers({ passions: ['citadels'] })
    expect(slugs(rankTours([plain, featured, popular], a))).toEqual(['popular', 'featured', 'plain'])

    // Same points, but the 8-day tour is further from the 9-day centre of the band than the 9-day one.
    const eight = tour({ slug: 'eight', durationDays: 8 })
    const nine = tour({ slug: 'nine', durationDays: 9 })
    expect(slugs(rankTours([eight, nine], answers({ duration: 'balanced' })))).toEqual(['nine', 'eight'])

    // Full tie → original (curated) order.
    const first = tour({ slug: 'first' })
    const second = tour({ slug: 'second' })
    expect(slugs(rankTours([first, second], EMPTY_ANSWERS))).toEqual(['first', 'second'])
  })

  it('always returns something when tours exist, even with zero matching answers', () => {
    const lonely = [
      tour({ slug: 'only', durationDays: 30, travellerTypes: ['solo'], seasons: ['may-sep'], categories: ['family'] }),
    ]
    const result = rankTours(
      lonely,
      answers({ party: 'family', duration: 'short', passions: ['trekking'], season: 'nov-apr' }),
    )
    expect(result).toHaveLength(1)
    expect(result[0].percent).toBe(0)
    expect(result[0].reasons).toEqual([])
  })

  it('returns an empty list only for an empty catalogue and respects the limit', () => {
    expect(rankTours([], answers({ party: 'solo' }))).toEqual([])
    expect(rankTours(CATALOGUE, EMPTY_ANSWERS, { limit: 1 })).toHaveLength(1)
    expect(rankTours(CATALOGUE, EMPTY_ANSWERS, { limit: 0 })).toEqual([])
  })

  it('does not mutate the input array', () => {
    const copy = [...CATALOGUE]
    rankTours(CATALOGUE, answers({ passions: ['wellness'] }))
    expect(CATALOGUE).toEqual(copy)
  })
})

describe('quiz state (URL hash)', () => {
  it('round-trips a complete state', () => {
    const state = {
      step: 'result' as const,
      answers: answers({ party: 'family', duration: 'deep', passions: ['safari', 'coast'], season: 'jul-aug' }),
    }
    const hash = serializeQuizHash(state)
    expect(hash).toBe('step=result&party=family&duration=deep&passions=safari,coast&season=jul-aug')
    expect(parseQuizHash(`#${hash}`)).toEqual(state)
  })

  it('drops unknown values and caps passions at three', () => {
    const state = parseQuizHash(
      '#step=2&party=pirates&duration=forever&passions=tea,tea,unknown,coast,safari,wellness&season=winter',
    )
    expect(state.answers).toEqual(answers({ passions: ['tea', 'coast', 'safari'] }))
    expect(state.answers.passions).toHaveLength(MAX_PASSIONS)
    // Party is missing, so step 2 is not reachable yet.
    expect(state.step).toBe(1)
  })

  it('clamps the step to the first unanswered question', () => {
    expect(parseQuizHash('#step=4&party=solo').step).toBe(2)
    expect(parseQuizHash('#step=result&party=solo&duration=short&passions=tea').step).toBe(4)
    expect(parseQuizHash('#step=2&party=solo&duration=short&passions=tea&season=flexible').step).toBe(2)
    expect(parseQuizHash('').step).toBe(1)
    expect(parseQuizHash('#step=9').step).toBe(1)
    expect(clampStep('result', EMPTY_ANSWERS)).toBe(1)
    expect(firstIncompleteStep(answers({ party: 'solo', duration: 'short', passions: [], season: 'flexible' }))).toBe(3)
  })

  it('toggles passions without exceeding the maximum', () => {
    expect(togglePassion([], 'tea')).toEqual(['tea'])
    expect(togglePassion(['tea'], 'tea')).toEqual([])
    expect(togglePassion(['tea', 'coast', 'safari'], 'wellness')).toEqual(['tea', 'coast', 'safari'])
    expect(togglePassion(['tea', 'coast', 'safari'], 'coast')).toEqual(['tea', 'safari'])
  })
})

describe('contact prefill', () => {
  const full = answers({
    party: 'couple',
    duration: 'balanced',
    passions: ['citadels', 'tea', 'trekking'],
    season: 'nov-apr',
  })

  it('maps passions to primary category slugs (deduplicated)', () => {
    expect(passionCategorySlugs(['citadels', 'tea', 'trekking'])).toEqual([
      'cultural-heritage',
      'hill-country',
      'trekking-adventure',
    ])
    expect(passionCategorySlugs([])).toEqual([])
  })

  const today = new Date(Date.UTC(2026, 9, 5)) // 5 October 2026

  it('builds the /contact prefill with tour, interests, season range, party, adults, duration and source', () => {
    expect(toContactPrefill(full, { slug: 'cultural-odyssey' }, { message: 'Hi', today })).toEqual({
      tour: 'cultural-odyssey',
      interests: ['cultural-heritage', 'hill-country', 'trekking-adventure'],
      month: '2026-11/2027-04',
      party: 'couple',
      adults: 2,
      duration: 'indepth',
      message: 'Hi',
      source: 'trip-quiz',
    })
  })

  it('omits what it cannot infer', () => {
    expect(toContactPrefill(answers({ party: 'group' }), null)).toEqual({ party: 'group', source: 'trip-quiz' })
    expect(toContactPrefill(answers({ party: 'solo', season: 'flexible' }), null)).toEqual({
      party: 'solo',
      adults: 1,
      month: 'flexible',
      source: 'trip-quiz',
    })
  })

  it('maps the season to its next stretch (YYYY-MM/YYYY-MM) so /contact shows exactly that range', () => {
    expect(seasonMonth('nov-apr', today)).toBe('2026-11/2027-04')
    expect(seasonMonth('may-sep', today)).toBe('2027-05/2027-09')
    expect(seasonMonth('jul-aug', today)).toBe('2027-07/2027-08')
    expect(seasonMonth('flexible', today)).toBe('flexible')
    // A season that is already running starts next month.
    expect(seasonMonth('nov-apr', new Date(Date.UTC(2027, 0, 20)))).toBe('2027-02/2027-04')
    expect(seasonMonth('jul-aug', new Date(Date.UTC(2027, 6, 1)))).toBe('2027-08/2027-08')
    expect(seasonMonth('jul-aug', new Date(Date.UTC(2027, 7, 1)))).toBe('2028-07/2028-08')
  })

  it('serialises to query params understood by parseContactPrefill', () => {
    expect(toContactQuery(full, { slug: 'grand-ceylon-odyssey' }, { today })).toEqual({
      tour: 'grand-ceylon-odyssey',
      interests: 'cultural-heritage,hill-country,trekking-adventure',
      month: '2026-11/2027-04',
      party: 'couple',
      duration: 'indepth',
      adults: '2',
      source: 'trip-quiz',
    })
  })
})
