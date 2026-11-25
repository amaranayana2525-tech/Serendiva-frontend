'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useScrollSpy } from '@/components/blog/useScrollSpy'

interface GuideState {
  /** Chapter ids in page order. */
  ids: readonly string[]
  /** Chapter currently in view (scroll-spy). */
  activeId: string | null
  query: string
  /** Updates the search term and dims the chapters that don't mention it. */
  search: (value: string) => void
  /** Ids of the chapters whose text contains the query (null = no search running). */
  matches: readonly string[] | null
}

const GuideContext = createContext<GuideState>({
  ids: [],
  activeId: null,
  query: '',
  search: () => undefined,
  matches: null,
})

export const useGuide = () => useContext(GuideContext)

const normalise = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+/g, ' ').trim()

/**
 * Client state shared by the hero search ("Live Index"), the sticky chapter navigation (desktop list + mobile chips)
 * and the server-rendered chapters: scroll-spy + a live search that dims chapters without a match (as in Stitch).
 */
export function GuideProvider({ ids, children }: { ids: readonly string[]; children: ReactNode }) {
  const activeId = useScrollSpy(ids, { offset: 0.25 })
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<readonly string[] | null>(null)

  const search = useCallback(
    (value: string) => {
      setQuery(value)
      const term = normalise(value)
      const found: string[] = []
      for (const id of ids) {
        const section = document.getElementById(id)
        if (!section) continue
        const hit = !term || normalise(section.textContent ?? '').includes(term)
        if (term && hit) found.push(id)
        if (hit) section.removeAttribute('data-dimmed')
        else section.setAttribute('data-dimmed', 'true')
      }
      setMatches(term ? found : null)
    },
    [ids],
  )

  const value = useMemo(() => ({ ids, activeId, query, search, matches }), [ids, activeId, query, search, matches])
  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>
}
