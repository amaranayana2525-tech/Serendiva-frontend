'use client'

import { useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * URL-synced filter state for static pages: reads `useSearchParams()` (call it inside a <Suspense> boundary) and writes
 * with `history.replaceState`, which Next.js syncs into `useSearchParams` without a server round-trip or scroll jump.
 *
 *   const { params, update } = useUrlParams()
 *   update({ category: 'wildlife' })   // ?category=wildlife
 *   update({ category: null })         // removes it
 */
export function useUrlParams() {
  const params = useSearchParams()
  const update = useCallback(
    (patch: Record<string, string | null | undefined>) => {
      const next = new URLSearchParams(params.toString())
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      const query = next.toString()
      const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
      window.history.replaceState(null, '', url)
    },
    [params],
  )
  return { params, update }
}
