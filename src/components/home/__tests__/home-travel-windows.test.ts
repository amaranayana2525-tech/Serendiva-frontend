import { describe, expect, it } from 'vitest'
import { formatWindowMonth, upcomingTravelWindows } from '../travelWindows'

const ym = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`

describe('upcomingTravelWindows', () => {
  it('starts with the first season that still has a month from next month on', () => {
    const windows = upcomingTravelWindows(new Date(Date.UTC(2026, 9, 5))) // 5 Oct 2026
    expect(windows.map((w) => `${ym(w.start)}..${ym(w.end)}:${w.note ?? ''}`)).toEqual([
      '2026-11..2027-01:',
      '2027-02..2027-04:peakDry',
      '2027-05..2027-08:eastCoast',
      '2027-09..2027-10:',
    ])
  })

  it('keeps a window that is still running next month', () => {
    const [first] = upcomingTravelWindows(new Date(Date.UTC(2026, 11, 20)), 1) // 20 Dec 2026
    expect(first && `${ym(first.start)}..${ym(first.end)}`).toBe('2026-11..2027-01')
  })

  it('handles the turn of the year and the requested count', () => {
    const windows = upcomingTravelWindows(new Date(Date.UTC(2027, 0, 31)), 6) // 31 Jan 2027
    expect(windows).toHaveLength(6)
    expect(ym(windows[0]!.start)).toBe('2027-02')
    expect(ym(windows[5]!.start)).toBe('2028-05')
  })
})

describe('formatWindowMonth', () => {
  it('formats month + year in the locale without time-zone drift', () => {
    expect(formatWindowMonth(new Date(Date.UTC(2026, 10, 1, 12)), 'en')).toBe('November 2026')
    expect(formatWindowMonth(new Date(Date.UTC(2027, 0, 1, 12)), 'de')).toBe('Januar 2027')
  })
})
