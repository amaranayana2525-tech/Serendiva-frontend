import { adminApi, cleanQuery, unwrap } from '@/lib/admin/client'
import type { AdminMedia, AdminMediaDetail, AdminMediaList, MediaUsage, MediaUsageType } from '@/lib/api/types'

/** Typed calls + helpers for the media library (GET/PATCH/DELETE /api/v1/admin/media). Upload: `useUploadQueue`. */

export interface MediaListFilters {
  q?: string
  type?: 'image' | 'document'
  folder?: string
  page?: number
  pageSize?: number
}

export const mediaApi = {
  list: (filters: MediaListFilters, signal?: AbortSignal): Promise<AdminMediaList> =>
    unwrap(adminApi.GET('/api/v1/admin/media', { params: { query: cleanQuery({ ...filters }) }, signal })),
  get: (id: string, signal?: AbortSignal): Promise<AdminMediaDetail> =>
    unwrap(adminApi.GET('/api/v1/admin/media/{id}', { params: { path: { id } }, signal })),
  /** Empty strings remove a locale; null clears all alt text. */
  updateAlt: (id: string, altText: { en?: string; zh?: string; de?: string } | null): Promise<AdminMedia> =>
    unwrap(adminApi.PATCH('/api/v1/admin/media/{id}', { params: { path: { id } }, body: { altText } })),
  /** 409 MEDIA_IN_USE (details.usage) while the file is referenced. */
  remove: (id: string): Promise<void> =>
    unwrap(adminApi.DELETE('/api/v1/admin/media/{id}', { params: { path: { id } } })),
}

/** Upload folders offered in the filters / upload form (the API accepts any lowercase slug). */
export const MEDIA_FOLDERS = [
  'general',
  'gallery',
  'blog',
  'tours',
  'destinations',
  'reviews',
  'settings',
  'seed',
] as const

/** Proposal attachments live under `private/` and are never shown in the library. */
export function isPrivateMedia(media: { url: string }): boolean {
  return /\/uploads\/private\//.test(media.url) || /^\/?private\//.test(media.url)
}

/** Storage folder from the file URL: `…/uploads/media/<folder>/…` → folder, legacy `…/uploads/<folder>/…`. */
export function mediaFolder(url: string): string | null {
  const m = /\/uploads\/(?:media\/)?([a-z0-9-]+)\//.exec(url)
  return m?.[1] ?? null
}

export const isImageMime = (mime: string) => mime.startsWith('image/')

/** File name for display: original name, else the last URL segment. */
export function mediaName(media: Pick<AdminMedia, 'originalName' | 'url'>): string {
  if (media.originalName) return media.originalName
  const last = media.url.split('?')[0].split('/').pop()
  return last ? decodeURIComponent(last) : media.url
}

/** Admin screen that edits the record behind a usage entry (null when there is no direct editor link). */
export function usageHref(usage: Pick<MediaUsage, 'type' | 'id'>): string | null {
  const id = encodeURIComponent(usage.id)
  switch (usage.type) {
    case 'tour':
    case 'tourGallery':
      return `/admin/tours/${id}`
    case 'destination':
    case 'destinationGallery':
    case 'destinationBlock':
      return `/admin/destinations/${id}`
    case 'blog':
      return `/admin/blog/${id}`
    case 'gallery':
      return `/admin/gallery?item=${id}`
    case 'setting':
      return `/admin/settings?section=${id}`
    case 'proposal':
      return `/admin/proposals?id=${id}`
    case 'review':
    case 'reviewTrip':
      return `/admin/reviews?id=${id}`
    default:
      return null
  }
}

export const USAGE_ICONS: Record<MediaUsageType, string> = {
  tour: 'map',
  tourGallery: 'photo_library',
  destination: 'location_on',
  destinationGallery: 'photo_library',
  destinationBlock: 'view_agenda',
  region: 'public',
  category: 'category',
  blog: 'article',
  gallery: 'photo_library',
  review: 'reviews',
  reviewTrip: 'reviews',
  proposal: 'business_center',
  setting: 'settings',
}
