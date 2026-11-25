import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from './Icon'

const variants = {
  /** Frosted label on photos (tour/blog card category). Override text colour with className (text-tertiary …). */
  glass: 'bg-surface/90 backdrop-blur-md text-primary font-semibold',
  /** Cinnamon highlight ("★ Most Popular"). */
  accent: 'bg-secondary text-on-secondary shadow-md font-bold tracking-wider',
  /** Teal glass (durations on images). */
  dark: 'bg-primary/80 backdrop-blur-md text-on-primary tracking-wider',
  /** Curated tea-green badge (DESIGN.md: tea green 15%). */
  green: 'bg-tertiary-container/15 text-tertiary',
  /** Licence seal: soft-gold outline on sand. */
  gold: 'border border-[rgba(201,162,75,0.6)] bg-surface text-primary',
  /** Neutral sand. */
  sand: 'bg-surface-container text-primary',
} as const

export interface BadgeProps extends ComponentProps<'span'> {
  variant?: keyof typeof variants
  icon?: string
  iconFilled?: boolean
  /** Uppercase label-md (default) or normal case. */
  uppercase?: boolean
}

/** Pill badge used on cards and heroes (label-md, uppercase). */
export function Badge({
  variant = 'glass',
  icon,
  iconFilled,
  uppercase = true,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-space-sm py-1 font-label-md text-label-md',
        uppercase && 'uppercase',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} filled={iconFilled} className="text-sm" />}
      {children}
    </span>
  )
}
