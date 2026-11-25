import type { ComponentProps, ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { Icon } from './Icon'

const chipBase =
  'tap-target relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-space-md py-1.5 font-label-md text-label-md uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
const chipActive = 'bg-primary text-on-primary shadow-sm'
const chipIdle = 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'

type LinkHref = ComponentProps<typeof Link>['href']

interface ChipBaseProps {
  active?: boolean
  icon?: string
  /** Optional count badge (e.g. number of tours). */
  count?: number
  className?: string
  children: ReactNode
}

type ChipButtonProps = ChipBaseProps & Omit<ComponentProps<'button'>, keyof ChipBaseProps> & { href?: undefined }
type ChipLinkProps = ChipBaseProps &
  Omit<ComponentProps<'a'>, keyof ChipBaseProps | 'href'> & { href: LinkHref; scroll?: boolean }

/** Filter chip from the tours/blog/gallery filter bars. As a button it is a toggle (aria-pressed); with `href` a link. */
export function Chip(props: ChipButtonProps | ChipLinkProps) {
  const { active = false, icon, count, className, children } = props
  const classes = cn(chipBase, active ? chipActive : chipIdle, className)
  const inner = (
    <>
      {icon && <Icon name={icon} className="text-sm" />}
      {children}
      {count !== undefined && (
        <span className={cn('tabular-nums', active ? 'text-on-primary/70' : 'text-on-surface-variant')}>{count}</span>
      )}
    </>
  )
  if (props.href !== undefined) {
    const { href, scroll, active: _a, icon: _i, count: _c, className: _cl, children: _ch, ...rest } = props
    return (
      <Link href={href} scroll={scroll} aria-current={active ? 'true' : undefined} className={classes} {...rest}>
        {inner}
      </Link>
    )
  }
  const { active: _a, icon: _i, count: _c, className: _cl, children: _ch, href: _h, type = 'button', ...rest } = props
  return (
    <button type={type} aria-pressed={active} className={classes} {...rest}>
      {inner}
    </button>
  )
}

const pillTones = {
  primary: 'bg-surface-container text-primary',
  muted: 'bg-surface-container text-on-surface-variant',
  green: 'bg-tertiary-container/15 text-tertiary',
  cinnamon: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  season: 'bg-tertiary-fixed text-on-tertiary-fixed',
} as const

export interface PillProps extends ComponentProps<'span'> {
  tone?: keyof typeof pillTones
  icon?: string
}

/** Small static tag (tour highlights, seasonal labels): `bg-surface-container px-2.5 py-1 rounded-full font-caption`. */
export function Pill({ tone = 'primary', icon, className, children, ...rest }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-caption text-caption',
        pillTones[tone],
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} className="text-[14px]" />}
      {children}
    </span>
  )
}
