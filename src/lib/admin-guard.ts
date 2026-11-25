import { NextResponse, type NextRequest } from 'next/server'

/** Cookie set by the API on admin login (the httpOnly sd_access / sd_refresh cookies carry the real auth). */
export const ADMIN_SESSION_COOKIE = 'sd_session'

export function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

/**
 * Admin routes are not localised. Without a session cookie every admin page except /admin/login redirects to
 * /admin/login?next=<original path>. Returns null for non-admin paths. Adds X-Robots-Tag to every admin response.
 */
export function adminGuard(request: NextRequest): NextResponse | null {
  const { pathname, search } = request.nextUrl
  if (!isAdminPath(pathname)) return null

  const isLogin = pathname === '/admin/login' || pathname.startsWith('/admin/login/')
  const hasSession = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)
  let response: NextResponse
  if (!isLogin && !hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.search = ''
    url.searchParams.set('next', `${pathname}${search}`)
    response = NextResponse.redirect(url)
  } else {
    response = NextResponse.next()
  }
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
}
