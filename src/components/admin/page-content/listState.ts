import { newItemProblem, overrideProblem, type ListItemOverride, type OverrideProblem } from '@/lib/page-content/merge'
import type { PageContentListModel } from '@/lib/page-content/registry'

/** One list item in the editor. Built-in items keep their key; new ones get a generated key. */
export interface EditItem {
  key: string
  /** Texts by field path inside the item (`title`, `points.one`). */
  values: Record<string, string>
  /** Own icon (null = the page's built-in icon for this position). */
  icon: string | null
  isNew: boolean
}

interface StoredEntry {
  values: Record<string, string>
  lists?: Record<string, ListItemOverride[]>
}

let seq = 0
/** Unique, never numeric (object key order = display order on the website). */
export const newItemKey = () => `item${Date.now().toString(36)}${(seq++).toString(36)}`

/** Editor items from the stored overrides (the admin's list, or the defaults with any single-text edits). */
export function listFromEntry(model: PageContentListModel, entry: StoredEntry | undefined): EditItem[] {
  const stored = entry?.lists?.[model.path]
  if (stored) {
    return stored.map((item) => {
      const builtIn = model.defaults.find((d) => d.key === item.key)
      const fields = builtIn ? Object.keys(builtIn.texts) : model.fields
      return {
        key: item.key,
        values: Object.fromEntries(fields.map((f) => [f, item.values[f] ?? builtIn?.texts[f] ?? ''])),
        icon: item.values.icon ?? null,
        isNew: !builtIn,
      }
    })
  }
  return model.defaults.map((d) => ({
    key: d.key,
    values: Object.fromEntries(
      Object.entries(d.texts).map(([f, text]) => [f, entry?.values[`${model.path}.${d.key}.${f}`] ?? text]),
    ),
    icon: null,
    isNew: false,
  }))
}

export function defaultItems(model: PageContentListModel): EditItem[] {
  return listFromEntry(model, undefined)
}

/** The override to store, or null when the list is exactly the default one. */
export function listToOverride(model: PageContentListModel, items: readonly EditItem[]): ListItemOverride[] | null {
  const same =
    items.length === model.defaults.length &&
    items.every((item, i) => {
      const d = model.defaults[i]!
      return (
        item.key === d.key &&
        !item.icon &&
        Object.entries(d.texts).every(([f, text]) => {
          const v = item.values[f] ?? ''
          return v === text || v.trim() === ''
        })
      )
    })
  if (same) return null
  return items.map((item) => {
    const builtIn = model.defaults.find((d) => d.key === item.key)
    const values: Record<string, string> = {}
    for (const [field, text] of Object.entries(item.values)) {
      if (text.trim() === '' || builtIn?.texts[field] === text) continue
      values[field] = text
    }
    if (item.icon) values.icon = item.icon
    return { key: item.key, values }
  })
}

export const listErrorKey = (path: string, key: string, field: string) => `${path}|${key}|${field}`

export type ListProblem = OverrideProblem | { kind: 'required' }

/** Problems by `listErrorKey`: new items need every text; edited texts must keep valid placeholders. */
export function listProblems(model: PageContentListModel, items: readonly EditItem[]): Record<string, ListProblem> {
  const out: Record<string, ListProblem> = {}
  const template = model.defaults[0]?.texts ?? {}
  for (const item of items) {
    const builtIn = model.defaults.find((d) => d.key === item.key)
    for (const [field, text] of Object.entries(item.values)) {
      const key = listErrorKey(model.path, item.key, field)
      if (!builtIn) {
        if (text.trim() === '') out[key] = { kind: 'required' }
        else {
          const problem = newItemProblem(template[field] ?? '', text)
          if (problem) out[key] = problem
        }
      } else if (text.trim() !== '' && text !== builtIn.texts[field]) {
        const problem = overrideProblem(builtIn.texts[field] ?? '', text)
        if (problem) out[key] = problem
      }
    }
  }
  return out
}
