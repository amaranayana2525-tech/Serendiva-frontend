/** Primary navigation (Stitch header order). `key` → `common.nav.<key>`. */
export const PRIMARY_NAV = [
  { key: 'home', href: '/' },
  { key: 'tours', href: '/tours' },
  { key: 'destinations', href: '/destinations' },
  { key: 'corporate', href: '/corporate' },
  { key: 'about', href: '/about' },
  { key: 'gallery', href: '/gallery' },
  { key: 'reviews', href: '/reviews' },
  { key: 'contact', href: '/contact' },
] as const

/** Secondary pages (mobile drawer "Plan & Explore"). */
export const SECONDARY_NAV = [
  { key: 'travelGuide', href: '/travel-guide' },
  { key: 'blog', href: '/blog' },
  { key: 'responsible', href: '/responsible-travel' },
  { key: 'tripQuiz', href: '/trip-quiz' },
] as const

export type NavKey = (typeof PRIMARY_NAV)[number]['key'] | (typeof SECONDARY_NAV)[number]['key']

/** Is `href` the current section? ('/' only matches exactly; '/tours' matches '/tours/…'). */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Nav key for the current pathname (used for page names in WhatsApp messages). */
export function navKeyForPath(pathname: string): NavKey | null {
  const all = [...PRIMARY_NAV, ...SECONDARY_NAV]
  const match = all.filter((item) => item.href !== '/' && isActivePath(pathname, item.href))
  return match[0]?.key ?? null
}
