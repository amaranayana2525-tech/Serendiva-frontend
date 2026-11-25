'use client'

import { useId, useState, type FormEvent } from 'react'
import { useRouter } from '@/i18n/navigation'
import type { PartyType } from '@/lib/api/types'
import { contactHref } from '@/lib/prefill'
import { Icon } from '@/components/ui/Icon'

export interface QuickInquiryOption {
  value: string
  label: string
}

export interface QuickInquiryPartyOption {
  party: PartyType
  label: string
}

export interface QuickInquiryBarProps {
  /** Locale-aware /contact path — the form still works as a plain GET form without JavaScript. */
  action: string
  /** Expedition focus: category slugs (value '' = open to suggestions). */
  focusOptions: QuickInquiryOption[]
  /** Travel month windows (value = the window label sent as `month`). */
  windowOptions: QuickInquiryOption[]
  partyOptions: QuickInquiryPartyOption[]
  labels: { form: string; focus: string; month: string; party: string; submit: string; submitHint: string }
  /** Stored as the inquiry's source page. */
  source?: string
}

const SELECT =
  'w-full min-w-0 cursor-pointer appearance-none rounded-xl bg-surface-container px-space-md py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary'
const LABEL = 'flex items-center gap-1 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant'

/** Hero quick-inquiry strip: focus · month window · party size → "Get My Plan" opens /contact prefilled. */
export function QuickInquiryBar({
  action,
  focusOptions,
  windowOptions,
  partyOptions,
  labels,
  source = 'home-hero',
}: QuickInquiryBarProps) {
  const router = useRouter()
  const id = useId()
  const [focus, setFocus] = useState(focusOptions[0]?.value ?? '')
  const [month, setMonth] = useState(windowOptions[0]?.value ?? '')
  const [party, setParty] = useState<PartyType>(partyOptions[0]?.party ?? 'couple')

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    router.push(
      contactHref({
        interests: focus ? [focus] : undefined,
        month: month || undefined,
        party,
        source,
      }),
    )
  }

  return (
    <div className="rounded-2xl bg-surface p-space-md shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
      <form
        action={action}
        method="get"
        aria-label={labels.form}
        onSubmit={onSubmit}
        className="grid grid-cols-1 items-center gap-space-md sm:grid-cols-2 lg:grid-cols-4"
      >
        <input type="hidden" name="source" value={source} />
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-focus`} className={LABEL}>
            <Icon name="interests" className="text-sm text-secondary" />
            {labels.focus}
          </label>
          <select
            id={`${id}-focus`}
            name="interests"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            className={SELECT}
          >
            {focusOptions.map((o) => (
              <option key={o.value || 'open'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-month`} className={LABEL}>
            <Icon name="calendar_month" className="text-sm text-secondary" />
            {labels.month}
          </label>
          <select
            id={`${id}-month`}
            name="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className={SELECT}
          >
            {windowOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-party`} className={LABEL}>
            <Icon name="group" className="text-sm text-secondary" />
            {labels.party}
          </label>
          <select
            id={`${id}-party`}
            name="party"
            value={party}
            onChange={(e) => setParty(e.target.value as PartyType)}
            className={SELECT}
          >
            {partyOptions.map((o) => (
              <option key={o.party} value={o.party}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end pt-2 lg:pt-0">
          <button
            type="submit"
            aria-describedby={`${id}-hint`}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-space-lg py-3 font-label-lg text-label-lg uppercase tracking-wider text-on-primary shadow-md transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <span>{labels.submit}</span>
            <Icon name="arrow_forward" className="text-sm" />
          </button>
          <span id={`${id}-hint`} className="sr-only">
            {labels.submitHint}
          </span>
        </div>
      </form>
    </div>
  )
}
