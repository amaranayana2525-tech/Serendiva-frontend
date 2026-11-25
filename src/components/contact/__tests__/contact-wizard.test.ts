import { afterEach, describe, expect, it, vi } from 'vitest'
import { publicEnv } from '@/lib/env'
import {
  interestIdFor,
  parseMonthRange,
  travelWindowForMonth,
  travelWindowForRange,
  travelWindowOptions,
} from '@/components/contact/wizard-config'
import { addMonthsIso, overlapsBusy, tripDays } from '@/components/contact/wizard-dates'
import {
  DRAFT_KEY,
  STEP_FIELDS,
  combineWhatsApp,
  guestsForParty,
  initialWizardState,
  mapServerErrors,
  prefillSignature,
  restoreDraft,
  sendInquiry,
  stepOfField,
  toInquiryBody,
  wizardSchema,
  type InquiryContext,
  type WizardValues,
} from '@/components/contact/wizard-model'

const TODAY = '2026-10-05'
const windows = travelWindowOptions(TODAY)

const labels: InquiryContext['labels'] = {
  travelWindow: (v) => `window:${v}`,
  flexibility: (v) => `flex:${v}`,
  duration: (v) => `duration:${v}`,
  exactDuration: (days) => `${days} days (${Math.max(0, days - 1)} nights)`,
  pace: (v) => `pace:${v}`,
  stay: (v) => `stay:${v}`,
  interest: (v) => `interest:${v}`,
  destination: (s) => `dest:${s}`,
  destinations: 'Destinations',
  budget: 'Comfort tier',
  budgetTier: (id) => `budget:${id}`,
  contactMethod: 'Preferred contact',
  preferredContact: (id) => `contact:${id}`,
  childAges: 'Children’s ages',
}

const filled = (): WizardValues => ({
  ...initialWizardState({}, windows, TODAY, 'en').values,
  // what a visitor actually picks (nothing is pre-chosen any more)
  partyType: 'couple',
  travelWindow: 'season-2026-12',
  flexibility: 'days',
  durationPreference: 'indepth',
  pace: 'balanced',
  stayStyle: 'bungalows',
  name: '  Ada Lovelace ',
  email: 'ada@example.com',
  whatsappCode: '+44',
  whatsappNumber: '07700 900123',
  country: '',
  message: '  ',
  interests: ['safaris', 'Ramayana trail'],
})

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('contact wizard — travel windows', () => {
  it('generates seasons for the next 18 months from today (never hard-coded years)', () => {
    expect(windows.map((w) => w.value)).toEqual([
      'immediate',
      'season-2026-12',
      'season-2027-03',
      'season-2027-06',
      'season-2027-09',
      'season-2027-12',
      'season-2028-03',
      'later',
      'flexible',
    ])
    expect(travelWindowOptions('2031-01-20')[1]).toMatchObject({ value: 'season-2031-03', season: 'mar' })
  })

  it('still offers the current Dec–Feb season in December (from next month)', () => {
    expect(travelWindowOptions('2026-12-05')[1]).toMatchObject({ value: 'season-2027-01', season: 'dec', start: 2027 * 12, end: 2027 * 12 + 1 })
  })

  it('keeps a month range picked on the hero / in the quiz exactly', () => {
    const picked = parseMonthRange('2027-02/2027-04')
    expect(picked).toEqual({ start: 2027 * 12 + 1, end: 2027 * 12 + 3 })
    const opts = travelWindowOptions(TODAY, 18, picked)
    const value = travelWindowForRange('2027-02/2027-04', opts)
    expect(value).toBe('range-2027-02-2027-04')
    expect(opts.find((o) => o.value === value)).toMatchObject({ kind: 'range' })
    // a range that is a season maps to the season, no extra option
    const season = travelWindowOptions(TODAY, 18, parseMonthRange('2027-03/2027-05'))
    expect(travelWindowForRange('2027-03/2027-05', season)).toBe('season-2027-03')
    expect(season.filter((o) => o.kind === 'range')).toHaveLength(0)
    expect(parseMonthRange('2027-05/2027-01')).toBeNull()
  })

  it('maps a prefilled month onto the generated options', () => {
    expect(travelWindowForMonth('2027-04', TODAY, windows)).toBe('season-2027-03')
    expect(travelWindowForMonth('2027-01', TODAY, windows)).toBe('season-2026-12')
    expect(travelWindowForMonth('2026-11', TODAY, windows)).toBe('immediate')
    expect(travelWindowForMonth('2030-01', TODAY, windows)).toBe('later')
    expect(travelWindowForMonth('2025-01', TODAY, windows)).toBeNull()
    expect(travelWindowForMonth('flexible', TODAY, windows)).toBe('flexible')
  })

  it('computes inclusive tripDays and UTC-clamped addMonthsIso', () => {
    expect(tripDays('2099-03-01', '2099-03-12')).toBe(12)
    expect(tripDays('2099-03-01', '2099-03-01')).toBe(1)
    expect(tripDays('2099-03-10', '2099-03-01')).toBeNull()
    expect(tripDays('2026-02-30', '2026-03-05')).toBeNull()
    expect(addMonthsIso('2025-01-31', 1)).toBe('2025-02-28')
    expect(addMonthsIso('2024-01-31', 1)).toBe('2024-02-29')
    expect(addMonthsIso('2026-10-05', 18)).toBe('2028-04-05')
  })
})

describe('contact wizard — prefill', () => {
  it('applies party, guests, month, interests and message from the /contact query', () => {
    const { values, extraInterests } = initialWizardState(
      {
        party: 'family',
        adults: 3,
        children: 2,
        month: '2027-03',
        interests: ['wildlife-safari', 'Tea country', 'ramayana-trail'],
        message: 'Hi',
      },
      windows,
      TODAY,
      'de',
    )
    expect(values).toMatchObject({
      partyType: 'family',
      adults: 3,
      children: 2,
      travelWindow: 'season-2027-03',
      interests: ['safaris', 'tea_estates', 'ramayana-trail'],
      message: 'Hi',
      whatsappCode: '+49',
    })
    expect(extraInterests).toEqual(['ramayana-trail'])
  })

  it('pre-chooses nothing: party and window empty, length / pace / stays "no preference"', () => {
    expect(initialWizardState({}, windows, TODAY, 'en').values).toMatchObject({
      partyType: undefined,
      adults: 2,
      travelWindow: '',
      durationPreference: 'flexible',
      pace: 'undecided',
      stayStyle: 'undecided',
      flexibility: 'completely',
    })
    expect(initialWizardState({ party: 'solo' }, windows, TODAY, 'en').values.adults).toBe(1)
    expect(initialWizardState({ party: 'family' }, windows, TODAY, 'en').values.children).toBe(1)
    expect(initialWizardState({ duration: 'grand' }, windows, TODAY, 'en').values.durationPreference).toBe('grand')
    expect(interestIdFor('Pristine Beaches')).toBe('coast_whales')
  })

  it('fits the guest counts to the party', () => {
    expect(guestsForParty('solo', 4, 2)).toEqual({ adults: 1, children: 0 })
    expect(guestsForParty('couple', 5, 1)).toEqual({ adults: 2, children: 0 })
    expect(guestsForParty('family', 2, 0)).toEqual({ adults: 2, children: 1 })
    expect(guestsForParty('group', 1, 0)).toEqual({ adults: 3, children: 0 })
    expect(guestsForParty('group', 6, 2)).toEqual({ adults: 6, children: 2 })
  })
})

describe('contact wizard — validation per step', () => {
  it('lists every schema field in exactly one step', () => {
    const stepFields = STEP_FIELDS.flat()
    const schemaFields = Object.keys(wizardSchema.shape).filter((k) => k !== 'website' && k !== 'turnstileToken')
    expect([...stepFields].sort()).toEqual(schemaFields.sort())
    expect(stepOfField('partyType')).toBe(0)
    expect(stepOfField('pace')).toBe(1)
    expect(stepOfField('stayStyle')).toBe(2)
    expect(stepOfField('whatsappNumber')).toBe(3)
  })

  const issuesOf = (values: WizardValues) =>
    Object.fromEntries((wizardSchema.safeParse(values).error?.issues ?? []).map((i) => [String(i.path[0]), i.message]))

  it('requires name and email; WhatsApp is optional but must be a valid number with code when "other"', () => {
    expect(issuesOf({ ...filled(), name: 'A', email: 'nope', whatsappNumber: 'abc' })).toMatchObject({
      name: 'nameTooShort',
      email: 'email',
      whatsappNumber: 'phone',
    })
    expect(issuesOf({ ...filled(), whatsappNumber: '-----' })).toMatchObject({ whatsappNumber: 'phone' })
    expect(issuesOf({ ...filled(), whatsappCode: 'other', whatsappNumber: '085 123 4567' })).toMatchObject({
      whatsappNumber: 'phoneCountryCode',
    })
    expect(wizardSchema.safeParse({ ...filled(), whatsappCode: 'other', whatsappNumber: '+353 85 123 4567' }).success).toBe(true)
    expect(wizardSchema.safeParse({ ...filled(), whatsappNumber: '' }).success).toBe(true)
    expect(issuesOf({ ...filled(), preferredContact: 'whatsapp', whatsappNumber: '' })).toMatchObject({
      whatsappNumber: 'required',
    })
    expect(issuesOf({ ...filled(), preferredContact: 'call', whatsappNumber: '' })).toMatchObject({
      whatsappNumber: 'required',
    })
    expect(wizardSchema.safeParse({ ...filled(), preferredContact: 'whatsapp' }).success).toBe(true)
    expect(wizardSchema.safeParse(filled()).success).toBe(true)
  })

  it('requires a party and a travel window (or exact dates)', () => {
    expect(issuesOf({ ...filled(), partyType: undefined, travelWindow: '' })).toMatchObject({
      partyType: 'required',
      travelWindow: 'required',
    })
    const fixed = { ...filled(), flexibility: 'fixed' as const, travelWindow: '' }
    expect(issuesOf(fixed)).toMatchObject({ travelStart: 'required', travelEnd: 'required' })
    expect(issuesOf({ ...fixed, travelStart: '2099-03-10', travelEnd: '2099-03-01' })).toMatchObject({ travelEnd: 'dateOrder' })
    expect(issuesOf({ ...fixed, travelStart: '2020-01-01', travelEnd: '2020-01-09' })).toMatchObject({ travelStart: 'datePast' })
    expect(wizardSchema.safeParse({ ...fixed, travelStart: '2099-03-01', travelEnd: '2099-03-12' }).success).toBe(true)
  })

  it('checks the guests against the party and guards combined message + childAges length', () => {
    expect(issuesOf({ ...filled(), partyType: 'solo', adults: 2 })).toMatchObject({ adults: 'partySolo' })
    expect(issuesOf({ ...filled(), partyType: 'couple', children: 1 })).toMatchObject({ children: 'partyCouple' })
    expect(issuesOf({ ...filled(), partyType: 'family', children: 0 })).toMatchObject({ children: 'partyFamily' })
    expect(issuesOf({ ...filled(), partyType: 'group', adults: 2 })).toMatchObject({ adults: 'partyGroup' })
    expect(
      issuesOf({
        ...filled(),
        partyType: 'family',
        children: 1,
        childAges: '5',
        message: 'x'.repeat(4985),
      }),
    ).toMatchObject({ message: 'tooLong:5000' })
  })
})

describe('contact wizard — API body', () => {
  it('maps the values to the InquiryBody contract', () => {
    const body = toInquiryBody(filled(), {
      locale: 'en',
      labels,
      tourSlug: 'cultural-odyssey',
      source: 'tour-detail',
    })
    expect(body).toEqual({
      partyType: 'couple',
      adults: 2,
      children: 0,
      travelWindow: 'window:season-2026-12',
      flexibleDates: true,
      flexibility: 'flex:days',
      durationPreference: 'duration:indepth',
      pace: 'pace:balanced',
      interests: ['interest:safaris', 'interest:Ramayana trail'],
      stayStyle: 'stay:bungalows',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      whatsapp: '+44 7700 900123',
      country: undefined,
      message: undefined,
      tourSlug: 'cultural-odyssey',
      destinationSlug: undefined,
      sourcePage: '/contact?source=tour-detail',
      locale: 'en',
      website: '',
    })
  })

  it('sends exact dates instead of a window, no "no preference" answers, and the children’s ages', () => {
    const body = toInquiryBody(
      {
        ...filled(),
        partyType: 'family',
        children: 2,
        childAges: '4, 9',
        message: 'Hi',
        flexibility: 'fixed',
        travelStart: '2099-03-01',
        travelEnd: '2099-03-12',
        pace: 'undecided',
        stayStyle: 'undecided',
      },
      { locale: 'en', labels },
    )
    expect(body).toMatchObject({
      travelStart: '2099-03-01',
      travelEnd: '2099-03-12',
      flexibleDates: false,
      durationPreference: '12 days (11 nights)',
      pace: undefined,
      stayStyle: undefined,
    })
    expect(body.travelWindow).toBeUndefined()
    expect(body.message).toBe('Hi\n\nChildren’s ages: 4, 9')
    expect(overlapsBusy('2099-03-01', '2099-03-12', [{ start: '2099-03-10', end: '2099-03-20' }])).toBe(true)
    expect(overlapsBusy('2099-03-01', '2099-03-09', [{ start: '2099-03-10', end: '2099-03-20' }])).toBe(false)
  })

  it('maps single vs multi-destinations, budget tier, and preferred contact cleanly without cluttering defaults', () => {
    const single = toInquiryBody(
      { ...filled(), tourSlug: 'hill-retreat', destinations: ['ella'] },
      { locale: 'en', labels },
    )
    expect(single.tourSlug).toBe('hill-retreat')
    expect(single.destinationSlug).toBe('ella')
    expect(single.message).toBeUndefined()

    const multi = toInquiryBody(
      {
        ...filled(),
        destinations: ['sigiriya', 'ella'],
        budgetTier: 'luxury',
        preferredContact: 'whatsapp',
      },
      { locale: 'en', labels },
    )
    expect(multi.destinationSlug).toBe('sigiriya')
    expect(multi.message).toBe(
      ['Destinations: dest:sigiriya, dest:ella', 'Comfort tier: budget:luxury', 'Preferred contact: contact:whatsapp'].join('\n\n'),
    )
  })

  it('combines the calling code with the number', () => {
    expect(combineWhatsApp('+94', '077 123 4567')).toBe('+94 77 123 4567')
    expect(combineWhatsApp('+44', '+44 7700 900123')).toBe('+44 7700 900123')
    expect(combineWhatsApp('other', '+353 85 123 4567')).toBe('+353 85 123 4567')
    expect(combineWhatsApp('+1', '   ')).toBe('')
  })
})

describe('contact wizard — server errors', () => {
  it('routes API field errors to the earliest step and keeps unknown fields form-level', () => {
    expect(stepOfField('tourSlug')).toBe(2)
    expect(
      mapServerErrors({ whatsapp: 'Bad number', partyType: 'Invalid option', tourSlug: 'Unknown tour', sourcePage: 'Invalid source' }),
    ).toEqual({
      fields: [
        { field: 'partyType', message: 'Invalid option' },
        { field: 'tourSlug', message: 'Unknown tour' },
        { field: 'whatsappNumber', message: 'Bad number' },
      ],
      form: ['Invalid source'],
      step: 0,
    })
    expect(mapServerErrors({ locale: 'Nope' })).toEqual({ fields: [], form: ['Nope'], step: 3 })
  })
})

describe('contact wizard — submission outcomes (mocked fetch)', () => {
  const context: InquiryContext = { locale: 'en', labels }

  it('returns the reference on 201 and POSTs the mapped body', async () => {
    const fetchMock = vi.fn(async () => json(201, { reference: 'SRD-2026-0042', message: 'Thanks' }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(sendInquiry(filled(), context)).resolves.toEqual({ kind: 'success', reference: 'SRD-2026-0042' })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${publicEnv.apiUrl}/api/v1/inquiries`)
    expect(JSON.parse(String(init.body))).toMatchObject({ name: 'Ada Lovelace', whatsapp: '+44 7700 900123' })
  })

  it('reports 429 as rate limited with the Retry-After seconds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json(429, { error: { code: 'RATE_LIMITED', message: 'Slow down' } }, { 'retry-after': '37' })),
    )
    await expect(sendInquiry(filled(), context)).resolves.toEqual({
      kind: 'failed',
      failure: { ok: false, kind: 'rate_limited', retryAfterSeconds: 37 },
    })
  })

  it('reports network failures and 5xx without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )
    await expect(sendInquiry(filled(), context)).resolves.toEqual({
      kind: 'failed',
      failure: { ok: false, kind: 'network' },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json(503, { error: { code: 'DOWN', message: 'Maintenance' } })),
    )
    await expect(sendInquiry(filled(), context)).resolves.toMatchObject({ kind: 'failed', failure: { kind: 'server' } })
  })

  it('routes 400 VALIDATION_ERROR details back to the wizard steps', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        json(400, {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Some fields are invalid',
            details: [{ path: 'email', message: 'Please enter a valid email address' }],
          },
        }),
      ),
    )
    const outcome = await sendInquiry(filled(), context)
    expect(outcome).toMatchObject({
      kind: 'invalid',
      errors: { step: 3, fields: [{ field: 'email', message: 'Please enter a valid email address' }] },
    })
  })
})

describe('contact wizard — sessionStorage draft', () => {
  const initial = initialWizardState({}, windows, TODAY, 'en')
  const values = windows.map((w) => w.value)

  it('restores a matching draft and type-checks every field', () => {
    const restored = restoreDraft(
      {
        v: 1,
        context: '{}',
        step: 3,
        aboutDismissed: true,
        extraInterests: ['honeymoon'],
        values: {
          ...filled(),
          adults: 999,
          travelWindow: 'season-2019-12',
          pace: 'sprint',
          tourSlug: 'cultural-odyssey',
          destinations: ['kandy', 'ella'],
          budgetTier: 'boutique',
          preferredContact: 'email',
          name: 'Grace',
        },
      },
      initial,
      '{}',
      values,
    )
    expect(restored).toMatchObject({ step: 3, aboutDismissed: true, extraInterests: ['honeymoon'] })
    expect(restored?.values).toMatchObject({
      name: 'Grace',
      partyType: 'couple',
      adults: 2,
      travelWindow: '', // stale season → back to "choose"
      pace: 'undecided', // invalid value → the default
      tourSlug: 'cultural-odyssey',
      destinations: ['kandy', 'ella'],
      budgetTier: 'boutique',
      preferredContact: 'email',
    })
    const invalidNew = restoreDraft(
      {
        v: 1,
        context: '{}',
        step: 0,
        aboutDismissed: false,
        extraInterests: [],
        values: { ...filled(), budgetTier: 'billionaire', preferredContact: 'carrier-pigeon', destinations: 'kandy' },
      },
      initial,
      '{}',
      values,
    )
    expect(invalidNew?.values).toMatchObject({
      budgetTier: 'undecided',
      preferredContact: 'any',
      destinations: [],
    })
  })

  it('ignores drafts started for another tour, on plain /contact, and garbage', () => {
    const tourContext = prefillSignature({ tour: 'cultural-odyssey' })
    const draft = { v: 1, context: tourContext, step: 1, aboutDismissed: false, extraInterests: [], values: filled() }
    expect(restoreDraft(draft, initial, prefillSignature({ tour: 'grand-ceylon-odyssey' }), values)).toBeNull()
    expect(restoreDraft(draft, initial, '{}', values)).toBeNull()
    expect(restoreDraft(draft, initial, tourContext, values)).not.toBeNull()
    expect(restoreDraft('nope', initial, '{}', values)).toBeNull()
    expect(restoreDraft({ v: 2, values: {} }, initial, '{}', values)).toBeNull()
    expect(DRAFT_KEY).toMatch(/contact-draft/)
  })
})
