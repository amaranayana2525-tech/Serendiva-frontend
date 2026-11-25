import { adminApi, unwrap } from '@/lib/admin/client'
import { ADMIN_LOCALES, type AdminLocale } from '@/lib/admin/translatable'
import type { components } from '@/lib/api/schema'
import type { AdminGalleryItem } from '@/lib/api/types'

/** Request bodies (the `…Input` variants are what the endpoints accept). */
export type GalleryItemWrite = components['schemas']['GalleryItemWriteInput']
export type GalleryBulkBody = components['schemas']['GalleryBulkBodyInput']

/** Typed calls for /api/v1/admin/gallery + caption helpers. */

export type GalleryStatus = AdminGalleryItem['status']
export type GalleryType = AdminGalleryItem['type']

export const galleryApi = {
  /** Every item (the gallery is small): ordered by `order`, then creation. Filtering happens client-side. */
  list: (signal?: AbortSignal): Promise<AdminGalleryItem[]> =>
    unwrap(adminApi.GET('/api/v1/admin/gallery', { signal })),
  create: (body: GalleryItemWrite): Promise<AdminGalleryItem> =>
    unwrap(adminApi.POST('/api/v1/admin/gallery', { body })),
  update: (id: string, body: GalleryItemWrite): Promise<AdminGalleryItem> =>
    unwrap(adminApi.PUT('/api/v1/admin/gallery/{id}', { params: { path: { id } }, body })),
  bulk: (body: GalleryBulkBody): Promise<AdminGalleryItem[]> =>
    unwrap(adminApi.POST('/api/v1/admin/gallery/bulk', { body })),
  setStatus: (id: string, status: GalleryStatus): Promise<AdminGalleryItem> =>
    unwrap(adminApi.PATCH('/api/v1/admin/gallery/{id}/status', { params: { path: { id } }, body: { status } })),
  reorder: (items: { id: string; order: number }[]) =>
    unwrap(adminApi.PATCH('/api/v1/admin/gallery/order', { body: { items } })),
  remove: (id: string): Promise<void> =>
    unwrap(adminApi.DELETE('/api/v1/admin/gallery/{id}', { params: { path: { id } } })),
}

/** Seeded categories (always offered, even when empty). */
export const DEFAULT_GALLERY_CATEGORIES = [
  'heritage',
  'wildlife',
  'tea-country',
  'coasts',
  'gastronomy',
  'portraits',
] as const

/** "tea-country" → "Tea country" (fallback label for categories without a translation). */
export function humanizeSlug(slug: string): string {
  const text = slug.replace(/-+/g, ' ').trim()
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : slug
}

/** Every category in use plus the defaults, defaults first. */
export function categoryList(items: readonly Pick<AdminGalleryItem, 'category'>[]): string[] {
  const out: string[] = [...DEFAULT_GALLERY_CATEGORIES]
  for (const item of items) if (!out.includes(item.category)) out.push(item.category)
  return out
}

/** Editing shape of the translatable caption block `{ en: { title, caption }, zh: {…} }`. */
export interface CaptionEdit {
  title: Record<AdminLocale, string>
  caption: Record<AdminLocale, string>
}

export function toCaptionEdit(value: AdminGalleryItem['caption']): CaptionEdit {
  const out: CaptionEdit = { title: { en: '', zh: '', de: '' }, caption: { en: '', zh: '', de: '' } }
  for (const locale of ADMIN_LOCALES) {
    const block = value?.[locale]
    out.title[locale] = block?.title ?? ''
    out.caption[locale] = block?.caption ?? ''
  }
  return out
}

/** Back to the API shape: locales without text are dropped, null when nothing is left. */
export function fromCaptionEdit(edit: CaptionEdit): GalleryItemWrite['caption'] {
  const out: Partial<Record<AdminLocale, { title?: string; caption?: string }>> = {}
  for (const locale of ADMIN_LOCALES) {
    const title = edit.title[locale].trim()
    const caption = edit.caption[locale].trim()
    if (!title && !caption) continue
    out[locale] = { ...(title ? { title } : {}), ...(caption ? { caption } : {}) }
  }
  return Object.keys(out).length ? out : null
}

/** Display title: English caption title, location or the image's alt text. */
export function galleryItemLabel(item: AdminGalleryItem): string {
  return item.caption?.en?.title || item.location || item.media?.alt || ''
}

/** Write body from an existing item (status / order changes go through their own endpoints). */
export function toWrite(item: AdminGalleryItem): GalleryItemWrite {
  return {
    type: item.type,
    mediaId: item.mediaId,
    videoUrl: item.videoUrl,
    category: item.category,
    caption: item.caption,
    location: item.location,
    order: item.order,
    status: item.status,
  }
}

/**
 * Reordering inside a filtered view: the view's items keep the global slots they occupy, in their new order. Returns
 * the full list re-sorted with `order` = index.
 */
export function applyViewOrder(
  all: readonly AdminGalleryItem[],
  view: readonly AdminGalleryItem[],
): AdminGalleryItem[] {
  const viewIds = new Set(view.map((v) => v.id))
  const queue = [...view]
  const merged = all.map((item) => (viewIds.has(item.id) ? (queue.shift() ?? item) : item))
  return merged.map((item, index) => (item.order === index ? item : { ...item, order: index }))
}
