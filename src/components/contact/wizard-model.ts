import { z } from 'zod'
import { submitInquiry, type FormFailure, type FormResult } from '@/lib/api/forms'
import type { InquiryBody, InquiryResult, Locale, PartyType } from '@/lib/api/types'
import { combineWhatsApp, hasCountryCode, isValidPhoneInput } from '@/lib/phone'
import type { ContactPrefill } from '@/lib/prefill'
import { msg } from '@/lib/validation/messages'
import { emailSchema, honeypot, requiredText, TRAVELLER_TYPES } from '@/lib/validation/shared'
import { tripDays } from './wizard-dates'
import {
  BUDGET_IDS,
  CALLING_CODE_VALUES,
  CONTACT_METHOD_IDS,
  DEFAULT_CALLING_CODE,
  DURATION_IDS,
  FLEXIBILITY_IDS,
  PACE_IDS,
  STAY_IDS,
  interestIdFor,
  travelWindowForMonth,
  travelWindowForRange,
  type BudgetId,
  type ContactMethodId,
  type DurationId,
  type FlexibilityId,
  type PaceId,
  type StayId,
  type TravelWindowOption,
} from './wizard-config'

/*
 * Form model of the /contact wizard: Zod schema (per-step validation via STEP_FIELDS), defaults from the
 * /contact prefill, mapping to the API's InquiryBody, server-error → step routing and the sessionStorage draft.
 * Pure TypeScript (no React) so it is unit-tested in src/components/contact/__tests__/contact-wizard.test.ts.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** 'YYYY-MM-DD' of the visitor's today (local), for "not in the past" checks. */
const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const baseSchema = z.object({
  // No default: the visitor picks the party (undefined until then).
  partyType: z
    .enum(TRAVELLER_TYPES, { error: 'required' })
    .optional()
    .refine((v) => v !== undefined, 'required'),
  adults: z.number({ error: 'required' }).int('integer').min(1, msg('min', 1)).max(50, msg('max', 50)),
  children: z.number({ error: 'required' }).int('integer').min(0, msg('min', 0)).max(50, msg('max', 50)),
  /** Children's ages as typed ("4, 9") — sent with the message. */
  childAges: z.string().trim().max(60, msg('tooLong', 60)),
  /** Required unless exact dates are given (flexibility "fixed"). */
  travelWindow: z.string().max(60, msg('tooLong', 60)),
  /** Exact dates 'YYYY-MM-DD' (shown and required for flexibility "fixed"). */
  travelStart: z.string().trim(),
  travelEnd: z.string().trim(),
  flexibility: z.enum(FLEXIBILITY_IDS, { error: 'required' }),
  durationPreference: z.enum(DURATION_IDS, { error: 'required' }),
  pace: z.enum(PACE_IDS, { error: 'required' }),
  interests: z.array(z.string().trim().min(1).max(60, msg('tooLong', 60))).max(20, msg('tooMany', 20)),
  tourSlug: z.string().trim().max(120),
  destinations: z.array(z.string().trim().min(1).max(120)).max(15, msg('tooMany', 15)),
  stayStyle: z.enum(STAY_IDS, { error: 'required' }),
  budgetTier: z.enum(BUDGET_IDS, { error: 'required' }),
  name: requiredText(120, 2, 'nameTooShort'),
  email: emailSchema,
  whatsappCode: z.enum(CALLING_CODE_VALUES),
  /** Optional unless WhatsApp or phone call is chosen as the preferred contact method. */
  whatsappNumber: z
    .string()
    .trim()
    .max(32, msg('tooLong', 32))
    .refine((v) => v === '' || isValidPhoneInput(v), 'phone'),
  preferredContact: z.enum(CONTACT_METHOD_IDS, { error: 'required' }),
  country: z.string().trim().max(80, msg('tooLong', 80)),
  message: z.string().trim().max(5000, msg('tooLong', 5000)),
  website: honeypot,
  turnstileToken: z.string().max(4096).optional(),
})

/** Cross-field rules: guests must fit the party, and the dates must be complete and in order. */
export const wizardSchema = baseSchema.superRefine((v, ctx) => {
  const guests = v.adults + v.children
  if (v.partyType === 'solo' && guests !== 1) ctx.addIssue({ code: 'custom', path: ['adults'], message: 'partySolo' })
  if (v.partyType === 'couple' && (v.adults !== 2 || v.children !== 0))
    ctx.addIssue({ code: 'custom', path: [v.adults !== 2 ? 'adults' : 'children'], message: 'partyCouple' })
  if (v.partyType === 'family' && v.children < 1) ctx.addIssue({ code: 'custom', path: ['children'], message: 'partyFamily' })
  if (v.partyType === 'group' && guests < 3) ctx.addIssue({ code: 'custom', path: ['adults'], message: 'partyGroup' })

  if ((v.preferredContact === 'whatsapp' || v.preferredContact === 'call') && v.whatsappNumber === '') {
    ctx.addIssue({ code: 'custom', path: ['whatsappNumber'], message: 'required' })
  }

  if (v.whatsappNumber !== '' && v.whatsappCode === 'other' && !hasCountryCode(v.whatsappNumber)) {
    ctx.addIssue({ code: 'custom', path: ['whatsappNumber'], message: 'phoneCountryCode' })
  }

  const trimmedMessage = v.message.trim()
  const ages = v.children > 0 ? v.childAges.trim() : ''
  const extraParts = [
    ages ? ages.length + 25 : 0,
    v.destinations.length > 1 ? v.destinations.join(', ').length + 30 : 0,
    v.budgetTier !== 'undecided' ? 45 : 0,
    v.preferredContact !== 'any' ? 45 : 0,
  ]
  const extraLen = extraParts.reduce((sum, n) => sum + (n ? n + 2 : 0), 0)
  if (trimmedMessage.length + extraLen > 5000) {
    ctx.addIssue({ code: 'custom', path: ['message'], message: msg('tooLong', 5000) })
  }

  if (v.flexibility === 'fixed') {
    if (!ISO_DATE.test(v.travelStart)) ctx.addIssue({ code: 'custom', path: ['travelStart'], message: 'required' })
    else if (v.travelStart < todayIso()) ctx.addIssue({ code: 'custom', path: ['travelStart'], message: 'datePast' })
    if (!ISO_DATE.test(v.travelEnd)) ctx.addIssue({ code: 'custom', path: ['travelEnd'], message: 'required' })
    else if (ISO_DATE.test(v.travelStart) && v.travelEnd < v.travelStart)
      ctx.addIssue({ code: 'custom', path: ['travelEnd'], message: 'dateOrder' })
  } else if (!v.travelWindow) {
    ctx.addIssue({ code: 'custom', path: ['travelWindow'], message: 'required' })
  }
})

export type WizardValues = z.input<typeof baseSchema>
export type WizardField = keyof WizardValues

/** Fields validated before leaving each step (index = step - 1). */
export const STEP_FIELDS = [
  ['partyType', 'adults', 'children', 'childAges'],
  ['travelWindow', 'travelStart', 'travelEnd', 'flexibility', 'durationPreference', 'pace'],
  ['interests', 'tourSlug', 'destinations', 'stayStyle', 'budgetTier'],
  ['name', 'email', 'whatsappCode', 'whatsappNumber', 'country', 'preferredContact', 'message'],
] as const satisfies readonly (readonly WizardField[])[]

export const STEP_COUNT = STEP_FIELDS.length

/** 0-based step that contains a form field (unknown fields → last step, where the submit button lives). */
export function stepOfField(field: string): number {
  const index = STEP_FIELDS.findIndex((fields) => (fields as readonly string[]).includes(field))
  return index === -1 ? STEP_COUNT - 1 : index
}

/** API field names (InquiryBody) → wizard field names. Fields not in the form go to the form-level error. */
const API_TO_FORM: Record<string, WizardField> = {
  whatsapp: 'whatsappNumber',
  partyType: 'partyType',
  adults: 'adults',
  children: 'children',
  travelWindow: 'travelWindow',
  travelStart: 'travelStart',
  travelEnd: 'travelEnd',
  flexibility: 'flexibility',
  durationPreference: 'durationPreference',
  pace: 'pace',
  interests: 'interests',
  tourSlug: 'tourSlug',
  destinationSlug: 'destinations',
  stayStyle: 'stayStyle',
  name: 'name',
  email: 'email',
  country: 'country',
  message: 'message',
}

export interface MappedServerErrors {
  /** Errors on wizard fields, in step order. */
  fields: { field: WizardField; message: string }[]
  /** Messages for API fields the visitor can't edit (tourSlug, locale…). */
  form: string[]
  /** 0-based step to show (first step with an error; last step when only form-level errors). */
  step: number
}

/** Routes API validation errors (`{ email: '…', whatsapp: '…' }`) to wizard fields and the step to jump to. */
export function mapServerErrors(fieldErrors: Record<string, string>): MappedServerErrors {
  const fields: MappedServerErrors['fields'] = []
  const form: string[] = []
  for (const [apiField, message] of Object.entries(fieldErrors)) {
    const field = API_TO_FORM[apiField]
    if (field) fields.push({ field, message })
    else form.push(message)
  }
  fields.sort((a, b) => stepOfField(a.field) - stepOfField(b.field))
  const step = fields.length > 0 ? stepOfField(fields[0]!.field) : STEP_COUNT - 1
  return { fields, form, step }
}

// ------------------------------------------------------------------------------------------------ defaults

export interface WizardInitialState {
  values: WizardValues
  /** Prefilled interests that are not one of the nine chips (rendered as extra chips). */
  extraInterests: string[]
}

/** Initial values: Stitch defaults, overridden by the /contact query prefill. */
export function initialWizardState(
  prefill: ContactPrefill,
  options: readonly TravelWindowOption[],
  today: string,
  locale: Locale,
): WizardInitialState {
  const party: PartyType | undefined = prefill.party
  const interests: string[] = []
  const extraInterests: string[] = []
  for (const raw of prefill.interests ?? []) {
    const id = interestIdFor(raw)
    const value = id ?? raw.trim()
    if (!value || interests.includes(value)) continue
    interests.push(value)
    if (!id) extraInterests.push(value)
  }
  const month = prefill.month?.trim()
  const fromMonth = month ? (travelWindowForRange(month, options) ?? travelWindowForMonth(month, today, options)) : null

  return {
    extraInterests,
    values: {
      // Nothing is pre-chosen for the visitor: party and travel window must be picked; length, pace and
      // stays start at "not sure / no preference" (honest data for the guide, no extra clicks).
      partyType: party,
      ...guestsForParty(party, prefill.adults ?? (party === 'solo' ? 1 : 2), prefill.children ?? 0),
      childAges: '',
      travelWindow: fromMonth ?? '',
      travelStart: '',
      travelEnd: '',
      // "Completely flexible" is the no-constraint answer; "fixed" reveals the exact-date fields.
      flexibility: 'completely',
      durationPreference: prefill.duration ?? 'flexible',
      pace: 'undecided',
      interests: interests.slice(0, 20),
      tourSlug: prefill.tour ?? '',
      destinations: prefill.destination ? [prefill.destination] : [],
      stayStyle: 'undecided',
      budgetTier: 'undecided',
      name: '',
      email: '',
      whatsappCode: DEFAULT_CALLING_CODE[locale],
      whatsappNumber: '',
      preferredContact: 'any',
      country: '',
      message: prefill.message ?? '',
      website: '',
    },
  }
}

/**
 * Guest counts that fit a party (used when the visitor picks a party card): solo = 1 adult, couple = 2 adults,
 * family = at least 1 child, group = at least 3 guests. Counts that already fit are kept.
 */
export function guestsForParty(party: PartyType | undefined, adults: number, children: number): { adults: number; children: number } {
  switch (party) {
    case 'solo':
      return { adults: 1, children: 0 }
    case 'couple':
      return { adults: 2, children: 0 }
    case 'family':
      return { adults: Math.max(1, adults), children: Math.max(1, children) }
    case 'group':
      return adults + children >= 3 ? { adults, children } : { adults: Math.max(3 - children, 1), children }
    default:
      return { adults, children }
  }
}

// ------------------------------------------------------------------------------------------------ API body

/** Localised, human-readable labels sent to the API (the guide reads them in the admin and the email). */
export interface WizardLabels {
  travelWindow: (value: string) => string
  flexibility: (id: FlexibilityId) => string
  duration: (id: DurationId) => string
  exactDuration?: (days: number) => string
  pace: (id: PaceId) => string
  stay: (id: StayId) => string
  /** Chip id → label; extra (prefilled) interests are passed through. */
  interest: (value: string) => string
  destination?: (slug: string) => string
  destinations?: string
  budget?: string
  budgetTier?: (id: BudgetId) => string
  contactMethod?: string
  preferredContact?: (id: ContactMethodId) => string
  /** "Children's ages" (prefix of the ages line added to the message). */
  childAges: string
}

export interface InquiryContext {
  locale: Locale
  labels: WizardLabels
  tourSlug?: string
  destinationSlug?: string
  /** Where the visitor came from (prefill `source`), e.g. 'tour-detail'. */
  source?: string
  /** Same id for every retry of one submission (the API returns the saved inquiry instead of a duplicate). */
  clientRequestId?: string
}

/** "+44" + "7700 900123" → "+44 7700 900123" (see lib/phone — also handles "00…" and a re-typed code). */
export { combineWhatsApp }

const blankToUndefined = (value: string | undefined) => {
  const v = value?.trim()
  return v ? v : undefined
}

/** Wizard values → POST /inquiries body (InquiryBody contract). */
export function toInquiryBody(values: WizardValues, context: InquiryContext): InquiryBody {
  const { labels } = context
  const interests = [...new Set(values.interests.map((v) => labels.interest(v).trim()).filter(Boolean))].slice(0, 20)
  const fixed = values.flexibility === 'fixed'
  const exactDays = fixed ? tripDays(values.travelStart, values.travelEnd) : null
  const ages = values.childAges.trim()
  const destinationList = values.destinations.filter(Boolean)
  const message = [
    values.message.trim(),
    values.children > 0 && ages ? `${labels.childAges}: ${ages}` : '',
    destinationList.length > 1
      ? `${labels.destinations ?? 'Destinations'}: ${destinationList.map((s) => (labels.destination ? labels.destination(s) : s)).join(', ')}`
      : '',
    values.budgetTier !== 'undecided'
      ? `${labels.budget ?? 'Comfort tier'}: ${labels.budgetTier ? labels.budgetTier(values.budgetTier) : values.budgetTier}`
      : '',
    values.preferredContact !== 'any'
      ? `${labels.contactMethod ?? 'Preferred contact'}: ${labels.preferredContact ? labels.preferredContact(values.preferredContact) : values.preferredContact}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n')
  return {
    partyType: values.partyType,
    adults: values.adults,
    children: values.children,
    ...(fixed
      ? { travelStart: values.travelStart, travelEnd: values.travelEnd, flexibleDates: false }
      : { travelWindow: labels.travelWindow(values.travelWindow).slice(0, 120), flexibleDates: true }),
    flexibility: labels.flexibility(values.flexibility),
    durationPreference: exactDays
      ? (labels.exactDuration ? labels.exactDuration(exactDays) : `${exactDays} days`)
      : labels.duration(values.durationPreference),
    // "No preference" is the untouched default — not an answer the guide should read as a choice.
    pace: values.pace === 'undecided' ? undefined : labels.pace(values.pace),
    interests,
    stayStyle: values.stayStyle === 'undecided' ? undefined : labels.stay(values.stayStyle),
    name: values.name.trim(),
    email: values.email.trim(),
    whatsapp: blankToUndefined(combineWhatsApp(values.whatsappCode, values.whatsappNumber)),
    country: blankToUndefined(values.country),
    message: blankToUndefined(message)?.slice(0, 5000),
    tourSlug: blankToUndefined(values.tourSlug) ?? context.tourSlug,
    destinationSlug: destinationList[0] ?? context.destinationSlug,
    sourcePage: context.source ? `/contact?source=${context.source}`.slice(0, 300) : '/contact',
    locale: context.locale,
    website: values.website ?? '',
    ...(values.turnstileToken ? { turnstileToken: values.turnstileToken } : {}),
    ...(context.clientRequestId ? { clientRequestId: context.clientRequestId } : {}),
  }
}

// ------------------------------------------------------------------------------------------------ submit

export type WizardSubmitOutcome =
  | { kind: 'success'; reference: string }
  /** 400/422: field errors routed to their steps (+ the generic failure for the status message). */
  | { kind: 'invalid'; errors: MappedServerErrors; failure: FormFailure }
  /** 429 / network / server — shown as a friendly message on the current step. */
  | { kind: 'failed'; failure: FormFailure }

/** Interprets the POST /inquiries result for the wizard UI. */
export function submitOutcome(result: FormResult<InquiryResult>): WizardSubmitOutcome {
  if (result.ok) return { kind: 'success', reference: result.data.reference }
  if (result.kind === 'validation')
    return { kind: 'invalid', errors: mapServerErrors(result.fieldErrors), failure: result }
  return { kind: 'failed', failure: result }
}

/** Maps the wizard values to the API body, POSTs them and interprets the answer (never throws). */
export async function sendInquiry(values: WizardValues, context: InquiryContext): Promise<WizardSubmitOutcome> {
  return submitOutcome(await submitInquiry(toInquiryBody(values, context)))
}

// ------------------------------------------------------------------------------------------------ draft

export const DRAFT_KEY = 'serendiva.contact-draft.v1'

export interface WizardDraft {
  v: 1
  /** Prefill signature the draft was started with (a different tour/destination starts afresh). */
  context: string
  step: number
  aboutDismissed: boolean
  extraInterests: string[]
  values: Omit<WizardValues, 'website' | 'turnstileToken'>
}

/** Stable signature of the prefill (parseContactPrefill output is already key-ordered). */
export const prefillSignature = (prefill: ContactPrefill) => JSON.stringify(prefill)

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : undefined)
const int = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : undefined
const oneOf = <T extends string>(v: unknown, list: readonly T[]) =>
  typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : undefined
const strings = (v: unknown, maxItems: number, maxLength: number) =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= maxLength).slice(0, maxItems)
    : undefined

/**
 * Merges a stored draft over the initial state. Every field is type-checked; anything stale (e.g. a travel
 * window from a season that has passed) falls back to the initial value. Returns null for foreign/invalid drafts.
 */
export function restoreDraft(
  raw: unknown,
  initial: WizardInitialState,
  context: string,
  travelWindowValues: readonly string[],
): (WizardInitialState & { step: number; aboutDismissed: boolean }) | null {
  if (!isRecord(raw) || raw.v !== 1 || !isRecord(raw.values)) return null
  if (raw.context !== context) return null
  const d = raw.values
  const base = initial.values
  const values: WizardValues = {
    ...base,
    partyType: oneOf(d.partyType, TRAVELLER_TYPES) ?? base.partyType,
    adults: int(d.adults, 1, 50) ?? base.adults,
    children: int(d.children, 0, 50) ?? base.children,
    childAges: str(d.childAges, 60) ?? base.childAges,
    travelWindow: oneOf(d.travelWindow, travelWindowValues) ?? base.travelWindow,
    travelStart: typeof d.travelStart === 'string' && ISO_DATE.test(d.travelStart) ? d.travelStart : base.travelStart,
    travelEnd: typeof d.travelEnd === 'string' && ISO_DATE.test(d.travelEnd) ? d.travelEnd : base.travelEnd,
    flexibility: oneOf(d.flexibility, FLEXIBILITY_IDS) ?? base.flexibility,
    durationPreference: oneOf(d.durationPreference, DURATION_IDS) ?? base.durationPreference,
    pace: oneOf(d.pace, PACE_IDS) ?? base.pace,
    interests: strings(d.interests, 20, 60) ?? base.interests,
    tourSlug: str(d.tourSlug, 120) ?? base.tourSlug,
    destinations: strings(d.destinations, 15, 120) ?? base.destinations,
    stayStyle: oneOf(d.stayStyle, STAY_IDS) ?? base.stayStyle,
    budgetTier: oneOf(d.budgetTier, BUDGET_IDS) ?? base.budgetTier,
    name: str(d.name, 120) ?? base.name,
    email: str(d.email, 200) ?? base.email,
    whatsappCode: oneOf(d.whatsappCode, CALLING_CODE_VALUES) ?? base.whatsappCode,
    whatsappNumber: str(d.whatsappNumber, 32) ?? base.whatsappNumber,
    preferredContact: oneOf(d.preferredContact, CONTACT_METHOD_IDS) ?? base.preferredContact,
    country: str(d.country, 80) ?? base.country,
    message: str(d.message, 5000) ?? base.message,
  }
  const extras = [...new Set([...initial.extraInterests, ...(strings(raw.extraInterests, 20, 60) ?? [])])]
  return {
    values,
    extraInterests: extras,
    step: int(raw.step, 0, STEP_COUNT - 1) ?? 0,
    aboutDismissed: raw.aboutDismissed === true,
  }
}

/** sessionStorage access that never throws (private mode, blocked storage, SSR). */
export const draftStorage = {
  read(): unknown {
    try {
      const raw = window.sessionStorage.getItem(DRAFT_KEY)
      return raw ? (JSON.parse(raw) as unknown) : null
    } catch {
      return null
    }
  },
  write(draft: WizardDraft): void {
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      // storage full or blocked — the draft is a convenience only
    }
  },
  clear(): void {
    try {
      window.sessionStorage.removeItem(DRAFT_KEY)
    } catch {
      // ignore
    }
  },
}
