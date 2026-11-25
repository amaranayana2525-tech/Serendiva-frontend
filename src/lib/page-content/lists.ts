/**
 * Rendering helpers for message lists the admin can re-order / extend (registry `list`).
 *
 * The items come from the messages (`t.raw('items')`), so their order and number follow the admin's edits;
 * per-item presentation that is not text (icon, colour tone, image slot) still comes from the component's
 * constants, matched by key. New items borrow the presentation of the item at the same position (cycling)
 * and can carry their own `icon`.
 */

type JsonRecord = Record<string, unknown>
const isRecord = (v: unknown): v is JsonRecord => typeof v === 'object' && v !== null && !Array.isArray(v)

export interface ListEntry<M> {
  key: string
  /** Presentation for this item (its own constant, or the one at the same position for new items). */
  meta: M
  /** True when the item is one of the component's built-in items. */
  known: boolean
  /** The admin's icon choice, else the constant's icon (when the constant has one). */
  icon: string | undefined
}

export function listEntries<M extends { key: string }>(raw: unknown, metas: readonly M[]): ListEntry<M>[] {
  if (!isRecord(raw) || metas.length === 0) return []
  return Object.entries(raw)
    .filter((entry): entry is [string, JsonRecord] => isRecord(entry[1]))
    .map(([key, item], index) => {
      const own = metas.find((m) => m.key === key)
      const meta = own ?? metas[index % metas.length]!
      const metaIcon = 'icon' in meta && typeof meta.icon === 'string' ? meta.icon : undefined
      return { key, meta, known: Boolean(own), icon: typeof item.icon === 'string' ? item.icon : metaIcon }
    })
}

type Values = Record<string, string | number | Date>

/**
 * `t` with string keys: list items have keys the message types don't know (admin-added items), so the
 * typed translator can't be used for `items.<key>.title`.
 */
export interface LooseTranslator {
  (key: string, values?: Values): string
  /** Raw message value (objects too) — for the list objects themselves. */
  raw: (key: string) => unknown
}

export const loose = (t: unknown): LooseTranslator => t as LooseTranslator
