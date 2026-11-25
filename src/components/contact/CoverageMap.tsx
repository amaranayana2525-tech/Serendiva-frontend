'use client'

import 'leaflet/dist/leaflet.css'
import { useMemo } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, Tooltip } from 'react-leaflet'
import { Link } from '@/i18n/navigation'

export interface CoverageHub {
  slug: string
  name: string
  lat: number
  lng: number
  /** "Explore Ella" (pre-translated on the server). */
  exploreLabel: string
}

export interface CoverageMapProps {
  base: { lat: number; lng: number; label: string }
  hubs: CoverageHub[]
}

// Marker styling is plain HTML (divIcon) so Leaflet's default image markers — which break under bundlers — are never used.
const hubIcon = L.divIcon({
  className: '',
  // 28 px hit area (WCAG 2.5.8) around the 14 px dot.
  html: '<span class="flex h-7 w-7 items-center justify-center"><span class="block h-3.5 w-3.5 rounded-full border-2 border-surface bg-primary shadow-md"></span></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -8],
  tooltipAnchor: [8, 0],
})

const baseIcon = L.divIcon({
  className: '',
  html: '<span class="flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-surface bg-secondary shadow-lg"><span class="block h-1.5 w-1.5 rounded-full bg-surface"></span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
  tooltipAnchor: [12, 0],
})

/** Sri Lanka's extent — used when the API returns no coordinates. */
const ISLAND_BOUNDS: L.LatLngBoundsExpression = [
  [5.9, 79.65],
  [9.85, 81.9],
]

/**
 * Leaflet + OpenStreetMap map of the islandwide coverage: my base (settings.contact.mapLat/mapLng) and the main
 * destination hubs from the API. Loaded with next/dynamic (ssr: false) through CoverageMapLazy.
 */
export function CoverageMap({ base, hubs }: CoverageMapProps) {
  const bounds = useMemo<L.LatLngBoundsExpression>(() => {
    const points: L.LatLngTuple[] = [[base.lat, base.lng], ...hubs.map((h): L.LatLngTuple => [h.lat, h.lng])]
    return points.length > 1 ? L.latLngBounds(points).pad(0.02) : ISLAND_BOUNDS
  }, [base, hubs])

  return (
    <MapContainer
      bounds={bounds}
      // Keep the markers clear of the caption strip at the bottom of the frame.
      boundsOptions={{ paddingTopLeft: [16, 16], paddingBottomRight: [16, 96] }}
      zoomSnap={0.25}
      scrollWheelZoom={false}
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[base.lat, base.lng]} icon={baseIcon} title={base.label} alt={base.label} zIndexOffset={1000}>
        <Tooltip direction="right">{base.label}</Tooltip>
      </Marker>
      {hubs.map((hub) => (
        <Marker key={hub.slug} position={[hub.lat, hub.lng]} icon={hubIcon} title={hub.name} alt={hub.name}>
          <Tooltip direction="right">{hub.name}</Tooltip>
          <Popup>
            <span className="block font-headline-sm text-headline-sm text-primary">{hub.name}</span>
            <Link
              href={`/destinations/${hub.slug}`}
              className="font-label-lg text-label-lg !text-secondary underline-offset-4 hover:underline"
            >
              {hub.exploreLabel}
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
