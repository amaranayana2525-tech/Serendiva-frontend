import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { getSettings } from '@/lib/api/public'
import type { Locale, PublicSettings } from '@/lib/api/types'
import { Footer } from './Footer'
import { Header } from './Header'
import { MobileActionBar } from './MobileActionBar'
import { SiteSettingsProvider, type SiteContact } from './SiteSettingsProvider'
import { SkipLink } from './SkipLink'
import { StickyInquiryTab } from './StickyInquiryTab'
import { WhatsAppButton } from './WhatsAppButton'

async function loadSettings(locale: Locale): Promise<PublicSettings | null> {
  try {
    return await getSettings(locale)
  } catch (error) {
    // The chrome must render even when the API is down (contact details fall back to env / are hidden).
    console.error('[layout] settings unavailable:', error instanceof Error ? error.message : error)
    return null
  }
}

/**
 * Header + <main> + Footer + floating actions around every public page (used by the (site) layout and the
 * locale-level not-found page). Settings are fetched once per request with the "settings" cache tag.
 */
export async function SiteChrome({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [settings, t] = await Promise.all([loadSettings(locale), getTranslations({ locale, namespace: 'common' })])
  const contact: SiteContact | null = settings
    ? {
        whatsapp: settings.contact.whatsapp,
        whatsappDisplay: settings.contact.whatsappDisplay,
        phone: settings.contact.phone,
        email: settings.contact.email,
        responseTime: settings.contact.responseTime,
      }
    : null

  return (
    <SiteSettingsProvider contact={contact}>
      <SkipLink />
      <Header />
      {/* md+: floating "Inquire" tab + WhatsApp button, in a labelled landmark (phones get the MobileActionBar). */}
      <aside aria-label={t('floating.mobileBarLabel')} className="hidden md:block">
        <StickyInquiryTab />
        <WhatsAppButton />
      </aside>
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-[calc(100vh-80px)] w-full bg-surface pt-20 focus:outline-none"
      >
        <div className="flex w-full flex-col">{children}</div>
      </main>
      <Footer settings={settings} />
      {/* Room for the fixed mobile action bar so it never covers the footer. */}
      <div aria-hidden="true" className="h-[76px] md:hidden" />
      <MobileActionBar />
    </SiteSettingsProvider>
  )
}
