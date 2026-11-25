import { adminApi, unwrap } from '@/lib/admin/client'
import type { AdminCategory, AdminTour, CategoryWrite, TourWrite } from '@/lib/api/types'

/** Tour statuses (draft ↔ published). */
export type TourStatus = AdminTour['status']
export const TOUR_STATUSES: readonly TourStatus[] = ['draft', 'published']
export const isTourStatus = (value: unknown): value is TourStatus => value === 'draft' || value === 'published'

/** The admin list endpoint returns at most 100 rows per page — enough to show every tour on one sortable page. */
export const TOUR_LIST_PAGE_SIZE = 100

export interface TourListQuery {
  q?: string
  status?: TourStatus
  page?: number
  pageSize?: number
}

/** Thin typed wrappers around /api/v1/admin/tours (all throw AdminApiError). */
export const toursApi = {
  list: (query: TourListQuery, signal?: AbortSignal) =>
    unwrap(adminApi.GET('/api/v1/admin/tours', { params: { query }, signal })),
  get: (id: string, signal?: AbortSignal) =>
    unwrap(adminApi.GET('/api/v1/admin/tours/{id}', { params: { path: { id } }, signal })),
  create: (body: TourWrite) => unwrap(adminApi.POST('/api/v1/admin/tours', { body })),
  update: (id: string, body: TourWrite) =>
    unwrap(adminApi.PUT('/api/v1/admin/tours/{id}', { params: { path: { id } }, body })),
  setStatus: (id: string, status: TourStatus) =>
    unwrap(adminApi.PATCH('/api/v1/admin/tours/{id}/status', { params: { path: { id } }, body: { status } })),
  reorder: (items: { id: string; order: number }[]) =>
    unwrap(adminApi.PATCH('/api/v1/admin/tours/order', { body: { items } })),
  remove: (id: string) => unwrap(adminApi.DELETE('/api/v1/admin/tours/{id}', { params: { path: { id } } })),
}

/** /api/v1/admin/categories */
export const categoriesApi = {
  list: async (signal?: AbortSignal): Promise<AdminCategory[]> => {
    const items = await unwrap(adminApi.GET('/api/v1/admin/categories', { signal }))
    return [...items].sort((a, b) => a.order - b.order)
  },
  create: (body: CategoryWrite) => unwrap(adminApi.POST('/api/v1/admin/categories', { body })),
  update: (id: string, body: CategoryWrite) =>
    unwrap(adminApi.PUT('/api/v1/admin/categories/{id}', { params: { path: { id } }, body })),
  reorder: (items: { id: string; order: number }[]) =>
    unwrap(adminApi.PATCH('/api/v1/admin/categories/order', { body: { items } })),
  remove: (id: string) => unwrap(adminApi.DELETE('/api/v1/admin/categories/{id}', { params: { path: { id } } })),
}

/** Destination options for the tour editor (every destination fits on one page). */
export const destinationOptionsApi = {
  list: (signal?: AbortSignal) =>
    unwrap(adminApi.GET('/api/v1/admin/destinations', { params: { query: { pageSize: 100 } }, signal })),
}

/** Public page of a tour (English has no locale prefix). */
export function publicTourPath(slug: string, locale: 'en' | 'zh' | 'de' = 'en'): string {
  return locale === 'en' ? `/tours/${slug}` : `/${locale}/tours/${slug}`
}
