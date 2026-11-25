'use client'

import { useState, type RefObject } from 'react'
import { useTranslations } from 'next-intl'
import { waLink } from '@/lib/whatsapp'
import { Icon } from '@/components/ui/Icon'
import { useSiteContact } from '@/components/layout/SiteSettingsProvider'

export interface WizardSuccessProps {
  reference: string
  email?: string
  hasWhatsApp?: boolean
  guideName: string
  headingRef: RefObject<HTMLHeadingElement | null>
  onRestart: () => void
}

/** Step 5 of the Stitch wizard: confirmation with the inquiry reference and a WhatsApp shortcut quoting it. */
export function WizardSuccess({ reference, email, hasWhatsApp, guideName, headingRef, onRestart }: WizardSuccessProps) {
  const t = useTranslations('contact.wizard.success')
  const ta = useTranslations('common.a11y')
  const contact = useSiteContact()
  const [copied, setCopied] = useState(false)
  const firstName = guideName.trim().split(' ')[0] ?? ''
  const waText = firstName
    ? t('whatsappMessage', { name: firstName, reference })
    : t('whatsappMessageNoName', { reference })
  const href = waLink(contact.whatsapp, waText)
  const display = contact.whatsappDisplay || `+${contact.whatsapp}`

  const onCopy = () => {
    void navigator.clipboard?.writeText(reference).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <section
      aria-labelledby="wizard-success-title"
      className="flex flex-col items-center justify-center gap-space-md py-space-2xl text-center"
    >
      <div className="mb-space-sm flex h-16 w-16 items-center justify-center rounded-full bg-tertiary-container text-on-tertiary shadow-lg motion-safe:animate-bounce">
        <Icon name="check_circle" className="text-3xl" />
      </div>
      <h2
        id="wizard-success-title"
        ref={headingRef}
        tabIndex={-1}
        className="scroll-mt-28 font-headline-lg text-headline-lg text-primary focus:outline-none"
      >
        {t('title')}
      </h2>
      <p className="max-w-lg font-body-lg text-body-lg text-on-surface-variant">
        {hasWhatsApp === false ? t('bodyEmailOnly') : t('body')}
      </p>
      {email && <p className="font-caption text-caption text-on-surface-variant">{t('sentTo', { email })}</p>}

      <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-outline-variant px-space-lg py-space-md">
        <span className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
          {t('referenceLabel')}
        </span>
        <div className="flex items-center gap-space-xs">
          <span className="font-headline-md text-headline-md tracking-wider text-primary" data-testid="inquiry-reference">
            {reference}
          </span>
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1 rounded-lg bg-surface-container-low px-2 py-1 font-caption text-caption text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Icon name={copied ? 'check' : 'content_copy'} className="text-sm" />
            <span>{copied ? t('copiedReference') : t('copyReference')}</span>
          </button>
        </div>
        <span className="max-w-xs font-caption text-caption text-on-surface-variant">{t('referenceHint')}</span>
      </div>

      {contact.whatsapp && (
        <div className="mt-space-md inline-flex items-center gap-space-sm rounded-xl bg-surface-container p-space-md text-left">
          <Icon name="chat" className="shrink-0 text-tertiary" />
          <span className="font-body-md text-body-md text-primary">
            {t('whatsappLead')}{' '}
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded font-bold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {display}
              <span className="sr-only"> {ta('opensInNewTab')}</span>
            </a>
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={onRestart}
        className="tap-target relative mt-space-sm inline-flex items-center gap-space-xs rounded-lg font-label-lg text-label-lg text-on-surface-variant transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <Icon name="refresh" className="text-sm" />
        {t('again')}
      </button>
    </section>
  )
}
