import type { PartyType } from '@/lib/api/types'

/*
 * Static option sets of the /contact inquiry wizard (ids → icons). Labels live in messages/en/contact.json
 * (`wizard.*`). Kept free of React so the pure helpers in wizard-model.ts can be unit-tested.
 */

export const WIZARD_STEPS = ['party', 'dates', 'passions', 'details'] as const
export type WizardStepId = (typeof WIZARD_STEPS)[number]

export interface PartyOption {
  id: PartyType
  icon: string
  /** Corporate spans two columns like the Stitch card. */
  wide?: boolean
}

export const PARTY_OPTIONS: readonly PartyOption[] = [
  { id: 'solo', icon: 'person' },
  { id: 'couple', icon: 'favorite' },
  { id: 'family', icon: 'family_restroom' },
  { id: 'group', icon: 'groups' },
  { id: 'corporate', icon: 'business_center', wide: true },
]

export const FLEXIBILITY_IDS = ['completely', 'days', 'fixed'] as const
export type FlexibilityId = (typeof FLEXIBILITY_IDS)[number]

export const DURATION_IDS = ['short', 'essential', 'indepth', 'grand', 'flexible'] as const
export type DurationId = (typeof DURATION_IDS)[number]

/** 'undecided' = "No preference yet" (the default — never sent to the guide as if it were a choice). */
export const PACE_IDS = ['relaxed', 'balanced', 'active', 'undecided'] as const
export type PaceId = (typeof PACE_IDS)[number]

export const INTEREST_OPTIONS = [
  { id: 'citadels', icon: 'castle' },
  { id: 'safaris', icon: 'pets' },
  { id: 'tea_estates', icon: 'emoji_food_beverage' },
  { id: 'trains', icon: 'train' },
  { id: 'coast_whales', icon: 'sailing' },
  { id: 'ayurveda', icon: 'spa' },
  { id: 'culinary', icon: 'restaurant' },
  { id: 'hiking', icon: 'hiking' },
  { id: 'photography', icon: 'photo_camera' },
] as const
export type InterestId = (typeof INTEREST_OPTIONS)[number]['id']
export const INTEREST_IDS: readonly InterestId[] = INTEREST_OPTIONS.map((o) => o.id)

export const STAY_OPTIONS = [
  { id: 'bungalows', icon: 'villa' },
  { id: 'safari_pavilions', icon: 'cabin' },
  { id: 'ocean_resorts', icon: 'pool' },
  { id: 'blend', icon: 'auto_awesome' },
  /** "No preference yet" (the default — not sent to the guide). */
  { id: 'undecided', icon: 'help' },
] as const
export type StayId = (typeof STAY_OPTIONS)[number]['id']
export const STAY_IDS = STAY_OPTIONS.map((o) => o.id) as [StayId, ...StayId[]]

export const BUDGET_OPTIONS = [
  { id: 'comfortable', icon: 'eco' },
  { id: 'boutique', icon: 'hotel' },
  { id: 'luxury', icon: 'diamond' },
  { id: 'ultra', icon: 'workspace_premium' },
  /** "Open / undecided" (default — omitted from message unless chosen). */
  { id: 'undecided', icon: 'help' },
] as const
export type BudgetId = (typeof BUDGET_OPTIONS)[number]['id']
export const BUDGET_IDS = BUDGET_OPTIONS.map((o) => o.id) as [BudgetId, ...BudgetId[]]

export const CONTACT_METHOD_OPTIONS = [
  { id: 'any', icon: 'forum' },
  { id: 'whatsapp', icon: 'chat' },
  { id: 'email', icon: 'mail' },
  { id: 'call', icon: 'call' },
] as const
export type ContactMethodId = (typeof CONTACT_METHOD_OPTIONS)[number]['id']
export const CONTACT_METHOD_IDS = CONTACT_METHOD_OPTIONS.map((o) => o.id) as [ContactMethodId, ...ContactMethodId[]]

export interface TourPickerOption {
  slug: string
  title: string
  durationDays: number
}

export interface DestinationPickerOption {
  slug: string
  name: string
  region?: string
}

/** Calling codes offered next to the WhatsApp number (message key → dial prefix). `other` = type the full number. */
export const CALLING_CODES = [
  { key: 'gb', code: '+44' },
  { key: 'us', code: '+1' },
  { key: 'au', code: '+61' },
  { key: 'nz', code: '+64' },
  { key: 'de', code: '+49' },
  { key: 'at', code: '+43' },
  { key: 'ch', code: '+41' },
  { key: 'fr', code: '+33' },
  { key: 'be', code: '+32' },
  { key: 'nl', code: '+31' },
  { key: 'it', code: '+39' },
  { key: 'es', code: '+34' },
  { key: 'se', code: '+46' },
  { key: 'no', code: '+47' },
  { key: 'dk', code: '+45' },
  { key: 'pl', code: '+48' },
  { key: 'ru', code: '+7' },
  { key: 'cn', code: '+86' },
  { key: 'hk', code: '+852' },
  { key: 'jp', code: '+81' },
  { key: 'kr', code: '+82' },
  { key: 'sg', code: '+65' },
  { key: 'my', code: '+60' },
  { key: 'in', code: '+91' },
  { key: 'ae', code: '+971' },
  { key: 'sa', code: '+966' },
  { key: 'qa', code: '+974' },
  { key: 'za', code: '+27' },
  { key: 'lk', code: '+94' },
  { key: 'other', code: 'other' },
] as const
export type CallingCodeKey = (typeof CALLING_CODES)[number]['key']
export const CALLING_CODE_VALUES = CALLING_CODES.map((c) => c.code) as [string, ...string[]]

/** Sensible default calling code per UI locale. */
export const DEFAULT_CALLING_CODE: Record<'en' | 'zh' | 'de', string> = { en: '+44', zh: '+86', de: '+49' }

/**
 * Prefill aliases (`/contact?interests=…` from tour/destination pages, the trip quiz or the hero bar):
 * category slugs and common words → interest chip ids. Anything unknown is kept as an extra, pre-checked chip.
 */
const INTEREST_ALIASES: Record<string, InterestId> = {
  citadels: 'citadels',
  'cultural-heritage': 'citadels',
  culture: 'citadels',
  heritage: 'citadels',
  'ancient-cities': 'citadels',
  'sacred-heritage': 'citadels',
  safaris: 'safaris',
  safari: 'safaris',
  'wildlife-safari': 'safaris',
  wildlife: 'safaris',
  'tea-estates': 'tea_estates',
  tea: 'tea_estates',
  'hill-country': 'tea_estates',
  'tea-country': 'tea_estates',
  trains: 'trains',
  train: 'trains',
  rail: 'trains',
  'tea-country-rail': 'trains',
  'coast-whales': 'coast_whales',
  'pristine-beaches': 'coast_whales',
  beaches: 'coast_whales',
  beach: 'coast_whales',
  coast: 'coast_whales',
  whales: 'coast_whales',
  ayurveda: 'ayurveda',
  'ayurveda-wellness': 'ayurveda',
  wellness: 'ayurveda',
  culinary: 'culinary',
  gastronomy: 'culinary',
  food: 'culinary',
  cooking: 'culinary',
  hiking: 'hiking',
  'trekking-adventure': 'hiking',
  trekking: 'hiking',
  adventure: 'hiking',
  photography: 'photography',
  birding: 'photography',
}

const normaliseInterest = (raw: string) =>
  raw
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')

/** Maps one prefill interest to a chip id (or null when it is not one of the nine chips). */
export function interestIdFor(raw: string): InterestId | null {
  return INTEREST_ALIASES[normaliseInterest(raw)] ?? null
}

/** Human label for an extra (unknown) interest: "ramayana-trail" → "Ramayana trail". */
export function extraInterestLabel(raw: string): string {
  const text = raw.trim().replace(/[-_]+/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// ------------------------------------------------------------------------------------------------ travel windows

export type SeasonKey = 'dec' | 'mar' | 'jun' | 'sep'

/** Sri Lankan planning seasons by 0-based start month. */
const SEASON_BY_START_MONTH: Partial<Record<number, SeasonKey>> = { 11: 'dec', 2: 'mar', 5: 'jun', 8: 'sep' }

export type TravelWindowOption =
  | { value: 'immediate'; kind: 'immediate' }
  | {
      value: string
      kind: 'season'
      season: SeasonKey
      /** Absolute month index (year * 12 + month) of the first and last month. */
      start: number
      end: number
    }
  | { value: 'later'; kind: 'later'; /** First month after the last listed season. */ from: number }
  | { value: 'flexible'; kind: 'flexible' }
  /** A month range picked elsewhere (home hero, trip quiz) that is not one of the seasons — kept exactly. */
  | { value: string; kind: 'range'; start: number; end: number }
  | { value: 'custom'; kind: 'custom'; label: string }

const pad = (n: number) => String(n).padStart(2, '0')
/** Absolute month index → 'YYYY-MM'. */
export const monthIso = (index: number) => `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`
const monthIndexOf = (iso: string) => {
  const m = /^(\d{4})-(\d{2})/.exec(iso)
  return m ? Number(m[1]) * 12 + Number(m[2]) - 1 : NaN
}

/** "2027-02/2027-04" (or a single "2027-02") → absolute month indexes; null when malformed. */
export function parseMonthRange(text: string | undefined): { start: number; end: number } | null {
  const m = /^(\d{4}-\d{2})(?:\/(\d{4}-\d{2}))?$/.exec(text?.trim() ?? '')
  if (!m) return null
  const start = monthIndexOf(m[1]!)
  const end = m[2] ? monthIndexOf(m[2]) : start
  return Number.isFinite(start) && Number.isFinite(end) && end >= start && end - start < 12 ? { start, end } : null
}

const rangeValue = (start: number, end: number) => `range-${monthIso(start)}-${monthIso(end)}`

/**
 * Travel-window choices generated from "today" (never hard-coded years): "Immediate (next 30–60 days)", the season
 * we are in (when at least a month of it is left — so in December/January the current Dec–Feb is still offered),
 * every season that starts within the next `monthsAhead` months, then "From <month> onwards".
 * `picked` is a month range chosen elsewhere (hero, quiz): matched to a season, or added as its own option.
 * `today` is 'YYYY-MM-DD' (passed from the server so SSR and hydration agree).
 */
export function travelWindowOptions(
  today: string,
  monthsAhead = 18,
  picked?: { start: number; end: number } | null,
): TravelWindowOption[] {
  const current = monthIndexOf(today)
  const options: TravelWindowOption[] = [{ value: 'immediate', kind: 'immediate' }]
  let lastEnd = current + 2
  for (let index = current - 2; index <= current + monthsAhead; index++) {
    const season = SEASON_BY_START_MONTH[((index % 12) + 12) % 12]
    if (!season) continue
    const end = index + 2
    const start = Math.max(index, current + 1)
    // An ongoing season stays while at least 2 of its months are ahead (in December: Jan–Feb of Dec–Feb);
    // the last month alone is covered by "Immediate".
    if (start > end - 1) continue
    options.push({ value: `season-${monthIso(start)}`, kind: 'season', season, start, end })
    lastEnd = end
  }
  options.push({ value: 'later', kind: 'later', from: lastEnd + 1 })
  options.push({ value: 'flexible', kind: 'flexible' })
  if (picked && picked.end > current && !options.some((o) => o.kind === 'season' && o.start === picked.start && o.end === picked.end)) {
    const start = Math.max(picked.start, current + 1)
    // after "immediate", in date order
    const at = options.findIndex((o) => o.kind !== 'immediate' && 'start' in o && o.start > start)
    const laterIndex = options.findIndex((o) => o.kind === 'later')
    const option: TravelWindowOption = { value: rangeValue(start, picked.end), kind: 'range', start, end: picked.end }
    options.splice(at === -1 ? (laterIndex === -1 ? options.length : laterIndex) : at, 0, option)
  }
  return options
}

/**
 * The option for a prefilled range ("2027-02/2027-04" from the hero / quiz): the season with exactly these months,
 * else the matching "range" option (see travelWindowOptions' `picked`). Null when there is none.
 */
export function travelWindowForRange(month: string, options: readonly TravelWindowOption[]): string | null {
  const range = parseMonthRange(month)
  if (!range || !month.includes('/')) return null
  const match =
    options.find((o) => (o.kind === 'season' || o.kind === 'range') && o.start === range.start && o.end === range.end) ??
    options.find((o) => o.kind === 'range' && o.end === range.end && o.start >= range.start) ??
    options.find((o) => o.kind === 'season' && o.end === range.end && o.start >= range.start)
  return match?.value ?? null
}

/**
 * Maps a prefilled `month` ('YYYY-MM' or a free label) onto the generated options:
 * within the next ~2 months → immediate · inside a season → that season · beyond → later · past → null.
 * "flexible" selects the explicit flexible option; other free labels return null.
 */
export function travelWindowForMonth(month: string, today: string, options: readonly TravelWindowOption[]) {
  if (month.trim().toLowerCase() === 'flexible') return 'flexible'
  if (!/^\d{4}-\d{2}$/.test(month)) return null
  const index = monthIndexOf(month)
  const current = monthIndexOf(today)
  if (!Number.isFinite(index) || index < current) return null
  const season = options.find((o) => o.kind === 'season' && index >= o.start && index <= o.end)
  if (season) return season.value
  const later = options.find((o) => o.kind === 'later')
  if (later && later.kind === 'later' && index >= later.from) return later.value
  return 'immediate'
}
