import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyFieldErrors,
  postToApi,
  proposalFormData,
  submitInquiry,
  submitProposal,
  submitReview,
  subscribeNewsletter,
} from '@/lib/api/forms'
import { parseRetryAfter, toFieldErrors } from '@/lib/api/errors'
import { publicEnv } from '@/lib/env'
import type { InquiryBody } from '@/lib/api/types'

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })

const inquiry: InquiryBody = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  adults: 2,
  children: 0,
  interests: [],
  locale: 'en',
}

function mockFetch(impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  const fn = vi.fn(impl)
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('api/forms', () => {
  it('returns data on success and POSTs JSON to the public API', async () => {
    const fetchMock = mockFetch(async () => json(201, { reference: 'SRD-2026-0001', message: 'Thanks' }))
    const result = await submitInquiry(inquiry)
    expect(result).toEqual({ ok: true, data: { reference: 'SRD-2026-0001', message: 'Thanks' } })
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe(`${publicEnv.apiUrl}/api/v1/inquiries`)
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual(inquiry)
    expect((init?.headers as Record<string, string>)['content-type']).toBe('application/json')
    expect(init?.signal).toBeInstanceOf(AbortSignal)
  })

  it('maps VALIDATION_ERROR details to top-level field names', async () => {
    mockFetch(async () =>
      json(400, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Some fields are invalid',
          details: [
            { path: 'email', message: 'Invalid email' },
            { path: 'interests.2', message: 'Too long' },
            { path: 'email', message: 'second message is ignored' },
            { path: '', message: 'Form level' },
          ],
        },
      }),
    )
    const result = await submitInquiry(inquiry)
    expect(result).toEqual({
      ok: false,
      kind: 'validation',
      message: 'Some fields are invalid',
      fieldErrors: { email: 'Invalid email', interests: 'Too long', _form: 'Form level' },
    })
  })

  it('reports 429 with Retry-After seconds', async () => {
    mockFetch(async () => json(429, { error: { code: 'RATE_LIMITED', message: 'Slow down' } }, { 'retry-after': '42' }))
    expect(await subscribeNewsletter({ email: 'a@b.co', locale: 'en' })).toEqual({
      ok: false,
      kind: 'rate_limited',
      retryAfterSeconds: 42,
    })
  })

  it('reports 429 without Retry-After', async () => {
    mockFetch(async () => new Response('', { status: 429 }))
    expect(
      await submitReview({
        guestName: 'Al',
        email: 'a@b.co',
        country: 'GB',
        travellerType: 'couple',
        rating: 5,
        text: 'x'.repeat(30),
        locale: 'en',
      }),
    ).toEqual({
      ok: false,
      kind: 'rate_limited',
      retryAfterSeconds: undefined,
    })
  })

  it('treats fetch failures and timeouts as network errors', async () => {
    mockFetch(async () => {
      throw new TypeError('Failed to fetch')
    })
    expect(await submitInquiry(inquiry)).toEqual({ ok: false, kind: 'network' })
    mockFetch(async () => {
      throw new DOMException('The operation timed out.', 'TimeoutError')
    })
    expect(await submitInquiry(inquiry)).toEqual({ ok: false, kind: 'network' })
  })

  it('treats 5xx (and non-JSON bodies) as server errors', async () => {
    mockFetch(async () => json(500, { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our side' } }))
    expect(await submitInquiry(inquiry)).toEqual({
      ok: false,
      kind: 'server',
      message: 'Something went wrong on our side',
    })
    mockFetch(async () => new Response('<html>Bad gateway</html>', { status: 502 }))
    expect(await submitInquiry(inquiry)).toEqual({ ok: false, kind: 'server', message: 'Unexpected response (502)' })
  })

  it('reports rejected uploads on the attachment field', async () => {
    mockFetch(async () => json(413, { error: { code: 'PAYLOAD_TOO_LARGE', message: 'Too large' } }))
    const result = await postToApi('/corporate-proposals', { body: new FormData() })
    expect(result).toMatchObject({ ok: false, kind: 'validation', fieldErrors: { attachment: 'fileTooLarge' } })
  })

  it('sends proposals as multipart with repeated logistics fields', async () => {
    const fetchMock = mockFetch(async () => json(201, { reference: 'SRD-C-2026-0001', message: 'ok' }))
    const file = new File(['%PDF-1.4'], 'brief.pdf', { type: 'application/pdf' })
    const result = await submitProposal({
      company: 'Northwind',
      contactPerson: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+44 7911 123456',
      groupSize: '18',
      dates: 'March 2027',
      eventType: 'Retreat',
      logistics: ['Airport transfers', 'Venue'],
      message: '',
      locale: 'en',
      attachment: file,
    })
    expect(result.ok).toBe(true)
    const body = fetchMock.mock.calls[0]![1]?.body as FormData
    expect(body).toBeInstanceOf(FormData)
    expect(body.getAll('logistics')).toEqual(['Airport transfers', 'Venue'])
    expect(body.get('message')).toBeNull()
    expect((body.get('attachment') as File).name).toBe('brief.pdf')
    // the multipart boundary must be set by fetch, not by us
    expect((fetchMock.mock.calls[0]![1]?.headers as Record<string, string>)['content-type']).toBeUndefined()
  })

  it('proposalFormData skips empty optional fields', () => {
    const fd = proposalFormData({
      company: 'A',
      contactPerson: 'B',
      email: 'c@d.co',
      phone: '12345',
      groupSize: '1',
      dates: 'x',
      eventType: 'y',
      logistics: [],
      locale: 'de',
      website: '',
    })
    expect(fd.get('website')).toBeNull()
    expect(fd.get('locale')).toBe('de')
  })

  it('applyFieldErrors routes unknown fields to root.server', () => {
    const setError = vi.fn()
    applyFieldErrors<{ email: string; name: string }>(setError, { email: 'Invalid', _form: 'Nope' }, ['email', 'name'])
    expect(setError).toHaveBeenCalledWith('email', { type: 'server', message: 'Invalid' })
    expect(setError).toHaveBeenCalledWith('root.server', { type: 'server', message: 'Nope' })
  })
})

describe('api/errors', () => {
  it('toFieldErrors ignores malformed details', () => {
    expect(toFieldErrors(undefined)).toEqual({})
    expect(toFieldErrors([null, { path: 'name' }, { path: ['tour', 'slug'], message: 'Bad' }])).toEqual({ tour: 'Bad' })
  })

  it('parseRetryAfter handles seconds and HTTP dates', () => {
    expect(parseRetryAfter('10')).toBe(10)
    expect(parseRetryAfter(null)).toBeUndefined()
    expect(parseRetryAfter('garbage')).toBeUndefined()
    const now = Date.parse('2026-10-05T10:00:00Z')
    expect(parseRetryAfter('Mon, 05 Oct 2026 10:00:30 GMT', now)).toBe(30)
  })
})

describe('api/forms status mapping', () => {
  it('treats unexpected 4xx (e.g. a missing endpoint) as a server error, not a validation error', async () => {
    mockFetch(async () =>
      json(404, { error: { code: 'NOT_FOUND', message: 'Route POST:/api/v1/newsletter/subscribe not found' } }),
    )
    expect(await subscribeNewsletter({ email: 'a@b.co', locale: 'en' })).toMatchObject({ ok: false, kind: 'server' })
  })
})
