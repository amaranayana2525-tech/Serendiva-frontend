import { adminApi, unwrap } from '@/lib/admin/client'
import type { components } from '@/lib/api/schema'
import type { JsonObject } from '@/lib/page-content/merge'
import type { PageContentNamespace } from '@/lib/page-content/registry'

export type AdminPageContent = components['schemas']['AdminPageContent']
export type PageContentEntry = AdminPageContent['items'][number]
export type PageContentBody = components['schemas']['PageContentBody']

/** GET /api/v1/admin/page-content + PUT /api/v1/admin/page-content/{namespace}. */
export const pageContentApi = {
  get: (signal?: AbortSignal): Promise<AdminPageContent> =>
    unwrap(adminApi.GET('/api/v1/admin/page-content', { signal })),
  save: (namespace: PageContentNamespace, body: PageContentBody): Promise<AdminPageContent> =>
    unwrap(adminApi.PUT('/api/v1/admin/page-content/{namespace}', { params: { path: { namespace } }, body })),
}

/** The English defaults (the JSON files the site ships with), loaded on demand per namespace. */
const DEFAULTS: Record<PageContentNamespace, () => Promise<{ default: unknown }>> = {
  common: () => import('@/messages/en/common.json'),
  home: () => import('@/messages/en/home.json'),
  about: () => import('@/messages/en/about.json'),
  blog: () => import('@/messages/en/blog.json'),
  contact: () => import('@/messages/en/contact.json'),
  corporate: () => import('@/messages/en/corporate.json'),
  destinations: () => import('@/messages/en/destinations.json'),
  destinationDetail: () => import('@/messages/en/destinationDetail.json'),
  gallery: () => import('@/messages/en/gallery.json'),
  legal: () => import('@/messages/en/legal.json'),
  responsible: () => import('@/messages/en/responsible.json'),
  reviews: () => import('@/messages/en/reviews.json'),
  tours: () => import('@/messages/en/tours.json'),
  tourDetail: () => import('@/messages/en/tourDetail.json'),
  travelGuide: () => import('@/messages/en/travelGuide.json'),
  quiz: () => import('@/messages/en/quiz.json'),
}

export async function loadDefaults(namespace: PageContentNamespace): Promise<JsonObject> {
  const mod = await DEFAULTS[namespace]()
  return mod.default as JsonObject
}

/** "titleAccent" → "Title accent"; "3" → "3" shown 1-based ("4"). */
function humanizeSegment(segment: string): string {
  if (/^\d+$/.test(segment)) return String(Number(segment) + 1)
  const words = segment
    .replace(/[-_]/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * Field label from its path below the group's roots: "services.items.retreat.title" (root "services") →
 * "Items › Retreat › Title"; a root that is itself a text ("rfp.intro") is labelled by its last segment.
 */
export function fieldLabel(path: string, roots: readonly string[]): string {
  const root = roots.find((r) => path.startsWith(`${r}.`))
  const rest = root ? path.slice(root.length + 1) : path.slice(path.lastIndexOf('.') + 1)
  return rest.split('.').map(humanizeSegment).join(' › ')
}

export const humanizeId = humanizeSegment
