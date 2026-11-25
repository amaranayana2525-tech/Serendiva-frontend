import { existsSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/*
 * The deprecated src/content snapshot (npm run content:snapshot) is served when the API is unreachable — in
 * development, or anywhere with CONTENT_FALLBACK=true — and never otherwise. These tests simulate an API outage by
 * making `fetch` fail, so the shared dev API never has to be stopped.
 */

const snapshot = (key: string) => path.join(process.cwd(), 'src', 'content', `${key}.json`)
const hasSnapshot = existsSync(snapshot('settings')) && existsSync(snapshot('tour.cultural-odyssey'))

async function loadPublicApi() {
  vi.resetModules() // env is read when the module (and the openapi client) is created
  return import('@/lib/api/public')
}

const networkDown = () => vi.fn().mockRejectedValue(new TypeError('fetch failed'))

describe.skipIf(!hasSnapshot)('content fallback (API unreachable)', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('serves the snapshot with CONTENT_FALLBACK=true and logs a warning', async () => {
    vi.stubEnv('CONTENT_FALLBACK', 'true')
    const fetchMock = networkDown()
    vi.stubGlobal('fetch', fetchMock)
    const { getSettings, getAllTours, getTour, getFaqs } = await loadPublicApi()

    const settings = await getSettings('en')
    expect(fetchMock).toHaveBeenCalled()
    expect(settings.contact.whatsapp).toMatch(/^\d+$/)

    const tours = await getAllTours('en')
    expect(tours.length).toBeGreaterThan(0)

    const tour = await getTour('en', 'cultural-odyssey')
    expect(tour?.slug).toBe('cultural-odyssey')

    expect(Array.isArray(await getFaqs('en', { scope: 'general' }))).toBe(true)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('serving the deprecated src/content snapshot'))
  })

  it('also falls back when the API answers 5xx', async () => {
    vi.stubEnv('CONTENT_FALLBACK', 'true')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        async () =>
          new Response(JSON.stringify({ error: { code: 'INTERNAL', message: 'boom' } }), {
            status: 503,
            headers: { 'content-type': 'application/json' },
          }),
      ),
    )
    const { getSettings } = await loadPublicApi()
    expect((await getSettings('en')).contact).toBeDefined()
  })

  it('throws a network ApiError when the fallback is disabled', async () => {
    vi.stubEnv('CONTENT_FALLBACK', 'false')
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubGlobal('fetch', networkDown())
    const { getSettings } = await loadPublicApi()
    const { ApiError } = await import('@/lib/api/errors')

    const error = await getSettings('en').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
    expect(warn).not.toHaveBeenCalled()
  })

  it('does not hide real 404s behind the snapshot (unknown slug → null)', async () => {
    vi.stubEnv('CONTENT_FALLBACK', 'true')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        async () =>
          new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Tour not found' } }), {
            status: 404,
            headers: { 'content-type': 'application/json' },
          }),
      ),
    )
    const { getTour } = await loadPublicApi()
    expect(await getTour('en', 'no-such-tour')).toBeNull()
    expect(warn).not.toHaveBeenCalled()
  })

  it('throws for a resource the snapshot does not contain', async () => {
    vi.stubEnv('CONTENT_FALLBACK', 'true')
    vi.stubGlobal('fetch', networkDown())
    const { getTour } = await loadPublicApi()
    await expect(getTour('en', 'not-in-the-snapshot')).rejects.toMatchObject({ status: 0 })
  })
})
