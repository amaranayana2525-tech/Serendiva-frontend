'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { DetailList, DetailSection } from '@/components/admin/kit/DetailList'
import { DateField } from '@/components/admin/kit/form/DateField'
import { Switch } from '@/components/admin/kit/form/Switch'
import { Icon } from '@/components/ui/Icon'
import { invalidateAdminQueries, useAdminMutation } from '@/lib/admin/hooks'
import { inquiriesApi } from '@/lib/admin/leads'
import { toast } from '@/lib/admin/toast'
import type { AdminInquiry, InquiryUpdateBody } from '@/lib/api/types'
import { ChipList, ContactValue, LeadDrawer } from './LeadDrawer'
import { useLeadFormat } from './useLeadFormat'

/** Inquiry detail drawer (`?id=`) — used by /admin/inquiries and the dashboard's latest inquiries. */
export function InquiryDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  return (
    <LeadDrawer<AdminInquiry>
      kind="inquiries"
      id={id}
      onClose={onClose}
      api={inquiriesApi}
      title={(lead) => lead.name}
      replyName={(lead) => lead.name}
      replyPhone={(lead) => lead.whatsapp}
      renderDetails={(lead, { onUpdated }) => <InquiryDetails lead={lead} onUpdated={onUpdated} />}
    />
  )
}

function InquiryDetails({ lead, onUpdated }: { lead: AdminInquiry; onUpdated: (updated: AdminInquiry) => void }) {
  const t = useTranslations('admin.leads')
  const f = useLeadFormat()
  const travel = f.travel(lead)
  return (
    <>
      <DetailSection title={t('sections.booking')} icon="calendar_month">
        <InquiryBookingEditor
          key={`${lead.id}-${lead.bookedStart ?? ''}-${lead.bookedEnd ?? ''}-${lead.calendarBlock?.id ?? ''}-${lead.status}`}
          lead={lead}
          onUpdated={onUpdated}
        />
      </DetailSection>

      <DetailSection title={t('sections.trip')} icon="luggage">
        <DetailList
          items={[
            {
              label: t('fields.tour'),
              value: lead.tour ? (
                <a
                  href={`/tours/${lead.tour.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                >
                  {lead.tour.title}
                  <Icon name="open_in_new" className="text-[14px]" />
                  <span className="sr-only">{t('newTab')}</span>
                </a>
              ) : null,
              wide: true,
            },
            ...(lead.destination ? [{ label: t('fields.destination'), value: lead.destination.name, wide: true }] : []),
            {
              label: t('fields.travelDates'),
              value: travel
                ? lead.travelStart && lead.travelWindow
                  ? `${travel} (${lead.travelWindow})`
                  : travel
                : null,
            },
            {
              // The visitor's own answer ("Flexible within ±3–5 days", "Fixed exact dates…") whenever there is one;
              // older inquiries only have the yes/no flag.
              label: t('fields.flexible'),
              value: lead.flexibility ?? (lead.flexibleDates ? t('yes') : t('no')),
            },
            { label: t('fields.duration'), value: lead.durationPreference },
            { label: t('fields.pace'), value: lead.pace },
            { label: t('fields.stayStyle'), value: lead.stayStyle },
            {
              label: t('fields.interests'),
              value: lead.interests.length ? <ChipList items={lead.interests} /> : null,
              wide: true,
            },
          ]}
        />
      </DetailSection>

      <DetailSection title={t('sections.guests')} icon="group">
        <DetailList
          items={[
            { label: t('fields.partyType'), value: lead.partyType ? t(`partyTypes.${lead.partyType}`) : null },
            { label: t('fields.guests'), value: f.guests(lead.adults, lead.children) },
          ]}
        />
      </DetailSection>

      <DetailSection title={t('sections.contact')} icon="contact_mail">
        <DetailList
          items={[
            {
              label: t('fields.email'),
              value: lead.email ? (
                <ContactValue value={lead.email} href={`mailto:${lead.email}`} copyLabel={t('copyEmail')} />
              ) : null,
              wide: true,
            },
            {
              label: t('fields.whatsapp'),
              value: lead.whatsapp ? <ContactValue value={lead.whatsapp} copyLabel={t('copyPhone')} /> : null,
            },
            { label: t('fields.country'), value: lead.country },
          ]}
        />
      </DetailSection>

      <DetailSection title={t('sections.message')} icon="chat_bubble">
        {lead.message ? (
          <p className="whitespace-pre-wrap break-words rounded-xl bg-surface-container-low px-4 py-3 font-body-md text-body-md leading-relaxed text-on-surface">
            {lead.message}
          </p>
        ) : (
          <p className="font-body-md text-body-md text-outline">{t('noMessage')}</p>
        )}
      </DetailSection>
    </>
  )
}

function InquiryBookingEditor({
  lead,
  onUpdated,
}: {
  lead: AdminInquiry
  onUpdated: (updated: AdminInquiry) => void
}) {
  const t = useTranslations('admin.leads.booking')
  const f = useLeadFormat()
  const initialStart = lead.bookedStart ?? lead.travelStart ?? ''
  const initialEnd = lead.bookedEnd ?? lead.travelEnd ?? ''
  const hasBlock = lead.calendarBlock !== null
  const [start, setStart] = useState(initialStart)
  const [end, setEnd] = useState(initialEnd)
  const [blockCalendar, setBlockCalendar] = useState(
    hasBlock || (lead.status === 'confirmed' && !lead.bookedStart && !lead.travelStart),
  )
  const [error, setError] = useState<string | null>(null)

  const save = useAdminMutation((body: InquiryUpdateBody) => inquiriesApi.update(lead.id, body), {
    onSuccess: (updated) => {
      onUpdated(updated)
      invalidateAdminQueries('availability')
    },
  })

  const dirty =
    start !== (lead.bookedStart ?? '') ||
    end !== (lead.bookedEnd ?? '') ||
    (lead.status === 'confirmed' && Boolean(start && end) && blockCalendar !== hasBlock)

  const onSave = async () => {
    setError(null)
    if ((start && !end) || (!start && end) || (start && end && end < start)) {
      setError(t('datesError'))
      return
    }
    const res = await save.mutate({
      bookedStart: start || null,
      bookedEnd: end || null,
      ...(lead.status === 'confirmed' ? { blockCalendar } : {}),
    })
    if (res.ok) toast.success(start ? t('saved') : t('cleared'))
  }

  const onClear = async () => {
    setError(null)
    const res = await save.mutate({ bookedStart: null, bookedEnd: null })
    if (res.ok) toast.success(t('cleared'))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DateField label={t('start')} value={start} onChange={setStart} />
        <DateField label={t('end')} value={end} min={start || undefined} onChange={setEnd} />
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-1 font-caption text-caption text-error">
          <Icon name="error" className="text-[15px]" />
          {error}
        </p>
      )}
      {lead.status === 'confirmed' ? (
        <Switch
          size="sm"
          checked={blockCalendar}
          onCheckedChange={setBlockCalendar}
          label={t('blockCalendar')}
          description={t('blockCalendarHint')}
        />
      ) : (
        <p className="font-caption text-caption text-on-surface-variant">{t('confirmHint')}</p>
      )}
      {lead.calendarBlock && (
        <p className="flex items-center gap-1.5 font-caption text-caption font-medium text-tertiary">
          <Icon name="event_available" className="text-[15px]" />
          {t('blockedRange', { range: f.calendarRange(lead.calendarBlock.startDate, lead.calendarBlock.endDate) })}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" icon="save" disabled={!dirty} loading={save.pending} onClick={() => void onSave()}>
          {t('save')}
        </Button>
        {(lead.bookedStart || lead.bookedEnd) && (
          <Button size="sm" variant="ghost" disabled={save.pending} onClick={() => void onClear()}>
            {t('clear')}
          </Button>
        )}
      </div>
    </div>
  )
}
