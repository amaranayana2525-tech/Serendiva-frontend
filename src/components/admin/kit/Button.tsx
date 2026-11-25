'use client'

import NextLink from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

export type AdminButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerGhost' | 'whatsapp' | 'link'
export type AdminButtonSize = 'sm' | 'md' | 'lg'

const variants: Record<AdminButtonVariant, string> = {
  primary: 'bg-primary text-on-primary shadow-sm hover:bg-primary-container',
  secondary:
    'border border-outline-variant bg-surface-container-lowest text-primary shadow-sm hover:border-primary/40 hover:bg-surface-container-low',
  ghost: 'text-primary hover:bg-surface-container',
  danger: 'bg-secondary text-on-secondary shadow-sm hover:bg-on-secondary-fixed-variant',
  dangerGhost: 'text-secondary hover:bg-secondary-fixed/50',
  whatsapp: 'bg-tertiary-container text-on-tertiary shadow-sm hover:bg-tertiary',
  link: 'text-primary underline-offset-4 hover:text-secondary hover:underline',
}

const sizes: Record<AdminButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-[13px]',
  md: 'h-10 gap-2 rounded-lg px-4 text-body-md',
  lg: 'h-12 gap-2 rounded-xl px-5 text-body-lg',
}
const iconSizes: Record<AdminButtonSize, string> = { sm: 'text-[16px]', md: 'text-[18px]', lg: 'text-[20px]' }

const base =
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap font-body-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50'

interface CommonProps {
  variant?: AdminButtonVariant
  size?: AdminButtonSize
  /** Leading Material Symbols icon. */
  icon?: string
  /** Trailing icon. */
  iconEnd?: string
  /** Spinner + disabled. */
  loading?: boolean
  fullWidth?: boolean
  className?: string
  children?: ReactNode
}

type AsButton = CommonProps & Omit<ComponentProps<'button'>, keyof CommonProps> & { href?: undefined }
type AsLink = CommonProps &
  Omit<ComponentProps<'a'>, keyof CommonProps | 'href'> & {
    /** Internal admin path (next/link) or external/mailto/tel URL (<a>). */
    href: string
    /** Open in a new tab (auto for http(s) URLs). */
    external?: boolean
  }

export type AdminButtonProps = AsButton | AsLink

const isExternal = (href: string) => /^(https?:|mailto:|tel:|\/\/)/.test(href) || href.startsWith('/api/')

/** Admin button (teal primary, outline secondary, ghost, cinnamon danger, WhatsApp green, link) as <button> or link. */
export function Button(props: AdminButtonProps) {
  const {
    variant = 'secondary',
    size = 'md',
    icon,
    iconEnd,
    loading = false,
    fullWidth = false,
    className,
    children,
  } = props
  const classes = cn(
    base,
    variant === 'link' ? 'h-auto gap-1 p-0 text-body-md' : sizes[size],
    variants[variant],
    fullWidth && 'w-full',
    className,
  )
  const content = (
    <>
      {loading ? (
        <Icon name="progress_activity" className={cn('animate-spin', iconSizes[size])} />
      ) : (
        icon && <Icon name={icon} className={iconSizes[size]} />
      )}
      {children}
      {iconEnd && <Icon name={iconEnd} className={iconSizes[size]} />}
    </>
  )

  if (props.href !== undefined) {
    const {
      href,
      external,
      variant: _v,
      size: _s,
      icon: _i,
      iconEnd: _ie,
      loading: _l,
      fullWidth: _f,
      className: _c,
      children: _ch,
      ...rest
    } = props
    if (external || isExternal(href)) {
      const newTab = external || /^(https?:|\/\/)/.test(href)
      return (
        <a href={href} className={classes} {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
          {content}
        </a>
      )
    }
    return (
      <NextLink href={href} className={classes} {...rest}>
        {content}
      </NextLink>
    )
  }

  const {
    type = 'button',
    disabled,
    variant: _v,
    size: _s,
    icon: _i,
    iconEnd: _ie,
    loading: _l,
    fullWidth: _f,
    className: _c,
    children: _ch,
    href: _h,
    ...rest
  } = props
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={classes} {...rest}>
      {content}
    </button>
  )
}

export interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  /** Material Symbols name. */
  icon: string
  /** Accessible name (also the tooltip). */
  label: string
  variant?: 'ghost' | 'secondary' | 'primary' | 'danger'
  size?: 'sm' | 'md'
  filled?: boolean
}

const iconButtonVariants = {
  ghost: 'text-on-surface-variant hover:bg-surface-container hover:text-primary',
  secondary: 'border border-outline-variant bg-surface-container-lowest text-primary hover:bg-surface-container-low',
  primary: 'bg-primary text-on-primary hover:bg-primary-container',
  danger: 'text-secondary hover:bg-secondary-fixed/50',
} as const

/** Square icon-only button with an accessible label + title tooltip. */
export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  filled,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-40',
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
        iconButtonVariants[variant],
        className,
      )}
      {...rest}
    >
      <Icon name={icon} filled={filled} className={size === 'sm' ? 'text-[18px]' : 'text-[20px]'} />
    </button>
  )
}
