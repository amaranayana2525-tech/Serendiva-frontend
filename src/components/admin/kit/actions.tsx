'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { downloadCsv } from '@/lib/admin/client'
import { firstName, phoneDigits } from '@/lib/admin/format'
import { useAdminErrorMessage } from '@/lib/admin/hooks'
import { toast } from '@/lib/admin/toast'
import { Button, IconButton, type AdminButtonProps } from './Button'

type ButtonLook = Pick<AdminButtonProps, 'variant' | 'size' | 'className' | 'fullWidth'>

export interface CsvExportButtonProps extends ButtonLook {
  /** Which export: GET /api/v1/admin/<resource>/export.csv */
  resource: 'inquiries' | 'proposals' | 'newsletter'
  /** Current filters (empty values are dropped; never include page/pageSize). */
  query?: Record<string, unknown>
  label?: string
}

/** Downloads the CSV export for the current filters (fetch → blob, with session refresh). */
export function CsvExportButton({ resource, query, label, variant = 'secondary', size = 'md', className, fullWidth }: CsvExportButtonProps) {
  const t = useTranslations('admin.kit.csv')
  const describe = useAdminErrorMessage()
  const [busy, setBusy] = useState(false)
  const run = async () => {
    setBusy(true)
    try {
      const filename = await downloadCsv(resource, query)
      toast.success(t('done'), filename)
    } catch (error) {
      toast.error(t('failed'), describe(error))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Button icon="download" variant={variant} size={size} className={className} fullWidth={fullWidth} loading={busy} onClick={() => void run()}>
      {label ?? t('export')}
    </Button>
  )
}

export interface CopyButtonProps {
  /** Text to copy. */
  value: string
  /** Accessible label / tooltip ("Copy reference"). */
  label?: string
  /** Visible text next to the icon (omit for an icon-only button). */
  children?: string
  size?: 'sm' | 'md'
  className?: string
}

/** Copies text to the clipboard with a "Copied" toast (icon-only or with text). */
export function CopyButton({ value, label, children, size = 'sm', className }: CopyButtonProps) {
  const t = useTranslations('admin.kit.copy')
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(t('copied'), value.length <= 80 ? value : undefined, { duration: 2000 })
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error(t('failed'))
    }
  }
  if (children) {
    return (
      <Button size={size} variant="ghost" icon={copied ? 'check' : 'content_copy'} onClick={() => void copy()} className={className} title={label ?? t('copy')}>
        {children}
      </Button>
    )
  }
  return (
    <IconButton
      icon={copied ? 'check' : 'content_copy'}
      label={label ?? t('copy')}
      size={size}
      onClick={() => void copy()}
      className={className}
    />
  )
}

export interface WhatsAppReplyButtonProps extends ButtonLook {
  /** Phone/WhatsApp number in any format ("+44 7700 900123"). Button is disabled without one. */
  phone: string | null | undefined
  /** Lead name ("Emma Thompson" → greets "Emma"). */
  name: string
  /** Reference code (SRD-2026-0001). */
  reference: string
  /** 'inquiry' (default) or 'proposal' changes the greeting wording. */
  kind?: 'inquiry' | 'proposal'
  label?: string
}

/** Builds the wa.me reply link: "Ayubowan <name>! Thank you for your inquiry <ref>…". */
export function useWhatsAppReplyHref() {
  const t = useTranslations('admin.kit.reply')
  return (phone: string | null | undefined, name: string, reference: string, kind: 'inquiry' | 'proposal' = 'inquiry') => {
    const digits = phoneDigits(phone)
    if (digits.length < 6) return null
    const text = t(kind === 'proposal' ? 'whatsappProposal' : 'whatsappInquiry', { name: firstName(name) || name, reference })
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
  }
}

/** Opens WhatsApp with a pre-filled, personal reply (new tab). */
export function WhatsAppReplyButton({ phone, name, reference, kind = 'inquiry', label, variant = 'whatsapp', size = 'md', className, fullWidth }: WhatsAppReplyButtonProps) {
  const t = useTranslations('admin.kit.reply')
  const href = useWhatsAppReplyHref()(phone, name, reference, kind)
  if (!href) {
    return (
      <Button variant="secondary" size={size} icon="chat" disabled className={className} fullWidth={fullWidth} title={t('noWhatsapp')}>
        {label ?? t('whatsapp')}
      </Button>
    )
  }
  return (
    <Button href={href} variant={variant} size={size} icon="chat" className={className} fullWidth={fullWidth} external>
      {label ?? t('whatsapp')}
      <span className="sr-only"> {t('newTab')}</span>
    </Button>
  )
}

export interface EmailReplyButtonProps extends ButtonLook {
  email: string
  name: string
  reference: string
  kind?: 'inquiry' | 'proposal'
  /** Override the subject (default "Your Serendiva inquiry <ref>"). */
  subject?: string
  label?: string
}

/** mailto: reply with the reference in the subject and a greeting in the body. */
export function EmailReplyButton({ email, name, reference, kind = 'inquiry', subject, label, variant = 'primary', size = 'md', className, fullWidth }: EmailReplyButtonProps) {
  const t = useTranslations('admin.kit.reply')
  const subjectText =
    subject ?? t(kind === 'proposal' ? 'emailSubjectProposal' : 'emailSubjectInquiry', { reference })
  const body = t(kind === 'proposal' ? 'emailBodyProposal' : 'emailBodyInquiry', { name: firstName(name) || name, reference })
  const href = `mailto:${encodeURIComponent(email).replace(/%40/g, '@')}?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(body)}`
  return (
    <Button href={href} variant={variant} size={size} icon="mail" className={className} fullWidth={fullWidth}>
      {label ?? t('email')}
    </Button>
  )
}
