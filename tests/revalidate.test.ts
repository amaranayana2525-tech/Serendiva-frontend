import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const revalidateTag = vi.fn()
vi.mock('next/cache', () => ({ revalidateTag: (...args: unknown[]) => revalidateTag(...args) }))

const SECRET = 'test-secret-0123456789'

async function post(body: unknown, secret?: string) {
  const { POST } = await import('@/app/api/revalidate/route')
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (secret !== undefined) headers['x-revalidate-secret'] = secret
  const request = new NextRequest('http://localhost:3000/api/revalidate', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
  const response = await POST(request)
  return { status: response.status, json: (await response.json()) as Record<string, unknown> }
}

describe('POST /api/revalidate', () => {
  beforeEach(() => {
    revalidateTag.mockReset()
    vi.stubEnv('REVALIDATE_SECRET', SECRET)
  })

  it('rejects a missing or wrong secret with 401', async () => {
    expect((await post({ tags: ['tours'] })).status).toBe(401)
    expect((await post({ tags: ['tours'] }, 'wrong')).status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('is closed when REVALIDATE_SECRET is not configured', async () => {
    vi.stubEnv('REVALIDATE_SECRET', '')
    expect((await post({ tags: ['tours'] }, '')).status).toBe(401)
  })

  it('validates the body', async () => {
    expect((await post('not json', SECRET)).status).toBe(400)
    expect((await post({ tags: [] }, SECRET)).status).toBe(400)
    expect((await post({ tags: ['tours', 'evil tag'] }, SECRET)).status).toBe(400)
    expect((await post({ tags: Array(51).fill('tours') }, SECRET)).status).toBe(400)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it("revalidates each unique tag and expires it immediately", async () => {
    const { status, json } = await post(
      { tags: ['tours', 'tour:cultural-odyssey', 'tours', 'blog:sigiriya-at-dawn'] },
      SECRET,
    )
    expect(status).toBe(200)
    expect(json.revalidated).toEqual(['tours', 'tour:cultural-odyssey', 'blog:sigiriya-at-dawn'])
    expect(revalidateTag).toHaveBeenCalledTimes(3)
    expect(revalidateTag).toHaveBeenCalledWith('tour:cultural-odyssey', { expire: 0 })
  })
})
