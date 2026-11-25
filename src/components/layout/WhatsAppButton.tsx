'use client'

import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { useWhatsAppHref } from './SiteSettingsProvider'
import { usePageName } from './usePageName'

/** Floating WhatsApp button (md+; on phones the MobileActionBar takes over). Message mentions the page/tour. */
export function WhatsAppButton() {
  const t = useTranslations('common')
  const href = useWhatsAppHref({ page: usePageName() })
  return (
    <div className="fixed bottom-space-lg right-space-lg z-40 hidden items-center md:flex">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${t('floating.whatsapp')} ${t('a11y.opensInNewTab')}`}
        className="flex h-14 w-14 transform items-center justify-center rounded-full bg-tertiary-container text-on-tertiary shadow-[0_8px_24px_rgba(44,78,35,0.35)] transition-all hover:scale-105 hover:bg-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <Icon name="chat" className="text-2xl" />
      </a>
    </div>
  )
}
