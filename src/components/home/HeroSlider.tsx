'use client'

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode, type TouchEvent } from 'react'
import { useTranslations } from 'next-intl'
import type { ApiImage } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

export interface HeroSliderProps {
  /** Full-bleed background photos (settings.heroSlides). */
  slides: ApiImage[]
  /** Accessible name of the slide picker (dots). */
  pickerLabel: string
  /** Auto-advance interval. */
  intervalMs?: number
  /** Hero copy (eyebrow, h1, intro, CTAs) — server-rendered. */
  children: ReactNode
  /** Quick-inquiry bar — server-rendered (may suspend while categories load). */
  inquiry: ReactNode
  /** "Discover Ceylon" scroll cue — server-rendered. */
  scrollCue: ReactNode
}

const SWIPE_MIN_PX = 48
const INTERACTIVE = 'a, button, input, select, textarea, label, form'

/**
 * Home hero: cinematic cross-fading photo slides behind the copy (Stitch markup), teal gradient scrim, slide dots,
 * quick-inquiry bar and scroll cue. Fixes the Stitch stacking bug with `isolate` (the `-z-10` slides now stay inside
 * the section instead of disappearing behind the page).
 *
 * Behaviour: auto-advances every ~6 s; pauses while the controls/inquiry bar are hovered, while anything inside the
 * hero has keyboard focus, when the visitor presses pause, and never starts with prefers-reduced-motion.
 * Dots are buttons (←/→/Home/End move between them); touch swipe changes slides.
 */
export function HeroSlider({ slides, pickerLabel, intervalMs = 6000, children, inquiry, scrollCue }: HeroSliderProps) {
  const t = useTranslations('common.a11y')
  const count = slides.length
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [stopped, setStopped] = useState(false)
  const reduceMotion = usePrefersReducedMotion()
  const canAutoplay = count > 1 && !reduceMotion
  const running = canAutoplay && !stopped && !hovered && !focused
  const dots = useRef<(HTMLButtonElement | null)[]>([])
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const go = useCallback((next: number) => setIndex(count > 0 ? ((next % count) + count) % count : 0), [count])

  useEffect(() => {
    if (!running) return
    const id = window.setTimeout(() => go(index + 1), intervalMs)
    return () => window.clearTimeout(id)
  }, [running, index, intervalMs, go])

  const onDotKeyDown = (event: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const target =
      event.key === 'ArrowRight'
        ? (i + 1) % count
        : event.key === 'ArrowLeft'
          ? (i - 1 + count) % count
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? count - 1
              : null
    if (target === null) return
    event.preventDefault()
    go(target)
    dots.current[target]?.focus()
  }

  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0]
    const fromControl = event.target instanceof Element && event.target.closest(INTERACTIVE)
    touchStart.current = touch && !fromControl && count > 1 ? { x: touch.clientX, y: touch.clientY } : null
  }

  const onTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = touchStart.current
    const touch = event.changedTouches[0]
    touchStart.current = null
    if (!start || !touch) return
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return
    go(dx < 0 ? index + 1 : index - 1)
  }

  return (
    <section
      className="relative isolate -mt-20 flex min-h-[92vh] w-full flex-col justify-between overflow-hidden bg-primary pb-12 pt-28"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false)
      }}
    >
      {/* Background slides (decorative — the copy does not change between slides). */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full">
        {slides.map((slide, i) => (
          <div
            key={slide.id || i}
            className={cn(
              'absolute inset-0 h-full w-full transition-opacity duration-1000 motion-reduce:transition-none',
              i === index ? 'opacity-100' : 'opacity-0',
            )}
          >
            <SmartImage
              image={slide}
              alt=""
              fill
              sizes="100vw"
              priority={i === 0}
              className="object-cover object-center"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/50 to-primary/30" />
      </div>

      {children}

      <div
        className="mx-auto mt-8 w-full max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {inquiry}
        <div className="flex items-center justify-between pt-space-md text-surface/80">
          {count > 1 ? (
            <div role="group" aria-label={pickerLabel} className="flex items-center gap-space-xs">
              {slides.map((slide, i) => (
                <button
                  key={slide.id || i}
                  ref={(el) => {
                    dots.current[i] = el
                  }}
                  type="button"
                  aria-label={
                    slide.alt ? `${t('goToSlide', { number: i + 1 })}: ${slide.alt}` : t('goToSlide', { number: i + 1 })
                  }
                  aria-current={i === index ? 'true' : undefined}
                  tabIndex={i === index ? 0 : -1}
                  onClick={() => go(i)}
                  onKeyDown={(event) => onDotKeyDown(event, i)}
                  className={cn(
                    'relative h-1.5 rounded-full transition-all motion-reduce:transition-none',
                    'before:absolute before:-inset-x-0.5 before:-inset-y-2.5 before:content-[""]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
                    i === index ? 'w-8 bg-secondary' : 'w-3 bg-surface/40 hover:bg-surface',
                  )}
                />
              ))}
              {canAutoplay && (
                <button
                  type="button"
                  onClick={() => setStopped((s) => !s)}
                  aria-label={stopped ? t('playAutoplay') : t('pauseAutoplay')}
                  className="tap-target relative ml-space-xs flex h-6 w-6 items-center justify-center rounded-full text-surface/75 transition-colors hover:text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface"
                >
                  {stopped ? (
                    <Icon name="play_arrow" className="text-[18px]" />
                  ) : (
                    <Icon name="pause" className="text-[18px]" />
                  )}
                </button>
              )}
            </div>
          ) : (
            <span />
          )}
          {scrollCue}
        </div>
      </div>
    </section>
  )
}
