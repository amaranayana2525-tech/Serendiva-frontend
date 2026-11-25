'use client'

import { useEffect, useRef } from 'react'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'
import type { GuideNavItem } from './chapters'
import { useGuide } from './GuideProvider'

interface GuideNavProps {
  items: GuideNavItem[]
  title: string
  countLabel: string
  navLabel: string
}

/** Desktop "Table of Practicalities" card (Stitch sidebar) with scroll-spy (aria-current) and search dimming. */
export function GuideNav({ items, title, countLabel, navLabel }: GuideNavProps) {
  const { activeId, matches } = useGuide()
  return (
    <div className="rounded-xl bg-surface-container-low p-space-md shadow-sm">
      <div className="mb-space-sm flex items-center justify-between gap-space-sm pb-space-sm">
        <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-on-surface-variant">{title}</span>
        <span className="shrink-0 font-caption text-caption font-semibold text-secondary">{countLabel}</span>
      </div>
      <nav aria-label={navLabel}>
        <ul className="flex flex-col gap-1 text-on-surface">
          {items.map((item) => {
            const active = item.id === activeId
            const dimmed = matches !== null && !matches.includes(item.id)
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={active ? 'location' : undefined}
                  className={cn(
                    'group flex items-center justify-between rounded-lg px-space-sm py-2 font-label-lg text-label-lg transition-[color,background-color,opacity]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    active
                      ? 'bg-surface-container font-bold text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-primary',
                    dimmed && 'opacity-40',
                  )}
                >
                  <span className="truncate">{item.label}</span>
                  <Icon
                    name="arrow_forward"
                    className="text-[16px] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  />
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

/** Below 1280 px the sidebar collapses into this sticky, horizontally scrolling chip bar under the header. */
export function GuideMobileNav({ items, navLabel }: { items: GuideNavItem[]; navLabel: string }) {
  const { activeId, matches } = useGuide()
  const scroller = useRef<HTMLUListElement>(null)

  // Keep the active chip visible inside the horizontal scroller (without scrolling the page).
  useEffect(() => {
    const list = scroller.current
    if (!list || !activeId) return
    const chip = list.querySelector<HTMLElement>(`[data-chapter="${activeId}"]`)
    if (!chip) return
    const left = chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollTo({ left: Math.max(0, left), behavior: reduce ? 'auto' : 'smooth' })
  }, [activeId])

  return (
    <div className="sticky top-20 z-30 bg-surface/95 shadow-sm backdrop-blur-md xl:hidden">
      <nav aria-label={navLabel} className="relative">
        <ul
          ref={scroller}
          className="no-scrollbar relative flex items-center gap-2 overflow-x-auto px-margin py-space-sm md:px-margin-md"
        >
          {items.map((item) => {
            const active = item.id === activeId
            const dimmed = matches !== null && !matches.includes(item.id)
            return (
              <li key={item.id} className="shrink-0">
                <a
                  href={`#${item.id}`}
                  data-chapter={item.id}
                  aria-current={active ? 'location' : undefined}
                  className={cn(
                    'tap-target relative block whitespace-nowrap rounded-full px-space-md py-2 font-label-md text-label-md uppercase tracking-wider transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                    active
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high hover:text-primary',
                    dimmed && 'opacity-40',
                  )}
                >
                  {item.shortLabel}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
