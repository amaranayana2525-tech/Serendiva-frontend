/** Error thrown by the server-side data functions (lib/api/public.ts) when the API fails. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  /** True for "API unreachable" style failures (network error, timeout, 5xx). */
  get isUnavailable(): boolean {
    return this.status === 0 || this.status >= 500
  }
}

export const isApiError = (err: unknown): err is ApiError => err instanceof ApiError

/** Shape of every API error body: `{ error: { code, message, details? } }`. */
export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown }
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false
  const err = (value as { error: unknown }).error
  return typeof err === 'object' && err !== null && typeof (err as { code?: unknown }).code === 'string'
}

/**
 * Maps the API's VALIDATION_ERROR details (`[{ path: 'email', message }]`, nested paths like `interests.2`)
 * to a flat `{ field: message }` record keyed by the top-level form field name (first message wins).
 * An empty path is reported under `_form`.
 */
export function toFieldErrors(details: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (!Array.isArray(details)) return out
  for (const item of details) {
    if (typeof item !== 'object' || item === null) continue
    const { path, message } = item as { path?: unknown; message?: unknown }
    if (typeof message !== 'string') continue
    const raw = typeof path === 'string' ? path : Array.isArray(path) ? path.join('.') : ''
    const field = raw.split(/[.[\]/]/).find(Boolean) ?? '_form'
    if (!(field in out)) out[field] = message
  }
  return out
}

/** Parses a `Retry-After` header (seconds or HTTP date) into whole seconds. */
export function parseRetryAfter(value: string | null, now: number = Date.now()): number | undefined {
  if (!value) return undefined
  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds)
  const date = Date.parse(value)
  if (Number.isNaN(date)) return undefined
  return Math.max(0, Math.ceil((date - now) / 1000))
}
