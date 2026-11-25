import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { adminGuard } from './lib/admin-guard'

/**
 * Next 16 proxy (formerly middleware):
 *  - /admin/** → admin guard (not localised; redirect to /admin/login without the sd_session cookie; noindex header).
 *  - everything else → next-intl (locale prefix "as-needed": English URLs have no prefix).
 */
const intlProxy = createMiddleware(routing)

export default function proxy(request: NextRequest) {
  return adminGuard(request) ?? intlProxy(request)
}

export const config = {
  // Skip API routes, Next internals, Vercel internals, the icon sprite and any file with an extension.
  matcher: ['/((?!api|_next|_vercel|icons|.*\\..*).*)'],
}
