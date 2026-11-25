import { adminApi, unwrap } from '@/lib/admin/client'
import type { paths } from '@/lib/api/schema'
import type { AdminMediaRef, AdminSettings } from '@/lib/api/types'

/** GET /api/v1/admin/settings + one typed PUT per setting key. */

export type SettingKey =
  | 'contact'
  | 'social'
  | 'guide'
  | 'counters'
  | 'trustBadges'
  | 'heroSlides'
  | 'seo'
  | 'corporateClients'
  | 'instagramFeed'
  | 'pageImages'

export type SettingBody<K extends SettingKey> = paths[`/api/v1/admin/settings/${K}`]['put']['requestBody'] extends {
  content: { 'application/json': infer B }
}
  ? B
  : never

export const settingsApi = {
  get: (signal?: AbortSignal): Promise<AdminSettings> => unwrap(adminApi.GET('/api/v1/admin/settings', { signal })),
  contact: (body: SettingBody<'contact'>) => unwrap(adminApi.PUT('/api/v1/admin/settings/contact', { body })),
  social: (body: SettingBody<'social'>) => unwrap(adminApi.PUT('/api/v1/admin/settings/social', { body })),
  guide: (body: SettingBody<'guide'>) => unwrap(adminApi.PUT('/api/v1/admin/settings/guide', { body })),
  counters: (body: SettingBody<'counters'>) => unwrap(adminApi.PUT('/api/v1/admin/settings/counters', { body })),
  trustBadges: (body: SettingBody<'trustBadges'>) =>
    unwrap(adminApi.PUT('/api/v1/admin/settings/trustBadges', { body })),
  heroSlides: (body: SettingBody<'heroSlides'>) => unwrap(adminApi.PUT('/api/v1/admin/settings/heroSlides', { body })),
  seo: (body: SettingBody<'seo'>) => unwrap(adminApi.PUT('/api/v1/admin/settings/seo', { body })),
  corporateClients: (body: SettingBody<'corporateClients'>) =>
    unwrap(adminApi.PUT('/api/v1/admin/settings/corporateClients', { body })),
  instagramFeed: (body: SettingBody<'instagramFeed'>) =>
    unwrap(adminApi.PUT('/api/v1/admin/settings/instagramFeed', { body })),
  pageImages: (body: SettingBody<'pageImages'>) => unwrap(adminApi.PUT('/api/v1/admin/settings/pageImages', { body })),
}

/** Preview ref for a media id stored in a setting (null when unset or unknown). */
export function refOf(settings: Pick<AdminSettings, 'mediaRefs'>, id: string | null | undefined): AdminMediaRef | null {
  if (!id) return null
  return settings.mediaRefs[id] ?? null
}

/** "about-field-zoology-yala" → "Field zoology yala" (prefix removed — it is the group). */
export function humanizeSlot(slot: string): string {
  const rest = slot.includes('-') ? slot.slice(slot.indexOf('-') + 1) : slot
  const text = rest.replace(/-+/g, ' ').trim()
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : slot
}

/** Group key of a page-image slot: its first segment ("about-…" → "about"). */
export const slotGroup = (slot: string) => slot.split('-')[0] || slot
