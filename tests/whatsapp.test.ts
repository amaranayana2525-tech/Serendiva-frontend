import { afterEach, describe, expect, it, vi } from 'vitest'
import type { WhatsAppTemplates } from '@/lib/whatsapp'

const templates: WhatsAppTemplates = {
  default: 'Hello Dinesh, I am planning a trip.',
  page: 'Hello Dinesh, I am on your “{page}” page.',
  tour: 'Hello Dinesh, I am interested in “{tour}”.',
  destination: 'Hello Dinesh, I would like to include {destination}.',
  corporate: 'Hello Dinesh, corporate program please.',
}

async function load(fallback?: string) {
  vi.resetModules()
  if (fallback !== undefined) vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', fallback)
  return import('@/lib/whatsapp')
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('whatsapp helper', () => {
  it('normalises numbers to digits', async () => {
    const { normalizeWhatsAppNumber } = await load()
    expect(normalizeWhatsAppNumber('+94 (77) 123-4567')).toBe('94771234567')
    expect(normalizeWhatsAppNumber(null)).toBe('')
  })

  it('builds wa.me links with an encoded message', async () => {
    const { waLink } = await load('')
    expect(waLink('+94 77 123 4567', 'Hello & “welcome”')).toBe(
      `https://wa.me/94771234567?text=${encodeURIComponent('Hello & “welcome”')}`,
    )
    expect(waLink('94771234567')).toBe('https://wa.me/94771234567')
    expect(waLink('94771234567', '   ')).toBe('https://wa.me/94771234567')
  })

  it('falls back to NEXT_PUBLIC_WHATSAPP_NUMBER when settings have no number', async () => {
    const { waLink, resolveWhatsAppNumber } = await load('+94 70 000 0000')
    expect(resolveWhatsAppNumber('')).toBe('94700000000')
    expect(resolveWhatsAppNumber(undefined)).toBe('94700000000')
    expect(resolveWhatsAppNumber('94771234567')).toBe('94771234567')
    expect(waLink(null, 'Hi')).toBe('https://wa.me/94700000000?text=Hi')
  })

  it('opens the share sheet when no number is configured at all', async () => {
    const { waLink } = await load('')
    expect(waLink('', 'Hi')).toBe('https://wa.me/?text=Hi')
  })

  it('picks the most specific message template', async () => {
    const { buildWhatsAppMessage } = await load()
    expect(buildWhatsAppMessage({ templates })).toBe(templates.default)
    expect(buildWhatsAppMessage({ templates, page: 'Tours' })).toBe('Hello Dinesh, I am on your “Tours” page.')
    expect(buildWhatsAppMessage({ templates, page: 'Tours', corporate: true })).toBe(templates.corporate)
    expect(buildWhatsAppMessage({ templates, page: 'Tours', destinationName: 'Ella' })).toBe(
      'Hello Dinesh, I would like to include Ella.',
    )
    expect(buildWhatsAppMessage({ templates, tourTitle: 'The Cultural Odyssey', destinationName: 'Ella' })).toBe(
      'Hello Dinesh, I am interested in “The Cultural Odyssey”.',
    )
  })
})
