import { z } from 'zod'
import type { ProposalBody } from '@/lib/api/types'
import { msg } from './messages'
import { emailSchema, honeypot, localeSchema, optionalText, requiredPhone, requiredText } from './shared'

export const PROPOSAL_MAX_FILE_BYTES = 5 * 1024 * 1024
export const PROPOSAL_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const
export const PROPOSAL_FILE_ACCEPT =
  '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const isAllowedFile = (file: File) =>
  (PROPOSAL_FILE_TYPES as readonly string[]).includes(file.type) || /\.(pdf|docx)$/i.test(file.name)

const isFile = (value: unknown): value is File => typeof File !== 'undefined' && value instanceof File

/**
 * Corporate proposal form — mirrors POST /corporate-proposals (multipart): company 2-160, contactPerson 2-120,
 * email, phone 5-40, groupSize ≤60, dates ≤120, eventType ≤80, logistics ≤10, message ≤5000, attachment PDF/DOCX ≤5 MB.
 */
export const proposalSchema = z.object({
  company: requiredText(160, 2),
  contactPerson: requiredText(120, 2, 'nameTooShort'),
  email: emailSchema,
  phone: requiredPhone(5, 40),
  groupSize: requiredText(60),
  dates: requiredText(120),
  eventType: requiredText(80),
  logistics: z.array(z.string().trim().min(1).max(80, msg('tooLong', 80))).max(10, msg('tooMany', 10)),
  message: optionalText(5000),
  sourcePage: optionalText(300),
  locale: localeSchema,
  website: honeypot,
  turnstileToken: z.string().max(4096).optional(),
  attachment: z
    .custom<File | null | undefined>((v) => v === null || v === undefined || isFile(v), 'invalid')
    .refine((f) => !f || f.size <= PROPOSAL_MAX_FILE_BYTES, 'fileTooLarge')
    .refine((f) => !f || isAllowedFile(f), 'fileType')
    .optional(),
})

export type ProposalFormValues = z.input<typeof proposalSchema>
export type ProposalPayload = z.output<typeof proposalSchema>

export const proposalDefaults = (locale: ProposalFormValues['locale']): ProposalFormValues => ({
  company: '',
  contactPerson: '',
  email: '',
  phone: '',
  groupSize: '',
  dates: '',
  eventType: '',
  logistics: [],
  message: '',
  locale,
  website: '',
  attachment: null,
})

export const toProposalBody = (payload: ProposalPayload): ProposalBody => payload
