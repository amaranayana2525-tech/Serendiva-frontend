'use client'

import { useEffect, useState } from 'react'

export interface ScrollSpyOptions {
  /** Activation line as a fraction of the viewport height (0.3 = 30% from the top). */
  offset?: number
}

/**
 * Returns the id of the section the reader is currently in: the last element (in document order) whose top has
 * crossed the activation line. At the very bottom of the page the last id wins (short final sections).
 * Used by the travel-guide chapter navigation and the article table of contents.
 */
export function useScrollSpy(ids: readonly string[], { offset = 0.3 }: ScrollSpyOptions = {}): string | null {
  const key = ids.join('|')
  const [active, setActive] = useState<string | null>(ids[0] ?? null)

  useEffect(() => {
    const list = key ? key.split('|') : []
    if (list.length === 0) return
    let frame = 0

    const update = () => {
      frame = 0
      const line = window.innerHeight * offset
      let current: string | null = null
      for (const id of list) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top - line <= 0) current = id
        else break
      }
      const doc = document.documentElement
      if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) {
        // Bottom of the page: activate the last section that is actually visible.
        const lastVisible = [...list].reverse().find((id) => {
          const el = document.getElementById(id)
          return el ? el.getBoundingClientRect().top < window.innerHeight : false
        })
        if (lastVisible) current = lastVisible
      }
      setActive(current ?? list[0] ?? null)
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('hashchange', schedule)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('hashchange', schedule)
    }
  }, [key, offset])

  return active
}

/** Smoothly scrolls to an element (instant when the user prefers reduced motion) and records the hash. */
export function scrollToId(id: string, { focus = false }: { focus?: boolean } = {}): void {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  window.history.replaceState(window.history.state, '', `#${id}`)
  if (focus) {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
    el.focus({ preventScroll: true })
  }
}
