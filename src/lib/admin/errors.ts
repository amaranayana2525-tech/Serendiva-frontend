import { parseRetryAfter } from '@/lib/api/errors'

/** One entry of a 400 VALIDATION_ERROR `details` array. */
export interface AdminFieldIssue {
  path: string
  message: string
}

/**
 * Typed error thrown by `unwrap()` / the admin helpers for every failed admin API call.
 *  - `status` 0 = network failure (API unreachable, offline, CORS, aborted by timeout).
 *  - `code` is the API's machine code (VALIDATION_ERROR, CONFLICT, MEDIA_IN_USE, ACCOUNT_LOCKED, RATE_LIMITED,
 *    UNAUTHORIZED, NOT_FOUND …) or NETWORK_ERROR / UNKNOWN_ERROR.
 *  - `fieldErrors` maps full dotted paths (`title.en`, `days.2.title.en`) to the first message for that path.
 */
export class AdminApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown
  readonly fieldErrors: Record<string, string>
  readonly retryAfterSeconds?: number

  constructor(init: { status: number; code: string; message: string; details?: unknown; retryAfterSeconds?: number }) {
    super(init.message)
    this.name = 'AdminApiError'
    this.status = init.status
    this.code = init.code
    this.details = init.details
    this.retryAfterSeconds = init.retryAfterSeconds
    this.fieldErrors = init.code === 'VALIDATION_ERROR' ? parseFieldIssues(init.details) : {}
  }

  get isNetworkError(): boolean {
    return this.status === 0
  }
  get isValidationError(): boolean {
    return this.code === 'VALIDATION_ERROR'
  }
  get isUnauthorized(): boolean {
    return this.status === 401
  }
  get isNotFound(): boolean {
    return this.status === 404
  }
  get isConflict(): boolean {
    return this.status === 409
  }
  get isRateLimited(): boolean {
    return this.status === 429
  }
  /** Field issues in API order (for summaries). */
  get issues(): AdminFieldIssue[] {
    return Object.entries(this.fieldErrors).map(([path, message]) => ({ path, message }))
  }
}

export const isAdminApiError = (value: unknown): value is AdminApiError => value instanceof AdminApiError

/** Normalises VALIDATION_ERROR details (`[{ path: 'title.en' | ['title','en'], message }]`) to `{ 'title.en': message }`. */
export function parseFieldIssues(details: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (!Array.isArray(details)) return out
  for (const item of details) {
    if (typeof item !== 'object' || item === null) continue
    const { path, message } = item as { path?: unknown; message?: unknown }
    if (typeof message !== 'string') continue
    const key = Array.isArray(path) ? path.join('.') : typeof path === 'string' ? path : ''
    const normalised = key.replace(/\[(\d+)\]/g, '.$1').replace(/^\./, '') || '_form'
    if (!(normalised in out)) out[normalised] = message
  }
  return out
}

/** Builds an AdminApiError from a failed Response and its (already parsed) body. */
export function errorFromResponse(response: Response, body: unknown): AdminApiError {
  const retryAfterSeconds = parseRetryAfter(response.headers.get('retry-after'))
  if (typeof body === 'object' && body !== null && 'error' in body) {
    const err = (body as { error: unknown }).error
    if (typeof err === 'object' && err !== null) {
      const { code, message, details } = err as { code?: unknown; message?: unknown; details?: unknown }
      return new AdminApiError({
        status: response.status,
        code: typeof code === 'string' ? code : `HTTP_${response.status}`,
        message: typeof message === 'string' && message ? message : response.statusText || 'Request failed',
        details,
        retryAfterSeconds,
      })
    }
  }
  return new AdminApiError({
    status: response.status,
    code: `HTTP_${response.status}`,
    message: typeof body === 'string' && body && body.length < 300 ? body : response.statusText || 'Request failed',
    retryAfterSeconds,
  })
}

/** Reads a failed Response body (JSON or text) and converts it. */
export async function readErrorResponse(response: Response): Promise<AdminApiError> {
  let body: unknown = undefined
  try {
    const text = await response.text()
    try {
      body = text ? JSON.parse(text) : undefined
    } catch {
      body = text
    }
  } catch {
    body = undefined
  }
  return errorFromResponse(response, body)
}

/** Wraps anything thrown (TypeError from fetch, AbortError, AdminApiError) into an AdminApiError. */
export function toAdminApiError(error: unknown): AdminApiError {
  if (isAdminApiError(error)) return error
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new AdminApiError({ status: 0, code: 'ABORTED', message: 'The request was cancelled' })
  }
  if (error instanceof TypeError) {
    return new AdminApiError({ status: 0, code: 'NETWORK_ERROR', message: error.message || 'Network error' })
  }
  const message = error instanceof Error ? error.message : 'Unexpected error'
  return new AdminApiError({ status: 0, code: 'UNKNOWN_ERROR', message })
}

/** True for an aborted request (unmounted component / superseded query) — never show these to the user. */
export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (isAdminApiError(error) && error.code === 'ABORTED')
  )
}

/** `MEDIA_IN_USE` (409) → the labels of the places that reference the file (e.g. "Cultural Odyssey · cover"). */
export function mediaUsageLabels(error: unknown): string[] {
  if (!isAdminApiError(error) || typeof error.details !== 'object' || error.details === null) return []
  const usage = (error.details as { usage?: unknown }).usage
  if (!Array.isArray(usage)) return []
  return usage
    .map((u) => (typeof u === 'object' && u !== null ? (u as { label?: unknown }).label : undefined))
    .filter((l): l is string => typeof l === 'string')
}
