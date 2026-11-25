'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'

export const TOUR_SECTIONS = [
  { id: 'overview', icon: 'menu_book' },
  { id: 'itinerary', icon: 'calendar_month' },
  { id: 'inclusions', icon: 'check_circle' },
  { id: 'route', icon: 'map' },
  { id: 'faq', icon: 'help_outline' },
  { id: 'reviews', icon: 'star_rate' },
] as const

export type TourSectionId = (typeof TOUR_SECTIONS)[number]['id']

/** Distance from the viewport top at which a section counts as "current" (header 80px + this bar + margin). */
const SPY_OFFSET = 170

/**
 * Sticky in-page navigation of a tour (Stitch "STICKY SUB-NAVIGATION BAR") with scroll-spy: the link of the section
 * being read gets `aria-current="location"`. Scrolls horizontally on phones and keeps the current link in view.
 */
export function TourSubNav({ sections }: { sections: TourSectionId[] }) {
  const t = useTranslations('tourDetail.subnav')
  const items = TOUR_SECTIONS.filter((s) => sections.includes(s.id))
  const [active, setActive] = useState<string>(items[0]?.id ?? '')
  const navRef = useRef<HTMLElement>(null)
  const ids = items.map((s) => s.id).join(',')

  useEffect(() => {
    const list = ids.split(',').filter(Boolean)
    let frame = 0
    const update = () => {
      frame = 0
      let current = list[0] ?? ''
      for (const id of list) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top - SPY_OFFSET <= 0) current = id
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      const last = list[list.length - 1]
      if (atBottom && last) {
        const lastEl = document.getElementById(last)
        if (lastEl && lastEl.getBoundingClientRect().top < window.innerHeight) current = last
      }
      setActive(current)
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [ids])

  // Keep the current link visible in the horizontally scrolling bar (phones).
  useEffect(() => {
    const nav = navRef.current
    const link = nav?.querySelector<HTMLElement>(`a[href="#${active}"]`)
    if (!nav || !link) return
    const left = link.offsetLeft - nav.offsetLeft
    if (left < nav.scrollLeft || left + link.offsetWidth > nav.scrollLeft + nav.clientWidth) {
      nav.scrollTo({ left: Math.max(0, left - 24), behavior: 'smooth' })
    }
  }, [active])

  if (items.length === 0) return null

  return (
    <div className="sticky top-20 z-30 border-b border-surface-container bg-surface/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
        <nav
          ref={navRef}
          aria-label={t('label')}
          className="no-scrollbar relative flex items-center gap-space-lg overflow-x-auto whitespace-nowrap py-space-sm font-label-lg text-label-lg text-on-surface-variant coarse:py-2.5"
        >
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setActive(item.id)}
              aria-current={active === item.id ? 'location' : undefined}
              className={cn(
                'tap-target relative flex items-center gap-1 rounded py-1 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                active === item.id && 'text-primary',
              )}
            >
              <Icon name={item.icon} className="text-sm" /> {t(item.id)}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}
