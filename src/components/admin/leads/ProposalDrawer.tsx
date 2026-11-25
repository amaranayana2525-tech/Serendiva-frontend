'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { DetailList, DetailSection } from '@/components/admin/kit/DetailList'
import { Icon } from '@/components/ui/Icon'
import { downloadFile } from '@/lib/admin/client'
import { formatBytes } from '@/lib/admin/format'
import { useAdminErrorMessage } from '@/lib/admin/hooks'
import { proposalsApi } from '@/lib/admin/leads'
import { toast } from '@/lib/admin/toast'
import type { AdminProposal, AdminProposalAttachment } from '@/lib/api/types'
import { ChipList, ContactValue, LeadDrawer } from './LeadDrawer'

/** Corporate proposal detail drawer (`?id=`). */
export function ProposalDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  return (
    <LeadDrawer<AdminProposal>
      kind="proposals"
      id={id}
      onClose={onClose}
      api={proposalsApi}
      title={(lead) => lead.company}
      replyName={(lead) => lead.contactPerson}
      replyPhone={(lead) => lead.phone}
      renderDetails={(lead) => <ProposalDetails lead={lead} />}
    />
  )
}

/** Download button for the proposal brief (authenticated fetch → blob). */
export function AttachmentDownload({ attachment }: { attachment: AdminProposalAttachment }) {
  const t = useTranslations('admin.proposals')
  const describe = useAdminErrorMessage()
  const [busy, setBusy] = useState(false)
  const kind = attachment.mime === 'application/pdf' ? 'PDF' : 'DOCX'
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-surface-container-high bg-surface-container-low px-3 py-2.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-fixed text-secondary">
        <Icon name="description" className="text-[22px]" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-body-md text-body-md font-semibold text-on-surface">{attachment.originalName}</span>
        <span className="font-caption text-caption text-on-surface-variant">
          {kind} · {formatBytes(attachment.size)}
        </span>
      </span>
      <Button
        size="sm"
        variant="primary"
        icon="download"
        loading={busy}
        onClick={async () => {
          setBusy(true)
          try {
            await downloadFile(attachment.downloadPath, { fallbackFilename: attachment.originalName })
          } catch (error) {
            toast.error(t('downloadFailed'), describe(error))
          } finally {
            setBusy(false)
          }
        }}
      >
        {t('download')}
      </Button>
    </div>
  )
}

function ProposalDetails({ lead }: { lead: AdminProposal }) {
  const t = useTranslations('admin.leads')
  const tp = useTranslations('admin.proposals')
  return (
    <>
      <DetailSection title={tp('sections.company')} icon="apartment">
        <DetailList
          items={[
            { label: tp('fields.company'), value: lead.company },
            { label: tp('fields.contactPerson'), value: lead.contactPerson },
            {
              label: t('fields.email'),
              value: <ContactValue value={lead.email} href={`mailto:${lead.email}`} copyLabel={t('copyEmail')} />,
              wide: true,
            },
            {
              label: tp('fields.phone'),
              value: <ContactValue value={lead.phone} href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`} copyLabel={t('copyPhone')} />,
              wide: true,
            },
          ]}
        />
      </DetailSection>

      <DetailSection title={tp('sections.event')} icon="event">
        <DetailList
          items={[
            { label: tp('fields.groupSize'), value: lead.groupSize },
            { label: tp('fields.dates'), value: lead.dates },
            { label: tp('fields.eventType'), value: lead.eventType },
            { label: tp('fields.logistics'), value: lead.logistics.length ? <ChipList items={lead.logistics} /> : null, wide: true },
          ]}
        />
      </DetailSection>

      <DetailSection title={tp('sections.brief')} icon="chat_bubble">
        {lead.message ? (
          <p className="whitespace-pre-wrap break-words rounded-xl bg-surface-container-low px-4 py-3 font-body-md text-body-md leading-relaxed text-on-surface">
            {lead.message}
          </p>
        ) : (
          <p className="font-body-md text-body-md text-outline">{t('noMessage')}</p>
        )}
      </DetailSection>

      <DetailSection title={tp('sections.attachment')} icon="attach_file">
        {lead.attachment ? (
          <AttachmentDownload attachment={lead.attachment} />
        ) : (
          <p className="font-body-md text-body-md text-outline">{tp('noAttachment')}</p>
        )}
      </DetailSection>
    </>
  )
}
