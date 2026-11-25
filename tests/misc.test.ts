import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { deepMerge } from '@/i18n/messages'
import { adminGuard } from '@/lib/admin-guard'
import { dayStatus } from '@/lib/availability'
import { countryName, flagEmoji, formatMonth } from '@/lib/format'
import { pageWindow } from '@/lib/pagination'
import { createSlugger } from '@/lib/slug'
import { cn } from '@/lib/utils'

describe('i18n deepMerge', () => {
  it('falls back to English for missing or empty keys', () => {
    const en = { nav: { home: 'Home', tours: 'Tours' }, title: 'Hello' }
    const zh = { nav: { home: '首页', tours: '' } }
    expect(deepMerge(en, zh)).toEqual({ nav: { home: '首页', tours: 'Tours' }, title: 'Hello' })
  })
})

describe('admin guard', () => {
  const req = (path: string, cookie?: string) =>
    new NextRequest(`http://localhost:3000${path}`, { headers: cookie ? { cookie } : {} })

  it('ignores site routes', () => {
    expect(adminGuard(req('/tours'))).toBeNull()
    expect(adminGuard(req('/administrator'))).toBeNull()
  })

  it('redirects to login with ?next when there is no session', () => {
    const res = adminGuard(req('/admin/tours?page=2'))!
    expect(res.status).toBe(307)
    const location = new URL(res.headers.get('location')!)
    expect(location.pathname).toBe('/admin/login')
    expect(location.searchParams.get('next')).toBe('/admin/tours?page=2')
    expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow')
  })

  it('lets the login page and authenticated requests through', () => {
    expect(adminGuard(req('/admin/login'))!.headers.get('x-middleware-next')).toBe('1')
    expect(adminGuard(req('/admin', 'sd_session=1'))!.headers.get('x-middleware-next')).toBe('1')
  })
})

describe('format', () => {
  it('formats countries, flags and months', () => {
    expect(countryName('gb', 'en')).toBe('United Kingdom')
    expect(countryName('DE', 'de')).toBe('Deutschland')
    expect(flagEmoji('se')).toBe('🇸🇪')
    expect(flagEmoji('Sweden')).toBe('')
    expect(formatMonth('2024-02', 'en')).toBe('February 2024')
  })
})

describe('heading slugger (matches the API)', () => {
  it('slugs like github-slugger and de-duplicates', () => {
    const slug = createSlugger()
    expect(slug('Visa & ETA: the 2026 rules')).toBe('visa--eta-the-2026-rules')
    expect(slug('Getting around')).toBe('getting-around')
    expect(slug('Getting around')).toBe('getting-around-1')
    expect(slug('Ārugam Bay')).toBe('ārugam-bay')
  })
})

describe('availability status', () => {
  const ranges = [
    { id: '1', startDate: '2026-10-10', endDate: '2026-10-12', type: 'available' as const },
    { id: '2', startDate: '2026-10-12', endDate: '2026-10-14', type: 'busy' as const },
  ]
  it('busy wins over available; past and unknown dates are handled', () => {
    expect(dayStatus('2026-10-01', '2026-10-05', ranges)).toBe('past')
    expect(dayStatus('2026-10-10', '2026-10-05', ranges)).toBe('available')
    expect(dayStatus('2026-10-12', '2026-10-05', ranges)).toBe('busy')
    expect(dayStatus('2026-10-20', '2026-10-05', ranges)).toBe('onRequest')
  })
})

describe('ui helpers', () => {
  it('pagination window', () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(pageWindow(6, 12)).toEqual([1, 'gap', 5, 6, 7, 'gap', 12])
  })

  it('cn keeps Stitch font-size and colour tokens apart', () => {
    expect(cn('text-body-md text-on-surface-variant', 'text-primary')).toBe('text-body-md text-primary')
    expect(cn('text-body-md', 'text-headline-sm')).toBe('text-headline-sm')
    expect(cn('px-margin', 'px-space-lg')).toBe('px-space-lg')
  })
})
