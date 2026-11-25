/**
 * Photo slots (settings.pageImages) of list items, shared by the components and the admin editor.
 * Built-in items keep their original slot; items the admin adds get `<prefix>-<item key>`.
 */
export interface ListImageSlots {
  prefix: string
  slots: Readonly<Record<string, string>>
  aspect?: 'landscape' | 'video' | 'square' | 'portrait'
}

export const CORPORATE_SERVICE_IMAGES: ListImageSlots = {
  prefix: 'corp-service',
  slots: {
    board: 'corp-board-retreat-bawa-villa',
    incentive: 'corp-incentive-observation-carriage',
    cohesion: 'corp-team-catamaran-regatta',
    diplomatic: 'corp-diplomatic-tarmac-fleet',
    academic: 'corp-academic-polonnaruwa',
    summit: 'corp-gala-oceanfront',
  },
  aspect: 'landscape',
}

export const CORPORATE_BLUEPRINT_IMAGES: ListImageSlots = {
  prefix: 'corp-blueprint',
  slots: {
    hill: 'corp-blueprint-hill-country-retreat',
    coastal: 'corp-blueprint-yala-glamping',
    cultural: 'corp-blueprint-sigiriya-aerial',
  },
  aspect: 'landscape',
}

/** The pageImages slot of a list item ("itemLx3" → "corp-service-itemlx3"). */
export function itemSlot(images: ListImageSlots, key: string): string {
  return (
    images.slots[key] ??
    `${images.prefix}-${key
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')}`
  )
}
