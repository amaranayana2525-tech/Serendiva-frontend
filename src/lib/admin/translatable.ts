/**
 * Helpers for the API's translatable fields `{ en, zh?, de? }`.
 *
 * Rules (backend): required translatable fields reject "" for zh/de — omit untranslated locales; optional
 * translatable fields may be `null`. Forms keep all three locales as strings while editing and call `compact*()`
 * right before sending.
 */

export const ADMIN_LOCALES = ['en', 'zh', 'de'] as const
export type AdminLocale = (typeof ADMIN_LOCALES)[number]

/** Editing shape: every locale optional (English is validated as required by the API where needed). */
export type Translatable<T = string> = Partial<Record<AdminLocale, T>>

export const isAdminLocale = (value: unknown): value is AdminLocale =>
  typeof value === 'string' && (ADMIN_LOCALES as readonly string[]).includes(value)

/** True when a value counts as "has content": non-blank string, non-empty array, object with any content. */
export function hasContent(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number' || typeof value === 'boolean') return true
  if (Array.isArray(value)) return value.some(hasContent)
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).some(hasContent)
  return false
}

/** Drops locales without content: `{ en: 'Hi', zh: '', de: '  ' }` → `{ en: 'Hi' }`. */
export function compact<T>(value: Translatable<T> | null | undefined): Translatable<T> {
  const out: Translatable<T> = {}
  if (!value) return out
  for (const locale of ADMIN_LOCALES) {
    const v = value[locale]
    if (hasContent(v)) out[locale] = v
  }
  return out
}

/**
 * For REQUIRED translatable fields: keeps `en` even when blank (so the API reports `title.en` as missing) and
 * drops untranslated zh/de.
 */
export function compactRequired<T>(value: Translatable<T> | null | undefined, emptyEn: T): Translatable<T> & { en: T } {
  const out = compact(value)
  return { ...out, en: out.en ?? value?.en ?? emptyEn }
}

/** For OPTIONAL translatable fields: `null` when no locale has content, otherwise the compacted object. */
export function compactOptional<T>(value: Translatable<T> | null | undefined): Translatable<T> | null {
  const out = compact(value)
  return Object.keys(out).length ? out : null
}

/** `{ en: true, zh: false, de: true }` — which locales have content in ANY of the given values (LocaleTabs dots). */
export function localesWithContent(...values: (Translatable<unknown> | null | undefined)[]): Record<AdminLocale, boolean> {
  const out: Record<AdminLocale, boolean> = { en: false, zh: false, de: false }
  for (const value of values) {
    if (!value) continue
    for (const locale of ADMIN_LOCALES) if (hasContent(value[locale])) out[locale] = true
  }
  return out
}

/** Returns a copy with one locale replaced. */
export function setLocale<T>(value: Translatable<T> | null | undefined, locale: AdminLocale, next: T): Translatable<T> {
  return { ...(value ?? {}), [locale]: next }
}

/** The value for `locale`, falling back to English (for previews/placeholders). */
export function pickLocale<T>(value: Translatable<T> | null | undefined, locale: AdminLocale, fallback = true): T | undefined {
  if (!value) return undefined
  const v = value[locale]
  if (hasContent(v)) return v
  return fallback ? value.en : undefined
}

/** Normalises an API translatable (`Record<string, T>`) into the editing shape with all three string locales. */
export function toEditable(value: Record<string, string> | null | undefined): Record<AdminLocale, string> {
  return { en: value?.en ?? '', zh: value?.zh ?? '', de: value?.de ?? '' }
}

/** Locale contained in a validation path ('title.zh' → 'zh', 'days.2.title.de' → 'de'); undefined when none. */
export function localeFromPath(path: string): AdminLocale | undefined {
  const parts = path.split('.')
  return parts.find(isAdminLocale)
}

/** Field errors for one translatable field: `{ 'title.en': 'Required' }` + 'title' → `{ en: 'Required' }`. */
export function localeErrors(fieldErrors: Record<string, string>, field: string): Partial<Record<AdminLocale, string>> {
  const out: Partial<Record<AdminLocale, string>> = {}
  for (const [path, message] of Object.entries(fieldErrors)) {
    if (path === field) out.en = out.en ?? message
    for (const locale of ADMIN_LOCALES) {
      if (path === `${field}.${locale}` || path.startsWith(`${field}.${locale}.`)) out[locale] = out[locale] ?? message
    }
  }
  return out
}
