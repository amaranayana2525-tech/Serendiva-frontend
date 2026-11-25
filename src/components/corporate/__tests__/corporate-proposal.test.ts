import { afterEach, describe, expect, it, vi } from 'vitest'
import { submitProposal } from '@/lib/api/forms'
import { proposalSchema, toProposalBody, type ProposalFormValues } from '@/lib/validation/proposal'
import { attachmentProblem, formatFileSize } from '@/components/corporate/proposal-file'

const MB = 1024 * 1024
const file = (name: string, size: number, type: string) => new File([new Uint8Array(size)], name, { type })
const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })

const values = (attachment: File | null = null): ProposalFormValues => ({
  company: 'QA Holdings AG',
  contactPerson: 'Elena QA, Head of Events',
  email: 'qa@example.com',
  phone: '+41 22 555 0192',
  groupSize: '15–30 Corporate Group',
  dates: 'November 2027 (6 days)',
  eventType: 'Executive Board Retreat',
  logistics: ['Seaplane Charter', 'BIA VIP Fast-Track'],
  message: '',
  sourcePage: '/corporate',
  locale: 'en',
  website: '',
  attachment,
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('corporate RFP — attachment checks (client side)', () => {
  it('accepts PDF and DOCX up to 5 MB', () => {
    expect(attachmentProblem(file('brief.pdf', 1000, 'application/pdf'))).toBeNull()
    expect(
      attachmentProblem(
        file('brief.docx', 5 * MB, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
      ),
    ).toBeNull()
    // Some browsers report an empty MIME type — the extension decides.
    expect(attachmentProblem(file('BRIEF.PDF', 10, ''))).toBeNull()
  })

  it('rejects other types and files over 5 MB (type first)', () => {
    expect(attachmentProblem(file('notes.txt', 10, 'text/plain'))).toBe('fileType')
    expect(attachmentProblem(file('big.pdf', 5 * MB + 1, 'application/pdf'))).toBe('fileTooLarge')
    expect(attachmentProblem(file('huge.exe', 20 * MB, 'application/x-msdownload'))).toBe('fileType')
  })

  it('formats sizes for the file chip', () => {
    expect(formatFileSize(595, 'en')).toBe('1 kB')
    expect(formatFileSize(2.25 * MB, 'en')).toBe('2.3 MB')
  })
})

describe('corporate RFP — submission (mocked fetch)', () => {
  it('sends multipart with repeated logistics and the attachment', async () => {
    const fetchMock = vi.fn(async () => json(201, { reference: 'SRD-C-2026-0001', message: 'Thanks' }))
    vi.stubGlobal('fetch', fetchMock)
    const payload = proposalSchema.parse(values(file('brief.pdf', 100, 'application/pdf')))
    await expect(submitProposal({ ...toProposalBody(payload), clientRequestId: 'prop-req-12345678' })).resolves.toEqual({
      ok: true,
      data: { reference: 'SRD-C-2026-0001', message: 'Thanks' },
    })
    const body = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as FormData
    expect(body.getAll('logistics')).toEqual(['Seaplane Charter', 'BIA VIP Fast-Track'])
    expect(body.get('clientRequestId')).toBe('prop-req-12345678')
    expect((body.get('attachment') as File).name).toBe('brief.pdf')
    expect(body.get('message')).toBeNull()
  })

  it('maps 413 / 415 to an attachment field error and 429 to rate limited', async () => {
    const payload = proposalSchema.parse(values())
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json(413, { error: { code: 'PAYLOAD_TOO_LARGE', message: 'Too big' } })),
    )
    await expect(submitProposal(toProposalBody(payload))).resolves.toMatchObject({
      kind: 'validation',
      fieldErrors: { attachment: 'fileTooLarge' },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json(415, { error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Nope' } })),
    )
    await expect(submitProposal(toProposalBody(payload))).resolves.toMatchObject({
      kind: 'validation',
      fieldErrors: { attachment: 'fileType' },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json(429, { error: { code: 'RATE_LIMITED', message: 'Slow down' } }, { 'retry-after': '60' })),
    )
    await expect(submitProposal(toProposalBody(payload))).resolves.toEqual({
      ok: false,
      kind: 'rate_limited',
      retryAfterSeconds: 60,
    })
  })
})
