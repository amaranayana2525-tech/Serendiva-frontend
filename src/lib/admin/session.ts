/**
 * Admin session lifecycle on the client: single-flight token refresh and the "session over" redirect.
 *
 * The API keeps the session in httpOnly cookies (sd_access 15 min, sd_refresh rotated on every refresh, sd_session
 * indicator). The refresh token is ROTATED and re-using an old one revokes the whole session family, so concurrent
 * refreshes must never happen: within a tab they share one promise, across tabs they are serialised with the
 * Web Locks API (when available).
 */

export const ADMIN_LOGIN_PATH = '/admin/login'
export const ADMIN_HOME_PATH = '/admin'
export const AUTH_REFRESH_PATH = '/api/v1/admin/auth/refresh'

/** Auth endpoints that must never trigger refresh-and-retry (they define the session themselves). */
const NO_RETRY_PATHS = ['/api/v1/admin/auth/login', '/api/v1/admin/auth/refresh', '/api/v1/admin/auth/logout']

/** True when `url` (absolute or relative) points at login/refresh/logout. */
export function isSessionEndpoint(url: string): boolean {
  let path = url
  try {
    path = new URL(url, 'http://local').pathname
  } catch {
    /* keep raw */
  }
  return NO_RETRY_PATHS.some((p) => path === p || path.startsWith(`${p}?`))
}

/**
 * Validates a `next` redirect target: only same-site admin paths (no protocol-relative or external URLs, never the
 * login page itself). Falls back to /admin.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || typeof next !== 'string') return ADMIN_HOME_PATH
  if (!next.startsWith('/admin') || next.startsWith('//') || next.includes('\\')) return ADMIN_HOME_PATH
  const pathOnly = next.split(/[?#]/)[0]
  if (pathOnly !== '/admin' && !pathOnly.startsWith('/admin/')) return ADMIN_HOME_PATH
  if (pathOnly === ADMIN_LOGIN_PATH || pathOnly.startsWith(`${ADMIN_LOGIN_PATH}/`)) return ADMIN_HOME_PATH
  return next
}

/** `/admin/login?next=<path>` for the given (or current) location. */
export function loginUrl(next?: string): string {
  const target =
    next ?? (typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : undefined)
  const safe = target ? safeNextPath(target) : ADMIN_HOME_PATH
  return safe === ADMIN_HOME_PATH ? ADMIN_LOGIN_PATH : `${ADMIN_LOGIN_PATH}?next=${encodeURIComponent(safe)}`
}

export interface SessionManagerOptions {
  /** Prefix for API paths ('' in the browser = same origin through the Next rewrite). */
  baseUrl?: string
  /** fetch implementation (tests pass a mock). Resolved lazily so test stubs of globalThis.fetch apply. */
  fetch?: typeof fetch
  /** Called once when the session is definitely over (refresh failed). Defaults to a redirect to the login page. */
  onExpired?: () => void
}

export interface SessionManager {
  /** POST /auth/refresh — single-flight; resolves true when a new access token was issued. */
  refresh(): Promise<boolean>
  /** Marks the session as over and runs `onExpired` (only the first time). */
  expire(): void
  /** True once `expire()` ran (a redirect to the login page is in progress). */
  readonly expired: boolean
  /** Clears the expired flag (after a successful login in the same page). */
  reset(): void
}

interface LockManagerLike {
  request<T>(name: string, callback: () => Promise<T>): Promise<T>
}

function webLocks(): LockManagerLike | undefined {
  if (typeof navigator === 'undefined') return undefined
  const locks = (navigator as Navigator & { locks?: LockManagerLike }).locks
  return locks && typeof locks.request === 'function' ? locks : undefined
}

/** Creates an isolated session manager (the app uses the shared `adminSession`; tests create their own). */
export function createSessionManager(options: SessionManagerOptions = {}): SessionManager {
  const baseUrl = (options.baseUrl ?? '').replace(/\/+$/, '')
  let inflight: Promise<boolean> | null = null
  let expired = false

  const doRefresh = async (): Promise<boolean> => {
    const fetchImpl = options.fetch ?? globalThis.fetch
    try {
      const response = await fetchImpl(`${baseUrl}${AUTH_REFRESH_PATH}`, {
        method: 'POST',
        credentials: 'include',
        headers: { accept: 'application/json' },
      })
      return response.ok
    } catch {
      return false
    }
  }

  const manager: SessionManager = {
    refresh() {
      if (!inflight) {
        const locks = webLocks()
        const run = locks ? locks.request('serendiva-admin-refresh', doRefresh) : doRefresh()
        inflight = run.finally(() => {
          inflight = null
        })
      }
      return inflight
    },
    expire() {
      if (expired) return
      expired = true
      if (options.onExpired) options.onExpired()
      else if (typeof window !== 'undefined') window.location.assign(loginUrl())
    },
    get expired() {
      return expired
    },
    reset() {
      expired = false
    },
  }
  return manager
}

/** The browser-wide session manager used by `adminApi`, `adminFetch`, the login page and the shell. */
export const adminSession: SessionManager = createSessionManager()
