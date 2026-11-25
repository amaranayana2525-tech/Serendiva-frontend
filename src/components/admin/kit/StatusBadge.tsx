'use client'

import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

/** Status vocabularies used by the API. */
export const STATUS_VALUES = {
  lead: ['new', 'replied', 'proposal_sent', 'confirmed', 'lost', 'cancelled'],
  content: ['draft', 'published'],
  review: ['pending', 'approved', 'rejected'],
  email: ['pending', 'sent', 'partial', 'failed'],
  subscriber: ['confirmed', 'pending', 'unsubscribed'],
} as const

export type StatusKind = keyof typeof STATUS_VALUES
export type StatusValue<K extends StatusKind> = (typeof STATUS_VALUES)[K][number]

type Tone = 'teal' | 'cinnamon' | 'green' | 'sand' | 'gold' | 'red'

const toneClasses: Record<Tone, string> = {
  teal: 'bg-primary-fixed/60 text-on-primary-fixed-variant',
  cinnamon: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  green: 'bg-tertiary-fixed/70 text-on-tertiary-fixed-variant',
  sand: 'bg-surface-container-high text-on-surface-variant',
  // Soft gold from DESIGN.md (rgba(201,162,75)) — same accent as the licence seal / blockquote rule.
  gold: 'bg-[rgba(201,162,75,0.22)] text-on-surface',
  red: 'bg-error-container text-on-error-container',
}

const TONES: { [K in StatusKind]: Record<StatusValue<K>, { tone: Tone; icon: string; filled?: boolean }> } = {
  lead: {
    new: { tone: 'cinnamon', icon: 'fiber_manual_record', filled: true },
    replied: { tone: 'teal', icon: 'reply' },
    proposal_sent: { tone: 'gold', icon: 'description' },
    confirmed: { tone: 'green', icon: 'verified' },
    lost: { tone: 'sand', icon: 'block' },
    cancelled: { tone: 'red', icon: 'cancel' },
  },
  content: {
    draft: { tone: 'sand', icon: 'edit_note' },
    published: { tone: 'green', icon: 'public' },
  },
  review: {
    pending: { tone: 'gold', icon: 'hourglass_top' },
    approved: { tone: 'green', icon: 'check_circle' },
    rejected: { tone: 'red', icon: 'block' },
  },
  email: {
    pending: { tone: 'gold', icon: 'schedule_send' },
    sent: { tone: 'green', icon: 'mark_email_read' },
    partial: { tone: 'gold', icon: 'outgoing_mail' },
    failed: { tone: 'red', icon: 'error' },
  },
  subscriber: {
    confirmed: { tone: 'green', icon: 'verified' },
    pending: { tone: 'gold', icon: 'hourglass_top' },
    unsubscribed: { tone: 'sand', icon: 'unsubscribe' },
  },
}

export interface StatusBadgeProps<K extends StatusKind> {
  kind: K
  status: StatusValue<K>
  /** Hide the icon (dense tables). */
  noIcon?: boolean
  size?: 'sm' | 'md'
  className?: string
}

/** Coloured pill for lead / content / review / email / subscriber statuses (label from admin.status.<kind>). */
export function StatusBadge<K extends StatusKind>({ kind, status, noIcon, size = 'sm', className }: StatusBadgeProps<K>) {
  const t = useTranslations('admin.status')
  const conf = (TONES[kind] as Record<string, { tone: Tone; icon: string; filled?: boolean }>)[status] ?? {
    tone: 'sand',
    icon: 'help',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full font-body-md font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[12px] leading-5' : 'px-2.5 py-1 text-[13px]',
        toneClasses[conf.tone],
        className,
      )}
    >
      {!noIcon && <Icon name={conf.icon} filled={conf.filled} className="text-[14px]" />}
      {t(`${kind}.${status}` as Parameters<typeof t>[0])}
    </span>
  )
}

/** Translated label for a status value (for selects and filters). */
export function useStatusLabel() {
  const t = useTranslations('admin.status')
  return <K extends StatusKind>(kind: K, status: StatusValue<K>) => t(`${kind}.${status}` as Parameters<typeof t>[0])
}
