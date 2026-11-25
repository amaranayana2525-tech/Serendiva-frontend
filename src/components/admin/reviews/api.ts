import { adminApi, unwrap } from '@/lib/admin/client'
import type { AdminReview, AdminReviewList, ReviewSource, ReviewWrite, TravellerType } from '@/lib/api/types'

export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]
export const TRAVELLER_TYPES = ['couple', 'family', 'group', 'solo', 'corporate'] as const satisfies readonly TravellerType[]
export const REVIEW_SOURCES = ['direct', 'tripadvisor', 'google'] as const satisfies readonly ReviewSource[]
export const REVIEW_LOCALES = ['en', 'zh', 'de'] as const

export const isReviewStatus = (v: unknown): v is ReviewStatus =>
  typeof v === 'string' && (REVIEW_STATUSES as readonly string[]).includes(v)
export const isTravellerType = (v: unknown): v is TravellerType =>
  typeof v === 'string' && (TRAVELLER_TYPES as readonly string[]).includes(v)

/** Request body of POST/PUT /reviews (the generated `ReviewWrite` types `country` as unknown — it's a 2-letter code). */
export type ReviewBody = Omit<ReviewWrite, 'country'> & { country: string }

export interface ReviewListQuery {
  status?: ReviewStatus
  q?: string
  travellerType?: TravellerType
  featured?: 'true' | 'false'
  page?: number
  pageSize?: number
}

/** Typed wrappers around /api/v1/admin/reviews. */
export const reviewsApi = {
  list: (query: ReviewListQuery, signal?: AbortSignal): Promise<AdminReviewList> =>
    unwrap(adminApi.GET('/api/v1/admin/reviews', { params: { query }, signal })),
  get: (id: string, signal?: AbortSignal): Promise<AdminReview> =>
    unwrap(adminApi.GET('/api/v1/admin/reviews/{id}', { params: { path: { id } }, signal })),
  create: (body: ReviewBody): Promise<AdminReview> => unwrap(adminApi.POST('/api/v1/admin/reviews', { body })),
  update: (id: string, body: ReviewBody): Promise<AdminReview> =>
    unwrap(adminApi.PUT('/api/v1/admin/reviews/{id}', { params: { path: { id } }, body })),
  setStatus: (id: string, status: ReviewStatus): Promise<AdminReview> =>
    unwrap(adminApi.PATCH('/api/v1/admin/reviews/{id}/status', { params: { path: { id } }, body: { status } })),
  setFeatured: (id: string, isFeatured: boolean): Promise<AdminReview> =>
    unwrap(adminApi.PATCH('/api/v1/admin/reviews/{id}/feature', { params: { path: { id } }, body: { isFeatured } })),
  remove: (id: string) => unwrap(adminApi.DELETE('/api/v1/admin/reviews/{id}', { params: { path: { id } } })),
}

/** Tour options for selects (id + English title), shared by the review and FAQ forms. */
export const tourOptionsApi = {
  list: async (signal?: AbortSignal) => {
    const data = await unwrap(adminApi.GET('/api/v1/admin/tours', { params: { query: { pageSize: 100 } }, signal }))
    return data.items.map((t) => ({ value: t.id, label: t.title }))
  },
}
