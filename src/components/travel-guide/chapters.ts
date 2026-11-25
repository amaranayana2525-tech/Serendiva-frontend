/**
 * Travel-guide chapters in page order: section id (deep-linkable, e.g. the footer's /travel-guide#safety),
 * message key (travelGuide.nav.items.<key> / travelGuide.<key>.*) and the Stitch eyebrow icon.
 */
export const GUIDE_CHAPTERS = [
  { id: 'visa', key: 'visa', icon: 'badge' },
  { id: 'best-time', key: 'bestTime', icon: 'cyclone' },
  { id: 'etiquette', key: 'etiquette', icon: 'temple_buddhist' },
  { id: 'packing', key: 'packing', icon: 'luggage' },
  { id: 'getting-around', key: 'gettingAround', icon: 'directions_car' },
  { id: 'money', key: 'money', icon: 'payments' },
  { id: 'health', key: 'health', icon: 'medical_services' },
  { id: 'connectivity', key: 'connectivity', icon: 'wifi' },
  { id: 'festivals', key: 'festivals', icon: 'celebration' },
  { id: 'safety', key: 'safety', icon: 'emergency' },
] as const

export type GuideChapter = (typeof GUIDE_CHAPTERS)[number]
export type GuideChapterKey = GuideChapter['key']

export const GUIDE_CHAPTER_IDS: readonly string[] = GUIDE_CHAPTERS.map((c) => c.id)

/** Navigation entry handed from the server page to the client navigation components. */
export interface GuideNavItem {
  id: string
  label: string
  shortLabel: string
}
