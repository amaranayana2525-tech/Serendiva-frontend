import { publicEnv } from '@/lib/env'
import { isApiErrorBody, parseRetryAfter } from './errors'

/*
 * Browser-side helpers for the newsletter double opt-in links (/newsletter/confirm?token=…, /newsletter/unsubscribe?token=…).
 * They call the API directly (NEXT_PUBLIC_API_URL, CORS) and never throw.
 *
 *   const outcome = await confirmNewsletter(token)
 *   if (outcome.ok) outcome.status   // 'confirmed' | 'already_confirmed'
 *   else outcome.kind                // 'invalid' | 'rate_limited' | 'network' | 'server'
 */

export type NewsletterTokenAction = 'confirm' | 'unsubscribe'

export type NewsletterTokenStatus = 'confirmed' | 'already_confirmed' | 'unsubscribed'

export type NewsletterTokenOutcome =
  | { ok: true; status: NewsletterTokenStatus }
  | { ok: false; kind: 'invalid' }
  | { ok: false; kind: 'rate_limited'; retryAfterSeconds?: number }
  | { ok: false; kind: 'network' }
  | { ok: false; kind: 'server' }

const TIMEOUT_MS = 15_000
/** Same bounds as the API (NewsletterTokenQuery): 16–200 characters. */
const TOKEN_RE = /^\S{16,200}$/

/** True when the token has the shape the API accepts (saves a request for obviously broken links). */
export function isPlausibleToken(token: string | null | undefined): token is string {
  return typeof token === 'string' && TOKEN_RE.test(token.trim())
}

const ALLOWED: Record<NewsletterTokenAction, readonly NewsletterTokenStatus[]> = {
  confirm: ['confirmed', 'already_confirmed'],
  unsubscribe: ['unsubscribed'],
}

/** GET /newsletter/{action}?token= → discriminated outcome. */
export async function runNewsletterTokenAction(
  action: NewsletterTokenAction,
  token: string | null | undefined,
  { signal }: { signal?: AbortSignal } = {},
): Promise<NewsletterTokenOutcome> {
  if (!isPlausibleToken(token)) return { ok: false, kind: 'invalid' }

  let response: Response
  try {
    const timeout = AbortSignal.timeout(TIMEOUT_MS)
    response = await fetch(
      `${publicEnv.apiUrl}/api/v1/newsletter/${action}?token=${encodeURIComponent(token.trim())}`,
      {
        method: 'GET',
        headers: { accept: 'application/json' },
        credentials: 'omit',
        cache: 'no-store',
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      },
    )
  } catch {
    return { ok: false, kind: 'network' }
  }

  const payload: unknown = await response.json().catch(() => null)

  if (response.ok) {
    const status =
      typeof payload === 'object' && payload !== null && 'status' in payload
        ? (payload as { status: unknown }).status
        : undefined
    if (typeof status === 'string' && (ALLOWED[action] as readonly string[]).includes(status)) {
      return { ok: true, status: status as NewsletterTokenStatus }
    }
    return { ok: false, kind: 'server' }
  }
  if (response.status === 429) {
    return { ok: false, kind: 'rate_limited', retryAfterSeconds: parseRetryAfter(response.headers.get('retry-after')) }
  }
  // 400 INVALID_TOKEN / VALIDATION_ERROR and 404 all mean the link cannot be used.
  if (response.status === 400 || response.status === 404 || response.status === 410) {
    return { ok: false, kind: 'invalid' }
  }
  if (isApiErrorBody(payload) && payload.error.code === 'INVALID_TOKEN') return { ok: false, kind: 'invalid' }
  return { ok: false, kind: 'server' }
}

/** Confirms a subscription (double opt-in). */
export function confirmNewsletter(token: string | null | undefined, options?: { signal?: AbortSignal }) {
  return runNewsletterTokenAction('confirm', token, options)
}

/** Unsubscribes (idempotent on the API). */
export function unsubscribeNewsletter(token: string | null | undefined, options?: { signal?: AbortSignal }) {
  return runNewsletterTokenAction('unsubscribe', token, options)
}
