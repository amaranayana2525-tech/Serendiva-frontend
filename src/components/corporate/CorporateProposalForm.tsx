'use client'

import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { useForm, useWatch, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { applyFieldErrors, submitProposal } from '@/lib/api/forms'
import type { Locale } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import {
  PROPOSAL_FILE_ACCEPT,
  proposalDefaults,
  proposalSchema,
  toProposalBody,
  type ProposalFormValues,
  type ProposalPayload,
} from '@/lib/validation/proposal'
import { FormStatus, useFormFailureMessage } from '@/components/forms/FormStatus'
import { Honeypot } from '@/components/forms/Honeypot'
import { Turnstile } from '@/components/forms/Turnstile'
import { useSubmissionId } from '@/components/forms/useSubmissionId'
import { Field, Input, Select, Textarea, useFieldErrorText } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { attachmentProblem, formatFileSize } from './proposal-file'

const GROUP_SIZES = ['board', 'group', 'delegation', 'summit'] as const
const EVENT_TYPES = ['retreat', 'incentive', 'diplomatic', 'conference', 'academic'] as const
const LOGISTICS = ['seaplane', 'train', 'fastTrack', 'av'] as const

const KNOWN_FIELDS = [
  'company',
  'contactPerson',
  'email',
  'phone',
  'groupSize',
  'dates',
  'eventType',
  'logistics',
  'message',
  'attachment',
] as const satisfies readonly Path<ProposalFormValues>[]

/** Stitch RFP control: sand-low fill that lifts to white with a shadow on focus. */
const control =
  'rounded-xl bg-surface-container-low px-space-md py-space-sm focus:bg-surface focus:shadow-md transition-all'
const labelClass = 'text-primary'

export interface CorporateProposalFormProps {
  /** Year used in the "Target travel month" placeholder (from the server, so SSR and hydration agree). */
  exampleYear: number
}

/**
 * Corporate RFP form (POST /corporate-proposals, multipart): Stitch fields, client Zod validation, PDF/DOCX
 * upload (≤ 5 MB) with drag & drop and a removable file chip, server field errors (incl. 413/415 on the
 * attachment), friendly 429/network messages and a success panel with the proposal reference.
 */
export function CorporateProposalForm({ exampleYear }: CorporateProposalFormProps) {
  const t = useTranslations('corporate.rfp')
  const tc = useTranslations('common')
  const locale = useLocale() as Locale
  const failureMessage = useFormFailureMessage()

  const defaults = useMemo<ProposalFormValues>(
    () => ({
      ...proposalDefaults(locale),
      groupSize: t(`form.groupSizes.${GROUP_SIZES[0]}`),
      eventType: t(`form.eventTypes.${EVENT_TYPES[0]}`),
      sourcePage: '/corporate',
    }),
    [locale, t],
  )

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    setFocus,
    clearErrors,
    reset,
    control: formControl,
    formState: { errors, isSubmitting },
  } = useForm<ProposalFormValues, unknown, ProposalPayload>({
    resolver: zodResolver(proposalSchema),
    defaultValues: defaults,
  })
  const attachment = useWatch({ control: formControl, name: 'attachment' })

  const [status, setStatus] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  /** Bumped after every send attempt → fresh single-use Turnstile token. */
  const [attempts, setAttempts] = useState(0)
  const submissionId = useSubmissionId()
  const fileInput = useRef<HTMLInputElement>(null)
  const successHeading = useRef<HTMLHeadingElement>(null)
  const attachmentError = useFieldErrorText(errors.attachment?.message)

  useEffect(() => {
    if (reference) successHeading.current?.focus()
  }, [reference])

  // ---------------------------------------------------------------------------------------------- file

  const pickFile = (file: File | undefined) => {
    if (!file) return
    const problem = attachmentProblem(file)
    if (problem) {
      setValue('attachment', null)
      setError('attachment', { type: 'client', message: problem })
      return
    }
    clearErrors('attachment')
    setValue('attachment', file, { shouldDirty: true })
  }

  const removeFile = () => {
    setValue('attachment', null, { shouldDirty: true })
    clearErrors('attachment')
    fileInput.current?.focus()
  }

  const onDrag = (event: DragEvent<HTMLLabelElement>, active: boolean) => {
    event.preventDefault()
    if (active) setDragging(true)
    else if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
  }

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragging(false)
    pickFile(event.dataTransfer.files[0])
  }

  // ---------------------------------------------------------------------------------------------- submit

  const onSubmit = async (values: ProposalPayload) => {
    setStatus(null)
    const result = await submitProposal({
      ...toProposalBody(values),
      clientRequestId: submissionId.current(),
    })
    setAttempts((n) => n + 1)
    if (result.ok) {
      submissionId.renew()
      setReference(result.data.reference)
      reset(defaults)
      return
    }
    if (result.kind === 'validation') {
      applyFieldErrors(setError, result.fieldErrors, KNOWN_FIELDS)
      setStatus(failureMessage(result))
      const first = KNOWN_FIELDS.find((field) => field in result.fieldErrors)
      if (first === 'attachment') fileInput.current?.focus()
      else if (first && first !== 'logistics') setFocus(first)
      return
    }
    setStatus(failureMessage(result))
  }

  const statusMessage = status ?? errors.root?.server?.message ?? null

  // ---------------------------------------------------------------------------------------------- success

  if (reference) {
    return (
      <div
        role="status"
        className="flex flex-col items-start gap-space-md rounded-xl bg-tertiary-fixed p-space-xl text-on-tertiary-fixed"
      >
        <div className="flex items-center gap-space-sm">
          <Icon name="task_alt" className="shrink-0 text-3xl" />
          <h3 ref={successHeading} tabIndex={-1} className="font-headline-md text-headline-md focus:outline-none">
            {t('success.title')}
          </h3>
        </div>
        <p className="font-body-md text-body-md">{t('success.body')}</p>
        <div className="flex flex-col gap-1 rounded-xl bg-surface/70 px-space-md py-space-sm">
          <span className="font-label-md text-label-md uppercase tracking-widest">{t('success.referenceLabel')}</span>
          <span
            className="font-headline-sm text-headline-sm tracking-wider text-primary"
            data-testid="proposal-reference"
          >
            {reference}
          </span>
          <span className="font-caption text-caption">{tc('form.status.keepReference')}</span>
        </div>
        <button
          type="button"
          onClick={() => setReference(null)}
          className="inline-flex items-center gap-space-xs rounded-lg font-label-lg text-label-lg underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Icon name="refresh" className="text-sm" />
          {t('success.again')}
        </button>
      </div>
    )
  }

  // ---------------------------------------------------------------------------------------------- form

  return (
    <form
      noValidate
      aria-label={t('form.label')}
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="relative flex flex-col gap-space-lg"
    >
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
        <Field
          id="rfp-company"
          label={t('form.company')}
          required
          error={errors.company?.message}
          labelClassName={labelClass}
        >
          <Input
            variant="muted"
            className={control}
            autoComplete="organization"
            placeholder={t('form.companyPlaceholder')}
            {...register('company')}
          />
        </Field>
        <Field
          id="rfp-contact"
          label={t('form.contactPerson')}
          required
          error={errors.contactPerson?.message}
          labelClassName={labelClass}
        >
          <Input
            variant="muted"
            className={control}
            autoComplete="name"
            placeholder={t('form.contactPersonPlaceholder')}
            {...register('contactPerson')}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
        <Field
          id="rfp-email"
          label={t('form.email')}
          required
          error={errors.email?.message}
          labelClassName={labelClass}
        >
          <Input
            variant="muted"
            className={control}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t('form.emailPlaceholder')}
            {...register('email')}
          />
        </Field>
        <Field
          id="rfp-phone"
          label={t('form.phone')}
          required
          error={errors.phone?.message}
          labelClassName={labelClass}
        >
          <Input
            variant="muted"
            className={control}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t('form.phonePlaceholder')}
            {...register('phone')}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
        <Field
          id="rfp-group-size"
          label={t('form.groupSize')}
          required
          error={errors.groupSize?.message}
          labelClassName={labelClass}
        >
          <Select variant="muted" className={control} {...register('groupSize')}>
            {GROUP_SIZES.map((key) => (
              <option key={key} value={t(`form.groupSizes.${key}`)}>
                {t(`form.groupSizes.${key}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          id="rfp-dates"
          label={t('form.dates')}
          required
          error={errors.dates?.message}
          labelClassName={labelClass}
        >
          <Input
            variant="muted"
            className={control}
            placeholder={t('form.datesPlaceholder', { year: exampleYear })}
            {...register('dates')}
          />
        </Field>
        <Field
          id="rfp-event-type"
          label={t('form.eventType')}
          required
          error={errors.eventType?.message}
          labelClassName={labelClass}
        >
          <Select variant="muted" className={control} {...register('eventType')}>
            {EVENT_TYPES.map((key) => (
              <option key={key} value={t(`form.eventTypes.${key}`)}>
                {t(`form.eventTypes.${key}`)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <fieldset className="flex flex-col gap-space-xs">
        <legend className="mb-space-xs font-label-md text-label-md uppercase tracking-wider text-primary">
          {t('form.logistics')}
        </legend>
        <div className="grid grid-cols-2 gap-space-sm pt-space-xs sm:grid-cols-4">
          {LOGISTICS.map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-space-xs rounded-xl bg-surface-container-low p-space-sm font-caption text-caption text-on-surface hover:bg-surface-container has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary"
            >
              <input
                type="checkbox"
                value={t(`form.logisticsItems.${key}`)}
                className="shrink-0 rounded accent-primary focus:outline-none"
                {...register('logistics')}
              />
              <span>{t(`form.logisticsItems.${key}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field id="rfp-message" label={t('form.message')} error={errors.message?.message} labelClassName={labelClass}>
        <Textarea
          variant="muted"
          rows={3}
          className={cn(control, 'p-space-md')}
          placeholder={t('form.messagePlaceholder')}
          {...register('message')}
        />
      </Field>

      <Honeypot {...register('website')} />
      <Turnstile action="proposal" onToken={(token) => setValue('turnstileToken', token)} resetKey={attempts} />

      {statusMessage && <FormStatus state={{ kind: 'error', message: statusMessage }} />}

      <div className="flex flex-col items-center justify-between gap-space-md pt-space-sm sm:flex-row sm:items-start">
        <div className="flex w-full min-w-0 flex-col gap-space-xs sm:w-auto sm:flex-1">
          <label
            htmlFor="rfp-attachment"
            onDragEnter={(e) => onDrag(e, true)}
            onDragOver={(e) => onDrag(e, true)}
            onDragLeave={(e) => onDrag(e, false)}
            onDrop={onDrop}
            className={cn(
              'flex cursor-pointer items-center gap-space-xs rounded-xl border border-dashed px-space-md py-space-sm font-label-md text-label-md text-primary transition-colors hover:text-secondary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
              dragging ? 'border-secondary bg-secondary-fixed/40' : 'border-outline-variant',
              attachmentError && 'border-error',
            )}
          >
            <Icon name="attach_file" className="shrink-0 text-lg" />
            <span className="flex flex-col">
              <span>{t('form.upload')}</span>
              <span className="font-caption text-caption normal-case tracking-normal text-on-surface-variant">
                {dragging ? t('form.uploadDropActive') : t('form.uploadDrop')}
              </span>
            </span>
            <input
              ref={fileInput}
              id="rfp-attachment"
              type="file"
              accept={PROPOSAL_FILE_ACCEPT}
              aria-invalid={attachmentError ? true : undefined}
              aria-describedby={attachmentError ? 'rfp-attachment-error' : undefined}
              className="sr-only"
              onChange={(event) => {
                pickFile(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </label>
          {attachment && (
            <div className="flex min-w-0 items-center gap-space-xs rounded-xl bg-surface-container px-space-md py-space-xs">
              <Icon name="description" className="shrink-0 text-lg text-primary" />
              <span className="sr-only">{t('form.fileSelected')}: </span>
              <span className="min-w-0 truncate font-body-md text-body-md text-on-surface">{attachment.name}</span>
              <span className="shrink-0 font-caption text-caption text-on-surface-variant">
                {formatFileSize(attachment.size, locale)}
              </span>
              <button
                type="button"
                onClick={removeFile}
                aria-label={`${tc('form.removeFile')}: ${attachment.name}`}
                className="tap-target relative ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Icon name="close" className="text-lg" />
              </button>
            </div>
          )}
          {attachmentError && (
            <p
              id="rfp-attachment-error"
              role="alert"
              className="flex items-center gap-1 font-caption text-caption text-error"
            >
              <Icon name="error" className="text-sm" />
              {attachmentError}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting || undefined}
          className="flex w-full items-center justify-center gap-space-sm rounded-xl bg-primary px-space-xl py-space-md font-label-lg text-label-lg text-on-primary shadow-lg transition-all hover:bg-primary-container hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-80 sm:w-auto"
        >
          <span>{isSubmitting ? t('form.submitting') : t('form.submit')}</span>
          <Icon
            name={isSubmitting ? 'progress_activity' : 'send'}
            className={cn('text-sm', isSubmitting && 'animate-spin')}
          />
        </button>
      </div>
    </form>
  )
}
