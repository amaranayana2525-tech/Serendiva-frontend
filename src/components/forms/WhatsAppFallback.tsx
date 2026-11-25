'use client'

import { useMessages, useTranslations } from 'next-intl'
import { useSiteContact } from '@/components/layout/SiteSettingsProvider'
import { Icon } from '@/components/ui/Icon'
import { inquirySummaryText, waLink, type InquirySummaryInput, type InquirySummaryLabels } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'

export interface WhatsAppFallbackProps {
  /** What the visitor filled in (the inquiry body that could not be sent). */
  inquiry: InquirySummaryInput
  /** Tour / destination the inquiry is about. */
  about?: string
  /** Translated party label (else the raw party type). */
  partyLabel?: string
  className?: string
}

/**
 * Shown when an inquiry cannot be sent (network, server, rate limit): one tap opens WhatsApp with everything the
 * visitor typed, so the lead is not lost. Not for validation errors — those are fixed in the form.
 */
export function WhatsAppFallback({ inquiry, about, partyLabel, className }: WhatsAppFallbackProps) {
  const t = useTranslations('common.whatsapp.fallback')
  const contact = useSiteContact()
  const labels: InquirySummaryLabels = useMessages().common.whatsapp.fallback.fields
  const text = inquirySummaryText(inquiry, { intro: t('intro'), labels, about, partyLabel })
  return (
    <a
      href={waLink(contact.whatsapp, text)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-tertiary-container px-space-md py-3 font-label-lg text-label-lg text-on-tertiary shadow-sm transition-colors hover:bg-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className,
      )}
    >
      <Icon name="chat" className="text-[18px]" />
      <span>{t('button')}</span>
      <span className="sr-only"> {t('opensInNewTab')}</span>
    </a>
  )
}
