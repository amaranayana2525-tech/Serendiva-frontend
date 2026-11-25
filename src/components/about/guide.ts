import type { ApiImage, PublicSettings } from '@/lib/api/types'

/** The guide's display name from the CMS settings (empty when settings are unavailable). */
export function guideName(settings: PublicSettings | null | undefined): string {
  return settings?.guide.name?.trim() ?? ''
}

/** A static page image slot (settings.pageImages) with optional fallbacks; null when none exists. */
export function pageImage(
  settings: PublicSettings | null | undefined,
  slot: string,
  ...fallbacks: (ApiImage | null | undefined)[]
): ApiImage | null {
  return settings?.pageImages?.[slot] ?? fallbacks.find((f): f is ApiImage => Boolean(f)) ?? null
}

/** "SLTDA/SQA/NTGL/01482" → "NTGL/01482" (the registration part shown in the compact metrics bar). */
export function shortLicence(licence: string): string {
  const parts = licence.split('/').filter(Boolean)
  return parts.length > 2 ? parts.slice(-2).join('/') : licence
}

export type LanguageProfileKey = 'english' | 'german' | 'mandarin'

/** Maps a CMS language label ("German", "Deutsch", "中文" …) to a known fluency profile in the about messages. */
export function languageProfile(label: string): LanguageProfileKey | 'sinhala' | null {
  const value = label.trim().toLowerCase()
  if (/^(en|english|englisch)\b/.test(value)) return 'english'
  if (/^(de|german|deutsch)\b/.test(value)) return 'german'
  if (/^(zh|mandarin|chinese)\b/.test(value) || value.includes('中文') || value.includes('普通话')) return 'mandarin'
  if (/^(si|sinhala|sinhalese)\b/.test(value) || value.includes('සිංහල')) return 'sinhala'
  return null
}
