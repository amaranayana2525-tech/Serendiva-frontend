import { describe, expect, it, vi } from 'vitest'
import { confirmNewsletter, isPlausibleToken, unsubscribeNewsletter } from '@/lib/api/newsletter-client'
import { newsletterSchema, toNewsletterBody } from '@/lib/validation/newsletter'

const TOKEN = 'YKcZJvlQx2l_2-bnxeMNKjsAPiGlU0nI'

function mockFetch(status: number, body: unknown, headers: Record<string, string> = {}) {
  const fn = vi.fn(
    async () =>
      new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } }),
  )
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('newsletter token links', () => {
  it('rejects missing or malformed tokens without calling the API', async () => {
    const fetchMock = mockFetch(200, { status: 'confirmed' })
    expect(isPlausibleToken(null)).toBe(false)
    expect(isPlausibleToken('short')).toBe(false)
    expect(isPlausibleToken('has spaces in the middle!!')).toBe(false)
    expect(isPlausibleToken(TOKEN)).toBe(true)
    expect(await confirmNewsletter(undefined)).toEqual({ ok: false, kind: 'invalid' })
    expect(await unsubscribeNewsletter('too-short')).toEqual({ ok: false, kind: 'invalid' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('confirms with a GET to the API and returns the status', async () => {
    const fetchMock = mockFetch(200, { status: 'confirmed' })
    expect(await confirmNewsletter(TOKEN)).toEqual({ ok: true, status: 'confirmed' })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toMatch(/\/api\/v1\/newsletter\/confirm\?token=YKcZJvlQx2l_2-bnxeMNKjsAPiGlU0nI$/)
    expect(init.method).toBe('GET')
    expect(init.credentials).toBe('omit')
  })

  it('reports an already confirmed subscription', async () => {
    mockFetch(200, { status: 'already_confirmed' })
    expect(await confirmNewsletter(TOKEN)).toEqual({ ok: true, status: 'already_confirmed' })
  })

  it('unsubscribes', async () => {
    const fetchMock = mockFetch(200, { status: 'unsubscribed' })
    expect(await unsubscribeNewsletter(TOKEN)).toEqual({ ok: true, status: 'unsubscribed' })
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toContain('/newsletter/unsubscribe?token=')
  })

  it('maps INVALID_TOKEN / 404 to "invalid"', async () => {
    mockFetch(400, { error: { code: 'INVALID_TOKEN', message: 'This link is invalid or has expired' } })
    expect(await confirmNewsletter(TOKEN)).toEqual({ ok: false, kind: 'invalid' })
    mockFetch(404, { error: { code: 'NOT_FOUND', message: 'Not found' } })
    expect(await unsubscribeNewsletter(TOKEN)).toEqual({ ok: false, kind: 'invalid' })
  })

  it('maps 429 to rate_limited with retry-after', async () => {
    mockFetch(429, { error: { code: 'RATE_LIMITED', message: 'Slow down' } }, { 'retry-after': '30' })
    expect(await confirmNewsletter(TOKEN)).toEqual({ ok: false, kind: 'rate_limited', retryAfterSeconds: 30 })
  })

  it('maps 5xx and unexpected bodies to "server"', async () => {
    mockFetch(500, { error: { code: 'INTERNAL', message: 'boom' } })
    expect(await confirmNewsletter(TOKEN)).toEqual({ ok: false, kind: 'server' })
    mockFetch(200, { status: 'unsubscribed' }) // wrong status for the confirm action
    expect(await confirmNewsletter(TOKEN)).toEqual({ ok: false, kind: 'server' })
  })

  it('maps fetch failures to "network"', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))),
    )
    expect(await confirmNewsletter(TOKEN)).toEqual({ ok: false, kind: 'network' })
  })

  it('preserves optional turnstileToken in newsletter form payloads', () => {
    const parsed = newsletterSchema.parse({
      email: 'reader@example.com',
      locale: 'de',
      source: 'footer',
      website: '',
      turnstileToken: 'cf-token-xyz',
    })
    expect(toNewsletterBody(parsed)).toEqual({
      email: 'reader@example.com',
      locale: 'de',
      source: 'footer',
      website: '',
      turnstileToken: 'cf-token-xyz',
    })
  })
})
