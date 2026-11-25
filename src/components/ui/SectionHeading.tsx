import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Eyebrow } from './Eyebrow'

export interface SectionHeadingProps {
  eyebrow?: ReactNode
  title: ReactNode
  intro?: ReactNode
  /**
   * 'split'  — title block left, intro right on md+ (home sections, Stitch default)
   * 'left'   — stacked, left aligned
   * 'center' — stacked, centred (FAQ blocks, CTAs)
   */
  align?: 'split' | 'left' | 'center'
  /** 'xl' = headline-xl (40px) · 'lg' = headline-lg (32px). */
  size?: 'xl' | 'lg'
  /** Heading element (h2 by default; use h1 only for page titles). */
  as?: 'h1' | 'h2' | 'h3'
  /** 'dark' text on sand · 'light' white text on teal/photo backgrounds. */
  tone?: 'dark' | 'light'
  id?: string
  className?: string
  titleClassName?: string
  introClassName?: string
}

/** Eyebrow + heading (+ optional intro) exactly as the Stitch sections lay them out. */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = 'split',
  size = 'xl',
  as: Heading = 'h2',
  tone = 'dark',
  id,
  className,
  titleClassName,
  introClassName,
}: SectionHeadingProps) {
  const light = tone === 'light'
  const titleEl = (
    <Heading
      id={id}
      className={cn(
        size === 'xl' ? 'font-headline-xl text-headline-xl' : 'font-headline-lg text-headline-lg',
        light ? 'text-surface' : 'text-primary',
        titleClassName,
      )}
    >
      {title}
    </Heading>
  )
  const eyebrowEl = eyebrow ? (
    <Eyebrow size={align === 'center' ? 'md' : 'lg'} tone={light ? 'light' : 'secondary'}>
      {eyebrow}
    </Eyebrow>
  ) : null
  const introEl = intro ? (
    <p
      className={cn(
        'font-body-md text-body-md',
        light ? 'text-surface/80' : 'text-on-surface-variant',
        align === 'split' && 'max-w-md',
        align === 'center' && 'mt-space-sm',
        introClassName,
      )}
    >
      {intro}
    </p>
  ) : null

  if (align === 'center') {
    return (
      <div className={cn('mx-auto max-w-2xl text-center', className)}>
        {eyebrowEl}
        <div className={cn(eyebrow && 'mt-space-xs')}>{titleEl}</div>
        {introEl}
      </div>
    )
  }

  if (align === 'left') {
    return (
      <div className={cn('flex flex-col gap-space-xs', className)}>
        {eyebrowEl}
        {titleEl}
        {introEl && <div className="mt-space-xs">{introEl}</div>}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col justify-between gap-space-md md:flex-row md:items-end', className)}>
      <div className="flex max-w-xl flex-col gap-space-xs">
        {eyebrowEl}
        {titleEl}
      </div>
      {introEl}
    </div>
  )
}
