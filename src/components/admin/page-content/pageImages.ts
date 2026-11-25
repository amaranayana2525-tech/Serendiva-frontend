import type { AdminMediaRef, AdminSettings } from '@/lib/api/types'
import type { PageContentGroup } from '@/lib/page-content/registry'
import { itemSlot } from '@/lib/page-content/slots'
import type { EditItem } from './listState'

/** Photos of one page in the editor, by settings.pageImages slot (null = no photo). */
export type SlotImages = Record<string, AdminMediaRef | null>

type PageImagesBody = { slot: string; imageId: string }[]

const MAX_SLOTS = 300

/** Every photo slot the page shows: section photos plus one per (current) item of photo lists. */
export function pageSlots(groups: readonly PageContentGroup[], lists: Record<string, EditItem[]>): string[] {
  const slots: string[] = []
  for (const group of groups) {
    for (const image of group.images ?? []) slots.push(image.slot)
    const listImage = group.list?.image
    if (group.list && listImage) for (const item of lists[group.list.path] ?? []) slots.push(itemSlot(listImage, item.key))
  }
  return [...new Set(slots)]
}

export function imagesFrom(settings: AdminSettings, slots: readonly string[]): SlotImages {
  const stored = new Map((settings.pageImages ?? []).map((p) => [p.slot, p.imageId]))
  return Object.fromEntries(
    slots.map((slot) => {
      const id = stored.get(slot)
      return [slot, id ? (settings.mediaRefs[id] ?? null) : null]
    }),
  )
}

/**
 * The full pageImages list to PUT, or null when nothing changed. Only slots the admin touched are rewritten
 * (a stored image without a preview is never dropped by accident), and the photos of list items the admin
 * added and removed again are cleaned up.
 */
export function imagesPayload(
  settings: AdminSettings,
  baseline: SlotImages,
  current: SlotImages,
  groups: readonly PageContentGroup[],
  lists: Record<string, EditItem[]>,
): PageImagesBody | null {
  const live = new Set(pageSlots(groups, lists))
  const changed = new Map<string, string | null>()
  for (const slot of live) {
    const next = current[slot]?.id ?? null
    if (next !== (baseline[slot]?.id ?? null)) changed.set(slot, next)
  }

  const orphans = new Set<string>()
  for (const group of groups) {
    const listImage = group.list?.image
    if (!listImage) continue
    const builtIn = new Set(Object.values(listImage.slots))
    for (const { slot } of settings.pageImages ?? []) {
      if (slot.startsWith(`${listImage.prefix}-`) && !builtIn.has(slot) && !live.has(slot)) orphans.add(slot)
    }
  }

  if (changed.size === 0 && orphans.size === 0) return null
  const next: PageImagesBody = (settings.pageImages ?? [])
    .filter((p) => !changed.has(p.slot) && !orphans.has(p.slot))
    .map((p) => ({ slot: p.slot, imageId: p.imageId }))
  for (const [slot, imageId] of changed) if (imageId) next.push({ slot, imageId })
  return next.slice(0, MAX_SLOTS)
}
