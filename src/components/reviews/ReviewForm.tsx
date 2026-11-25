'use client'

import { useEffect, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { applyFieldErrors, submitReview } from '@/lib/api/forms'
import type { Locale } from '@/lib/api/types'
import { reviewSchema, toReviewBody, type ReviewFormValues, type ReviewPayload } from '@/lib/validation/review'
import { TRAVELLER_TYPES } from '@/lib/validation/shared'
import { FormStatus, useFormFailureMessage, type FormStatusState } from '@/components/forms/FormStatus'
import { Honeypot } from '@/components/forms/Honeypot'
import { Turnstile } from '@/components/forms/Turnstile'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import type { CountryOption } from './countries'
import { StarRatingInput } from './StarRatingInput'

const SERVER_FIELDS = [
  'guestName',
  'email',
  'country',
  'location',
  'travellerType',
  'tourSlug',
  'rating',
  'title',
  'text',
  'travelDate',
] as const

const TEXT_MAX = 3000

export interface ReviewFormProps {
  countries: CountryOption[]
  tours: { slug: string; title: string }[]
  /** Latest selectable travel month ('YYYY-MM', computed on the server). */
  maxMonth: string
}

/**
 * "Share your experience" form → POST /reviews (saved as pending until moderated). Client Zod validation, server field
 * errors mapped onto the fields, friendly 429 / network messages, honeypot + optional Turnstile.
 */
export function ReviewForm({ countries, tours, maxMonth }: ReviewFormProps) {
  const t = useTranslations('reviews.form')
  const tc = useTranslations('common')
  const locale = useLocale() as Locale
  const failureMessage = useFormFailureMessage()
  const [status, setStatus] = useState<FormStatusState>(null)
  const [submitted, setSubmitted] = useState(false)
  /** Bumped after every send attempt → fresh single-use Turnstile token. */
  const [attempts, setAttempts] = useState(0)
  const successRef = useRef<HTMLDivElement>(null)

  const defaults: ReviewFormValues = {
    guestName: '',
    email: '',
    country: '',
    location: '',
    // Empty selects until the guest chooses (validated as required).
    travellerType: '' as ReviewFormValues['travellerType'],
    tourSlug: '',
    rating: 0,
    title: '',
    text: '',
    travelDate: '',
    locale,
    website: '',
    turnstileToken: '',
  }

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues, unknown, ReviewPayload>({
    resolver: zodResolver(reviewSchema),
    defaultValues: defaults,
    mode: 'onTouched',
  })
  const textLength = useWatch({ control, name: 'text' })?.length ?? 0

  useEffect(() => {
    if (submitted) successRef.current?.focus()
  }, [submitted])

  const onSubmit = async (values: ReviewPayload) => {
    setStatus(null)
    const result = await submitReview(toReviewBody(values))
    setAttempts((n) => n + 1)
    if (result.ok) {
      setSubmitted(true)
      reset(defaults)
      return
    }
    if (result.kind === 'validation') applyFieldErrors(setError, result.fieldErrors, SERVER_FIELDS)
    setStatus({ kind: 'error', message: failureMessage(result) })
  }

  if (submitted) {
    return (
      <div ref={successRef} tabIndex={-1} className="focus:outline-none">
        <FormStatus
          variant="card"
          state={{ kind: 'success', title: t('success.title'), body: t('success.body') }}
          className="bg-surface-container-low"
        >
          <div className="flex flex-wrap items-center justify-center gap-space-sm pt-space-xs">
            <Button href="/reviews" variant="primary" leadingIcon="arrow_back">
              {t('success.back')}
            </Button>
            <Button
              variant="soft"
              leadingIcon="edit"
              onClick={() => {
                setSubmitted(false)
                setStatus(null)
              }}
            >
              {t('success.another')}
            </Button>
          </div>
        </FormStatus>
      </div>
    )
  }

  const rootError = errors.root?.server?.message

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      aria-label={t('title')}
      className="relative flex flex-col gap-space-xl"
    >
      <fieldset className="flex flex-col gap-space-md">
        <legend className="mb-space-md font-headline-sm text-headline-sm text-primary">{t('sections.about')}</legend>
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
          <Field label={t('labels.name')} required error={errors.guestName?.message} hint={t('hints.name')}>
            <Input
              variant="white"
              autoComplete="name"
              placeholder={t('placeholders.name')}
              {...register('guestName')}
            />
          </Field>
          <Field label={t('labels.email')} required error={errors.email?.message} hint={t('hints.email')}>
            <Input
              variant="white"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t('placeholders.email')}
              {...register('email')}
            />
          </Field>
          <Field label={t('labels.country')} required error={errors.country?.message}>
            <Select
              variant="white"
              autoComplete="country"
              placeholder={t('placeholders.country')}
              options={countries}
              {...register('country')}
            />
          </Field>
          <Field label={t('labels.city')} error={errors.location?.message}>
            <Input
              variant="white"
              autoComplete="address-level2"
              placeholder={t('placeholders.city')}
              {...register('location')}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-space-md">
        <legend className="mb-space-md font-headline-sm text-headline-sm text-primary">{t('sections.trip')}</legend>
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
          <Field label={t('labels.travellerType')} required error={errors.travellerType?.message}>
            <Select
              variant="white"
              placeholder={t('placeholders.travellerType')}
              options={TRAVELLER_TYPES.map((type) => ({ value: type, label: tc(`travellerTypes.${type}`) }))}
              {...register('travellerType')}
            />
          </Field>
          <Field label={t('labels.travelDate')} error={errors.travelDate?.message} hint={t('hints.travelDate')}>
            <Input variant="white" type="month" max={maxMonth} {...register('travelDate')} />
          </Field>
          <Field
            label={t('labels.tour')}
            error={errors.tourSlug?.message}
            hint={t('hints.tour')}
            className="sm:col-span-2"
          >
            <Select
              variant="white"
              placeholder={t('placeholders.tour')}
              options={tours.map((tour) => ({ value: tour.slug, label: tour.title }))}
              {...register('tourSlug')}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-space-md">
        <legend className="mb-space-md font-headline-sm text-headline-sm text-primary">{t('sections.review')}</legend>
        <Controller
          control={control}
          name="rating"
          render={({ field, fieldState }) => (
            <StarRatingInput
              name={field.name}
              value={field.value || undefined}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              required
            />
          )}
        />
        <Field label={t('labels.title')} error={errors.title?.message}>
          <Input variant="white" placeholder={t('placeholders.title')} maxLength={160} {...register('title')} />
        </Field>
        <Field label={t('labels.text')} required error={errors.text?.message} hint={t('hints.text')}>
          <Textarea
            variant="white"
            rows={7}
            maxLength={TEXT_MAX}
            placeholder={t('placeholders.text')}
            {...register('text')}
          />
        </Field>
        <p aria-hidden="true" className="-mt-space-sm text-right font-caption text-caption text-on-surface-variant">
          {tc('form.characterCount', { count: textLength, max: TEXT_MAX })}
        </p>
      </fieldset>

      <Honeypot {...register('website')} />
      <Turnstile onToken={(token) => setValue('turnstileToken', token)} action="review" resetKey={attempts} />

      <p className="flex items-start gap-space-sm rounded-lg bg-surface-container-low p-space-md font-caption text-caption text-on-surface-variant">
        <Icon name="lock" className="mt-0.5 shrink-0 text-base text-tertiary" />
        <span>{t('consent')}</span>
      </p>

      {(status || rootError) && <FormStatus state={status ?? { kind: 'error', message: rootError }} />}

      <div className="flex flex-col items-stretch gap-space-md sm:flex-row sm:items-center sm:justify-between">
        <span className="font-caption text-caption text-on-surface-variant">{tc('form.requiredHint')}</span>
        <Button
          type="submit"
          variant="accent"
          size="lg"
          loading={isSubmitting}
          trailingIcon={isSubmitting ? undefined : 'send'}
        >
          {isSubmitting ? t('sending') : t('submit')}
        </Button>
      </div>
    </form>
  )
}
