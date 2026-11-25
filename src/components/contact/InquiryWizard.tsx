'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useForm, useWatch, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import type { AvailabilityCalendar, InquiryBody, Locale } from '@/lib/api/types'
import { nextDateRange } from '@/lib/availability'
import type { CountryOption } from '@/lib/countries'
import { callingCodeForRegion, combineWhatsApp, regionFromLanguages } from '@/lib/phone'
import type { ContactPrefill } from '@/lib/prefill'
import { cn } from '@/lib/utils'
import { FormStatus, useFormFailureMessage } from '@/components/forms/FormStatus'
import { useSubmissionId } from '@/components/forms/useSubmissionId'
import { WhatsAppFallback } from '@/components/forms/WhatsAppFallback'
import { Icon } from '@/components/ui/Icon'
import {
  INTEREST_IDS,
  WIZARD_STEPS,
  extraInterestLabel,
  parseMonthRange,
  travelWindowOptions,
  type DestinationPickerOption,
  type InterestId,
  type TourPickerOption,
} from './wizard-config'
import {
  STEP_COUNT,
  STEP_FIELDS,
  draftStorage,
  initialWizardState,
  prefillSignature,
  restoreDraft,
  sendInquiry,
  stepOfField,
  toInquiryBody,
  wizardSchema,
  type WizardField,
  type WizardLabels,
  type WizardValues,
} from './wizard-model'
import type { BusyRange } from './wizard-dates'
import { StepDates, StepDetails, StepParty, StepPassions } from './WizardSteps'
import { WizardSuccess } from './WizardSuccess'

export interface WizardAbout {
  kind: 'tour' | 'destination'
  title: string
}

export interface InquiryWizardProps {
  /** Sanitised /contact query (parseContactPrefill). */
  prefill: ContactPrefill
  /** 'YYYY-MM-DD' from the server, so the generated travel windows match between SSR and hydration. */
  today: string
  /** Title of the prefilled tour/destination for the "About: …" chip (null when none / not found). */
  about: WizardAbout | null
  /** Guide's name (settings) for the WhatsApp message on the success panel. */
  guideName: string
  /** The guide's busy ranges (admin availability) — exact dates touching them show a gentle warning. */
  busy?: readonly BusyRange[]
  /** Server-generated sorted country suggestions for the Step 4 datalist. */
  countries?: readonly CountryOption[]
  /** Availability calendar (for mobile/inline Step 2 date picking). */
  calendar?: AvailabilityCalendar | null
  /** Published tour blueprints visitors can optionally pick on Step 3. */
  tours?: readonly TourPickerOption[]
  /** Published destinations visitors can tag on Step 3. */
  destinations?: readonly DestinationPickerOption[]
}

type FocusTarget = WizardField | 'heading'

/** Fields without a focusable input of their own (guest steppers, hidden fields) → focus the step heading. */
const UNFOCUSABLE: ReadonlySet<WizardField> = new Set<WizardField>(['adults', 'children', 'website', 'turnstileToken'])

const isInterestId = (value: string): value is InterestId => (INTEREST_IDS as readonly string[]).includes(value)

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * The /contact "Plan My Trip" wizard (Stitch: plan_my_trip_bespoke_inquiry). Four steps with per-step Zod
 * validation, step tabs + progress bar, screen-reader step announcements, a sessionStorage draft, server
 * error routing back to the right step, and the success panel with the inquiry reference.
 */
export function InquiryWizard({
  prefill,
  today,
  about,
  guideName,
  busy,
  countries = [],
  calendar = null,
  tours = [],
  destinations = [],
}: InquiryWizardProps) {
  const t = useTranslations('contact.wizard')
  const locale = useLocale() as Locale
  const failureMessage = useFormFailureMessage()

  // A month range picked on the home hero / in the quiz ("2027-02/2027-04") stays exactly as chosen.
  const picked = useMemo(() => (prefill.month?.includes('/') ? parseMonthRange(prefill.month) : null), [prefill.month])
  const windows = useMemo(() => travelWindowOptions(today, 18, picked), [today, picked])
  const initial = useMemo(() => initialWizardState(prefill, windows, today, locale), [prefill, windows, today, locale])
  const context = useMemo(() => prefillSignature(prefill), [prefill])

  const form = useForm<WizardValues, unknown, WizardValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: initial.values,
    mode: 'onTouched',
    shouldFocusError: false,
  })

  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState<{ reference: string; email: string; hasWhatsApp: boolean } | null>(null)
  const [extraInterests, setExtraInterests] = useState<string[]>(initial.extraInterests)
  const [aboutDismissed, setAboutDismissed] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  /** What could not be sent (network / server / rate limit) — offered as a WhatsApp message instead. */
  const [unsent, setUnsent] = useState<InquiryBody | null>(null)
  /** Bumped after every send attempt → the Turnstile widget fetches a fresh (single-use) token. */
  const [attempts, setAttempts] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const [restored, setRestored] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const pendingFocus = useRef<FocusTarget | null>(null)
  const draftReady = useRef(false)

  // ---------------------------------------------------------------------------------------------- labels

  const windowLabel = useCallback(
    (value: string) => {
      const option = windows.find((w) => w.value === value)
      if (!option) return value
      const monthName = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' })
      const monthYear = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })
      const date = (index: number) => new Date(Date.UTC(Math.floor(index / 12), index % 12, 15))
      switch (option.kind) {
        case 'immediate':
          return t('dates.windows.immediate')
        case 'season':
        case 'range': {
          const sameYear = Math.floor(option.start / 12) === Math.floor(option.end / 12)
          const from = (sameYear ? monthName : monthYear).format(date(option.start))
          const range =
            option.start === option.end ? monthYear.format(date(option.end)) : `${from} – ${monthYear.format(date(option.end))}`
          return option.kind === 'season'
            ? t('dates.windows.season', { range, note: t(`dates.windows.notes.${option.season}`) })
            : range
        }
        case 'later':
          return t('dates.windows.later', { month: monthYear.format(date(option.from)) })
        case 'flexible':
          return t('dates.windows.flexible')
        default:
          return option.label
      }
    },
    [windows, locale, t],
  )

  const destinationNames = useMemo(() => new Map(destinations.map((d) => [d.slug, d.name])), [destinations])

  const labels: WizardLabels = useMemo(
    () => ({
      travelWindow: windowLabel,
      flexibility: (id) => t(`dates.flexibility.${id}`),
      duration: (id) => t(`dates.durations.${id}.title`),
      exactDuration: (days) => t('dates.exactDurationValue', { days, nights: Math.max(0, days - 1) }),
      pace: (id) => t(`dates.paces.${id}.title`),
      stay: (id) => t(`passions.stays.${id}.title`),
      interest: (value) => (isInterestId(value) ? t(`passions.interests.${value}`) : extraInterestLabel(value)),
      destination: (slug) =>
        destinationNames.get(slug) ??
        (about?.kind === 'destination' && prefill.destination === slug ? about.title : slug),
      destinations: t('passions.destinationsField'),
      budget: t('passions.budgetLabel'),
      budgetTier: (id) => t(`passions.budgets.${id}.title`),
      contactMethod: t('details.preferredContactLabel'),
      preferredContact: (id) => t(`details.contactMethods.${id}`),
      childAges: t('party.childAges'),
    }),
    [windowLabel, t, destinationNames, about, prefill.destination],
  )

  const goTo = useCallback(
    (target: number, focus: FocusTarget = 'heading') => {
      pendingFocus.current = focus
      setStep(target)
      setAnnouncement(
        t('announceStep', { current: target + 1, total: STEP_COUNT, title: t(`steps.${WIZARD_STEPS[target]!}`) }),
      )
    },
    [t],
  )

  const onPickDate = useCallback(
    (iso: string) => {
      const curFlex = form.getValues('flexibility')
      const curStart = curFlex === 'fixed' ? form.getValues('travelStart') : ''
      const curEnd = curFlex === 'fixed' ? form.getValues('travelEnd') : ''
      const nextRange = nextDateRange(curStart, curEnd, iso)
      form.setValue('flexibility', 'fixed', { shouldDirty: true })
      form.setValue('travelStart', nextRange.start, { shouldDirty: true })
      form.setValue('travelEnd', nextRange.end, { shouldDirty: true })
      form.clearErrors(['travelWindow', 'travelStart', 'travelEnd'])
    },
    [form],
  )

  const onClearDates = useCallback(() => {
    form.setValue('travelStart', '', { shouldDirty: true })
    form.setValue('travelEnd', '', { shouldDirty: true })
    form.clearErrors(['travelStart', 'travelEnd'])
  }, [form])

  const watchFlexibility = useWatch({ control: form.control, name: 'flexibility' })
  const watchStart = useWatch({ control: form.control, name: 'travelStart' })
  const watchEnd = useWatch({ control: form.control, name: 'travelEnd' })

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('serendiva:calendar-sync', {
        detail:
          watchFlexibility === 'fixed' && !submitted
            ? { start: watchStart, end: watchEnd }
            : { start: '', end: '' },
      }),
    )
  }, [watchFlexibility, watchStart, watchEnd, submitted])

  useEffect(() => {
    const handlePick = (event: Event) => {
      const iso = (event as CustomEvent<string>).detail
      if (typeof iso !== 'string' || !iso) return
      onPickDate(iso)
      if (!submitted && step !== 1) goTo(1)
      cardRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    }
    const handleClear = () => onClearDates()
    window.addEventListener('serendiva:calendar-pick', handlePick)
    window.addEventListener('serendiva:calendar-clear', handleClear)
    return () => {
      window.removeEventListener('serendiva:calendar-pick', handlePick)
      window.removeEventListener('serendiva:calendar-clear', handleClear)
    }
  }, [onPickDate, onClearDates, step, submitted, goTo])

  // ---------------------------------------------------------------------------------------------- draft

  // Restore a draft from this browser tab (after hydration, so server and client render the same first frame).
  useEffect(() => {
    const draft = restoreDraft(
      draftStorage.read(),
      initial,
      context,
      windows.map((w) => w.value),
    )
    const frame = window.requestAnimationFrame(() => {
      if (draft) {
        form.reset(draft.values)
        setExtraInterests(draft.extraInterests)
        setAboutDismissed(draft.aboutDismissed)
        setStep(draft.step)
        setRestored(true)
      } else {
        // Default calling code from the browser's region (en-AU → +61), not the UI language (en → +44):
        // a number saved with the wrong code is a WhatsApp reply that never arrives.
        const code = callingCodeForRegion(regionFromLanguages(navigator.languages ?? [navigator.language]))
        if (code) form.setValue('whatsappCode', code)
      }
      draftReady.current = true
    })
    return () => window.cancelAnimationFrame(frame)
  }, [form, initial, context, windows])

  const saveDraft = useCallback(() => {
    if (!draftReady.current || submitted) return
    const { website: _website, turnstileToken: _token, ...values } = form.getValues()
    draftStorage.write({ v: 1, context, step, aboutDismissed, extraInterests, values })
  }, [form, context, step, aboutDismissed, extraInterests, submitted])

  useEffect(() => {
    saveDraft()
    return form.subscribe({ formState: { values: true }, callback: saveDraft })
  }, [form, saveDraft])

  // ---------------------------------------------------------------------------------------------- navigation

  // Move focus (step heading or a field with a server error) once the new step has rendered.
  useEffect(() => {
    const target = pendingFocus.current
    if (!target) return
    pendingFocus.current = null
    const card = cardRef.current
    if (card && card.getBoundingClientRect().top < 0) {
      card.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    }
    if (target === 'heading' || UNFOCUSABLE.has(target)) headingRef.current?.focus({ preventScroll: true })
    else form.setFocus(target)
  }, [step, submitted, form])

  const focusField = (field: WizardField) => {
    if (UNFOCUSABLE.has(field)) headingRef.current?.focus()
    else form.setFocus(field)
  }

  const firstInvalidField = (index: number): WizardField | undefined =>
    STEP_FIELDS[index]!.find((field) => form.getFieldState(field).invalid)

  const next = async () => {
    setFormError(null)
    const valid = await form.trigger([...STEP_FIELDS[step]!], { shouldFocus: true })
    if (valid) goTo(step + 1)
  }

  const back = () => {
    setFormError(null)
    goTo(Math.max(0, step - 1))
  }

  /** Step tabs: going back is free; going forward validates every step on the way. */
  const jumpTo = async (target: number) => {
    if (target === step) return
    if (target < step) return goTo(target)
    for (let index = step; index < target; index++) {
      const valid = await form.trigger([...STEP_FIELDS[index]!], { shouldFocus: index === step })
      if (!valid) {
        if (index !== step) goTo(index, firstInvalidField(index) ?? 'heading')
        return
      }
    }
    goTo(target)
  }

  // ---------------------------------------------------------------------------------------------- submit

  const submission = useSubmissionId()
  const sending = useRef(false)

  const onValid = async (values: WizardValues) => {
    setFormError(null)
    setUnsent(null)
    setSubmitting(true)
    const context = {
      locale,
      labels,
      source: prefill.source,
      clientRequestId: submission.current(),
    }
    const outcome = await sendInquiry(values, context)
    setSubmitting(false)
    setAttempts((n) => n + 1)

    if (outcome.kind === 'success') {
      submission.renew()
      draftStorage.clear()
      draftReady.current = false
      pendingFocus.current = 'heading'
      setSubmitted({
        reference: outcome.reference,
        email: values.email.trim(),
        hasWhatsApp: Boolean(combineWhatsApp(values.whatsappCode, values.whatsappNumber)),
      })
      setAnnouncement('')
      return
    }
    if (outcome.kind === 'invalid') {
      const { fields, form: formMessages, step: target } = outcome.errors
      for (const { field, message } of fields) form.setError(field, { type: 'server', message })
      setFormError(formMessages.length > 0 ? formMessages.join(' ') : failureMessage(outcome.failure))
      const firstField = fields[0]?.field
      if (target !== step) goTo(target, firstField ?? 'heading')
      else if (firstField) focusField(firstField)
      return
    }
    setFormError(failureMessage(outcome.failure))
    setUnsent(toInquiryBody(values, context))
  }

  /** Client validation failed on submit (e.g. a restored draft): open the first step with an error. */
  const onInvalid = (errors: FieldErrors<WizardValues>) => {
    const fields = Object.keys(errors) as WizardField[]
    if (fields.length === 0) return
    const target = Math.min(...fields.map(stepOfField))
    const field = STEP_FIELDS[target]!.find((f) => fields.includes(f))
    if (target !== step) goTo(target, field ?? 'heading')
    else if (field) focusField(field)
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    // Enter inside a field on steps 1–3 means "continue", never "send".
    if (step < STEP_COUNT - 1) {
      event.preventDefault()
      void next()
      return
    }
    // A second click while the first send is still validating or in flight is ignored (the state flag is
    // set too late for a fast double click: validation is async).
    if (sending.current) {
      event.preventDefault()
      return
    }
    sending.current = true
    void form.handleSubmit(onValid, onInvalid)(event).finally(() => {
      sending.current = false
    })
  }

  const restart = () => {
    draftStorage.clear()
    form.reset(initial.values)
    const code = callingCodeForRegion(regionFromLanguages(navigator.languages ?? [navigator.language]))
    if (code) form.setValue('whatsappCode', code)
    setExtraInterests(initial.extraInterests)
    setAboutDismissed(false)
    setFormError(null)
    setUnsent(null)
    setSubmitted(null)
    setRestored(false)
    draftReady.current = true
    goTo(0)
  }

  // ---------------------------------------------------------------------------------------------- render

  const done = submitted !== null
  const showAboutTitle = about && !aboutDismissed ? about.title : undefined
  const progress = done ? 100 : ((step + 1) / STEP_COUNT) * 100
  const status = formError ? (
    <div className="flex flex-col gap-space-sm">
      <FormStatus state={{ kind: 'error', message: formError }} />
      {unsent && <WhatsAppFallback inquiry={unsent} about={showAboutTitle} />}
    </div>
  ) : null
  const showAbout = about && !aboutDismissed && !done
  const stepProps = { form, headingRef, status, headingId: `wizard-step-${step + 1}-title` }

  const dismissAbout = () => {
    setAboutDismissed(true)
    if (about?.kind === 'tour') form.setValue('tourSlug', '', { shouldDirty: true })
    if (about?.kind === 'destination' && prefill.destination) {
      form.setValue(
        'destinations',
        form.getValues('destinations').filter((s) => s !== prefill.destination),
        { shouldDirty: true },
      )
    }
  }

  return (
    <div
      ref={cardRef}
      id="plan-my-trip"
      className="relative scroll-mt-24 overflow-hidden rounded-xl bg-surface-container-lowest p-space-md shadow-xl md:p-space-xl"
    >
      <div className="w-full border-b border-surface-container pb-space-lg">
        {showAbout && (
          <div className="mb-space-md flex">
            <span className="inline-flex max-w-full items-center gap-space-xs rounded-full bg-secondary-fixed/60 py-space-xs pl-space-md pr-space-xs font-label-md text-label-md text-on-secondary-fixed-variant">
              <Icon name={about.kind === 'tour' ? 'route' : 'location_on'} className="shrink-0 text-sm" />
              <span className="truncate">{t('about', { title: about.title })}</span>
              <button
                type="button"
                onClick={dismissAbout}
                aria-label={t('aboutRemove', { title: about.title })}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-secondary-fixed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Icon name="close" className="text-sm" />
              </button>
            </span>
          </div>
        )}

        <ol aria-label={t('stepsLabel')} className="grid grid-cols-2 gap-space-sm md:grid-cols-4">
          {WIZARD_STEPS.map((id, index) => {
            const active = index === step && !done
            const completed = done || index < step
            return (
              <li key={id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => void jumpTo(index)}
                  disabled={done}
                  aria-current={active ? 'step' : undefined}
                  className={cn(
                    'flex w-full items-center gap-space-xs rounded-lg p-space-sm text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default',
                    active ? 'bg-surface-container' : 'hover:bg-surface-container/60 disabled:hover:bg-transparent',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-label-md text-label-md',
                      active ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant',
                    )}
                  >
                    {index + 1}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span
                      className={cn(
                        'font-label-md text-label-md uppercase tracking-wider',
                        active ? 'text-on-surface-variant' : 'text-on-surface-variant',
                      )}
                    >
                      {t('stepLabel', { number: index + 1 })}
                      {completed && <span className="sr-only"> ({t('stepCompleted')})</span>}
                    </span>
                    <span
                      className={cn(
                        'truncate font-body-md text-body-md',
                        active ? 'font-semibold text-primary' : 'text-on-surface-variant',
                      )}
                    >
                      {t(`steps.${id}`)}
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ol>

        <div
          role="progressbar"
          aria-label={t('progressLabel')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-valuetext={t('progressValue', { current: done ? STEP_COUNT : step + 1, total: STEP_COUNT })}
          className="mt-space-md h-1.5 w-full overflow-hidden rounded-full bg-surface-container"
        >
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        {restored && !done && (
          <div
            role="status"
            className="mt-space-sm flex flex-wrap items-center justify-between gap-2 font-caption text-caption text-on-surface-variant"
          >
            <span className="flex items-center gap-1">
              <Icon name="history" className="text-sm text-tertiary" />
              {t('draftRestored')}
            </span>
            <button
              type="button"
              onClick={restart}
              className="rounded font-semibold text-primary underline underline-offset-4 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {t('draftClear')}
            </button>
          </div>
        )}
      </div>

      <form noValidate aria-label={t('formLabel')} onSubmit={onSubmit} className="pt-space-lg">
        {submitted ? (
          <WizardSuccess
            reference={submitted.reference}
            email={submitted.email}
            hasWhatsApp={submitted.hasWhatsApp}
            guideName={guideName}
            headingRef={headingRef}
            onRestart={restart}
          />
        ) : step === 0 ? (
          <StepParty {...stepProps} onNext={() => void next()} />
        ) : step === 1 ? (
          <StepDates
            {...stepProps}
            onNext={() => void next()}
            onBack={back}
            windows={windows}
            windowLabel={windowLabel}
            today={today}
            busy={busy}
            calendar={calendar}
            onPickDate={onPickDate}
            onClearDates={onClearDates}
          />
        ) : step === 2 ? (
          <StepPassions
            {...stepProps}
            onNext={() => void next()}
            onBack={back}
            extraInterests={extraInterests}
            tours={tours}
            destinations={destinations}
            about={about}
          />
        ) : (
          <StepDetails
            {...stepProps}
            onBack={back}
            submitting={submitting}
            turnstileReset={attempts}
            countries={countries}
            tours={tours}
            destinations={destinations}
            windowLabel={windowLabel}
            onEditStep={(target) => goTo(target)}
          />
        )}
      </form>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  )
}
