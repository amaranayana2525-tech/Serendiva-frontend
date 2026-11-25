import type {
  AdminInquiry,
  AdminInquiryCreateBody,
  AdminInquiryList,
  AdminProposal,
  AdminProposalList,
  InquiryUpdateBody,
  LeadContactBody,
  LeadStatus,
  ProposalUpdateBody,
} from '@/lib/api/types'
import { adminApi, cleanQuery, unwrap } from './client'

/** Typed calls for the two lead types (travel inquiries and corporate proposals). */

export const LEAD_STATUSES: readonly LeadStatus[] = [
  'new',
  'replied',
  'proposal_sent',
  'confirmed',
  'lost',
  'cancelled',
]
export const LEAD_PAGE_SIZE = 25

export const isLeadStatus = (value: unknown): value is LeadStatus =>
  typeof value === 'string' && (LEAD_STATUSES as readonly string[]).includes(value)

export type LeadDueFilter = 'reply' | 'followUp'
export type LeadSort = 'newest' | 'oldest'

export const isLeadDue = (value: unknown): value is LeadDueFilter => value === 'reply' || value === 'followUp'
export const isLeadSort = (value: unknown): value is LeadSort => value === 'newest' || value === 'oldest'

export interface LeadListFilters {
  status?: LeadStatus
  q?: string
  from?: string
  to?: string
  due?: LeadDueFilter
  sort?: LeadSort
  guideEmail?: 'missing'
  page?: number
  pageSize?: number
}

export interface InquiryListFilters extends LeadListFilters {
  /** Tour id */
  tour?: string
  destination?: string
  country?: string
}

export const inquiriesApi = {
  list: (filters: InquiryListFilters, signal?: AbortSignal): Promise<AdminInquiryList> =>
    unwrap(adminApi.GET('/api/v1/admin/inquiries', { params: { query: cleanQuery({ ...filters }) }, signal })),
  get: (id: string, signal?: AbortSignal): Promise<AdminInquiry> =>
    unwrap(adminApi.GET('/api/v1/admin/inquiries/{id}', { params: { path: { id } }, signal })),
  create: (body: AdminInquiryCreateBody): Promise<AdminInquiry> =>
    unwrap(adminApi.POST('/api/v1/admin/inquiries', { body })),
  update: (id: string, body: InquiryUpdateBody): Promise<AdminInquiry> =>
    unwrap(adminApi.PATCH('/api/v1/admin/inquiries/{id}', { params: { path: { id } }, body })),
  logContact: (id: string, body: LeadContactBody): Promise<AdminInquiry> =>
    unwrap(adminApi.POST('/api/v1/admin/inquiries/{id}/contacts', { params: { path: { id } }, body })),
  remove: (id: string): Promise<void> =>
    unwrap(adminApi.DELETE('/api/v1/admin/inquiries/{id}', { params: { path: { id } } })),
  resendEmails: (id: string): Promise<AdminInquiry> =>
    unwrap(adminApi.POST('/api/v1/admin/inquiries/{id}/resend-emails', { params: { path: { id } } })),
}

export const proposalsApi = {
  list: (filters: LeadListFilters, signal?: AbortSignal): Promise<AdminProposalList> =>
    unwrap(adminApi.GET('/api/v1/admin/proposals', { params: { query: cleanQuery({ ...filters }) }, signal })),
  get: (id: string, signal?: AbortSignal): Promise<AdminProposal> =>
    unwrap(adminApi.GET('/api/v1/admin/proposals/{id}', { params: { path: { id } }, signal })),
  update: (id: string, body: ProposalUpdateBody): Promise<AdminProposal> =>
    unwrap(adminApi.PATCH('/api/v1/admin/proposals/{id}', { params: { path: { id } }, body })),
  logContact: (id: string, body: LeadContactBody): Promise<AdminProposal> =>
    unwrap(adminApi.POST('/api/v1/admin/proposals/{id}/contacts', { params: { path: { id } }, body })),
  remove: (id: string): Promise<void> =>
    unwrap(adminApi.DELETE('/api/v1/admin/proposals/{id}', { params: { path: { id } } })),
  resendEmails: (id: string): Promise<AdminProposal> =>
    unwrap(adminApi.POST('/api/v1/admin/proposals/{id}/resend-emails', { params: { path: { id } } })),
}

export type LeadKind = 'inquiries' | 'proposals'
