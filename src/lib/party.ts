import type { PartyType } from '@/lib/api/types'

/**
 * Party type from real guest counts (forms that ask for numbers, not a party): any child → family,
 * 1 adult → solo, 2 adults → couple, 3+ → group.
 */
export function partyForGuests(adults: number, children: number): PartyType {
  if (children > 0) return 'family'
  if (adults === 1) return 'solo'
  if (adults === 2) return 'couple'
  return 'group'
}

/** Guest-count choices for the short inquiry forms. */
export const ADULT_COUNTS = Array.from({ length: 20 }, (_, i) => String(i + 1))
export const CHILD_COUNTS = Array.from({ length: 11 }, (_, i) => String(i))
