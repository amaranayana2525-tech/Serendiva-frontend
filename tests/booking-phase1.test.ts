import { describe, expect, it } from 'vitest'
import { isBetweenDates, nextDateRange } from '@/lib/availability'
import { inquiryTarget } from '@/components/layout/inquiryTarget'
import {
  callingCodeForRegion,
  combineWhatsApp,
  hasCountryCode,
  isValidPhoneInput,
  regionFromCountryName,
  regionFromLanguages,
} from '@/lib/phone'
import { optionalIntlPhone, requiredIntlPhone } from '@/lib/validation/shared'
import { inquirySummaryText, type InquirySummaryLabels } from '@/lib/whatsapp'

describe('site-wide "Inquire" target', () => {
  it('scrolls to the form on the page when there is one (keeps the tour / destination context)', () => {
    expect(inquiryTarget('/contact', 'mobile-bar')).toEqual({ kind: 'anchor', hash: 'plan-my-trip' })
    expect(inquiryTarget('/tours/cultural-odyssey', 'mobile-bar')).toEqual({ kind: 'anchor', hash: 'tour-inquiry' })
    expect(inquiryTarget('/destinations/ella/', 'side-tab')).toEqual({ kind: 'anchor', hash: 'include-in-journey' })
  })

  it('elsewhere opens the wizard tagged with the button and page', () => {
    expect(inquiryTarget('/tours', 'mobile-bar')).toEqual({
      kind: 'link',
      href: { pathname: '/contact', query: { source: 'mobile-bar:/tours' } },
    })
    expect(inquiryTarget('/', 'side-tab')).toMatchObject({ kind: 'link', href: { query: { source: 'side-tab:/' } } })
  })
})

describe('WhatsApp number helpers', () => {
  it('takes the default calling code from the browser region, not the UI language', () => {
    expect(callingCodeForRegion(regionFromLanguages(['en-AU', 'en']))).toBe('+61')
    expect(callingCodeForRegion(regionFromLanguages(['en-US']))).toBe('+1')
    expect(callingCodeForRegion(regionFromLanguages(['en-IE']))).toBe('other') // not in the select: type +353…
    expect(regionFromLanguages(['en', 'de'])).toBeNull() // bare languages: keep the locale default
  })

  it('reads the region from a typed country name', () => {
    expect(regionFromCountryName('Australia')).toBe('AU')
    expect(regionFromCountryName('  united kingdom ')).toBe('GB')
    expect(regionFromCountryName('UK')).toBe('GB')
    expect(regionFromCountryName('Deutschland', ['de', 'en'])).toBe('DE')
    expect(regionFromCountryName('Ireland')).toBe('IE')
    expect(callingCodeForRegion(regionFromCountryName('Ireland'))).toBe('other')
    expect(regionFromCountryName('Atlantis')).toBeNull()
  })

  it('validates raw phone inputs requiring at least 5 digits', () => {
    expect(isValidPhoneInput('+44 7700 900123')).toBe(true)
    expect(isValidPhoneInput('-----')).toBe(false)
    expect(isValidPhoneInput('+ ()-.')).toBe(false)
    expect(isValidPhoneInput('1234')).toBe(false)
    expect(isValidPhoneInput('12345')).toBe(true)
  })

  it('combines code and number without doubling the code', () => {
    expect(combineWhatsApp('+44', '07700 900123')).toBe('+44 7700 900123')
    expect(combineWhatsApp('+44', '0044 7700 900123')).toBe('+44 7700 900123')
    expect(combineWhatsApp('+44', '447700900123')).toBe('+447700900123')
    expect(combineWhatsApp('+1', '+61 412 345 678')).toBe('+61 412 345 678')
    expect(combineWhatsApp('+94', '77 123 4567')).toBe('+94 77 123 4567')
    expect(combineWhatsApp('other', '  ')).toBe('')
    expect(hasCountryCode(' +94 77')).toBe(true)
    expect(hasCountryCode('0094 77')).toBe(true)
    expect(hasCountryCode('077 123')).toBe(false)
  })

  it('tour / destination forms require the country code and store numbers internationally', () => {
    expect(requiredIntlPhone().safeParse('0044 7911 123456')).toEqual({ success: true, data: '+44 7911 123456' })
    const local = requiredIntlPhone().safeParse('07911 123456')
    expect(local.success).toBe(false)
    expect(local.error?.issues[0]?.message).toBe('phoneCountryCode')
    expect(optionalIntlPhone().safeParse('').data).toBeUndefined()
    expect(optionalIntlPhone().safeParse('077 123 4567').success).toBe(false)
    expect(optionalIntlPhone().safeParse('+-----').error?.issues[0]?.message).toBe('phone')
  })
})

describe('WhatsApp fallback summary', () => {
  const labels: InquirySummaryLabels = {
    name: 'Name',
    email: 'Email',
    whatsapp: 'WhatsApp',
    country: 'Country',
    party: 'Travelling as',
    guests: 'Guests',
    dates: 'Dates',
    flexibility: 'Flexibility',
    duration: 'Length',
    pace: 'Pace',
    stay: 'Stays',
    interests: 'Interests',
    about: 'About',
    message: 'Message',
  }

  it('repeats every filled field under the intro and skips empty ones', () => {
    const text = inquirySummaryText(
      { name: 'Ana', email: 'ana@example.com', adults: 2, children: 1, travelWindow: 'Dec – Feb', interests: ['Safari', 'Tea'], message: '' },
      { intro: 'Hello, the form failed:', labels, about: 'The Cultural Odyssey' },
    )
    expect(text).toBe(
      [
        'Hello, the form failed:',
        '',
        'Name: Ana',
        'Email: ana@example.com',
        'Guests: 2 + 1',
        'Dates: Dec – Feb',
        'Interests: Safari, Tea',
        'About: The Cultural Odyssey',
      ].join('\n'),
    )
  })
})

describe('availability calendar range helpers', () => {
  it('picks start first, then end when later/equal, and resets when clicked earlier or third time', () => {
    expect(nextDateRange('', '', '2027-03-10')).toEqual({ start: '2027-03-10', end: '' })
    expect(nextDateRange('2027-03-10', '', '2027-03-18')).toEqual({ start: '2027-03-10', end: '2027-03-18' })
    expect(nextDateRange('2027-03-10', '', '2027-03-10')).toEqual({ start: '2027-03-10', end: '2027-03-10' })
    expect(nextDateRange('2027-03-10', '', '2027-03-05')).toEqual({ start: '2027-03-05', end: '' })
    expect(nextDateRange('2027-03-10', '2027-03-18', '2027-03-22')).toEqual({ start: '2027-03-22', end: '' })
  })

  it('detects dates strictly between start and end', () => {
    expect(isBetweenDates('2027-03-14', '2027-03-10', '2027-03-18')).toBe(true)
    expect(isBetweenDates('2027-03-10', '2027-03-10', '2027-03-18')).toBe(false)
    expect(isBetweenDates('2027-03-18', '2027-03-10', '2027-03-18')).toBe(false)
    expect(isBetweenDates('2027-03-14', '2027-03-10', '')).toBe(false)
  })
})
