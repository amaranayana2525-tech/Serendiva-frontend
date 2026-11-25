'use client'

import type { ComponentProps, ReactNode, RefObject } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'

/*
 * Stitch-styled building blocks of the /contact wizard. The selectable cards keep the Stitch markup
 * (sr-only `peer` input + sibling card) and add a visible keyboard focus ring.
 */

/** Focus ring for the card that follows an sr-only peer input. */
export const peerFocus =
  'peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-container-lowest'

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest'

export interface StepHeaderProps {
  id: string
  eyebrow: string
  title: string
  intro: string
  headingRef?: RefObject<HTMLHeadingElement | null>
}

/** Eyebrow + h2 (focus target when the step changes) + intro. */
export function StepHeader({ id, eyebrow, title, intro, headingRef }: StepHeaderProps) {
  return (
    <div>
      <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">{eyebrow}</span>
      <h2
        id={id}
        ref={headingRef}
        tabIndex={-1}
        className="mt-space-xs scroll-mt-28 font-headline-md text-headline-md text-primary focus:outline-none"
      >
        {title}
      </h2>
      <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{intro}</p>
    </div>
  )
}

/** Uppercase label above a group of cards (rendered as the fieldset legend). */
export function GroupLegend({ children }: { children: ReactNode }) {
  return (
    <legend className="mb-space-sm font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
      {children}
    </legend>
  )
}

type InputProps = Omit<ComponentProps<'input'>, 'type' | 'className'>

/** Step 1 party card (icon + check dot + title + caption; turns teal when selected). */
export function PartyCard({
  icon,
  title,
  body,
  className,
  input,
}: {
  icon: string
  title: string
  body: string
  className?: string
  input: InputProps
}) {
  return (
    <label className={cn('group relative cursor-pointer', className)}>
      <input type="radio" className="peer sr-only" {...input} />
      <div
        className={cn(
          'flex h-full flex-col justify-between rounded-xl bg-surface-container-low p-space-md shadow-sm transition-all duration-200 peer-checked:bg-primary peer-checked:text-on-primary',
          peerFocus,
        )}
      >
        <div className="flex items-start justify-between">
          <Icon
            name={icon}
            className="text-2xl text-primary transition-transform group-hover:scale-110 group-has-[:checked]:text-on-primary"
          />
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-surface-container-high group-has-[:checked]:bg-surface-tint">
            <Icon name="check" className="text-xs text-on-primary" />
          </div>
        </div>
        <div className="mt-space-md">
          <div className="font-headline-sm text-headline-sm font-semibold">{title}</div>
          <p className="mt-1 font-caption text-caption opacity-80">{body}</p>
        </div>
      </div>
    </label>
  )
}

/** Title + caption card (duration, pace). `tone="accent"` = cinnamon selection (pace). */
export function OptionCard({
  title,
  body,
  tone = 'primary',
  className,
  input,
}: {
  title: string
  body: string
  tone?: 'primary' | 'accent'
  className?: string
  input: InputProps
}) {
  return (
    <label className={cn('cursor-pointer', className)}>
      <input type="radio" className="peer sr-only" {...input} />
      <div
        className={cn(
          'h-full rounded-xl bg-surface-container-low p-space-md shadow-sm transition-all',
          tone === 'primary'
            ? 'peer-checked:bg-primary peer-checked:text-on-primary'
            : 'peer-checked:bg-secondary-container peer-checked:text-on-secondary-container',
          peerFocus,
        )}
      >
        <span className="block font-headline-sm text-headline-sm">{title}</span>
        <span className={cn('block font-caption text-caption', tone === 'primary' ? 'opacity-80' : 'mt-1 opacity-85')}>
          {body}
        </span>
      </div>
    </label>
  )
}

/** Step 3 stay-style card (icon + title + caption). */
export function StayCard({
  icon,
  title,
  body,
  input,
}: {
  icon: string
  title: string
  body: string
  input: InputProps
}) {
  return (
    <label className="cursor-pointer">
      <input type="radio" className="peer sr-only" {...input} />
      <div
        className={cn(
          'h-full rounded-xl bg-surface-container-low p-space-md shadow-sm transition-all peer-checked:bg-primary peer-checked:text-on-primary',
          peerFocus,
        )}
      >
        <div className="flex items-center gap-space-xs">
          <Icon name={icon} className="text-lg" />
          <span className="font-headline-sm text-headline-sm font-semibold">{title}</span>
        </div>
        <p className="mt-1 font-caption text-caption opacity-80">{body}</p>
      </div>
    </label>
  )
}

/** Step 3 multi-select interest chip (tea-green when checked). */
export function InterestChip({ icon, label, input }: { icon: string; label: string; input: InputProps }) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" className="peer sr-only" {...input} />
      <div
        className={cn(
          'flex h-full items-center gap-space-sm rounded-xl bg-surface-container-low p-space-sm shadow-sm transition-all peer-checked:bg-tertiary-container peer-checked:text-on-tertiary md:p-space-md',
          peerFocus,
        )}
      >
        <Icon name={icon} className="text-xl" />
        <span className="font-body-md text-body-md font-medium">{label}</span>
      </div>
    </label>
  )
}

export interface StepperProps {
  id: string
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

/** − value + counter (Stitch guest count) with labelled buttons and a live value. */
export function Stepper({ id, label, value, min, max, onChange }: StepperProps) {
  const t = useTranslations('common.form')
  const button =
    'tap-target relative flex h-8 w-8 items-center justify-center rounded-full bg-surface-container font-bold text-primary transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40 ' +
    focusRing
  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      className="flex items-center gap-space-sm rounded-xl bg-surface-container-lowest px-space-md py-space-xs shadow-sm"
    >
      <span id={`${id}-label`} className="font-label-md text-label-md uppercase text-on-surface-variant">
        {label}
      </span>
      <button
        type="button"
        className={button}
        aria-label={t('decrease', { label })}
        aria-controls={`${id}-value`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <span aria-hidden="true">-</span>
      </button>
      <output
        id={`${id}-value`}
        aria-live="polite"
        className="w-6 text-center font-headline-sm text-headline-sm text-primary"
      >
        {value}
      </output>
      <button
        type="button"
        className={button}
        aria-label={t('increase', { label })}
        aria-controls={`${id}-value`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  )
}

/** Teal "Continue to …" button (Stitch step action bar). */
export function NextButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-space-xs rounded-xl bg-primary px-space-xl py-space-md text-left font-label-lg text-label-lg tracking-wider text-on-primary shadow-md transition-all hover:bg-primary-container',
        focusRing,
      )}
    >
      <span>{children}</span>
      <Icon name="arrow_forward" className="text-sm" />
    </button>
  )
}

/** Quiet "← Back" text button. */
export function BackButton({
  children,
  onClick,
  className,
}: {
  children: ReactNode
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-space-xs rounded-lg font-label-lg text-label-lg text-on-surface-variant transition-colors hover:text-primary',
        focusRing,
        className,
      )}
    >
      <Icon name="arrow_back" className="text-sm" />
      <span>{children}</span>
    </button>
  )
}
