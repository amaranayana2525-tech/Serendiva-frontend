import { getRequestConfig } from 'next-intl/server'
import { getPageContent } from '@/lib/api/public'
import { loadMessages } from './messages'
import { defaultLocale, isLocale } from './routing'
import type { AbstractIntlMessages } from 'next-intl'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = isLocale(requested) ? requested : defaultLocale
  // Admin edits of the page copy (API) are merged over the JSON defaults; API down → defaults only.
  const messages = (await loadMessages(locale, await getPageContent(locale))) as unknown as AbstractIntlMessages

  return {
    locale,
    messages,
    // Fixed time zone so server and client format dates identically (the guide works in Sri Lanka time).
    timeZone: 'Asia/Colombo',
    onError(error) {
      // Missing translations must never crash a page; log them in development.
      if (process.env.NODE_ENV !== 'production') console.warn(`[i18n] ${error.message}`)
    },
    getMessageFallback({ namespace, key }) {
      return [namespace, key].filter(Boolean).join('.')
    },
  }
})
