'use client'

import { useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

export const REGION_PARAM = 'region'

/**
 * The `?region=` filter shared by the island map legend and the region tabs on /destinations.
 * Unknown slugs are ignored. Updates use `history.replaceState` (integrated with the Next router), so the page
 * stays static and filtering is instant. Must be rendered inside <Suspense> (useSearchParams).
 */
export function useRegionParam(validSlugs: readonly string[]): [string | null, (slug: string | null) => void] {
  const searchParams = useSearchParams()
  const raw = searchParams.get(REGION_PARAM)
  const region = raw && validSlugs.includes(raw) ? raw : null

  const setRegion = useCallback((slug: string | null) => {
    const params = new URLSearchParams(window.location.search)
    if (slug) params.set(REGION_PARAM, slug)
    else params.delete(REGION_PARAM)
    const query = params.toString()
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
    )
  }, [])

  return [region, setRegion]
}
