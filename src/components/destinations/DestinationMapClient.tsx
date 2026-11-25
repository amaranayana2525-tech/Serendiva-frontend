'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import type { DestinationDetail } from '@/lib/api/types'
import { cn } from '@/lib/utils'

const DestinationLeafletMap = dynamic(() => import('./DestinationLeafletMap'), { ssr: false })

/** Legend / marker colours in the Stitch order (Nine Arches, Little Adam's Peak, Ella Rock, Ravana, Demodara). */
const DOTS = ['bg-secondary', 'bg-primary', 'bg-tertiary', 'bg-secondary-container', 'bg-on-tertiary-container']

export interface DestinationMapClientProps {
  name: string
  centre: { lat: number; lng: number } | null
  points: DestinationDetail['mapPoints']
}

/** Map canvas + the frosted Stitch legend; selecting a landmark in the legend flies the map to it. */
export function DestinationMapClient({ name, centre, points }: DestinationMapClientProps) {
  const t = useTranslations('destinationDetail.map')
  const ta = useTranslations('common.a11y')
  const [focus, setFocus] = useState<number | null>(null)
  const legendRef = useRef<HTMLUListElement>(null)
  const [legendHeight, setLegendHeight] = useState(96)

  // Keep markers clear of the floating legend (it wraps to several lines on phones).
  useEffect(() => {
    const el = legendRef.current
    if (!el) return
    const update = () => setLegendHeight(el.offsetHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      role="region"
      aria-label={t('label', { name })}
      className="relative isolate h-[400px] w-full overflow-hidden rounded-xl bg-surface-container shadow-sm"
    >
      <p className="absolute inset-0 flex items-center justify-center font-caption text-caption text-on-surface-variant">
        {ta('mapLoading')}
      </p>
      <div className="absolute inset-0">
        <DestinationLeafletMap
          centre={centre}
          centreLabel={t('centre', { name })}
          points={points}
          dotClasses={DOTS}
          focus={focus}
          bottomPadding={legendHeight + 32}
          attribution={t('attribution')}
        />
      </div>
      {points.length > 0 && (
        <ul
          ref={legendRef}
          aria-label={t('legendLabel')}
          className="absolute bottom-space-md left-space-md right-space-md z-[1000] flex flex-wrap items-center justify-between gap-space-sm rounded-xl bg-surface/90 p-space-md shadow-lg backdrop-blur-md"
        >
          {points.map((p, i) => (
            <li key={`${p.name}-${i}`}>
              <button
                type="button"
                onClick={() => setFocus(i)}
                aria-pressed={focus === i}
                aria-label={t('focus', { name: p.name })}
                className={cn(
                  'tap-target relative flex items-center gap-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  focus === i ? 'text-secondary' : 'text-on-surface hover:text-primary',
                )}
              >
                <span aria-hidden="true" className={cn('h-3 w-3 shrink-0 rounded-full', DOTS[i % DOTS.length])} />
                <span className="font-label-md text-label-md font-semibold">{p.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
