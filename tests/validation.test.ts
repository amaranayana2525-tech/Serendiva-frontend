import { describe, expect, it } from 'vitest'
import { inquiryDefaults, inquirySchema } from '@/lib/validation/inquiry'
import { msg, parseValidationMessage } from '@/lib/validation/messages'
import { newsletterSchema } from '@/lib/validation/newsletter'
import { PROPOSAL_MAX_FILE_BYTES, proposalSchema } from '@/lib/validation/proposal'
import { reviewSchema } from '@/lib/validation/review'
import { optionalIntlPhone, optionalPhone, requiredIntlPhone, requiredPhone } from '@/lib/validation/shared'

const firstError = (
  result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } },
  field: string,
) => result.error?.issues.find((i) => i.path[0] === field)?.message

describe('inquiry schema', () => {
  const valid = { ...inquiryDefaults('en'), name: 'Ada Lovelace', email: '  ada@example.com ' }

  it('accepts a minimal inquiry and strips empty optional strings', () => {
    const result = inquirySchema.safeParse({ ...valid, whatsapp: '', country: '', message: '' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.email).toBe('ada@example.com')
    expect(result.data.whatsapp).toBeUndefined()
    expect(result.data.country).toBeUndefined()
    expect(result.data.message).toBeUndefined()
  })

  it('returns translatable message keys', () => {
    const result = inquirySchema.safeParse({ ...valid, name: 'A', email: 'nope', adults: 0, children: 51 })
    expect(firstError(result, 'name')).toBe('nameTooShort')
    expect(firstError(result, 'email')).toBe('email')
    expect(firstError(result, 'adults')).toBe('min:1')
    expect(firstError(result, 'children')).toBe('max:50')
  })

  it('enforces API length limits', () => {
    const result = inquirySchema.safeParse({
      ...valid,
      message: 'x'.repeat(5001),
      interests: Array.from({ length: 21 }, (_, i) => `i${i}`),
    })
    expect(firstError(result, 'message')).toBe('tooLong:5000')
    expect(firstError(result, 'interests')).toBe('tooMany:20')
  })

  it('validates dates and their order', () => {
    expect(firstError(inquirySchema.safeParse({ ...valid, travelStart: '2027-13-45' }), 'travelStart')).toBe('date')
    const reversed = inquirySchema.safeParse({ ...valid, travelStart: '2027-03-10', travelEnd: '2027-03-01' })
    expect(firstError(reversed, 'travelEnd')).toBe('dateOrder')
    expect(inquirySchema.safeParse({ ...valid, travelStart: '2027-03-01', travelEnd: '2027-03-10' }).success).toBe(true)
  })

  it('validates phone numbers and slugs', () => {
    expect(firstError(inquirySchema.safeParse({ ...valid, whatsapp: 'call me' }), 'whatsapp')).toBe('phone')
    expect(firstError(inquirySchema.safeParse({ ...valid, whatsapp: '+ ()-.-' }), 'whatsapp')).toBe('phone')
    expect(
      inquirySchema.safeParse({ ...valid, whatsapp: '+44 7911 123456', tourSlug: 'cultural-odyssey' }).success,
    ).toBe(true)
    expect(firstError(inquirySchema.safeParse({ ...valid, tourSlug: 'Bad Slug' }), 'tourSlug')).toBe('invalid')
  })
})

describe('proposal schema', () => {
  const base = {
    company: 'Northwind',
    contactPerson: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '+44 7911 123456',
    groupSize: '18 executives',
    dates: 'March 2027',
    eventType: 'Leadership retreat',
    logistics: ['Airport transfers'],
    locale: 'en' as const,
  }

  it('accepts a valid proposal with a PDF', () => {
    const attachment = new File(['%PDF'], 'brief.pdf', { type: 'application/pdf' })
    expect(proposalSchema.safeParse({ ...base, attachment }).success).toBe(true)
    expect(proposalSchema.safeParse({ ...base, attachment: null }).success).toBe(true)
  })

  it('rejects large or unsupported files', () => {
    const big = new File([new Uint8Array(PROPOSAL_MAX_FILE_BYTES + 1)], 'big.pdf', { type: 'application/pdf' })
    expect(firstError(proposalSchema.safeParse({ ...base, attachment: big }), 'attachment')).toBe('fileTooLarge')
    const exe = new File(['MZ'], 'virus.exe', { type: 'application/x-msdownload' })
    expect(firstError(proposalSchema.safeParse({ ...base, attachment: exe }), 'attachment')).toBe('fileType')
  })

  it('requires the core fields', () => {
    const result = proposalSchema.safeParse({
      ...base,
      company: '',
      phone: '12',
      groupSize: '',
      logistics: Array(11).fill('x'),
    })
    expect(firstError(result, 'company')).toBe('required')
    expect(firstError(result, 'phone')).toBe('phone')
    expect(firstError(result, 'groupSize')).toBe('required')
    expect(firstError(result, 'logistics')).toBe('tooMany:10')
  })
})

describe('newsletter schema', () => {
  it('validates email and locale', () => {
    expect(newsletterSchema.safeParse({ email: 'a@b.co', locale: 'de', source: '' }).success).toBe(true)
    expect(firstError(newsletterSchema.safeParse({ email: '', locale: 'en' }), 'email')).toBe('required')
    expect(newsletterSchema.safeParse({ email: 'a@b.co', locale: 'fr' }).success).toBe(false)
  })
})

describe('review schema', () => {
  const base = {
    guestName: 'Marcus Lindqvist',
    email: 'm@example.se',
    country: 'se',
    travellerType: 'couple' as const,
    rating: 5,
    text: 'An unforgettable private journey.',
    locale: 'en' as const,
  }

  it('normalises country codes and accepts a valid review', () => {
    const result = reviewSchema.safeParse({ ...base, travelDate: '2024-01', title: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.country).toBe('SE')
      expect(result.data.title).toBeUndefined()
    }
  })

  it('enforces rating, text length, country and month format', () => {
    const result = reviewSchema.safeParse({
      ...base,
      rating: 6,
      text: 'Too short',
      country: 'Sweden',
      travelDate: '2024-13',
    })
    expect(firstError(result, 'rating')).toBe('rating')
    expect(firstError(result, 'text')).toBe('reviewTooShort')
    expect(firstError(result, 'country')).toBe('country')
    expect(firstError(result, 'travelDate')).toBe('month')
  })
})

describe('validation messages', () => {
  it('parses keys with parameters', () => {
    expect(parseValidationMessage('tooLong:120')).toEqual({ key: 'tooLong', values: { max: 120 } })
    expect(parseValidationMessage('min:1')).toEqual({ key: 'min', values: { min: 1 } })
    expect(parseValidationMessage('email')).toEqual({ key: 'email', values: {} })
    expect(parseValidationMessage('Invalid email (from the API)')).toBeNull()
    expect(msg('tooMany', 20)).toBe('tooMany:20')
  })

  it('rejects punctuation-only phone inputs with fewer than 5 digits', () => {
    for (const bad of ['-----', '+ --- ()', '1234', '+(12)-']) {
      expect(optionalPhone().safeParse(bad).success).toBe(false)
      expect(requiredPhone().safeParse(bad).success).toBe(false)
      expect(optionalIntlPhone().safeParse(bad).success).toBe(false)
      expect(requiredIntlPhone().safeParse(bad).success).toBe(false)
    }
  })
})
