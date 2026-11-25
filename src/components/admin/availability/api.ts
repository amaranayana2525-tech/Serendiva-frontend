import { adminApi, unwrap } from '@/lib/admin/client'
import type { AdminAvailabilityList, AdminAvailabilityRange, AvailabilityWrite } from '@/lib/api/types'

export type RangeType = 'busy' | 'available'

/** Typed wrappers around /api/v1/admin/availability. */
export const availabilityApi = {
  list: (signal?: AbortSignal): Promise<AdminAvailabilityList> =>
    unwrap(adminApi.GET('/api/v1/admin/availability', { params: { query: {} }, signal })),
  create: (body: AvailabilityWrite): Promise<AdminAvailabilityRange> =>
    unwrap(adminApi.POST('/api/v1/admin/availability', { body })),
  update: (id: string, body: AvailabilityWrite): Promise<AdminAvailabilityRange> =>
    unwrap(adminApi.PUT('/api/v1/admin/availability/{id}', { params: { path: { id } }, body })),
  remove: (id: string) => unwrap(adminApi.DELETE('/api/v1/admin/availability/{id}', { params: { path: { id } } })),
}

// ---------------------------------------------------------------------------------------------- calendar maths

const pad = (n: number) => String(n).padStart(2, '0')

/** Absolute month index (year * 12 + month0) of an ISO date. */
export const monthOf = (iso: string) => {
  const [y, m] = iso.split('-').map(Number)
  return (y ?? 1970) * 12 + ((m ?? 1) - 1)
}

/** ISO date from a UTC Date. */
export const isoOf = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`

/** 'YYYY-MM-DD' → Date at UTC noon. */
export const dateOf = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12))
}

export const addDays = (iso: string, days: number) => {
  const d = dateOf(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return isoOf(d)
}

/** Same day `months` later/earlier, clamped to the end of the target month (Jan 31 + 1 → Feb 28/29). */
export const addMonths = (iso: string, months: number) => {
  const [y, m, d] = iso.split('-').map(Number)
  const target = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1 + months, 1, 12))
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12)).getUTCDate()
  target.setUTCDate(Math.min(d ?? 1, last))
  return isoOf(target)
}

/** Inclusive number of days in a range. */
export const rangeDays = (start: string, end: string) =>
  Math.round((dateOf(end).getTime() - dateOf(start).getTime()) / 86_400_000) + 1

/** Monday-first weeks of a month (null = padding cell). */
export function monthGrid(monthIndex: number): (string | null)[][] {
  const year = Math.floor(monthIndex / 12)
  const month = monthIndex % 12
  const first = new Date(Date.UTC(year, month, 1, 12))
  const days = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate()
  const lead = (first.getUTCDay() + 6) % 7
  const cells: (string | null)[] = Array.from({ length: lead }, () => null)
  for (let d = 1; d <= days; d++) cells.push(`${year}-${pad(month + 1)}-${pad(d)}`)
  while (cells.length % 7) cells.push(null)
  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export const overlaps = (a: { startDate: string; endDate: string }, b: { startDate: string; endDate: string }) =>
  a.startDate <= b.endDate && b.startDate <= a.endDate
