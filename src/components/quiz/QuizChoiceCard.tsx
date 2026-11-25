'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'

export interface QuizChoiceCardProps {
  type: 'radio' | 'checkbox'
  name: string
  value: string
  checked: boolean
  onChange: () => void
  /** id of the visible option title (accessible name). */
  labelledBy: string
  /** ids of the description / tag (accessible description). */
  describedBy?: string
  /** Multi-select limit reached: still focusable, announced as unavailable, visually dimmed. */
  unavailable?: boolean
  /** Stitch card classes (background, radius, padding, grid span…). */
  className: string
  testId?: string
  children: ReactNode
}

/**
 * One answer card: a native radio/checkbox (visually hidden, so arrow keys / Space work as usual) wrapped in the
 * Stitch card. Selected = `ring-2 ring-primary`; keyboard focus adds a cinnamon ring with offset.
 */
export function QuizChoiceCard({
  type,
  name,
  value,
  checked,
  onChange,
  labelledBy,
  describedBy,
  unavailable = false,
  className,
  testId,
  children,
}: QuizChoiceCardProps) {
  return (
    <label
      data-testid={testId}
      data-selected={checked}
      className={cn(
        'relative block',
        className,
        checked && 'ring-2 ring-primary',
        unavailable && 'opacity-60',
        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-secondary has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-surface',
      )}
    >
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-disabled={unavailable || undefined}
        className="sr-only"
      />
      {children}
    </label>
  )
}

/** Radio / checkbox state icon from the Stitch cards. */
export function QuizChoiceIndicator({
  type,
  checked,
  className,
}: {
  type: 'radio' | 'checkbox'
  checked: boolean
  className?: string
}) {
  const name =
    type === 'radio'
      ? checked
        ? 'check_circle'
        : 'radio_button_unchecked'
      : checked
        ? 'check_box'
        : 'check_box_outline_blank'
  return (
    <Icon
      name={name}
      filled={checked}
      className={cn('shrink-0', checked ? 'text-primary' : 'text-outline-variant', className)}
    />
  )
}
