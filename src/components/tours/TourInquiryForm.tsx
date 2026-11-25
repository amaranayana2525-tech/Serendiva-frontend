'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { applyFieldErrors, submitInquiry } from '@/lib/api/forms'
import { useSubmissionId } from '@/components/forms/useSubmissionId'
import type { InquiryBody, Locale } from '@/lib/api/types'
import { FormStatus, useFormFailureMessage, type FormStatusState } from '@/components/forms/FormStatus'
import { WhatsAppFallback } from '@/components/forms/WhatsAppFallback'
import { Honeypot } from '@/components/forms/Honeypot'
import { Turnstile } from '@/components/forms/Turnstile'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import {
  FLEXIBLE_MONTH,
  ADULT_COUNTS,
  CHILD_COUNTS,
  mapInquiryFieldErrors,
  TOUR_INQUIRY_FIELDS,
  tourInquiryDefaults,
  tourInquirySchema,
  toTourInquiryBody,
  type MonthOption,
  type TourInquiryFormValues,
  type TourInquiryValues,
} from './tour-inquiry'
import { useHydrated } from './useHydrated'

export interface TourInquiryFormProps {
  tourSlug: string
  tourTitle: string
  /** Upcoming months for the "Estimated Month" select (computed on the server so SSR and hydration agree). */
  months: MonthOption[]
}

/**
 * Sidebar inquiry form of a tour page (Stitch "Bespoke Inquiry for This Tour"). Inquiry only — nothing is booked or
 * paid. Client Zod validation, server field errors, reference code on success, friendly 429/network messages.
 */
export function TourInquiryForm({ tourSlug, tourTitle, months }: TourInquiryFormProps) {
  const t = useTranslations('tourDetail.inquiry')
  const tc = useTranslations('common')
  const locale = useLocale() as Locale
  const failureMessage = useFormFailureMessage()
  const hydrated = useHydrated()
  const [status, setStatus] = useState<FormStatusState>(null)
  /** Body that could not be sent (network / server / rate limit) → offered as a WhatsApp message. */
  const [unsent, setUnsent] = useState<InquiryBody | null>(null)
  const [attempts, setAttempts] = useState(0)
  const successRef = useRef<HTMLDivElement>(null)
  const succeeded = status?.kind === 'success'
  useEffect(() => {
    // Move focus to the confirmation so keyboard and screen-reader users land on the reference code.
    if (succeeded) successRef.current?.focus()
  }, [succeeded])
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TourInquiryFormValues, unknown, TourInquiryValues>({
    resolver: zodResolver(tourInquirySchema),
    defaultValues: tourInquiryDefaults(),
  })

  const submission = useSubmissionId()
  const sending = useRef(false)

  const onSubmit = async (values: TourInquiryValues) => {
    setStatus(null)
    setUnsent(null)
    const body = toTourInquiryBody(values, {
      tourSlug,
      locale,
      sourcePage: window.location.pathname,
      monthLabel: months.find((m) => m.value === values.month)?.label,
      flexibleLabel: t('flexibleWindow'),
    })
    const result = await submitInquiry({ ...body, clientRequestId: submission.current() })
    setAttempts((n) => n + 1)
    if (result.ok) {
      submission.renew()
      setStatus({
        kind: 'success',
        title: t('successTitle', { tour: tourTitle }),
        reference: result.data.reference,
      })
      reset(tourInquiryDefaults())
      return
    }
    if (result.kind === 'validation' && Object.keys(result.fieldErrors).length > 0) {
      applyFieldErrors(setError, mapInquiryFieldErrors(result.fieldErrors), TOUR_INQUIRY_FIELDS)
      setStatus({ kind: 'error', message: failureMessage(result) })
      return
    }
    setStatus({ kind: 'error', message: failureMessage(result) })
    if (result.kind !== 'validation') setUnsent(body)
  }

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (sending.current) {
      event.preventDefault()
      return
    }
    sending.current = true
    void handleSubmit(onSubmit)(event).finally(() => {
      sending.current = false
    })
  }

  const whatsapp = (
    <WhatsAppLink
      tourTitle={tourTitle}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-tertiary-container py-space-sm font-label-lg text-label-lg uppercase tracking-wider text-on-tertiary shadow-sm transition-all hover:bg-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container coarse:min-h-11"
    >
      <Icon name="chat" className="text-lg" />
      <span>{tc('buttons.chatWhatsAppDinesh')}</span>
    </WhatsAppLink>
  )

  if (status?.kind === 'success') {
    return (
      <div ref={successRef} tabIndex={-1} className="flex flex-col gap-space-md rounded-2xl focus:outline-none">
        <FormStatus state={status} variant="card" className="bg-surface px-space-md py-space-lg">
          <Button variant="soft" size="sm" uppercase leadingIcon="edit_note" onClick={() => setStatus(null)}>
            {tc('form.status.sendAnother')}
          </Button>
        </FormStatus>
        {whatsapp}
      </div>
    )
  }

  const serverError = errors.root?.server?.message

  return (
    <form
      noValidate
      data-hydrated={hydrated || undefined}
      onSubmit={handleFormSubmit}
      aria-labelledby="tour-inquiry-title"
      className="relative flex flex-col gap-space-md"
    >
      <p className="flex items-start gap-space-xs rounded-lg bg-surface/60 px-space-sm py-space-xs font-caption text-caption text-on-surface-variant">
        <Icon name="route" className="mt-px shrink-0 text-sm text-secondary" />
        <span>
          <span className="font-semibold uppercase tracking-wider">{t('selectedJourney')}:</span>{' '}
          <span className="font-semibold text-primary">{tourTitle}</span>
        </span>
      </p>

      <Field label={tc('form.labels.name')} required error={errors.name?.message}>
        <Input type="text" autoComplete="name" placeholder={tc('form.placeholders.name')} {...register('name')} />
      </Field>
      <Field label={tc('form.labels.email')} required error={errors.email?.message}>
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={tc('form.placeholders.email')}
          {...register('email')}
        />
      </Field>
      <Field label={tc('form.labels.whatsapp')} hint={tc('form.whatsappOptional')} error={errors.whatsapp?.message}>
        <Input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={tc('form.placeholders.whatsapp')}
          {...register('whatsapp')}
        />
      </Field>
      <Field label={tc('form.labels.travelMonth')} error={errors.month?.message}>
        <Select className="px-space-sm" {...register('month')}>
          <option value="">{t('monthPlaceholder')}</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
          <option value={FLEXIBLE_MONTH}>{t('flexible')}</option>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-space-sm">
        <Field label={tc('form.labels.adults')} error={errors.adults?.message}>
          <Select className="px-space-sm" {...register('adults')}>
            {ADULT_COUNTS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={tc('form.labels.children')} error={errors.children?.message}>
          <Select className="px-space-sm" {...register('children')}>
            {CHILD_COUNTS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label={tc('form.labels.message')} error={errors.message?.message}>
        <Textarea rows={3} placeholder={tc('form.placeholders.message')} {...register('message')} />
      </Field>

      <Honeypot {...register('website')} />
      <Turnstile onToken={(token) => setValue('turnstileToken', token)} action="tour-inquiry" resetKey={attempts} />

      {(status?.kind === 'error' || serverError) && (
        <FormStatus state={status ?? { kind: 'error', message: serverError }} />
      )}
      {status?.kind === 'error' && unsent && <WhatsAppFallback inquiry={unsent} about={tourTitle} />}

      <Button
        type="submit"
        variant="accent"
        uppercase
        fullWidth
        loading={isSubmitting}
        disabled={isSubmitting}
        leadingIcon="send"
        iconClassName="text-lg"
        className="gap-2 py-space-md shadow-md"
      >
        {isSubmitting ? tc('buttons.sending') : tc('buttons.sendCustomInquiry')}
      </Button>
      {whatsapp}
    </form>
  )
}
