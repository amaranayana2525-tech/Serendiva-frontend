import type { NextConfig } from 'next'
import type { RemotePattern } from 'next/dist/shared/lib/image-config'
import createNextIntlPlugin from 'next-intl/plugin'

const isProd = process.env.NODE_ENV === 'production'

/** Browser → API origin (also the default for server → API). */
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
/** Server → API base URL (may be an internal hostname). */
const apiUrl = (process.env.API_URL || publicApiUrl).replace(/\/+$/, '')

function safeUrl(value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'])
const apiOrigins = [safeUrl(publicApiUrl), safeUrl(apiUrl)].filter((u): u is URL => u !== null)
const extraImageHosts = (process.env.IMAGE_REMOTE_HOSTS || '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean)

const remotePatterns: RemotePattern[] = [
  { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
  ...apiOrigins.map((u): RemotePattern => ({
    protocol: u.protocol.replace(':', '') as 'http' | 'https',
    hostname: u.hostname,
    port: u.port,
  })),
  ...extraImageHosts.map((hostname): RemotePattern => ({ protocol: 'https', hostname })),
]

/** Next 16 refuses to optimise images served from local IPs. Allow it only when the API itself runs locally (development). */
const apiIsLocal = apiOrigins.some((u) => LOCAL_HOSTS.has(u.hostname))

const apiOriginList = [...new Set(apiOrigins.map((u) => u.origin))]
const imageHostSources = ['https://lh3.googleusercontent.com', ...extraImageHosts.map((h) => `https://${h}`)]

/**
 * Content-Security-Policy. Pages are statically rendered, so nonces are not an option and Next's inline
 * bootstrap scripts need 'unsafe-inline'. Everything else is locked to the origins we actually use:
 * the API, OpenStreetMap tiles, Cloudflare Turnstile and YouTube (nocookie) embeds.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${[...apiOriginList, ...imageHostSources, 'https://*.tile.openstreetmap.org', 'https://i.ytimg.com'].join(' ')}`,
  "font-src 'self' data:",
  `connect-src 'self' ${apiOriginList.join(' ')} https://challenges.cloudflare.com${isProd ? '' : ' ws: wss:'}`,
  "frame-src 'self' https://challenges.cloudflare.com https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com",
  "media-src 'self' blob: " + apiOriginList.join(' '),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ['upgrade-insecure-requests'] : []),
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns,
    formats: ['image/avif', 'image/webp'],
    qualities: [60, 75, 85],
    dangerouslyAllowLocalIP: apiIsLocal,
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      {
        source: '/icons/sprite.svg',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
    ]
  },
  async rewrites() {
    return [
      // Same-origin proxy to the API — used by the admin panel so its httpOnly cookies are first-party.
      { source: '/api/v1/:path*', destination: `${apiUrl}/api/v1/:path*` },
    ]
  },
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

export default withNextIntl(nextConfig)
