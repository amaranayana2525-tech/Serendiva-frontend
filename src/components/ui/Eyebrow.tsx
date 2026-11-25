import type { ComponentPropsWithoutRef, ElementType } from 'react'
import { cn } from '@/lib/utils'

type EyebrowProps<T extends ElementType> = {
  as?: T
  /** 'md' = label-md (cards, small sections) · 'lg' = label-lg (section headings on home). */
  size?: 'md' | 'lg'
  /** 'secondary' cinnamon on sand · 'light' secondary-fixed on dark/photo backgrounds · 'primary'. */
  tone?: 'secondary' | 'light' | 'primary' | 'muted'
} & ComponentPropsWithoutRef<T>

const tones = {
  secondary: 'text-secondary',
  light: 'text-secondary-fixed',
  primary: 'text-primary',
  muted: 'text-on-surface-variant',
} as const

/** Uppercase kicker above headings (`font-label-* uppercase tracking-widest text-secondary`). */
export function Eyebrow<T extends ElementType = 'span'>({
  as,
  size = 'md',
  tone = 'secondary',
  className,
  ...rest
}: EyebrowProps<T>) {
  const Component: ElementType = as ?? 'span'
  return (
    <Component
      className={cn(
        size === 'lg' ? 'font-label-lg text-label-lg' : 'font-label-md text-label-md',
        'font-semibold uppercase tracking-widest',
        tones[tone],
        className,
      )}
      {...rest}
    />
  )
}
