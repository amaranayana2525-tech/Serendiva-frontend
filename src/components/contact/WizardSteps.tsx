'use client'

import { useState, type ReactNode, type RefObject } from 'react'
import { useController, useWatch, type UseFormReturn } from 'react-hook-form'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { AvailabilityCalendar as AvailabilityCalendarDto } from '@/lib/api/types'
import type { CountryOption } from '@/lib/countries'
import { callingCodeForRegion, combineWhatsApp, regionFromCountryName } from '@/lib/phone'
import { cn } from '@/lib/utils'
import { Honeypot } from '@/components/forms/Honeypot'
import { Turnstile } from '@/components/forms/Turnstile'
import { AvailabilityCalendar } from '@/components/sections/AvailabilityCalendar'
import { Field, Input, Select, Textarea, useFieldErrorText } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import {
  BUDGET_OPTIONS,
  CALLING_CODES,
  CONTACT_METHOD_OPTIONS,
  DURATION_IDS,
  FLEXIBILITY_IDS,
  INTEREST_OPTIONS,
  PACE_IDS,
  PARTY_OPTIONS,
  STAY_OPTIONS,
  extraInterestLabel,
  type DestinationPickerOption,
  type TourPickerOption,
  type TravelWindowOption,
} from './wizard-config'
import { guestsForParty, type WizardValues } from './wizard-model'
import { overlapsBusy, tripDays, type BusyRange } from './wizard-dates'
import {
  BackButton,
  GroupLegend,
  InterestChip,
  NextButton,
  OptionCard,
  PartyCard,
  StayCard,
  StepHeader,
  Stepper,
} from './WizardControls'

/* The four panels of the /contact wizard (only the current one is mounted; react-hook-form keeps the values). */

// The resolver output equals the input shape (strings are only trimmed), so one type serves both generics.
export type WizardForm = UseFormReturn<WizardValues, unknown, WizardValues>

interface StepProps {
  form: WizardForm
  headingId: string
  headingRef: RefObject<HTMLHeadingElement | null>
  /** Error / status message rendered above the action bar. */
  status?: ReactNode
}

/** Stitch white-on-sand controls: sand-low fill, xl radius, roomy padding. */
const fieldControl = 'rounded-xl bg-surface-container-low px-space-md py-space-md shadow-none'

const ACTIONS = 'flex items-center pt-space-md'

// ------------------------------------------------------------------------------------------------ step 1

export function StepParty({ form, headingId, headingRef, status, onNext }: StepProps & { onNext: () => void }) {
  const t = useTranslations('contact.wizard.party')
  const {
    control,
    register,
    getValues,
    setValue,
    clearErrors,
    trigger,
    formState: { errors },
  } = form
  const partyType = useWatch({ control, name: 'partyType' })
  const adults = useController({ control, name: 'adults' })
  const children = useController({ control, name: 'children' })
  const partyError = errors.partyType?.message
  const guestsError = errors.adults?.message ?? errors.children?.message
  const minAdults = partyType === 'couple' ? 2 : 1
  const maxAdults = partyType === 'solo' ? 1 : partyType === 'couple' ? 2 : 50
  const minChildren = partyType === 'family' ? 1 : 0
  const maxChildren = partyType === 'solo' || partyType === 'couple' ? 0 : 50
  // Picking a party adjusts the guest counts to fit it (solo = 1, couple = 2 adults / 0 children, family ≥ 1 child, group ≥ 3).
  const party = register('partyType', {
    onChange: (event: { target: { value: string } }) => {
      const next = guestsForParty(event.target.value as WizardValues['partyType'], getValues('adults'), getValues('children'))
      setValue('adults', next.adults)
      setValue('children', next.children)
      clearErrors(['adults', 'children'])
    },
  })

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-space-xl">
      <StepHeader id={headingId} headingRef={headingRef} eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')} />

      <div>
        <div
          role="radiogroup"
          aria-labelledby={headingId}
          aria-describedby={partyError ? 'wizard-party-error' : undefined}
          className="grid grid-cols-1 gap-space-md sm:grid-cols-2 md:grid-cols-3"
        >
          {PARTY_OPTIONS.map((option) => (
            <PartyCard
              key={option.id}
              icon={option.icon}
              title={t(`options.${option.id}.title`)}
              body={t(`options.${option.id}.body`)}
              className={option.wide ? 'sm:col-span-2 md:col-span-2' : undefined}
              input={{ value: option.id, ...party }}
            />
          ))}
        </div>
        {partyError && <FieldError id="wizard-party-error" message={partyError} />}
        {partyType === 'corporate' && (
          <p className="mt-space-md flex flex-wrap items-center justify-between gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low px-space-md py-space-sm font-caption text-caption text-on-surface-variant">
            <span>{t('corporateNote')}</span>
            <Link
              href="/corporate"
              className="font-semibold text-primary underline underline-offset-4 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {t('corporateLink')}
            </Link>
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-space-lg rounded-xl bg-surface-container-low p-space-lg">
        <div className="flex min-w-[12rem] flex-1 flex-col">
          <span className="font-headline-sm text-headline-sm text-primary">{t('guestsTitle')}</span>
          <span className="font-caption text-caption text-on-surface-variant">{t('guestsBody')}</span>
        </div>
        <div className="flex flex-wrap items-center gap-space-md sm:gap-space-lg">
          <Stepper
            id="wizard-adults"
            label={t('adults')}
            value={adults.field.value}
            min={minAdults}
            max={maxAdults}
            onChange={(value) => {
              adults.field.onChange(value)
              if (guestsError) void trigger(['adults', 'children'])
            }}
          />
          <Stepper
            id="wizard-children"
            label={t('children')}
            value={children.field.value}
            min={minChildren}
            max={maxChildren}
            onChange={(value) => {
              children.field.onChange(value)
              if (guestsError) void trigger(['adults', 'children'])
            }}
          />
        </div>
        {guestsError && <FieldError id="wizard-guests-error" message={guestsError} className="mt-0 w-full" />}
        {children.field.value > 0 && (
          <Field
            label={t('childAges')}
            hint={t('childAgesHint')}
            error={errors.childAges?.message}
            id="wizard-child-ages"
            className="w-full"
          >
            <Input variant="muted" className={fieldControl} placeholder={t('childAgesPlaceholder')} {...register('childAges')} />
          </Field>
        )}
      </div>

      {status}
      <div className={cn(ACTIONS, 'justify-end')}>
        <NextButton onClick={onNext}>{t('next')}</NextButton>
      </div>
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ step 2

export function StepDates({
  form,
  headingId,
  headingRef,
  status,
  onNext,
  onBack,
  windows,
  windowLabel,
  today,
  busy = [],
  calendar = null,
  onPickDate,
  onClearDates,
}: StepProps & {
  onNext: () => void
  onBack: () => void
  windows: readonly TravelWindowOption[]
  windowLabel: (value: string) => string
  /** 'YYYY-MM-DD' (from the server) — earliest selectable arrival date. */
  today: string
  /** The guide's busy ranges (admin availability) — a warning, never a block. */
  busy?: readonly BusyRange[]
  calendar?: AvailabilityCalendarDto | null
  onPickDate?: (iso: string) => void
  onClearDates?: () => void
}) {
  const t = useTranslations('contact.wizard.dates')
  const tw = useTranslations('contact.wizard')
  const [showCalendar, setShowCalendar] = useState(false)
  const {
    register,
    control,
    clearErrors,
    formState: { errors },
  } = form
  const durationError = errors.durationPreference?.message
  const paceError = errors.pace?.message
  const flexibility = useWatch({ control, name: 'flexibility' })
  const travelStart = useWatch({ control, name: 'travelStart' })
  const travelEnd = useWatch({ control, name: 'travelEnd' })
  const fixed = flexibility === 'fixed'
  const exactDays = fixed ? tripDays(travelStart, travelEnd) : null
  const clash = fixed && overlapsBusy(travelStart, travelEnd, busy)

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-space-xl">
      <StepHeader id={headingId} headingRef={headingRef} eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')} />

      <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
        {fixed ? (
          <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
            <Field label={t('arrival')} required error={errors.travelStart?.message} id="wizard-travel-start">
              <Input variant="muted" className={fieldControl} type="date" min={today} {...register('travelStart')} />
            </Field>
            <Field label={t('departure')} required error={errors.travelEnd?.message} id="wizard-travel-end">
              <Input
                variant="muted"
                className={fieldControl}
                type="date"
                min={travelStart || today}
                {...register('travelEnd')}
              />
            </Field>
          </div>
        ) : (
          <Field label={t('windowLabel')} required error={errors.travelWindow?.message} id="wizard-travel-window">
            <div className="relative">
              <Select variant="muted" className={cn(fieldControl, 'appearance-none pr-12')} {...register('travelWindow')}>
                <option value="" disabled>
                  {t('windowPlaceholder')}
                </option>
                {windows.map((w) => (
                  <option key={w.value} value={w.value}>
                    {windowLabel(w.value)}
                  </option>
                ))}
              </Select>
              <Icon
                name="calendar_month"
                className="pointer-events-none absolute right-space-md top-1/2 -translate-y-1/2 text-on-surface-variant"
              />
            </div>
          </Field>
        )}
        <Field label={t('flexibilityLabel')} error={errors.flexibility?.message} id="wizard-flexibility">
          <div className="relative">
            <Select
              variant="muted"
              className={cn(fieldControl, 'appearance-none pr-12')}
              {...register('flexibility', {
                onChange: () => clearErrors(['travelWindow', 'travelStart', 'travelEnd']),
              })}
            >
              {FLEXIBILITY_IDS.map((id) => (
                <option key={id} value={id}>
                  {t(`flexibility.${id}`)}
                </option>
              ))}
            </Select>
            <Icon
              name="sync_alt"
              className="pointer-events-none absolute right-space-md top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
          </div>
        </Field>
      </div>
      {clash && (
        <p role="status" className="-mt-space-md flex items-start gap-space-xs rounded-xl bg-secondary-fixed/40 p-space-md font-body-md text-body-md text-on-surface">
          <Icon name="event_busy" className="mt-0.5 shrink-0 text-secondary" />
          {t('busyWarning')}
        </p>
      )}

      {calendar && onPickDate && (
        <div className="flex flex-col gap-space-sm">
          <button
            type="button"
            aria-expanded={showCalendar}
            onClick={() => setShowCalendar((s) => !s)}
            className="inline-flex w-fit items-center gap-space-xs rounded-lg px-2 py-1 font-label-md text-label-md font-semibold text-primary transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Icon name="calendar_month" className="text-base text-secondary" />
            <span>{showCalendar ? t('calendarToggleHide') : t('calendarToggleShow')}</span>
            <Icon name={showCalendar ? 'expand_less' : 'expand_more'} className="text-base" />
          </button>
          {showCalendar && (
            <AvailabilityCalendar
              calendar={calendar}
              monthsToShow={1}
              selectedStart={fixed ? travelStart : ''}
              selectedEnd={fixed ? travelEnd : ''}
              onSelectDate={onPickDate}
              onClearSelection={onClearDates}
              selectionHint={
                fixed && travelStart
                  ? travelEnd
                    ? t('calendarSelectionRange', { start: travelStart, end: travelEnd })
                    : t('calendarSelectionStart', { start: travelStart })
                  : t('calendarSelectionEmpty')
              }
            />
          )}
        </div>
      )}

      {exactDays !== null ? (
        <p
          role="status"
          className="flex items-center gap-space-xs rounded-xl bg-surface-container-low px-space-md py-space-sm font-body-md text-body-md font-medium text-primary"
        >
          <Icon name="schedule" className="shrink-0 text-secondary" />
          {t('exactDurationBadge', { days: exactDays, nights: Math.max(0, exactDays - 1) })}
        </p>
      ) : (
        <fieldset aria-describedby={durationError ? 'wizard-duration-error' : undefined}>
          <GroupLegend>{t('durationLabel')}</GroupLegend>
          <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2 lg:grid-cols-3">
            {DURATION_IDS.map((id) => (
              <OptionCard
                key={id}
                title={t(`durations.${id}.title`)}
                body={t(`durations.${id}.body`)}
                className={id === 'flexible' ? 'sm:col-span-2 lg:col-span-2' : undefined}
                input={{ value: id, ...register('durationPreference') }}
              />
            ))}
          </div>
          {durationError && <FieldError id="wizard-duration-error" message={durationError} />}
        </fieldset>
      )}

      <fieldset aria-describedby={paceError ? 'wizard-pace-error' : undefined}>
        <GroupLegend>{t('paceLabel')}</GroupLegend>
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
          {PACE_IDS.map((id) => (
            <OptionCard
              key={id}
              tone="accent"
              title={t(`paces.${id}.title`)}
              body={t(`paces.${id}.body`)}
              input={{ value: id, ...register('pace') }}
            />
          ))}
        </div>
        {paceError && <FieldError id="wizard-pace-error" message={paceError} />}
      </fieldset>

      {status}
      <div className={cn(ACTIONS, 'justify-between gap-space-md')}>
        <BackButton onClick={onBack}>{tw('back')}</BackButton>
        <NextButton onClick={onNext}>{t('next')}</NextButton>
      </div>
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ step 3

export function StepPassions({
  form,
  headingId,
  headingRef,
  status,
  onNext,
  onBack,
  extraInterests,
  tours = [],
  destinations = [],
  about = null,
}: StepProps & {
  onNext: () => void
  onBack: () => void
  extraInterests: readonly string[]
  tours?: readonly TourPickerOption[]
  destinations?: readonly DestinationPickerOption[]
  about?: { kind: 'tour' | 'destination'; title: string } | null
}) {
  const t = useTranslations('contact.wizard.passions')
  const tw = useTranslations('contact.wizard')
  const {
    control,
    register,
    formState: { errors },
  } = form
  const selectedTour = useWatch({ control, name: 'tourSlug' })
  const destinationsCtrl = useController({ control, name: 'destinations' })
  const selectedDestinations = destinationsCtrl.field.value
  const [showDestinations, setShowDestinations] = useState(false)
  const interestsError = errors.interests?.message ?? errors.interests?.root?.message
  const destinationsError = errors.destinations?.message ?? errors.destinations?.root?.message
  const stayError = errors.stayStyle?.message
  const budgetError = errors.budgetTier?.message

  const destinationNames = new Map(destinations.map((d) => [d.slug, d.name]))
  const toggleDestination = (slug: string) => {
    if (selectedDestinations.includes(slug)) {
      destinationsCtrl.field.onChange(selectedDestinations.filter((s) => s !== slug))
      return
    }
    if (selectedDestinations.length < 15) {
      destinationsCtrl.field.onChange([...selectedDestinations, slug])
    }
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-space-xl">
      <StepHeader id={headingId} headingRef={headingRef} eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')} />

      <fieldset aria-describedby={interestsError ? 'wizard-interests-error' : undefined}>
        <legend className="sr-only">{t('interestsLabel')}</legend>
        <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2 md:grid-cols-3">
          {INTEREST_OPTIONS.map((option) => (
            <InterestChip
              key={option.id}
              icon={option.icon}
              label={t(`interests.${option.id}`)}
              input={{ value: option.id, ...register('interests') }}
            />
          ))}
          {extraInterests.map((value) => (
            <InterestChip
              key={value}
              icon="star"
              label={extraInterestLabel(value)}
              input={{ value, ...register('interests') }}
            />
          ))}
        </div>
        {interestsError && <FieldError id="wizard-interests-error" message={interestsError} />}
      </fieldset>

      {(tours.length > 0 || destinations.length > 0 || selectedTour || selectedDestinations.length > 0) && (
        <div className="grid grid-cols-1 gap-space-md rounded-xl bg-surface-container-low p-space-md md:grid-cols-2">
          <Field label={t('tourLabel')} error={errors.tourSlug?.message} id="wizard-tour">
            <div className="relative">
              <Select variant="muted" className={cn(fieldControl, 'appearance-none bg-surface-container-lowest pr-12')} {...register('tourSlug')}>
                <option value="">{t('tourPlaceholder')}</option>
                {selectedTour && !tours.some((item) => item.slug === selectedTour) && (
                  <option value={selectedTour}>{about?.kind === 'tour' ? about.title : selectedTour}</option>
                )}
                {tours.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {t('tourOption', { title: item.title, days: item.durationDays })}
                  </option>
                ))}
              </Select>
              <Icon
                name="route"
                className="pointer-events-none absolute right-space-md top-1/2 -translate-y-1/2 text-on-surface-variant"
              />
            </div>
          </Field>

          <div className="flex flex-col gap-space-xs">
            <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              {t('destinationsLabel')}
            </span>
            {selectedDestinations.length > 0 && !showDestinations && (
              <div className="flex flex-wrap gap-1.5">
                {selectedDestinations.map((slug) => (
                  <span
                    key={slug}
                    className="inline-flex items-center gap-1 rounded-full bg-tertiary-container px-3 py-1 font-caption text-caption font-medium text-on-tertiary"
                  >
                    <span>
                      {destinationNames.get(slug) ??
                        (about?.kind === 'destination' ? about.title : slug)}
                    </span>
                    <button
                      type="button"
                      aria-label={slug}
                      onClick={() => toggleDestination(slug)}
                      className="rounded-full p-0.5 hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Icon name="close" className="text-xs" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <button
              type="button"
              aria-expanded={showDestinations}
              onClick={() => setShowDestinations((s) => !s)}
              className="inline-flex w-fit items-center gap-space-xs rounded-xl bg-surface-container-lowest px-space-md py-space-sm font-body-md text-body-md font-medium text-primary shadow-sm transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Icon name="location_on" className="text-base text-secondary" />
              <span>
                {showDestinations
                  ? t('destinationsHide')
                  : selectedDestinations.length > 0
                    ? t('destinationsShow', { count: selectedDestinations.length })
                    : t('destinationsShowNone')}
              </span>
              <Icon name={showDestinations ? 'expand_less' : 'expand_more'} className="text-base" />
            </button>
            {showDestinations && (
              <div className="mt-space-xs flex flex-wrap gap-1.5 rounded-xl bg-surface-container-lowest p-space-sm">
                {destinations.length === 0 ? (
                  <p className="font-caption text-caption text-on-surface-variant">{t('destinationsEmpty')}</p>
                ) : (
                  destinations.map((dest) => {
                    const active = selectedDestinations.includes(dest.slug)
                    return (
                      <button
                        key={dest.slug}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleDestination(dest.slug)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-caption text-caption font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                          active
                            ? 'bg-tertiary-container text-on-tertiary'
                            : 'bg-surface-container-low text-on-surface hover:bg-surface-container',
                        )}
                      >
                        {active && <Icon name="check" className="text-xs" />}
                        <span>{dest.name}</span>
                      </button>
                    )
                  })
                )}
              </div>
            )}
            {destinationsError && <FieldError id="wizard-destinations-error" message={destinationsError} />}
          </div>
        </div>
      )}

      <fieldset aria-describedby={stayError ? 'wizard-stay-error' : undefined}>
        <GroupLegend>{t('stayLabel')}</GroupLegend>
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
          {STAY_OPTIONS.map((option) => (
            <StayCard
              key={option.id}
              icon={option.icon}
              title={t(`stays.${option.id}.title`)}
              body={t(`stays.${option.id}.body`)}
              input={{ value: option.id, ...register('stayStyle') }}
            />
          ))}
        </div>
        {stayError && <FieldError id="wizard-stay-error" message={stayError} />}
      </fieldset>

      <fieldset aria-describedby={budgetError ? 'wizard-budget-error' : undefined}>
        <GroupLegend>{t('budgetLabel')}</GroupLegend>
        <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
          {BUDGET_OPTIONS.map((option) => (
            <OptionCard
              key={option.id}
              title={t(`budgets.${option.id}.title`)}
              body={t(`budgets.${option.id}.body`)}
              className={option.id === 'undecided' ? 'sm:col-span-2' : undefined}
              input={{ value: option.id, ...register('budgetTier') }}
            />
          ))}
        </div>
        {budgetError && <FieldError id="wizard-budget-error" message={budgetError} />}
      </fieldset>

      {status}
      <div className={cn(ACTIONS, 'justify-between gap-space-md')}>
        <BackButton onClick={onBack}>{tw('back')}</BackButton>
        <NextButton onClick={onNext}>{t('next')}</NextButton>
      </div>
    </section>
  )
}

/** Error line under a card group (translated validation key or the API's message). */
function FieldError({ id, message, className }: { id: string; message: string; className?: string }) {
  const text = useFieldErrorText(message)
  return (
    <p id={id} className={cn('mt-space-sm flex items-center gap-1 font-caption text-caption text-error', className)}>
      <Icon name="error" className="text-sm" />
      {text}
    </p>
  )
}

// ------------------------------------------------------------------------------------------------ step 4

export function StepDetails({
  form,
  headingId,
  headingRef,
  status,
  onBack,
  submitting,
  turnstileReset,
  countries = [],
  tours = [],
  destinations = [],
  windowLabel,
  onEditStep,
}: StepProps & {
  onBack: () => void
  submitting: boolean
  turnstileReset?: number
  countries?: readonly CountryOption[]
  tours?: readonly TourPickerOption[]
  destinations?: readonly DestinationPickerOption[]
  windowLabel?: (value: string) => string
  onEditStep?: (step: number) => void
}) {
  const t = useTranslations('contact.wizard.details')
  const tw = useTranslations('contact.wizard')
  const {
    register,
    setValue,
    clearErrors,
    control,
    formState: { errors },
  } = form
  const locale = useLocale()
  const code = useWatch({ control, name: 'whatsappCode' })
  const number = useWatch({ control, name: 'whatsappNumber' })
  const preferredContact = useWatch({ control, name: 'preferredContact' })
  const all = useWatch({ control })
  const phoneRequired = preferredContact === 'whatsapp' || preferredContact === 'call'
  const preview = combineWhatsApp(code, number ?? '')
  // Once the visitor picks a code themselves, the country field no longer changes it.
  const [codeChosen, setCodeChosen] = useState(false)
  const countryField = register('country', {
    onChange: (event: { target: { value: string } }) => {
      if (codeChosen) return
      const next = callingCodeForRegion(regionFromCountryName(event.target.value, [locale, 'en']))
      if (next && next !== code) setValue('whatsappCode', next, { shouldDirty: true })
    },
  })

  const adultsCount = all.adults ?? 2
  const childrenCount = all.children ?? 0
  const partyTitle = all.partyType ? tw(`party.options.${all.partyType}.title`) : t('summaryNone')
  const partySummary = `${partyTitle} · ${adultsCount} ${tw('party.adults')}${
    childrenCount > 0
      ? `, ${childrenCount} ${tw('party.children')}${all.childAges?.trim() ? ` (${all.childAges.trim()})` : ''}`
      : ''
  }`

  const fixedDates = all.flexibility === 'fixed'
  const exactDays =
    fixedDates && all.travelStart && all.travelEnd ? tripDays(all.travelStart, all.travelEnd) : null
  const whenSummary = fixedDates
    ? all.travelStart && all.travelEnd
      ? `${all.travelStart} → ${all.travelEnd}`
      : all.travelStart || t('summaryNone')
    : all.travelWindow && windowLabel
      ? windowLabel(all.travelWindow)
      : t('summaryNone')
  const lengthSummary = exactDays
    ? tw('dates.exactDurationValue', { days: exactDays, nights: Math.max(0, exactDays - 1) })
    : all.durationPreference
      ? tw(`dates.durations.${all.durationPreference}.title`)
      : ''
  const paceSummary = all.pace && all.pace !== 'undecided' ? tw(`dates.paces.${all.pace}.title`) : ''
  const timingSummary = [whenSummary, lengthSummary, paceSummary].filter(Boolean).join(' · ')

  const tourTitle = all.tourSlug
    ? (tours.find((item) => item.slug === all.tourSlug)?.title ?? all.tourSlug)
    : ''
  const destSummary = (all.destinations ?? [])
    .map((slug) => destinations.find((d) => d.slug === slug)?.name ?? slug)
    .join(', ')
  const interestSummary = (all.interests ?? [])
    .map((id) => {
      const match = INTEREST_OPTIONS.find((o) => o.id === id)
      return match ? tw(`passions.interests.${match.id}`) : extraInterestLabel(id)
    })
    .join(', ')
  const staySummary = all.stayStyle && all.stayStyle !== 'undecided' ? tw(`passions.stays.${all.stayStyle}.title`) : ''
  const budgetSummary =
    all.budgetTier && all.budgetTier !== 'undecided' ? tw(`passions.budgets.${all.budgetTier}.title`) : ''
  const styleSummary =
    [tourTitle, destSummary, interestSummary, staySummary, budgetSummary].filter(Boolean).join(' · ') ||
    t('summaryNone')

  const summaryRows = [
    { step: 0, label: t('summaryParty'), value: partySummary },
    { step: 1, label: t('summaryTiming'), value: timingSummary },
    { step: 2, label: t('summaryStyle'), value: styleSummary },
  ]

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-space-xl">
      <StepHeader id={headingId} headingRef={headingRef} eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')} />

      <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
        <Field label={t('name')} required error={errors.name?.message} id="wizard-name">
          <Input
            variant="muted"
            className={fieldControl}
            autoComplete="name"
            placeholder={t('namePlaceholder')}
            {...register('name')}
          />
        </Field>
        <Field label={t('email')} required error={errors.email?.message} id="wizard-email">
          <Input
            variant="muted"
            className={fieldControl}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t('emailPlaceholder')}
            {...register('email')}
          />
        </Field>
        <Field
          label={t('whatsapp')}
          required={phoneRequired}
          error={errors.whatsappNumber?.message ?? errors.whatsappCode?.message}
          hint={
            preview && /\d{5,}/.test(preview.replace(/\D/g, ''))
              ? t('whatsappPreview', { number: preview })
              : code === 'other'
                ? t('whatsappOtherHint')
                : phoneRequired
                  ? t('whatsappRequiredHint')
                  : t('whatsappOptionalHint')
          }
          id="wizard-whatsapp"
        >
          <div className="flex items-center gap-space-xs">
            <select
              aria-label={t('whatsappCode')}
              autoComplete="tel-country-code"
              className="w-24 shrink-0 cursor-pointer rounded-xl bg-surface-container-low px-space-sm py-space-md font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              {...register('whatsappCode', { onChange: () => setCodeChosen(true) })}
            >
              {CALLING_CODES.map((c) => (
                <option key={c.key} value={c.code}>
                  {t(`codes.${c.key}`)}
                </option>
              ))}
            </select>
            <Input
              variant="muted"
              className={fieldControl}
              type="tel"
              inputMode="tel"
              autoComplete={code === 'other' ? 'tel' : 'tel-national'}
              placeholder={code === 'other' ? '+353 85 123 4567' : t('whatsappPlaceholder')}
              {...register('whatsappNumber')}
            />
          </div>
        </Field>
        <Field label={t('country')} error={errors.country?.message} id="wizard-country">
          <Input
            variant="muted"
            className={fieldControl}
            autoComplete="country-name"
            list={countries.length > 0 ? 'wizard-country-list' : undefined}
            placeholder={t('countryPlaceholder')}
            {...countryField}
          />
          {countries.length > 0 && (
            <datalist id="wizard-country-list">
              {countries.map((c) => (
                <option key={c.value} value={c.label} />
              ))}
            </datalist>
          )}
        </Field>
      </div>

      <fieldset aria-describedby={errors.preferredContact?.message ? 'wizard-contact-method-error' : undefined}>
        <GroupLegend>{t('preferredContactLabel')}</GroupLegend>
        <div className="grid grid-cols-1 gap-space-xs sm:grid-cols-2 lg:grid-cols-4">
          {CONTACT_METHOD_OPTIONS.map((option) => (
            <label key={option.id} className="cursor-pointer">
              <input
                type="radio"
                className="peer sr-only"
                value={option.id}
                {...register('preferredContact', { onChange: () => clearErrors('whatsappNumber') })}
              />
              <div className="flex h-full items-center gap-space-xs rounded-xl bg-surface-container-low px-space-md py-space-sm font-body-md text-body-md font-medium text-on-surface shadow-sm transition-all peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2">
                <Icon name={option.icon} className="shrink-0 text-base" />
                <span>{t(`contactMethods.${option.id}`)}</span>
              </div>
            </label>
          ))}
        </div>
        {errors.preferredContact?.message && (
          <FieldError id="wizard-contact-method-error" message={errors.preferredContact.message} />
        )}
      </fieldset>

      <Field label={t('message')} error={errors.message?.message} id="wizard-message">
        <Textarea
          variant="muted"
          rows={4}
          className={cn(fieldControl, 'resize-none p-space-md')}
          placeholder={t('messagePlaceholder')}
          {...register('message')}
        />
      </Field>

      <div className="flex flex-col gap-space-sm rounded-xl border border-outline-variant/40 bg-surface-container-low p-space-md">
        <span className="font-label-md text-label-md uppercase tracking-wider text-primary">{t('summaryTitle')}</span>
        <dl className="flex flex-col gap-space-xs">
          {summaryRows.map((row) => (
            <div key={row.step} className="flex items-start justify-between gap-space-sm border-b border-surface-container pb-space-xs last:border-b-0 last:pb-0">
              <div className="min-w-0">
                <dt className="font-caption text-caption font-semibold text-on-surface-variant">{row.label}</dt>
                <dd className="break-words font-body-md text-body-md text-on-surface">{row.value}</dd>
              </div>
              {onEditStep && (
                <button
                  type="button"
                  onClick={() => onEditStep(row.step)}
                  className="shrink-0 rounded font-caption text-caption font-semibold text-primary underline underline-offset-4 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {t('summaryEdit')}
                </button>
              )}
            </div>
          ))}
        </dl>
      </div>

      <div className="flex items-start gap-space-sm rounded-xl bg-surface-container p-space-md">
        <Icon name="lock" className="mt-0.5 shrink-0 text-secondary" />
        <div className="flex flex-col">
          <span className="font-body-md text-body-md font-semibold text-primary">{t('guaranteeTitle')}</span>
          <span className="mt-0.5 font-caption text-caption text-on-surface-variant">{t('guaranteeBody')}</span>
        </div>
      </div>

      <p className="font-caption text-caption text-on-surface-variant">
        {t('privacyBefore')}
        <Link
          href="/privacy"
          target="_blank"
          className="font-semibold text-primary underline underline-offset-4 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t('privacyLink')}
        </Link>
        {t('privacyAfter')}
      </p>

      <Honeypot {...register('website')} />
      <Turnstile action="inquiry" onToken={(token) => setValue('turnstileToken', token)} resetKey={turnstileReset} />

      {status}
      <div className="flex flex-col items-center justify-between gap-space-md pt-space-sm sm:flex-row">
        <BackButton onClick={onBack} className="order-2 sm:order-1">
          {t('back')}
        </BackButton>
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting || undefined}
          className="order-1 inline-flex w-full items-center justify-center gap-space-sm rounded-xl bg-secondary px-space-xl py-space-md text-center font-headline-sm text-headline-sm text-on-secondary shadow-xl transition-all hover:bg-on-secondary-fixed-variant hover:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-80 sm:order-2 sm:w-auto"
        >
          <Icon name={submitting ? 'progress_activity' : 'send'} className={cn(submitting && 'animate-spin')} />
          <span>{submitting ? t('submitting') : t('submit')}</span>
        </button>
      </div>
    </section>
  )
}
