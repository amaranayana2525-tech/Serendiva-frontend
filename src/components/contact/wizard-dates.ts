/** A range the guide marked as busy in the admin availability calendar ('YYYY-MM-DD', both inclusive). */
export interface BusyRange {
  start: string
  end: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 86_400_000

function parseUtcDateMs(iso: string): number | null {
  if (!ISO_DATE.test(iso)) return null
  const ms = Date.parse(`${iso}T00:00:00.000Z`)
  if (Number.isNaN(ms)) return null
  return new Date(ms).toISOString().slice(0, 10) === iso ? ms : null
}

/** True when the trip [start, end] touches a busy range (only checked once both dates are valid). */
export function overlapsBusy(start: string, end: string, busy: readonly BusyRange[]): boolean {
  if (!ISO_DATE.test(start) || !ISO_DATE.test(end) || end < start) return false
  return busy.some((r) => r.start <= end && start <= r.end)
}

/** Inclusive calendar days between two YYYY-MM-DD dates (1 day if arrival === departure), or null if invalid. */
export function tripDays(start: string, end: string): number | null {
  const startMs = parseUtcDateMs(start)
  const endMs = parseUtcDateMs(end)
  if (startMs === null || endMs === null || endMs < startMs) return null
  return Math.round((endMs - startMs) / DAY_MS) + 1
}

/** Adds `months` to a YYYY-MM-DD string in UTC, clamping the day to the target month's length. */
export function addMonthsIso(isoDate: string, months: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!m) return isoDate
  const year = Number(m[1])
  const monthIndex = Number(m[2]) - 1
  const day = Number(m[3])
  const total = year * 12 + monthIndex + months
  const targetYear = Math.floor(total / 12)
  const targetMonth = ((total % 12) + 12) % 12
  const maxDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate()
  const clamped = Math.min(day, maxDay)
  return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(clamped).padStart(2, '0')}`
}
