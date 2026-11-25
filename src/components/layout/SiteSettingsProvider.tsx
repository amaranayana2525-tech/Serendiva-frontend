'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useMessages } from 'next-intl'
import { buildWhatsAppMessage, resolveWhatsAppNumber, waLink, type WhatsAppTemplates } from '@/lib/whatsapp'

/** The slice of PublicSettings that client components need (passed down from the (site) layout). */
export interface SiteContact {
  /** WhatsApp digits (falls back to NEXT_PUBLIC_WHATSAPP_NUMBER). */
  whatsapp: string
  whatsappDisplay: string
  phone: string
  email: string
  responseTime: string
}

/** Page-level context for pre-filled WhatsApp messages (set with <WhatsAppContext tourTitle=… />). */
export interface WhatsAppPageContext {
  tourTitle?: string
  destinationName?: string
  corporate?: boolean
}

interface SiteSettingsValue {
  contact: SiteContact
  pageContext: WhatsAppPageContext
  setPageContext: (ctx: WhatsAppPageContext) => void
}

const EMPTY_CONTACT: SiteContact = { whatsapp: '', whatsappDisplay: '', phone: '', email: '', responseTime: '' }

const SiteSettingsContext = createContext<SiteSettingsValue>({
  contact: EMPTY_CONTACT,
  pageContext: {},
  setPageContext: () => undefined,
})

/** Provides contact settings + WhatsApp page context to client components (Header, floating buttons, forms). */
export function SiteSettingsProvider({ contact, children }: { contact: SiteContact | null; children: ReactNode }) {
  const [pageContext, setPageContext] = useState<WhatsAppPageContext>({})
  const value = useMemo(
    () => ({
      contact: { ...EMPTY_CONTACT, ...contact, whatsapp: resolveWhatsAppNumber(contact?.whatsapp) },
      pageContext,
      setPageContext,
    }),
    [contact, pageContext],
  )
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
}

/** Contact details from the CMS settings. */
export function useSiteContact(): SiteContact {
  return useContext(SiteSettingsContext).contact
}

export interface UseWhatsAppHrefOptions extends WhatsAppPageContext {
  /** Page name for the generic "I'm on your … page" message. */
  page?: string
  /** Ignore the page-level context (tour/destination) set by <WhatsAppContext>. */
  ignorePageContext?: boolean
}

/** wa.me link with a localised, context-aware pre-filled message. */
export function useWhatsAppHref(options: UseWhatsAppHrefOptions = {}): string {
  const { contact, pageContext } = useContext(SiteSettingsContext)
  const templates: WhatsAppTemplates = useMessages().common.whatsapp
  const ctx = options.ignorePageContext ? {} : pageContext
  const message = buildWhatsAppMessage({
    templates,
    page: options.page,
    tourTitle: options.tourTitle ?? ctx.tourTitle,
    destinationName: options.destinationName ?? ctx.destinationName,
    corporate: options.corporate ?? ctx.corporate,
  })
  return waLink(contact.whatsapp, message)
}

/**
 * Drop into a page to make the floating WhatsApp button / mobile bar mention the tour or destination:
 *   <WhatsAppContext tourTitle={tour.title} />
 */
export function WhatsAppContext(props: WhatsAppPageContext) {
  const { setPageContext } = useContext(SiteSettingsContext)
  const { tourTitle, destinationName, corporate } = props
  useEffect(() => {
    setPageContext({ tourTitle, destinationName, corporate })
    return () => setPageContext({})
  }, [setPageContext, tourTitle, destinationName, corporate])
  return null
}
