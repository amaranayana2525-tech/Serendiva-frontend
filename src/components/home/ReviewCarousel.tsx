'use client'

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

export interface ReviewCarouselProps {
  /** Accessible name of the carousel. */
  label: string
  /** One element per slide (server-rendered review cards). */
  children: ReactNode
}

/**
 * Testimonials: a swipeable scroll-snap carousel with prev/next + dot controls below `md`, the Stitch 3-column grid
 * from `md` up (controls hidden, nothing scrolls). Native scrolling keeps touch swipe and keyboard (←/→ on the
 * focused track) working; the buttons scroll one card at a time.
 */
export function ReviewCarousel({ label, children }: ReviewCarouselProps) {
  const t = useTranslations('common.a11y')
  const slides = Children.toArray(children)
  const count = slides.length
  const track = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [scrollable, setScrollable] = useState(false)
  const reduceMotion = usePrefersReducedMotion()

  const slideEls = () => Array.from(track.current?.children ?? []) as HTMLElement[]

  const update = useCallback(() => {
    const el = track.current
    if (!el) return
    setScrollable(el.scrollWidth > el.clientWidth + 1)
    const center = el.scrollLeft + el.clientWidth / 2
    let best = 0
    let bestDistance = Number.POSITIVE_INFINITY
    ;(Array.from(el.children) as HTMLElement[]).forEach((slide, i) => {
      const distance = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center)
      if (distance < bestDistance) {
        bestDistance = distance
        best = i
      }
    })
    setActive(best)
  }, [])

  useEffect(() => {
    const el = track.current
    if (!el) return
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    update()
    el.addEventListener('scroll', onScroll, { passive: true })
    const observer = new ResizeObserver(onScroll)
    observer.observe(el)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('scroll', onScroll)
      observer.disconnect()
    }
  }, [update])

  const goTo = (i: number) => {
    const el = track.current
    const slide = slideEls()[i]
    if (!el || !slide) return
    el.scrollTo({
      left: slide.offsetLeft - (el.clientWidth - slide.offsetWidth) / 2,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }

  const control =
    'flex h-11 w-11 items-center justify-center rounded-full bg-surface-container text-primary transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label} className="flex flex-col gap-space-md">
      <div
        ref={track}
        tabIndex={scrollable ? 0 : undefined}
        role={scrollable ? 'group' : undefined}
        aria-label={scrollable ? t('carousel') : undefined}
        className={cn(
          'relative -mx-margin flex snap-x snap-mandatory scroll-px-margin gap-gutter overflow-x-auto px-margin pb-2',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
          'md:mx-0 md:grid md:grid-cols-3 md:gap-gutter md:overflow-visible md:px-0 md:pb-0',
        )}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={t('slideOf', { current: i + 1, total: count })}
            className="flex w-[85%] shrink-0 snap-center md:w-auto"
          >
            {slide}
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className="flex items-center justify-center gap-space-md md:hidden">
          <button
            type="button"
            className={control}
            onClick={() => goTo(Math.max(0, active - 1))}
            disabled={active === 0}
            aria-label={t('carouselPrev')}
          >
            <Icon name="chevron_left" className="text-[22px]" />
          </button>
          <div className="flex items-center gap-space-xs">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={t('goToSlide', { number: i + 1 })}
                aria-current={i === active ? 'true' : undefined}
                className={cn(
                  'relative h-1.5 rounded-full transition-all motion-reduce:transition-none',
                  'before:absolute before:-inset-x-1 before:-inset-y-3 before:content-[""]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  i === active ? 'w-8 bg-secondary' : 'w-3 bg-outline-variant hover:bg-outline',
                )}
              />
            ))}
          </div>
          <button
            type="button"
            className={control}
            onClick={() => goTo(Math.min(count - 1, active + 1))}
            disabled={active === count - 1}
            aria-label={t('carouselNext')}
          >
            <Icon name="chevron_right" className="text-[22px]" />
          </button>
        </div>
      )}
    </div>
  )
}
