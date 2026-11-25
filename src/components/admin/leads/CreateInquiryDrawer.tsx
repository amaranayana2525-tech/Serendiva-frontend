'use client'

import { useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { DetailSection } from '@/components/admin/kit/DetailList'
import { Drawer } from '@/components/admin/kit/Drawer'
import { DateField } from '@/components/admin/kit/form/DateField'
import { NumberField } from '@/components/admin/kit/form/NumberField'
import { SelectField } from '@/components/admin/kit/form/SelectField'
import { Switch } from '@/components/admin/kit/form/Switch'
import { TextArea } from '@/components/admin/kit/form/TextArea'
import { TextField } from '@/components/admin/kit/form/TextField'
import { useAdminMutation } from '@/lib/admin/hooks'
import type { AdminInquiryCreateBody, LeadStatus, PartyType } from '@/lib/api/types'
import { inquiriesApi } from '@/lib/admin/leads'

export interface CreateInquiryDrawerProps {
  open: boolean
  onClose: () => void
  onCreated: (id: string) => void
  tourOptions: readonly { value: string; label: string }[]
  destinationOptions: readonly { value: string; label: string }[]
}

type Channel = NonNullable<AdminInquiryCreateBody['channel']>
type InitialStatus = Extract<LeadStatus, 'new' | 'replied' | 'proposal_sent' | 'confirmed'>

const CHANNELS: readonly Channel[] = ['whatsapp', 'phone', 'email', 'referral', 'other']
const INITIAL_STATUSES: readonly InitialStatus[] = ['new', 'replied', 'proposal_sent', 'confirmed']
const PARTY_TYPES: readonly PartyType[] = ['couple', 'family', 'group', 'solo', 'corporate']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Right-side drawer for logging direct WhatsApp, phone, or referral leads + manual bookings. */
export function CreateInquiryDrawer({
  open,
  onClose,
  onCreated,
  tourOptions,
  destinationOptions,
}: CreateInquiryDrawerProps) {
  const t = useTranslations('admin.inquiries.create')

  return (
    <Drawer open={open} onClose={onClose} title={t('title')} subtitle={t('subtitle')} size="lg">
      {open && (
        <CreateInquiryForm
          onClose={onClose}
          onCreated={onCreated}
          tourOptions={tourOptions}
          destinationOptions={destinationOptions}
        />
      )}
    </Drawer>
  )
}

function CreateInquiryForm({
  onClose,
  onCreated,
  tourOptions,
  destinationOptions,
}: Omit<CreateInquiryDrawerProps, 'open'>) {
  const t = useTranslations('admin.inquiries.create')
  const tl = useTranslations('admin.leads')

  const [name, setName] = useState('')
  const [channel, setChannel] = useState<Channel>('whatsapp')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('')

  const [partyType, setPartyType] = useState<PartyType | ''>('')
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [tourId, setTourId] = useState('')
  const [destinationId, setDestinationId] = useState('')
  const [travelStart, setTravelStart] = useState('')
  const [travelEnd, setTravelEnd] = useState('')
  const [travelWindow, setTravelWindow] = useState('')

  const [status, setStatus] = useState<InitialStatus>('replied')
  const [followUpAt, setFollowUpAt] = useState('')
  const [bookedStart, setBookedStart] = useState('')
  const [bookedEnd, setBookedEnd] = useState('')
  const [blockCalendar, setBlockCalendar] = useState(true)

  const [message, setMessage] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const create = useAdminMutation((body: AdminInquiryCreateBody) => inquiriesApi.create(body), {
    invalidate: ['inquiries', 'stats', 'availability'],
    successToast: (created) => t('created', { reference: created.reference }),
    onSuccess: (created) => onCreated(created.id),
  })

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (name.trim().length < 2) next.name = t('errors.nameTooShort')
    const hasEmail = email.trim() !== ''
    const hasWhatsapp = whatsapp.trim() !== ''
    if (!hasEmail && !hasWhatsapp) next.whatsapp = t('errors.contactRequired')
    if (hasEmail && !EMAIL_RE.test(email.trim())) next.email = t('errors.emailInvalid')
    if (travelStart && travelEnd && travelEnd < travelStart) next.travelEnd = t('errors.datesOrder')
    if (status === 'confirmed') {
      const hasAnyBooked = bookedStart !== '' || bookedEnd !== ''
      if (hasAnyBooked && (!bookedStart || !bookedEnd || bookedEnd < bookedStart)) {
        next.bookedEnd = t('errors.bookedDates')
      }
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (create.pending || !validate()) return
    const effBookedStart = status === 'confirmed' ? bookedStart || (travelStart && travelEnd ? travelStart : '') : ''
    const effBookedEnd = status === 'confirmed' ? bookedEnd || (travelStart && travelEnd ? travelEnd : '') : ''

    const body: AdminInquiryCreateBody = {
      name: name.trim(),
      channel,
      ...(email.trim() ? { email: email.trim() } : {}),
      whatsapp: whatsapp.trim() || null,
      country: country.trim() || null,
      partyType: partyType || null,
      adults,
      children,
      tourId: tourId || null,
      destinationId: destinationId || null,
      travelStart: travelStart || null,
      travelEnd: travelEnd || null,
      travelWindow: travelWindow.trim() || null,
      flexibleDates: !(travelStart && travelEnd),
      status,
      followUpAt: followUpAt || null,
      ...(effBookedStart && effBookedEnd
        ? { bookedStart: effBookedStart, bookedEnd: effBookedEnd, blockCalendar }
        : status === 'confirmed'
          ? { blockCalendar }
          : {}),
      message: message.trim() || null,
      internalNotes: internalNotes.trim() || null,
    }
    await create.mutate(body)
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} noValidate className="flex flex-col gap-5 pb-4">
      <DetailSection title={t('sections.guest')} icon="person">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            label={t('fields.name')}
            placeholder={t('fields.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            required
          />
          <SelectField
            label={t('fields.channel')}
            value={channel}
            onValueChange={(v) => setChannel((v || 'whatsapp') as Channel)}
            options={CHANNELS.map((c) => ({ value: c, label: t(`channels.${c}`) }))}
          />
          <TextField
            label={t('fields.whatsapp')}
            placeholder={t('fields.whatsappPlaceholder')}
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            error={errors.whatsapp}
          />
          <TextField
            label={t('fields.email')}
            type="email"
            placeholder={t('fields.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <TextField
            label={t('fields.country')}
            placeholder={t('fields.countryPlaceholder')}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            fieldClassName="sm:col-span-2"
          />
        </div>
      </DetailSection>

      <DetailSection title={t('sections.trip')} icon="luggage">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField
            label={t('fields.partyType')}
            placeholder={t('fields.partyPlaceholder')}
            value={partyType}
            onValueChange={(v) => setPartyType(v as PartyType | '')}
            options={PARTY_TYPES.map((p) => ({ value: p, label: tl(`partyTypes.${p}`) }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <NumberField label={t('fields.adults')} value={adults} min={1} max={50} onChange={(v) => setAdults(v ?? 2)} />
            <NumberField label={t('fields.children')} value={children} min={0} max={50} onChange={(v) => setChildren(v ?? 0)} />
          </div>
          <SelectField
            label={t('fields.tour')}
            placeholder={tl('noTour')}
            value={tourId}
            onValueChange={setTourId}
            options={tourOptions}
          />
          <SelectField
            label={t('fields.destination')}
            placeholder={t('fields.anyDestination')}
            value={destinationId}
            onValueChange={setDestinationId}
            options={destinationOptions}
          />
          <DateField label={t('fields.travelStart')} value={travelStart} onChange={setTravelStart} />
          <DateField
            label={t('fields.travelEnd')}
            value={travelEnd}
            min={travelStart || undefined}
            onChange={setTravelEnd}
            error={errors.travelEnd}
          />
          <TextField
            label={t('fields.travelWindow')}
            placeholder={t('fields.travelWindowPlaceholder')}
            value={travelWindow}
            onChange={(e) => setTravelWindow(e.target.value)}
            fieldClassName="sm:col-span-2"
          />
        </div>
      </DetailSection>

      <DetailSection title={t('sections.status')} icon="flag">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField
            label={t('fields.status')}
            value={status}
            onValueChange={(v) => setStatus((v || 'replied') as InitialStatus)}
            options={INITIAL_STATUSES.map((s) => ({ value: s, label: tl(`statusLabel.${s}`) }))}
          />
          <DateField label={t('fields.followUpAt')} value={followUpAt} onChange={setFollowUpAt} />
        </div>
        {status === 'confirmed' && (
          <div className="mt-3 flex flex-col gap-3 rounded-xl bg-surface-container-low p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DateField label={t('fields.bookedStart')} value={bookedStart} onChange={setBookedStart} />
              <DateField
                label={t('fields.bookedEnd')}
                value={bookedEnd}
                min={bookedStart || undefined}
                onChange={setBookedEnd}
                error={errors.bookedEnd}
              />
            </div>
            <p className="font-caption text-caption text-on-surface-variant">{t('fields.bookedHint')}</p>
            <Switch
              size="sm"
              checked={blockCalendar}
              onCheckedChange={setBlockCalendar}
              label={t('fields.blockCalendar')}
              description={t('fields.blockCalendarHint')}
            />
          </div>
        )}
      </DetailSection>

      <DetailSection title={t('sections.notes')} icon="sticky_note_2">
        <div className="flex flex-col gap-3">
          <TextArea
            label={t('fields.message')}
            placeholder={t('fields.messagePlaceholder')}
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <TextArea
            label={t('fields.internalNotes')}
            placeholder={t('fields.internalNotesPlaceholder')}
            rows={3}
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
          />
        </div>
      </DetailSection>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-surface-container-high pt-4">
        <Button type="button" variant="ghost" onClick={onClose} disabled={create.pending}>
          {t('cancel')}
        </Button>
        <Button type="submit" variant="primary" icon="save" loading={create.pending}>
          {t('submit')}
        </Button>
      </div>
    </form>
  )
}
