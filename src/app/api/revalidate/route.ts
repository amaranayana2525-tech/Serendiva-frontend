import { timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { TAG_PATTERN } from '@/lib/api/tags'
import { getServerEnv } from '@/lib/env'

/**
 * On-demand ISR webhook called by the API after content changes:
 *   POST /api/revalidate   x-revalidate-secret: <REVALIDATE_SECRET>   { "tags": ["tours", "tour:cultural-odyssey"] }
 * Each tag is expired immediately with revalidateTag(tag, { expire: 0 }) so the next request fetches fresh data. 401 on a bad/missing secret.
 */
const bodySchema = z.object({
  tags: z.array(z.string().regex(TAG_PATTERN)).min(1).max(50),
})

function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

const error = (status: number, code: string, message: string, details?: unknown) =>
  NextResponse.json({ error: { code, message, ...(details ? { details } : {}) } }, { status })

export async function POST(request: NextRequest) {
  const { revalidateSecret } = getServerEnv()
  const provided = request.headers.get('x-revalidate-secret') ?? ''
  if (!revalidateSecret || !secretMatches(provided, revalidateSecret)) {
    return error(401, 'UNAUTHORIZED', 'Invalid revalidation secret')
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return error(400, 'BAD_REQUEST', 'Body must be JSON: { "tags": string[] }')
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return error(
      400,
      'VALIDATION_ERROR',
      'Some fields are invalid',
      parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    )
  }

  const tags = [...new Set(parsed.data.tags)]
  // `expire: 0` instead of 'max': stale content must never be served after an edit — otherwise an unpublished tour
  // would keep rendering, because Next's fetch cache only stores 200 responses and the 404 can't replace the old entry.
  for (const tag of tags) revalidateTag(tag, { expire: 0 })
  return NextResponse.json({ revalidated: tags, now: Date.now() })
}
