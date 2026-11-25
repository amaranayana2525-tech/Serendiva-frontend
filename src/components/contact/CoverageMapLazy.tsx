'use client'

import dynamic from 'next/dynamic'
import type { CoverageMapProps } from './CoverageMap'

/** Leaflet touches `window`, so the map only renders in the browser (next/dynamic with ssr: false). */
const CoverageMapClient = dynamic(() => import('./CoverageMap').then((m) => m.CoverageMap), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-surface-container" />,
})

export function CoverageMapLazy(props: CoverageMapProps) {
  return <CoverageMapClient {...props} />
}
