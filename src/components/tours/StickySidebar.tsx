'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface StickySidebarProps {
  children: ReactNode
  /** Offset below the fixed header + sticky sub-navigation (Stitch `top-36` = 144px). */
  top?: number
  /** Gap kept under the sidebar when it is taller than the viewport. */
  bottom?: number
  className?: string
}

/**
 * Sticky aside (lg+) that also works when it is taller than the viewport (inquiry form + availability calendar):
 * it sticks at `top` when it fits; otherwise it scrolls along with the page until its end is visible, sticks there,
 * and slides back down when the visitor scrolls up — so every part of the card stays reachable.
 */
export function StickySidebar({ children, top = 144, bottom = 24, className }: StickySidebarProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const desktop = window.matchMedia('(min-width: 1024px)')
    let offset = top
    let lastY = window.scrollY
    let frame = 0

    const update = () => {
      frame = 0
      const y = window.scrollY
      if (!desktop.matches) {
        el.style.top = ''
        lastY = y
        return
      }
      const min = Math.min(top, window.innerHeight - el.offsetHeight - bottom)
      offset = Math.max(min, Math.min(top, offset - (y - lastY)))
      lastY = y
      el.style.top = `${Math.round(offset)}px`
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    const resize = new ResizeObserver(schedule)
    resize.observe(el)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    desktop.addEventListener('change', schedule)
    update()
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      resize.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      desktop.removeEventListener('change', schedule)
    }
  }, [top, bottom])

  return (
    <div ref={ref} className={cn('lg:sticky', className)} style={{ top }}>
      {children}
    </div>
  )
}
