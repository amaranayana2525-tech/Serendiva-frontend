'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'

export interface LegalTocProps {
  title: string
  countLabel: string
  items: { id: string; label: string }[]
}

/**
 * Stitch "Table of Practicalities" card with scroll-spy: the section currently being read is highlighted
 * and marked `aria-current="location"`.
 */
export function LegalToc({ title, countLabel, items }: LegalTocProps) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    let frame = 0
    // The active section is the last one whose top has passed the reading line below the fixed header;
    // at the very bottom of the page the last section wins (short final sections never reach the line).
    const update = () => {
      frame = 0
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      let current: string | null = null
      for (const item of items) {
        const el = document.getElementById(item.id)
        if (el && el.getBoundingClientRect().top <= 140) current = item.id
      }
      if (atBottom && current !== null) current = items[items.length - 1]?.id ?? current
      setActive(current)
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [items])

  return (
    <nav aria-label={title} className="rounded-xl bg-surface-container-low p-space-md shadow-sm">
      <div className="mb-space-sm flex items-center justify-between gap-space-sm pb-space-sm">
        <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-on-surface-variant">{title}</span>
        <span className="shrink-0 font-caption text-caption font-semibold text-secondary">{countLabel}</span>
      </div>
      <ol className="flex flex-col gap-1 text-on-surface">
        {items.map((item, index) => {
          const current = active === item.id
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={current ? 'location' : undefined}
                className={cn(
                  'group flex items-center justify-between gap-space-xs rounded-lg px-space-sm py-2 font-label-lg text-label-lg transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary coarse:min-h-11',
                  current ? 'bg-surface-container text-primary' : 'text-on-surface-variant hover:text-primary',
                )}
              >
                <span className="min-w-0">
                  {index + 1}. {item.label}
                </span>
                <Icon
                  name="arrow_forward"
                  className={cn(
                    'shrink-0 text-[16px] transition-opacity',
                    current ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                  )}
                />
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
