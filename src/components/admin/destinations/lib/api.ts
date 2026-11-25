import { adminApi, unwrap } from '@/lib/admin/client'
import type {
  AdminDestination,
  AdminDestinationList,
  AdminRegion,
  AdminRegionList,
  DestinationWrite,
  RegionWrite,
} from '@/lib/api/types'
import type { OrderItem } from './useOrderSaver'

export type ContentStatus = 'draft' | 'published'

export interface DestinationListQuery {
  q?: string
  status?: ContentStatus
  regionId?: string
  page?: number
  pageSize?: number
}

/** Typed wrappers around /api/v1/admin/destinations and /api/v1/admin/regions. */
export const destinationsApi = {
  list: (query: DestinationListQuery, signal?: AbortSignal): Promise<AdminDestinationList> =>
    unwrap(adminApi.GET('/api/v1/admin/destinations', { params: { query }, signal })),
  get: (id: string, signal?: AbortSignal): Promise<AdminDestination> =>
    unwrap(adminApi.GET('/api/v1/admin/destinations/{id}', { params: { path: { id } }, signal })),
  create: (body: DestinationWrite): Promise<AdminDestination> =>
    unwrap(adminApi.POST('/api/v1/admin/destinations', { body })),
  update: (id: string, body: DestinationWrite): Promise<AdminDestination> =>
    unwrap(adminApi.PUT('/api/v1/admin/destinations/{id}', { params: { path: { id } }, body })),
  setStatus: (id: string, status: ContentStatus): Promise<AdminDestination> =>
    unwrap(adminApi.PATCH('/api/v1/admin/destinations/{id}/status', { params: { path: { id } }, body: { status } })),
  reorder: (items: OrderItem[]) => unwrap(adminApi.PATCH('/api/v1/admin/destinations/order', { body: { items } })),
  remove: (id: string) => unwrap(adminApi.DELETE('/api/v1/admin/destinations/{id}', { params: { path: { id } } })),
}

export const regionsApi = {
  list: (signal?: AbortSignal): Promise<AdminRegionList> => unwrap(adminApi.GET('/api/v1/admin/regions', { signal })),
  create: (body: RegionWrite): Promise<AdminRegion> => unwrap(adminApi.POST('/api/v1/admin/regions', { body })),
  update: (id: string, body: RegionWrite): Promise<AdminRegion> =>
    unwrap(adminApi.PUT('/api/v1/admin/regions/{id}', { params: { path: { id } }, body })),
  reorder: (items: OrderItem[]) => unwrap(adminApi.PATCH('/api/v1/admin/regions/order', { body: { items } })),
  remove: (id: string) => unwrap(adminApi.DELETE('/api/v1/admin/regions/{id}', { params: { path: { id } } })),
}

/** Public URL of a destination (English, no locale prefix). Opened in a new tab from the admin. */
export const destinationPublicPath = (slug: string, locale: 'en' | 'zh' | 'de' = 'en') =>
  locale === 'en' ? `/destinations/${slug}` : `/${locale}/destinations/${slug}`
