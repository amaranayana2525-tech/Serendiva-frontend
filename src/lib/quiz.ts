/**
 * Trip Finder quiz (/trip-quiz) — pure, framework-free logic:
 *   - the answer model (party · duration band · up to 3 passions · season),
 *   - scoring + ranking of published tours (`rankTours`),
 *   - URL-hash (de)serialisation so a refresh keeps the visitor's progress,
 *   - the /contact prefill built from a result (`toContactPrefill` / `toContactQuery`).
 *
 * Scoring (100 points when every question is answered):
 *   interests 45 · party 20 · duration 20 · season 15.
 *   Unanswered questions are left out of both the score and the maximum, so `percent` stays meaningful.
 *   Ties are broken by passions matched → "most popular" → featured → closeness to the preferred length → the
 *   API's own order (the guide's curated sort order). `rankTours` always returns up to `limit` tours as long as
 *   at least one tour exists — a weak match is still a starting point for the conversation.
 */
import type { TourCard, TravellerType } from '@/lib/api/types'
import { buildContactQuery, type ContactPrefill } from '@/lib/prefill'

// ------------------------------------------------------------------------------------------------ answer model

/** Who is travelling (same ids as the API's `TravellerType`). */
export const PARTY_OPTIONS = [
  'couple',
  'solo',
  'family',
  'group',
  'corporate',
] as const satisfies readonly TravellerType[]
export type QuizParty = (typeof PARTY_OPTIONS)[number]

/** Trip length bands in days (inclusive; `max: null` = open-ended). */
export const DURATION_BANDS = {
  short: { min: 5, max: 7 },
  balanced: { min: 8, max: 10 },
  deep: { min: 11, max: 14 },
  grand: { min: 15, max: null },
} as const satisfies Record<string, { min: number; max: number | null }>
export type DurationBand = keyof typeof DURATION_BANDS
export const DURATION_OPTIONS = ['short', 'balanced', 'deep', 'grand'] as const satisfies readonly DurationBand[]

/**
 * Passions → tour category slugs. `primary` categories count as a full match, `related` ones as half a match
 * (e.g. the honeymoon route ends on a south-coast beach, sacred Ramayana sites are heritage too).
 */
export const PASSION_CATEGORIES = {
  citadels: { primary: ['cultural-heritage'], related: ['ramayana-trail'] },
  safari: { primary: ['wildlife-safari'], related: [] },
  tea: { primary: ['hill-country'], related: ['trekking-adventure'] },
  coast: { primary: ['pristine-beaches'], related: ['honeymoon'] },
  trekking: { primary: ['trekking-adventure'], related: ['hill-country'] },
  wellness: { primary: ['ayurveda-wellness'], related: ['honeymoon'] },
} as const satisfies Record<string, { primary: readonly string[]; related: readonly string[] }>
export type Passion = keyof typeof PASSION_CATEGORIES
export const PASSION_OPTIONS = [
  'citadels',
  'safari',
  'tea',
  'coast',
  'trekking',
  'wellness',
] as const satisfies readonly Passion[]
export const MAX_PASSIONS = 3

/** Arrival season. Tour `seasons` use the same ids plus 'year-round'. */
export const SEASON_OPTIONS = ['nov-apr', 'may-sep', 'jul-aug', 'flexible'] as const
export type QuizSeason = (typeof SEASON_OPTIONS)[number]

export interface QuizAnswers {
  party: QuizParty | null
  duration: DurationBand | null
  /** 0–3 passions, in the order they were chosen. */
  passions: Passion[]
  season: QuizSeason | null
}

export const EMPTY_ANSWERS: QuizAnswers = { party: null, duration: null, passions: [], season: null }

/** Question order — step n (1-based) asks QUIZ_QUESTIONS[n - 1]. */
export const QUIZ_QUESTIONS = ['party', 'duration', 'passions', 'season'] as const
export type QuizQuestion = (typeof QUIZ_QUESTIONS)[number]
export const TOTAL_STEPS = QUIZ_QUESTIONS.length

export type QuizStepNumber = 1 | 2 | 3 | 4
export type QuizStep = QuizStepNumber | 'result'

export interface QuizState {
  step: QuizStep
  answers: QuizAnswers
}

// ------------------------------------------------------------------------------------------------ scoring

export const WEIGHTS = { interests: 45, party: 20, duration: 20, season: 15 } as const

/** Points per day outside the preferred band (1 day → 14/20, 2 → 8/20, 3 → 2/20, 4+ → 0). */
const DURATION_PENALTY_PER_DAY = 6
/** Corporate groups: no tour is tagged 'corporate', but group-friendly tours adapt well. */
const CORPORATE_VIA_GROUP = 12
/** Parties with a dedicated tour category get the last 5 party points only on those tours. */
const PARTY_AFFINITY: Partial<Record<QuizParty, readonly string[]>> = { couple: ['honeymoon'], family: ['family'] }
const PARTY_LISTED_WITHOUT_AFFINITY = 15
/** May–Sep visitors on a tour that is only great in Jul–Aug (partial overlap), and tours without season data. */
const SEASON_PARTIAL = 8

export interface ScoreComponent {
  points: number
  max: number
}

/** Points per question; `null` when the question was not answered (excluded from the maximum). */
export interface ScoreBreakdown {
  interests: ScoreComponent | null
  party: ScoreComponent | null
  duration: ScoreComponent | null
  season: ScoreComponent | null
}

/** Typed "why it matches" items — the UI turns them into localised sentences. Ordered by importance. */
export type MatchReason =
  | { kind: 'passion'; passion: Passion; strength: 'full' | 'partial' }
  | { kind: 'party'; party: QuizParty; fit: 'specialist' | 'listed' | 'adapted' }
  | { kind: 'duration'; days: number; nights: number; band: DurationBand; fit: 'exact' | 'adjustable' }
  | { kind: 'season'; season: QuizSeason; fit: 'ideal' | 'yearRound' | 'flexible' | 'partial' }
  | { kind: 'popular' }

export interface QuizMatch {
  tour: TourCard
  /** 1-based rank. */
  rank: number
  /** Raw points (sum of the breakdown). */
  points: number
  /** Maximum reachable points for the answered questions. */
  maxPoints: number
  /** 0–100, rounded. */
  percent: number
  breakdown: ScoreBreakdown
  reasons: MatchReason[]
  /** Passions this tour covers fully. */
  matchedPassions: Passion[]
}

const round1 = (n: number) => Math.round(n * 10) / 10

function passionStrength(passion: Passion, categories: ReadonlySet<string>): 0 | 0.5 | 1 {
  const { primary, related } = PASSION_CATEGORIES[passion]
  if (primary.some((c) => categories.has(c))) return 1
  if (related.some((c) => categories.has(c))) return 0.5
  return 0
}

/** Days outside the band (0 when inside). */
export function daysOutsideBand(days: number, band: DurationBand): number {
  const { min, max } = DURATION_BANDS[band]
  if (days < min) return min - days
  if (max !== null && days > max) return days - max
  return 0
}

function bandCentre(band: DurationBand): number {
  const { min, max } = DURATION_BANDS[band]
  return max === null ? min + 2 : (min + max) / 2
}

/** Scores one tour against the answers (rank is filled in by `rankTours`). */
export function scoreTour(tour: TourCard, answers: QuizAnswers): Omit<QuizMatch, 'rank'> {
  const categories = new Set(tour.categories.map((c) => c.slug))
  const reasons: MatchReason[] = []
  const breakdown: ScoreBreakdown = { interests: null, party: null, duration: null, season: null }

  // Interests — average strength over the chosen passions.
  const passions = [...new Set(answers.passions)].slice(0, MAX_PASSIONS)
  const matchedPassions: Passion[] = []
  if (passions.length > 0) {
    let sum = 0
    const partial: Passion[] = []
    for (const passion of passions) {
      const strength = passionStrength(passion, categories)
      sum += strength
      if (strength === 1) matchedPassions.push(passion)
      else if (strength === 0.5) partial.push(passion)
    }
    breakdown.interests = { points: round1((WEIGHTS.interests * sum) / passions.length), max: WEIGHTS.interests }
    for (const passion of matchedPassions) reasons.push({ kind: 'passion', passion, strength: 'full' })
    for (const passion of partial) reasons.push({ kind: 'passion', passion, strength: 'partial' })
  }

  // Party — listed traveller type (+ affinity category for couples / families).
  if (answers.party) {
    const party = answers.party
    const affinity = PARTY_AFFINITY[party]
    let points = 0
    if (tour.travellerTypes.includes(party)) {
      const specialist = affinity?.some((c) => categories.has(c)) ?? false
      points = affinity && !specialist ? PARTY_LISTED_WITHOUT_AFFINITY : WEIGHTS.party
      reasons.push({ kind: 'party', party, fit: specialist ? 'specialist' : 'listed' })
    } else if (party === 'corporate' && tour.travellerTypes.includes('group')) {
      points = CORPORATE_VIA_GROUP
      reasons.push({ kind: 'party', party, fit: 'adapted' })
    }
    breakdown.party = { points, max: WEIGHTS.party }
  }

  // Duration — full points inside the band, minus 6 per day outside it.
  if (answers.duration) {
    const outside = daysOutsideBand(tour.durationDays, answers.duration)
    const points = Math.max(0, WEIGHTS.duration - DURATION_PENALTY_PER_DAY * outside)
    breakdown.duration = { points, max: WEIGHTS.duration }
    if (points > 0) {
      reasons.push({
        kind: 'duration',
        days: tour.durationDays,
        nights: tour.durationNights,
        band: answers.duration,
        fit: outside === 0 ? 'exact' : 'adjustable',
      })
    }
  }

  // Season.
  if (answers.season) {
    const season = answers.season
    const seasons = new Set(tour.seasons)
    let points = 0
    let fit: Extract<MatchReason, { kind: 'season' }>['fit'] | null = null
    if (season === 'flexible') {
      points = WEIGHTS.season
      fit = 'flexible'
    } else if (seasons.has(season) || (season === 'jul-aug' && seasons.has('may-sep'))) {
      points = WEIGHTS.season
      fit = 'ideal'
    } else if (seasons.has('year-round')) {
      points = WEIGHTS.season
      fit = 'yearRound'
    } else if ((season === 'may-sep' && seasons.has('jul-aug')) || seasons.size === 0) {
      points = SEASON_PARTIAL
      fit = 'partial'
    }
    breakdown.season = { points, max: WEIGHTS.season }
    if (fit) reasons.push({ kind: 'season', season, fit })
  }

  if (tour.isMostPopular) reasons.push({ kind: 'popular' })

  const components = Object.values(breakdown).filter((c): c is ScoreComponent => c !== null)
  const points = round1(components.reduce((s, c) => s + c.points, 0))
  const maxPoints = components.reduce((s, c) => s + c.max, 0)
  const percent = maxPoints > 0 ? Math.min(100, Math.max(0, Math.round((points / maxPoints) * 100))) : 0

  return { tour, points, maxPoints, percent, breakdown, reasons, matchedPassions }
}

export interface RankOptions {
  /** How many results to return (default 3: the top match + 2 alternatives). */
  limit?: number
}

/**
 * Ranks tours for the answers, best first. Deterministic; returns `min(limit, tours.length)` matches —
 * an empty array only when there are no tours at all.
 */
export function rankTours(
  tours: readonly TourCard[],
  answers: QuizAnswers,
  { limit = 3 }: RankOptions = {},
): QuizMatch[] {
  const scored = tours.map((tour, index) => ({ index, match: scoreTour(tour, answers) }))
  const centre = answers.duration ? bandCentre(answers.duration) : null
  scored.sort((a, b) => {
    const A = a.match
    const B = b.match
    if (Math.abs(B.points - A.points) > 0.001) return B.points - A.points
    if (B.matchedPassions.length !== A.matchedPassions.length)
      return B.matchedPassions.length - A.matchedPassions.length
    if (A.tour.isMostPopular !== B.tour.isMostPopular) return A.tour.isMostPopular ? -1 : 1
    if (A.tour.isFeatured !== B.tour.isFeatured) return A.tour.isFeatured ? -1 : 1
    if (centre !== null) {
      const diff = Math.abs(A.tour.durationDays - centre) - Math.abs(B.tour.durationDays - centre)
      if (diff !== 0) return diff
    }
    return a.index - b.index
  })
  return scored.slice(0, Math.max(0, limit)).map(({ match }, i) => ({ ...match, rank: i + 1 }))
}

// ------------------------------------------------------------------------------------------------ steps & URL state

const QUESTION_OF_STEP: Record<QuizStepNumber, QuizQuestion> = { 1: 'party', 2: 'duration', 3: 'passions', 4: 'season' }

export function questionOfStep(step: QuizStepNumber): QuizQuestion {
  return QUESTION_OF_STEP[step]
}

export function isQuestionAnswered(question: QuizQuestion, answers: QuizAnswers): boolean {
  if (question === 'passions') return answers.passions.length > 0
  return answers[question] !== null
}

/** First step whose question is unanswered, or null when the quiz is complete. */
export function firstIncompleteStep(answers: QuizAnswers): QuizStepNumber | null {
  for (const step of [1, 2, 3, 4] as const) if (!isQuestionAnswered(QUESTION_OF_STEP[step], answers)) return step
  return null
}

export const isQuizComplete = (answers: QuizAnswers) => firstIncompleteStep(answers) === null

/** A step is reachable when every earlier question is answered ('result' needs all four). */
export function isStepReachable(step: QuizStep, answers: QuizAnswers): boolean {
  const incomplete = firstIncompleteStep(answers)
  if (step === 'result') return incomplete === null
  return incomplete === null || step <= incomplete
}

/** Moves a requested step back to the furthest reachable one. */
export function clampStep(step: QuizStep, answers: QuizAnswers): QuizStep {
  if (isStepReachable(step, answers)) return step
  return firstIncompleteStep(answers) ?? 'result'
}

const includes = <T extends string>(list: readonly T[], value: string | null | undefined): value is T =>
  value !== null && value !== undefined && (list as readonly string[]).includes(value)

/** Toggles a passion, never exceeding MAX_PASSIONS (returns the same list when the limit is reached). */
export function togglePassion(passions: readonly Passion[], passion: Passion): Passion[] {
  if (passions.includes(passion)) return passions.filter((p) => p !== passion)
  if (passions.length >= MAX_PASSIONS) return [...passions]
  return [...passions, passion]
}

/**
 * Parses `#step=3&party=couple&duration=balanced&passions=citadels,safari&season=nov-apr`
 * (leading '#' optional). Unknown values are dropped; the step is clamped to what the answers allow.
 */
export function parseQuizHash(hash: string): QuizState {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const party = params.get('party')
  const duration = params.get('duration')
  const season = params.get('season')
  const passions = [
    ...new Set(
      (params.get('passions') ?? '')
        .split(',')
        .map((p) => p.trim())
        .filter((p): p is Passion => includes(PASSION_OPTIONS, p)),
    ),
  ].slice(0, MAX_PASSIONS)

  const answers: QuizAnswers = {
    party: includes(PARTY_OPTIONS, party) ? party : null,
    duration: includes(DURATION_OPTIONS, duration) ? duration : null,
    passions,
    season: includes(SEASON_OPTIONS, season) ? season : null,
  }

  const rawStep = params.get('step')
  const requested: QuizStep =
    rawStep === 'result' ? 'result' : rawStep && /^[1-4]$/.test(rawStep) ? (Number(rawStep) as QuizStepNumber) : 1
  return { step: clampStep(requested, answers), answers }
}

/** Inverse of `parseQuizHash` (without '#'); empty answers are omitted. */
export function serializeQuizHash({ step, answers }: QuizState): string {
  const params = new URLSearchParams()
  params.set('step', String(step))
  if (answers.party) params.set('party', answers.party)
  if (answers.duration) params.set('duration', answers.duration)
  if (answers.passions.length) params.set('passions', answers.passions.join(','))
  if (answers.season) params.set('season', answers.season)
  // Keep commas readable in the address bar.
  return params.toString().replace(/%2C/gi, ',')
}

// ------------------------------------------------------------------------------------------------ contact prefill

/** Category slugs of the chosen passions (primary categories, de-duplicated, in choice order). */
export function passionCategorySlugs(passions: readonly Passion[]): string[] {
  return [...new Set(passions.flatMap((p) => PASSION_CATEGORIES[p].primary))]
}

/** Adults we can infer from the party (only where it is unambiguous). */
const PARTY_ADULTS: Partial<Record<QuizParty, number>> = { solo: 1, couple: 2 }

export interface ContactPrefillOptions {
  /** Optional pre-written message (localised by the caller; it also names the season in words). */
  message?: string
  /** "Today" for the season → month mapping (tests); defaults to the current date. */
  today?: Date
}

/** Arrival seasons as (0-based first month, length in months). */
const SEASON_MONTHS: Record<Exclude<QuizSeason, 'flexible'>, { start: number; length: number }> = {
  'nov-apr': { start: 10, length: 6 },
  'may-sep': { start: 4, length: 5 },
  'jul-aug': { start: 6, length: 2 },
}

const isoMonth = (index: number) => `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`

/**
 * The /contact `month` prefill for a season: the next stretch of it from next month onwards, as a month range
 * 'YYYY-MM/YYYY-MM' (e.g. "May – Sep" in November → "2027-05/2027-09"). The inquiry wizard shows exactly this
 * range (it no longer falls into one of its own seasons by its first month). 'flexible' for no preference.
 */
export function seasonMonth(season: QuizSeason, today: Date = new Date()): string {
  if (season === 'flexible') return 'flexible'
  const { start, length } = SEASON_MONTHS[season]
  const current = today.getUTCFullYear() * 12 + today.getUTCMonth()
  const inSeason = (index: number) => ((index % 12) - start + 12) % 12 < length
  for (let index = current + 1; index <= current + 12; index++) {
    if (!inSeason(index)) continue
    let end = index
    while (end + 1 < index + length && inSeason(end + 1)) end++
    return `${isoMonth(index)}/${isoMonth(end)}`
  }
  return 'flexible'
}

/** Quiz duration bands → the wizard's trip-length choices (nearest band). */
const DURATION_FOR_WIZARD: Record<DurationBand, NonNullable<ContactPrefill['duration']>> = {
  short: 'essential', // 5–7 nights → 6–8 days
  balanced: 'indepth', // 8–10 → 9–12 days
  deep: 'indepth', // 11–14 → 9–12 days ("my recommendation"; the guide fine-tunes)
  grand: 'grand', // 15+ → 13+ days
}

/** /contact prefill for a quiz result: tour, interests (category slugs), season month, party, adults, source. */
export function toContactPrefill(
  answers: QuizAnswers,
  tour: Pick<TourCard, 'slug'> | null,
  { message, today }: ContactPrefillOptions = {},
): ContactPrefill {
  const interests = passionCategorySlugs(answers.passions)
  const prefill: ContactPrefill = {
    tour: tour?.slug,
    interests: interests.length ? interests : undefined,
    month: answers.season ? seasonMonth(answers.season, today) : undefined,
    party: answers.party ?? undefined,
    adults: answers.party ? PARTY_ADULTS[answers.party] : undefined,
    duration: answers.duration ? DURATION_FOR_WIZARD[answers.duration] : undefined,
    message,
    source: 'trip-quiz',
  }
  return Object.fromEntries(Object.entries(prefill).filter(([, v]) => v !== undefined)) as ContactPrefill
}

/** Query-string form of `toContactPrefill` (for `{ pathname: '/contact', query }`). */
export function toContactQuery(
  answers: QuizAnswers,
  tour: Pick<TourCard, 'slug'> | null,
  options?: ContactPrefillOptions,
): Record<string, string> {
  return buildContactQuery(toContactPrefill(answers, tour, options))
}
