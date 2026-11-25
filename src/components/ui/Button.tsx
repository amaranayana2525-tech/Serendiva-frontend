import type { ComponentProps, ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { Icon } from './Icon'

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'whatsapp' | 'ghostLight' | 'soft' | 'light' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variantClasses: Record<ButtonVariant, string> = {
  // Deep Ocean Teal — main actions inside content
  primary: 'bg-primary text-on-primary shadow-sm hover:bg-primary-container',
  // Cinnamon — "Plan My Trip", "Send Inquiry", hero CTAs
  accent:
    'bg-secondary text-on-secondary shadow-[0_4px_16px_rgba(156,68,30,0.2)] hover:bg-on-secondary-fixed-variant hover:shadow-none',
  // Outline (bespoke inquiry secondary)
  secondary: 'border-[1.5px] border-primary bg-transparent text-primary hover:bg-surface-container',
  // Tea green WhatsApp
  whatsapp: 'bg-tertiary-container text-on-tertiary shadow-sm hover:bg-tertiary',
  // Frosted glass on photos / teal
  ghostLight: 'bg-surface/20 text-surface backdrop-blur-md hover:bg-surface/30',
  // Sand chip-like ("View Itinerary")
  soft: 'bg-surface-container text-primary hover:bg-surface-container-high',
  // White on sand / teal
  light: 'bg-surface text-primary shadow-sm hover:bg-surface-container',
  // Text link with arrow
  link: 'text-primary hover:text-secondary',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'gap-1.5 px-space-md py-2.5 font-label-md text-label-md coarse:min-h-11',
  md: 'gap-space-xs px-space-lg py-space-sm font-label-lg text-label-lg coarse:min-h-11',
  lg: 'gap-2 px-space-xl py-4 font-label-lg text-label-lg',
}

const iconSize: Record<ButtonSize, string> = { sm: 'text-sm', md: 'text-[18px]', lg: 'text-[20px]' }

type LinkHref = ComponentProps<typeof Link>['href']

interface CommonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  /** 'rounded' (lg/xl radius, default) or 'pill' (rounded-full, hero CTAs). */
  shape?: 'rounded' | 'pill'
  /** Uppercase + wider tracking (most in-content Stitch CTAs). */
  uppercase?: boolean
  fullWidth?: boolean
  /** Material Symbols names. */
  leadingIcon?: string
  trailingIcon?: string
  iconClassName?: string
  /** Shows a spinner and disables the button. */
  loading?: boolean
  className?: string
  children?: ReactNode
}

type ButtonOnlyProps = CommonProps & Omit<ComponentProps<'button'>, keyof CommonProps> & { href?: undefined }
type LinkOnlyProps = CommonProps &
  Omit<ComponentProps<'a'>, keyof CommonProps | 'href'> & {
    /** Internal path ('/tours', { pathname, query }) → locale-aware Link; http(s)/mailto/tel → <a>. */
    href: LinkHref
    /** Force <a target="_blank"> (auto for http/https links). */
    external?: boolean
    prefetch?: boolean
  }

export type ButtonProps = ButtonOnlyProps | LinkOnlyProps

const isExternalHref = (href: LinkHref) => typeof href === 'string' && /^(https?:|mailto:|tel:|\/\/)/.test(href)

/** Stitch button styles (teal / cinnamon / outline / WhatsApp / glass / soft / light / link) as <button> or link. */
export function Button(props: ButtonProps) {
  const t = useTranslations('common')
  const {
    variant = 'primary',
    size = 'md',
    shape = 'rounded',
    uppercase = false,
    fullWidth = false,
    leadingIcon,
    trailingIcon,
    iconClassName,
    loading = false,
    className,
    children,
  } = props

  const classes = cn(
    'inline-flex items-center justify-center text-center transition-all',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
    variant === 'ghostLight' ? 'focus-visible:ring-surface' : 'focus-visible:ring-primary',
    'disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60',
    variant !== 'link' && sizeClasses[size],
    variant === 'link' && 'tap-target relative gap-1 font-label-lg text-label-lg',
    variant !== 'link' && (shape === 'pill' ? 'rounded-full' : size === 'lg' ? 'rounded-xl' : 'rounded-lg'),
    uppercase && 'uppercase tracking-wider',
    fullWidth && 'w-full',
    variantClasses[variant],
    className,
  )

  const content = (
    <>
      {loading ? (
        <Icon name="progress_activity" className={cn('animate-spin', iconSize[size], iconClassName)} />
      ) : (
        leadingIcon && <Icon name={leadingIcon} className={cn(iconSize[size], iconClassName)} />
      )}
      {children}
      {trailingIcon && <Icon name={trailingIcon} className={cn(iconSize[size], iconClassName)} />}
    </>
  )

  if (props.href !== undefined) {
    const {
      href,
      external,
      prefetch,
      variant: _v,
      size: _s,
      shape: _sh,
      uppercase: _u,
      fullWidth: _f,
      leadingIcon: _li,
      trailingIcon: _ti,
      iconClassName: _ic,
      loading: _l,
      className: _c,
      children: _ch,
      ...anchorProps
    } = props
    if (external || isExternalHref(href)) {
      const newTab = external || (typeof href === 'string' && /^(https?:|\/\/)/.test(href))
      return (
        <a
          href={typeof href === 'string' ? href : (href.pathname ?? '#')}
          className={classes}
          {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          {...anchorProps}
        >
          {content}
          {newTab && <span className="sr-only"> {t('a11y.opensInNewTab')}</span>}
        </a>
      )
    }
    return (
      <Link href={href} prefetch={prefetch} className={classes} {...anchorProps}>
        {content}
      </Link>
    )
  }

  const {
    type = 'button',
    disabled,
    variant: _v,
    size: _s,
    shape: _sh,
    uppercase: _u,
    fullWidth: _f,
    leadingIcon: _li,
    trailingIcon: _ti,
    iconClassName: _ic,
    loading: _l,
    className: _c,
    children: _ch,
    href: _h,
    ...buttonProps
  } = props
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...buttonProps}
    >
      {content}
    </button>
  )
}
