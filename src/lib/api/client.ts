import 'server-only'
import createClient from 'openapi-fetch'
import { getServerEnv } from '@/lib/env'
import type { paths } from './schema'
import { DEFAULT_REVALIDATE } from './tags'

/** Typed server-side API client (openapi-fetch). Use the functions in ./public.ts instead of calling it directly. */
export const api = createClient<paths>({ baseUrl: getServerEnv().apiUrl })

export interface CacheOptions {
  /** Cache tags (see ./tags.ts) so the API can revalidate exactly what changed. */
  tags: string[]
  /** Seconds before Next refetches in the background (default 3600). `0` disables caching. */
  revalidate?: number
  /** Abort after this many milliseconds (default 10 s). */
  timeoutMs?: number
}

/**
 * Per-request `fetch` for openapi-fetch that attaches Next's data-cache options. openapi-fetch builds a `Request`
 * object (which drops the non-standard `next` field), so the options must be added at the fetch call.
 */
export function cachedFetch({ tags, revalidate = DEFAULT_REVALIDATE, timeoutMs = 10_000 }: CacheOptions) {
  return (input: Request): Promise<Response> =>
    fetch(input, {
      next: { tags, revalidate },
      signal: AbortSignal.timeout(timeoutMs),
    })
}
