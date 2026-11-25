/**
 * Admin overrides of the static page copy (API: /page-content). The JSON files in src/messages stay the
 * defaults; an override replaces one string at a dotted path, and `hidden` removes whole sections.
 *
 * Used by the site (i18n/messages.ts) and by the admin editor (validation before save), so it must stay
 * free of server-only imports.
 */

export type JsonObject = { [key: string]: JsonValue }
export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject

/** One item of an edited list: its key (existing items keep theirs) and its texts by field path. */
export interface ListItemOverride {
  key: string
  values: Record<string, string>
}

export interface PageContentOverride {
  namespace: string
  locale: string
  values: Record<string, string>
  hidden: string[]
  /** Re-ordered / shortened / extended lists: the message object at each path is rebuilt from the items. */
  lists?: Record<string, ListItemOverride[]>
}

/** List item keys start with a letter so object key order stays the display order (never numeric). */
export const LIST_ITEM_KEY = /^[a-z][A-Za-z0-9_-]{0,39}$/
const ICON_NAME = /^[a-z0-9_]{2,60}$/

const isObject = (v: unknown): v is JsonObject => typeof v === 'object' && v !== null && !Array.isArray(v)

// ------------------------------------------------------------------------------------------------ placeholders

const ARGUMENT = /\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*[,}]/g
const TAG = /<(\/?)([A-Za-z][A-Za-z0-9]*)>/g

/**
 * The ICU arguments (`{name}`, `{count, plural, …}`) and rich-text tags (`<em>…</em>`) a message uses.
 * An override must keep exactly the same set, otherwise the component's `t()` call breaks.
 */
export function messageTokens(text: string): string[] {
  const tokens = new Set<string>()
  for (const m of text.matchAll(ARGUMENT)) tokens.add(`{${m[1]}}`)
  for (const m of text.matchAll(TAG)) tokens.add(`<${m[1]}${m[2]}>`)
  return [...tokens].sort()
}

function bracesBalanced(text: string): boolean {
  let depth = 0
  for (const ch of text) {
    if (ch === '{') depth++
    else if (ch === '}' && --depth < 0) return false
  }
  return depth === 0
}

export type OverrideProblem =
  | { kind: 'missing'; tokens: string[] }
  | { kind: 'unexpected'; tokens: string[] }
  | { kind: 'braces' }

/** Why `text` cannot replace `original` (null when it can). */
export function overrideProblem(original: string, text: string): OverrideProblem | null {
  if (!bracesBalanced(text)) return { kind: 'braces' }
  const expected = messageTokens(original)
  const actual = messageTokens(text)
  const missing = expected.filter((t) => !actual.includes(t))
  if (missing.length) return { kind: 'missing', tokens: missing }
  const unexpected = actual.filter((t) => !expected.includes(t))
  if (unexpected.length) return { kind: 'unexpected', tokens: unexpected }
  return null
}

// ------------------------------------------------------------------------------------------------ paths

/** Value at a dotted path (array segments are indexes), or undefined. */
export function getAtPath(root: JsonValue | undefined, path: string): JsonValue | undefined {
  let node: JsonValue | undefined = root
  for (const segment of path.split('.')) {
    if (Array.isArray(node)) node = /^\d+$/.test(segment) ? node[Number(segment)] : undefined
    else if (isObject(node)) node = Object.hasOwn(node, segment) ? node[segment] : undefined
    else return undefined
    if (node === undefined) return undefined
  }
  return node
}

function setAtPath(root: JsonValue, path: string, value: string): void {
  const segments = path.split('.')
  const last = segments.pop()!
  const parent = segments.length ? getAtPath(root, segments.join('.')) : root
  if (Array.isArray(parent)) parent[Number(last)] = value
  else if (isObject(parent)) parent[last] = value
}

function deleteAtPath(root: JsonValue, path: string): void {
  const segments = path.split('.')
  const last = segments.pop()!
  const parent = segments.length ? getAtPath(root, segments.join('.')) : root
  if (isObject(parent)) delete parent[last]
}

/** Every string leaf under `root` as `[path, text]`, in document order. */
export function stringLeaves(root: JsonValue | undefined, prefix = ''): [string, string][] {
  if (typeof root === 'string') return prefix ? [[prefix, root]] : []
  const join = (key: string | number) => (prefix ? `${prefix}.${key}` : String(key))
  if (Array.isArray(root)) return root.flatMap((child, i) => stringLeaves(child, join(i)))
  if (isObject(root)) return Object.entries(root).flatMap(([key, child]) => stringLeaves(child, join(key)))
  return []
}

// ------------------------------------------------------------------------------------------------ merge

export interface ApplyOptions {
  /** Called for each override that was ignored (unknown path, not a string, or broken placeholders). */
  onSkip?: (path: string, reason: string) => void
}

/**
 * Returns a copy of `messages` with the override texts applied. Only paths that exist in the defaults as
 * strings are replaced, and only when the placeholders still match; anything else is skipped, so a
 * stale or broken override can never crash a page.
 */
export function applyValues(
  messages: JsonObject,
  values: Record<string, string>,
  options: ApplyOptions = {},
): JsonObject {
  const entries = Object.entries(values).filter(([, text]) => typeof text === 'string' && text.trim() !== '')
  if (entries.length === 0) return messages
  const out = structuredClone(messages)
  for (const [path, text] of entries) {
    const original = getAtPath(out, path)
    if (typeof original !== 'string') {
      options.onSkip?.(path, original === undefined ? 'unknown path' : 'not a text')
      continue
    }
    const problem = overrideProblem(original, text)
    if (problem) {
      options.onSkip?.(path, problem.kind === 'braces' ? 'unbalanced braces' : `${problem.kind} ${problem.tokens.join(' ')}`)
      continue
    }
    setAtPath(out, path, text)
  }
  return out
}

/** The items (object children) of a keyed message list, e.g. `{ board: {…}, incentive: {…}, label: '…' }`. */
export function listChildren(node: JsonValue | undefined): [string, JsonObject][] {
  return isObject(node) ? Object.entries(node).filter((e): e is [string, JsonObject] => isObject(e[1])) : []
}

/** A copy of `item` with every text emptied (the shape of a brand-new item). */
function blankLike(item: JsonValue): JsonValue {
  if (typeof item === 'string') return ''
  if (Array.isArray(item)) return item.map(blankLike)
  if (isObject(item)) return Object.fromEntries(Object.entries(item).map(([k, v]) => [k, blankLike(v)]))
  return item
}

/** New list items may drop placeholders, but not invent ones the component doesn't pass. */
export function newItemProblem(template: string, text: string): OverrideProblem | null {
  const problem = overrideProblem(template, text)
  return problem?.kind === 'missing' ? null : problem
}

/**
 * Rebuilds the lists the admin edited: each path's object gets exactly the given items, in that order.
 * Existing items start from their default texts, new ones from an empty copy of the first default item;
 * only fields that exist in that shape are accepted (plus `icon`). Plain-text siblings of the items
 * (e.g. a list's `label`) are kept. Invalid paths, keys and texts are skipped.
 */
export function applyLists(
  messages: JsonObject,
  lists: Record<string, ListItemOverride[]> | undefined,
  options: ApplyOptions = {},
): JsonObject {
  const entries = Object.entries(lists ?? {})
  if (entries.length === 0) return messages
  const out = structuredClone(messages)
  for (const [path, items] of entries) {
    const node = getAtPath(out, path)
    const children = listChildren(node)
    const template = children[0]?.[1]
    if (!isObject(node) || !template || !Array.isArray(items)) {
      options.onSkip?.(path, 'not a list')
      continue
    }
    const rebuilt: JsonObject = Object.fromEntries(Object.entries(node).filter(([, v]) => !isObject(v)))
    for (const item of items) {
      if (!LIST_ITEM_KEY.test(item.key) || Object.hasOwn(rebuilt, item.key)) {
        options.onSkip?.(`${path}.${item.key}`, 'invalid or duplicate item key')
        continue
      }
      const original = isObject(node[item.key]) ? (node[item.key] as JsonObject) : undefined
      const base = structuredClone(original ?? (blankLike(template) as JsonObject))
      for (const [field, text] of Object.entries(item.values ?? {})) {
        if (typeof text !== 'string' || text.trim() === '') continue
        if (field === 'icon') {
          if (ICON_NAME.test(text)) base.icon = text
          continue
        }
        const reference = getAtPath(original ?? template, field)
        if (typeof reference !== 'string' || typeof getAtPath(base, field) !== 'string') {
          options.onSkip?.(`${path}.${item.key}.${field}`, 'unknown field')
          continue
        }
        const problem = original ? overrideProblem(reference, text) : newItemProblem(reference, text)
        if (problem) {
          options.onSkip?.(`${path}.${item.key}.${field}`, problem.kind)
          continue
        }
        setAtPath(base, field, text)
      }
      rebuilt[item.key] = base
    }
    replaceAtPath(out, path, rebuilt)
  }
  return out
}

function replaceAtPath(root: JsonObject, path: string, value: JsonObject): void {
  const segments = path.split('.')
  const last = segments.pop()!
  const parent = segments.length ? getAtPath(root, segments.join('.')) : root
  if (isObject(parent)) parent[last] = value
}

/** Returns a copy of `messages` without the hidden sections (components check `t.has()` and render nothing). */
export function applyHidden(messages: JsonObject, hidden: readonly string[]): JsonObject {
  const present = hidden.filter((path) => getAtPath(messages, path) !== undefined)
  if (present.length === 0) return messages
  const out = structuredClone(messages)
  for (const path of present) deleteAtPath(out, path)
  return out
}
