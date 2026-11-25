'use client'

import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
  /** Visually hide the label (e.g. inline table toggles) — still announced. */
  hideLabel?: boolean
  size?: 'sm' | 'md'
  id?: string
  className?: string
}

/** Accessible on/off toggle (`role="switch"`), label on the right. */
export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  hideLabel,
  size = 'md',
  id,
  className,
}: SwitchProps) {
  const generated = useId()
  const switchId = id ?? `sw${generated.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const descId = description ? `${switchId}-desc` : undefined
  const small = size === 'sm'
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={descId}
        aria-label={hideLabel && typeof label === 'string' ? label : undefined}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          small ? 'h-5 w-9' : 'h-6 w-11',
          checked ? 'bg-primary' : 'bg-outline-variant',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'inline-block rounded-full bg-surface-container-lowest shadow transition-transform',
            small ? 'h-4 w-4' : 'h-5 w-5',
            checked ? (small ? 'translate-x-[18px]' : 'translate-x-[22px]') : 'translate-x-0.5',
          )}
        />
      </button>
      {!(hideLabel && typeof label === 'string') && (
        <div className={cn('flex flex-col', hideLabel && 'sr-only')}>
          <label htmlFor={switchId} className="cursor-pointer font-body-md text-body-md font-medium text-on-surface">
            {label}
          </label>
          {description && (
            <span id={descId} className="font-caption text-caption text-on-surface-variant">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
