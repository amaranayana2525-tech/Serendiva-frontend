/**
 * Typed access to environment variables.
 *  - `publicEnv`: NEXT_PUBLIC_* values, inlined at build time, safe in client components.
 *  - `getServerEnv()`: secrets / server-only values — throws if called in the browser.
 * Every variable is documented in `.env.example`.
 */

const trimSlash = (url: string) => url.replace(/\/+$/, '')
const digits = (value: string | undefined) => (value ?? '').replace(/\D/g, '')

export const publicEnv = {
  /** Canonical site origin, e.g. https://serendiva.lk (no trailing slash). */
  siteUrl: trimSlash(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  /** API origin as seen from the browser (forms POST here). */
  apiUrl: trimSlash(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'),
  /** Fallback WhatsApp number (digits only, international format) when settings have none. */
  whatsappNumber: digits(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER),
  /** Comma list of locales offered in the language switcher (routing still serves all). */
  enabledLocales: (process.env.NEXT_PUBLIC_ENABLED_LOCALES || 'en')
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean),
  /** Cloudflare Turnstile site key — when empty, no widget is rendered. */
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
  isProduction: process.env.NODE_ENV === 'production',
} as const

export interface ServerEnv {
  /** API base URL used by server components (may be an internal hostname). */
  apiUrl: string
  /** Shared secret for POST /api/revalidate (sent by the API in `x-revalidate-secret`). */
  revalidateSecret: string
  /** Serve the deprecated src/content snapshot when the API is unreachable (always on in development). */
  contentFallback: boolean
}

export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') throw new Error('getServerEnv() must only be called on the server')
  return {
    apiUrl: trimSlash(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'),
    revalidateSecret: process.env.REVALIDATE_SECRET || '',
    contentFallback: process.env.CONTENT_FALLBACK === 'true' || process.env.NODE_ENV === 'development',
  }
}
