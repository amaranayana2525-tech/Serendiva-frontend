'use client'

import NextLink from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

export interface IconLinkProps {
  href: string
  icon: string
  /** Accessible name + tooltip. */
  label: string
  /** Open in a new tab (public site previews). */
  external?: boolean
  size?: 'sm' | 'md'
  className?: string
}

/** Icon-only link styled like the kit's ghost IconButton (edit / view on site actions in list rows). */
export function IconLink({ href, icon, label, external, size = 'sm', className }: IconLinkProps) {
  const classes = cn(
    'inline-flex shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
    size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
    className,
  )
  const glyph = <Icon name={icon} className={size === 'sm' ? 'text-[18px]' : 'text-[20px]'} />
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className={classes}>
        {glyph}
      </a>
    )
  }
  return (
    <NextLink href={href} aria-label={label} title={label} className={classes}>
      {glyph}
    </NextLink>
  )
}
