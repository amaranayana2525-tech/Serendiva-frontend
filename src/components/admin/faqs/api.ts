import { adminApi, unwrap } from '@/lib/admin/client'
import type { AdminFaq, AdminFaqList, FaqWrite } from '@/lib/api/types'
import type { OrderItem } from '../destinations/lib/useOrderSaver'

export const FAQ_SCOPES = ['general', 'booking', 'corporate', 'reviews', 'travelGuide', 'tour', 'destination'] as const
export type FaqScope = (typeof FAQ_SCOPES)[number]

export const isFaqScope = (value: unknown): value is FaqScope =>
  typeof value === 'string' && (FAQ_SCOPES as readonly string[]).includes(value)

export interface FaqListQuery {
  scope?: FaqScope
  tourId?: string
  destinationId?: string
  q?: string
}

/** Typed wrappers around /api/v1/admin/faqs. */
export const faqsApi = {
  list: (query: FaqListQuery, signal?: AbortSignal): Promise<AdminFaqList> =>
    unwrap(adminApi.GET('/api/v1/admin/faqs', { params: { query }, signal })),
  create: (body: FaqWrite): Promise<AdminFaq> => unwrap(adminApi.POST('/api/v1/admin/faqs', { body })),
  update: (id: string, body: FaqWrite): Promise<AdminFaq> =>
    unwrap(adminApi.PUT('/api/v1/admin/faqs/{id}', { params: { path: { id } }, body })),
  setStatus: (id: string, status: 'draft' | 'published'): Promise<AdminFaq> =>
    unwrap(adminApi.PATCH('/api/v1/admin/faqs/{id}/status', { params: { path: { id } }, body: { status } })),
  reorder: (items: OrderItem[]) => unwrap(adminApi.PATCH('/api/v1/admin/faqs/order', { body: { items } })),
  remove: (id: string) => unwrap(adminApi.DELETE('/api/v1/admin/faqs/{id}', { params: { path: { id } } })),
}
