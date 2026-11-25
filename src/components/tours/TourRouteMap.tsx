'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import type { RouteMarker, RouteStop } from './route-stops'

function MapLoading() {
  const t = useTranslations('tourDetail.route')
  return (
    <div className="flex h-full w-full animate-pulse items-center justify-center gap-2 bg-surface-container font-label-lg text-label-lg text-on-surface-variant">
      <Icon name="map" className="text-xl" />
      <span>{t('loading')}</span>
    </div>
  )
}

/** Leaflet (and its CSS) is only downloaded in the browser, when a tour page is opened. */
const LeafletMap = dynamic(() => import('./TourRouteMapLeaflet'), { ssr: false, loading: MapLoading })

export interface TourRouteMapProps {
  stops: RouteStop[]
  markers: RouteMarker[]
  tourTitle: string
  /** id of the text describing the map (the hint / stop list). */
  describedBy?: string
}

/** Route map region: numbered pins for every stop, dashed route line, bounds fitted to the itinerary. */
export function TourRouteMap({ stops, markers, tourTitle, describedBy }: TourRouteMapProps) {
  const t = useTranslations('tourDetail.route')
  return (
    <div
      role="region"
      aria-label={t('mapLabel', { tour: tourTitle })}
      aria-describedby={describedBy}
      className="relative isolate z-0 h-80 w-full"
    >
      <LeafletMap
        stops={stops}
        markers={markers}
        stopLabel={(numbers) => numbers.map((n) => t('stopNumber', { number: n })).join(' · ')}
      />
    </div>
  )
}
