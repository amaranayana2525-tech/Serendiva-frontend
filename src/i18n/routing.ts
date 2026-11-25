import { defineRouting } from 'next-intl/routing'

/** Every locale the router serves. Which ones the language switcher offers is controlled by NEXT_PUBLIC_ENABLED_LOCALES. */
export const locales = ['en', 'zh', 'de'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

/** Locales that are translated and offered in the switcher / sitemap / hreflang (always includes the default). */
export const enabledLocales: readonly Locale[] = (() => {
  const raw = (process.env.NEXT_PUBLIC_ENABLED_LOCALES || 'en').split(',').map((l) => l.trim())
  const list = locales.filter((l) => raw.includes(l))
  return list.includes(defaultLocale) ? list : [defaultLocale, ...list]
})()

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (locales as readonly string[]).includes(value)

export const routing = defineRouting({
  locales,
  defaultLocale,
  // English URLs have no prefix (/tours); others do (/zh/tours, /de/tours).
  localePrefix: 'as-needed',
  // No Accept-Language/cookie redirects: untranslated locales would otherwise capture visitors. Visitors switch explicitly.
  localeDetection: false,
  // hreflang alternates are emitted by buildMetadata() for *enabled* locales only (the middleware would list all locales).
  alternateLinks: false,
})
