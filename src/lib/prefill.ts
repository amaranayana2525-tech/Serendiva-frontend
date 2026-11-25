import type { PartyType } from '@/lib/api/types'

/**
 * Query-string contract for pre-filling the /contact inquiry wizard. Used by tour & destination inquiry cards,
 * the trip quiz result, the hero quick-inquiry bar and WhatsApp-less CTAs.
 *
 *   <Link href={contactHref({ tour: tour.slug, source: 'tour-detail' })}>Inquire</Link>
 *   const prefill = parseContactPrefill(await searchParams)   // in /contact
 */
export interface ContactPrefill {
  /** Tour slug */
  tour?: string
  /** Destination slug */
  destination?: string
  /** Interest labels / category slugs */
  interests?: string[]
  /**
   * Travel month 'YYYY-MM', a month range 'YYYY-MM/YYYY-MM' (hero window, quiz season — the wizard keeps it
   * exactly) or a free label such as "flexible"
   */
  month?: string
  /** Trip length id of the wizard ('short' | 'essential' | 'indepth' | 'grand' | 'flexible'), e.g. from the quiz */
  duration?: 'short' | 'essential' | 'indepth' | 'grand' | 'flexible'
  party?: PartyType
  adults?: number
  children?: number
  message?: string
  /** Where the visitor came from (e.g. 'hero', 'quiz', 'tour-detail') — stored as sourcePage */
  source?: string
}

const PARTY_TYPES: readonly PartyType[] = ['couple', 'family', 'group', 'solo', 'corporate']
const DURATIONS = ['short', 'essential', 'indepth', 'grand', 'flexible'] as const
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const LIMITS = { slug: 100, interest: 60, interests: 20, month: 40, message: 2000, source: 120 } as const

type SearchParamsLike = URLSearchParams | Record<string, string | string[] | undefined>

function getAll(params: SearchParamsLike, key: string): string[] {
  if (params instanceof URLSearchParams) return params.getAll(key)
  const value = params[key]
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

const first = (params: SearchParamsLike, key: string) => getAll(params, key)[0]?.trim() || undefined

function clampInt(raw: string | undefined, min: number, max: number): number | undefined {
  if (raw === undefined || !/^\d{1,3}$/.test(raw)) return undefined
  const n = Number(raw)
  return n >= min && n <= max ? n : undefined
}

const slug = (raw: string | undefined) => (raw && raw.length <= LIMITS.slug && SLUG.test(raw) ? raw : undefined)

/** Parses (and sanitises) /contact search params. Invalid values are dropped, never thrown. */
export function parseContactPrefill(params: SearchParamsLike): ContactPrefill {
  const interests = getAll(params, 'interests')
    .flatMap((v) => v.split(','))
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && v.length <= LIMITS.interest)
  const party = first(params, 'party')
  const month = first(params, 'month')
  const message = first(params, 'message')
  const source = first(params, 'source')
  const duration = first(params, 'duration')

  const out: ContactPrefill = {
    tour: slug(first(params, 'tour')),
    destination: slug(first(params, 'destination')),
    interests: interests.length ? [...new Set(interests)].slice(0, LIMITS.interests) : undefined,
    month: month && month.length <= LIMITS.month ? month : undefined,
    party: PARTY_TYPES.includes(party as PartyType) ? (party as PartyType) : undefined,
    duration: (DURATIONS as readonly string[]).includes(duration ?? '') ? (duration as ContactPrefill['duration']) : undefined,
    adults: clampInt(first(params, 'adults'), 1, 50),
    children: clampInt(first(params, 'children'), 0, 50),
    message: message ? message.slice(0, LIMITS.message) : undefined,
    source: source ? source.slice(0, LIMITS.source) : undefined,
  }
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined)) as ContactPrefill
}

/** Serialises a prefill into query params (stable key order, empty values skipped). */
export function buildContactQuery(prefill: ContactPrefill): Record<string, string> {
  const query: Record<string, string> = {}
  if (prefill.tour) query.tour = prefill.tour
  if (prefill.destination) query.destination = prefill.destination
  if (prefill.interests?.length) query.interests = prefill.interests.join(',')
  if (prefill.month) query.month = prefill.month
  if (prefill.party) query.party = prefill.party
  if (prefill.duration) query.duration = prefill.duration
  if (prefill.adults !== undefined) query.adults = String(prefill.adults)
  if (prefill.children !== undefined) query.children = String(prefill.children)
  if (prefill.message) query.message = prefill.message
  if (prefill.source) query.source = prefill.source
  return query
}

/** `href` for next-intl's <Link> / router.push: `{ pathname: '/contact', query }`. */
export function contactHref(prefill: ContactPrefill = {}): { pathname: '/contact'; query: Record<string, string> } {
  return { pathname: '/contact', query: buildContactQuery(prefill) }
}

/** Plain string version, e.g. "/contact?tour=cultural-odyssey&adults=2" (locale prefix NOT included). */
export function contactPath(prefill: ContactPrefill = {}): string {
  const qs = new URLSearchParams(buildContactQuery(prefill)).toString()
  return qs ? `/contact?${qs}` : '/contact'
}
