/** The 14 admin sections (sidebar order). `badge` = which /admin/stats count shows next to the link. */

export type AdminSectionKey =
  | 'dashboard'
  | 'inquiries'
  | 'proposals'
  | 'tours'
  | 'destinations'
  | 'reviews'
  | 'blog'
  | 'gallery'
  | 'faqs'
  | 'pageContent'
  | 'availability'
  | 'newsletter'
  | 'media'
  | 'settings'

export type AdminNavGroup = 'overview' | 'leads' | 'content' | 'audience'

export interface AdminNavItem {
  key: AdminSectionKey
  href: string
  icon: string
  group: AdminNavGroup
  badge?: 'inquiries' | 'proposals' | 'reviews'
}

export const ADMIN_NAV: readonly AdminNavItem[] = [
  { key: 'dashboard', href: '/admin', icon: 'dashboard', group: 'overview' },
  { key: 'inquiries', href: '/admin/inquiries', icon: 'inbox', group: 'leads', badge: 'inquiries' },
  { key: 'proposals', href: '/admin/proposals', icon: 'business_center', group: 'leads', badge: 'proposals' },
  { key: 'tours', href: '/admin/tours', icon: 'map', group: 'content' },
  { key: 'destinations', href: '/admin/destinations', icon: 'location_on', group: 'content' },
  { key: 'reviews', href: '/admin/reviews', icon: 'reviews', group: 'content', badge: 'reviews' },
  { key: 'blog', href: '/admin/blog', icon: 'article', group: 'content' },
  { key: 'gallery', href: '/admin/gallery', icon: 'photo_library', group: 'content' },
  { key: 'faqs', href: '/admin/faqs', icon: 'quiz', group: 'content' },
  { key: 'pageContent', href: '/admin/page-content', icon: 'edit_note', group: 'content' },
  { key: 'availability', href: '/admin/availability', icon: 'calendar_month', group: 'content' },
  { key: 'newsletter', href: '/admin/newsletter', icon: 'mail', group: 'audience' },
  { key: 'media', href: '/admin/media', icon: 'perm_media', group: 'audience' },
  { key: 'settings', href: '/admin/settings', icon: 'settings', group: 'audience' },
]

export const ADMIN_NAV_GROUPS: readonly AdminNavGroup[] = ['overview', 'leads', 'content', 'audience']

/** True when `pathname` belongs to the section (dashboard only matches exactly). */
export function isNavActive(item: AdminNavItem, pathname: string): boolean {
  if (item.href === '/admin') return pathname === '/admin'
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
