'use client'

import { useTranslations } from 'next-intl'
import { usePathname } from '@/i18n/navigation'
import { navKeyForPath } from './nav'

/** Human name of the current section (for "I'm on your … page" WhatsApp messages). */
export function usePageName(): string | undefined {
  const t = useTranslations('common.nav')
  const key = navKeyForPath(usePathname())
  return key ? t(key) : undefined
}
