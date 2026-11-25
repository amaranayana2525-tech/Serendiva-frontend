import { contactHref } from '@/lib/prefill'

/** Where a site-wide "Inquire" button (mobile bar, side tab) should lead from the current page. */
export type InquiryTarget =
  /** An inquiry form on this very page — scroll to it (keeps the tour / destination context). */
  | { kind: 'anchor'; hash: string }
  /** The /contact wizard, tagged with where the visitor came from. */
  | { kind: 'link'; href: ReturnType<typeof contactHref> }

/** DOM ids of the inquiry forms (wizard, tour sidebar, destination card). */
export const INQUIRY_ANCHORS = {
  contact: 'plan-my-trip',
  tour: 'tour-inquiry',
  destination: 'include-in-journey',
} as const

/**
 * `pathname` is the locale-less path (next-intl `usePathname`). `channel` names the button
 * ("mobile-bar", "side-tab") so the admin sees which one brought the lead.
 */
export function inquiryTarget(pathname: string, channel: string): InquiryTarget {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/contact') return { kind: 'anchor', hash: INQUIRY_ANCHORS.contact }
  if (/^\/tours\/[^/]+$/.test(path)) return { kind: 'anchor', hash: INQUIRY_ANCHORS.tour }
  if (/^\/destinations\/[^/]+$/.test(path)) return { kind: 'anchor', hash: INQUIRY_ANCHORS.destination }
  return { kind: 'link', href: contactHref({ source: `${channel}:${path}`.slice(0, 120) }) }
}
