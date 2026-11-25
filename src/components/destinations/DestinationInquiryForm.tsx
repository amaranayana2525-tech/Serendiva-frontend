'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { applyFieldErrors, submitInquiry } from '@/lib/api/forms'
import { useSubmissionId } from '@/components/forms/useSubmissionId'
import { ADULT_COUNTS, CHILD_COUNTS, partyForGuests } from '@/lib/party'
import type { InquiryBody, Locale } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import {
  inquiryDefaults,
  inquirySchema,
  toInquiryBody,
  type InquiryFormValues,
  type InquiryPayload,
} from '@/lib/validation/inquiry'
import { FormStatus, useFormFailureMessage, type FormStatusState } from '@/components/forms/FormStatus'
import { WhatsAppFallback } from '@/components/forms/WhatsAppFallback'
import { Honeypot } from '@/components/forms/Honeypot'
import { Turnstile } from '@/components/forms/Turnstile'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { Field, Input, Select, Textarea, useFieldErrorText } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import type { MonthOption } from './content'

export interface DestinationInquiryFormProps {
  destinationSlug: string
  destinationName: string
  /** Interest pills (destination.interests from the CMS). */
  interests: string[]
  /** Upcoming months (computed on the server so SSR and hydration agree). */
  months: MonthOption[]
}

const FIELDS = ['name', 'email', 'whatsapp', 'travelWindow', 'durationPreference', 'interests', 'adults', 'children', 'message'] as const

/** Stitch control look: sand-low field that turns sand on focus (focus ring kept for keyboard users). */
const CONTROL = 'rounded-lg bg-surface-container-low py-3 shadow-none transition-colors focus:bg-surface'
const LABEL = 'normal-case tracking-[0.1em] font-semibold'

/**
 * "Include <destination> in my journey" — POST /inquiries with the destination slug, travel month, stay length and
 * interests. Inquiry only (nothing is booked or paid). Client Zod validation, API field errors, reference on success.
 */
export function DestinationInquiryForm({
  destinationSlug,
  destinationName,
  interests,
  months,
}: DestinationInquiryFormProps) {
  const t = useTranslations('destinationDetail.inquiry')
  const tc = useTranslations('common')
  const locale = useLocale() as Locale
  const failureMessage = useFormFailureMessage()
  const [status, setStatus] = useState<FormStatusState>(null)
  /** Body that could not be sent (network / server / rate limit) → offered as a WhatsApp message. */
  const [unsent, setUnsent] = useState<InquiryBody | null>(null)
  const [attempts, setAttempts] = useState(0)
  const successRef = useRef<HTMLDivElement>(null)
  const succeeded = status?.kind === 'success'

  const defaults: InquiryFormValues = {
    ...inquiryDefaults(locale),
    travelWindow: '',
    durationPreference: t('stay.two'),
    destinationSlug,
    sourcePage: `/destinations/${destinationSlug}`,
  }
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormValues, unknown, InquiryPayload>({
    resolver: zodResolver(inquirySchema),
    defaultValues: defaults,
  })
  // Validation keys ("tooMany:20") → sentences
  const interestsError = useFieldErrorText(errors.interests?.message ?? (errors.interests ? 'invalid' : undefined))

  useEffect(() => {
    // Move focus to the confirmation so keyboard and screen-reader users land on the reference code.
    if (succeeded) successRef.current?.focus()
  }, [succeeded])

  const submission = useSubmissionId()
  const sending = useRef(false)

  const onSubmit = async (values: InquiryPayload) => {
    setStatus(null)
    setUnsent(null)
    const body: InquiryBody = {
      ...toInquiryBody(values),
      partyType: partyForGuests(values.adults, values.children),
      ...(values.travelWindow === t('flexible') ? { flexibleDates: true } : {}),
    }
    const result = await submitInquiry({ ...body, clientRequestId: submission.current() })
    setAttempts((n) => n + 1)
    if (result.ok) {
      submission.renew()
      setStatus({
        kind: 'success',
        title: t('successTitle', { name: destinationName }),
        body: t('successBody'),
        reference: result.data.reference,
      })
      return
    }
    if (result.kind === 'validation') applyFieldErrors(setError, result.fieldErrors, FIELDS)
    else setUnsent(body)
    setStatus({ kind: 'error', message: failureMessage(result) })
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
      destinationName={destinationName}
      className="flex w-full items-center justify-center gap-space-xs rounded-lg bg-surface-container px-space-md py-3 font-label-lg text-label-lg tracking-wider text-primary transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 coarse:min-h-11"
    >
      <Icon name="chat" className="text-lg text-tertiary" />
      <span>{t('whatsapp')}</span>
    </WhatsAppLink>
  )

  if (succeeded) {
    return (
      <div ref={successRef} tabIndex={-1} className="flex flex-col gap-space-md focus:outline-none">
        <FormStatus state={status} variant="card" className="p-space-lg">
          <button
            type="button"
            onClick={() => {
              reset(defaults)
              setStatus(null)
            }}
            className="font-label-lg text-label-lg text-primary underline decoration-secondary/40 underline-offset-4 transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {t('sendAnother')}
          </button>
        </FormStatus>
        {whatsapp}
      </div>
    )
  }

  const serverRootError = errors.root?.server?.message

  return (
    <form
      noValidate
      onSubmit={handleFormSubmit}
      aria-label={t('formLabel', { name: destinationName })}
      className="relative flex flex-col gap-space-md"
    >
      <Field label={t('labels.name')} required error={errors.name?.message} labelClassName={LABEL}>
        <Input autoComplete="name" placeholder={t('placeholders.name')} className={CONTROL} {...register('name')} />
      </Field>
      <Field label={t('labels.email')} required error={errors.email?.message} labelClassName={LABEL}>
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t('placeholders.email')}
          className={CONTROL}
          {...register('email')}
        />
      </Field>
      <Field
        label={t('labels.whatsapp')}
        hint={tc('form.whatsappOptional')}
        error={errors.whatsapp?.message}
        labelClassName={LABEL}
      >
        <Input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={t('placeholders.whatsapp')}
          className={CONTROL}
          {...register('whatsapp')}
        />
      </Field>

      <div className="grid grid-cols-2 gap-space-sm">
        <Field label={t('labels.month')} error={errors.travelWindow?.message} labelClassName={LABEL}>
          <Select className={cn(CONTROL, 'px-space-sm')} {...register('travelWindow')}>
            <option value="">{t('monthPlaceholder')}</option>
            {months.map((m) => (
              <option key={m.value} value={m.long}>
                {m.label}
              </option>
            ))}
            <option value={t('flexible')}>{t('flexible')}</option>
          </Select>
        </Field>
        <Field
          label={t('labels.stay', { name: destinationName })}
          error={errors.durationPreference?.message}
          labelClassName={LABEL}
        >
          <Select className={cn(CONTROL, 'px-space-sm')} {...register('durationPreference')}>
            <option value={t('stay.two')}>{t('stay.two')}</option>
            <option value={t('stay.one')}>{t('stay.one')}</option>
            <option value={t('stay.three')}>{t('stay.three')}</option>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-space-sm">
        <Field label={tc('form.labels.adults')} error={errors.adults?.message} labelClassName={LABEL}>
          <Select className={cn(CONTROL, 'px-space-sm')} {...register('adults', { valueAsNumber: true })}>
            {ADULT_COUNTS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={tc('form.labels.children')} error={errors.children?.message} labelClassName={LABEL}>
          <Select className={cn(CONTROL, 'px-space-sm')} {...register('children', { valueAsNumber: true })}>
            {CHILD_COUNTS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {interests.length > 0 && (
        <fieldset className="mt-1 flex flex-col gap-1.5">
          <legend className="mb-1.5 font-label-md text-label-md font-semibold text-on-surface-variant">
            {t('labels.interests', { name: destinationName })}
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {interests.map((interest) => (
              <label
                key={interest}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-surface-container-low px-2.5 py-1.5 font-caption text-caption transition-colors focus-within:ring-2 focus-within:ring-primary hover:bg-surface-container coarse:min-h-11"
              >
                <input type="checkbox" value={interest} className="accent-primary" {...register('interests')} />
                <span>{interest}</span>
              </label>
            ))}
          </div>
          {interestsError && (
            <p className="flex items-center gap-1 font-caption text-caption text-error">
              <Icon name="error" className="text-sm" />
              {interestsError}
            </p>
          )}
        </fieldset>
      )}

      <Field label={tc('form.labels.message')} error={errors.message?.message} labelClassName={LABEL}>
        <Textarea rows={3} className={CONTROL} placeholder={t('messagePlaceholder')} {...register('message')} />
      </Field>

      <FormStatus state={status ?? (serverRootError ? { kind: 'error', message: serverRootError } : null)} />
      {status?.kind === 'error' && unsent && <WhatsAppFallback inquiry={unsent} about={destinationName} />}

      <Turnstile onToken={(token) => setValue('turnstileToken', token)} action="inquiry" resetKey={attempts} />
      <Honeypot {...register('website')} />

      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting || undefined}
        className="mt-space-sm flex w-full items-center justify-center gap-space-xs rounded-lg bg-secondary px-space-md py-3.5 font-label-lg text-label-lg uppercase tracking-wider text-on-secondary shadow-[0_4px_16px_rgba(156,68,30,0.25)] transition-all hover:bg-on-secondary-fixed-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-80"
      >
        <Icon
          name={isSubmitting ? 'progress_activity' : 'travel_explore'}
          className={cn('text-lg', isSubmitting && 'animate-spin')}
        />
        <span>{isSubmitting ? tc('buttons.sending') : t('submit')}</span>
      </button>
      {whatsapp}
    </form>
  )
}
