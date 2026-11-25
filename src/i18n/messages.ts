import { applyHidden, applyLists, applyValues, type PageContentOverride } from '@/lib/page-content/merge'
import type { Locale } from './routing'

/**
 * Message namespaces = files in src/messages/<locale>/<namespace>.json.
 * `common` holds shared UI strings; every page has its own namespace. Add a namespace here AND create
 * src/messages/en/<namespace>.json (zh/de files are optional — missing keys fall back to English).
 */
export const NAMESPACES = [
  'common',
  'home',
  'tours',
  'tourDetail',
  'destinations',
  'destinationDetail',
  'corporate',
  'about',
  'gallery',
  'reviews',
  'contact',
  'travelGuide',
  'blog',
  'responsible',
  'quiz',
  'legal',
  'newsletter',
  'admin',
] as const

export type Namespace = (typeof NAMESPACES)[number]

type JsonObject = { [key: string]: JsonValue }
type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject

const isObject = (v: unknown): v is JsonObject => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Deep-merges `override` over `base`; empty strings in `override` keep the base (English) value. */
export function deepMerge(base: JsonObject, override: JsonObject): JsonObject {
  const out: JsonObject = { ...base }
  for (const [key, value] of Object.entries(override)) {
    const prev = out[key]
    if (isObject(prev) && isObject(value)) out[key] = deepMerge(prev, value)
    else if (value === '' || value === null || value === undefined) continue
    else out[key] = value
  }
  return out
}

async function loadNamespace(locale: Locale, ns: Namespace): Promise<JsonObject> {
  try {
    const mod = (await import(`../messages/${locale}/${ns}.json`)) as { default: JsonObject }
    return mod.default
  } catch {
    return {}
  }
}

/**
 * Loads every namespace for `locale`, merged over English so untranslated keys fall back to English.
 *
 * `overrides` are the admin's page-copy edits (API /page-content). Order of precedence, lowest first:
 * en JSON → en texts → locale JSON → en lists → locale texts → locale lists; hidden sections (any locale)
 * are removed last. Lists are rebuilt after the locale JSON so removed / re-ordered items stay that way.
 */
export async function loadMessages(
  locale: Locale,
  overrides: readonly PageContentOverride[] = [],
): Promise<Record<Namespace, JsonObject>> {
  const forNamespace = (ns: string, loc: string) => overrides.find((o) => o.namespace === ns && o.locale === loc)
  const onSkip = (ns: string) => (path: string, reason: string) => {
    if (process.env.NODE_ENV !== 'production') console.warn(`[page-content] ignored override ${ns}.${path}: ${reason}`)
  }

  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      const options = { onSkip: onSkip(ns) }
      const enOverride = forNamespace(ns, 'en')
      let messages = applyValues(await loadNamespace('en', ns), enOverride?.values ?? {}, options)
      const localeOverride = locale === 'en' ? undefined : forNamespace(ns, locale)
      if (locale !== 'en') messages = deepMerge(messages, await loadNamespace(locale, ns))
      messages = applyLists(messages, enOverride?.lists, options)
      if (localeOverride) {
        messages = applyValues(messages, localeOverride.values, options)
        messages = applyLists(messages, localeOverride.lists, options)
      }
      const hidden = [...(enOverride?.hidden ?? []), ...(localeOverride?.hidden ?? [])]
      return [ns, applyHidden(messages, hidden)] as const
    }),
  )
  return Object.fromEntries(entries) as Record<Namespace, JsonObject>
}

/** Picks namespaces out of the full message object (used to keep client payloads small). */
export function pickMessages<T extends Record<string, unknown>>(
  messages: T,
  namespaces: readonly string[],
): Partial<T> {
  return Object.fromEntries(Object.entries(messages).filter(([ns]) => namespaces.includes(ns))) as Partial<T>
}
