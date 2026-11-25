/**
 * Travel-month windows for the hero quick-inquiry bar ("November 2026 - January 2027", "February 2027 - April 2027
 * (Peak Dry)" …). Pure and deterministic: computed on the server from `now` and passed to the client bar as props,
 * so server and client HTML always match.
 */

export type SeasonNote = 'peakDry' | 'eastCoast'

/** Sri Lanka's planning seasons (0-based start month, length in months), in calendar order. */
export const TRAVEL_SEASONS: readonly { start: number; length: number; note?: SeasonNote }[] = [
  { start: 1, length: 3, note: 'peakDry' }, // Feb – Apr: south & west coasts and the hills at their best
  { start: 4, length: 4, note: 'eastCoast' }, // May – Aug: the east coast's dry season
  { start: 8, length: 2 }, // Sep – Oct: inter-monsoon shoulder
  { start: 10, length: 3 }, // Nov – Jan: festive season
]

export interface TravelWindow {
  /** First month of the window (UTC, 1st of the month). */
  start: Date
  /** Last month of the window (UTC, 1st of the month). */
  end: Date
  note?: SeasonNote
}

const monthIndex = (d: Date) => d.getUTCFullYear() * 12 + d.getUTCMonth()
const fromIndex = (i: number) => new Date(Date.UTC(Math.floor(i / 12), i % 12, 1, 12))

/**
 * The next `count` seasonal windows that still have at least one month from next month onwards
 * (planning usually starts a few weeks ahead, so a window ending this month is skipped).
 */
export function upcomingTravelWindows(now: Date, count = 4): TravelWindow[] {
  const firstUsefulMonth = monthIndex(now) + 1
  const windows: TravelWindow[] = []
  // Walk the seasons from the previous year onwards until we have enough windows.
  for (let year = now.getUTCFullYear() - 1; windows.length < count; year++) {
    for (const season of TRAVEL_SEASONS) {
      const startIdx = year * 12 + season.start
      const endIdx = startIdx + season.length - 1
      if (endIdx < firstUsefulMonth) continue
      windows.push({ start: fromIndex(startIdx), end: fromIndex(endIdx), note: season.note })
      if (windows.length === count) break
    }
  }
  return windows
}

/** "November 2026" in the given locale (UTC, no time-zone drift). */
export function formatWindowMonth(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
}
