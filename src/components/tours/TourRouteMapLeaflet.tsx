'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { RouteMarker, RouteStop } from './route-stops'

export interface TourRouteMapLeafletProps {
  stops: RouteStop[]
  markers: RouteMarker[]
  /** "Stop {number}" template result per marker, e.g. "Stop 3". */
  stopLabel: (numbers: number[]) => string
}

const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
/** Sri Lanka, used before the bounds are fitted. */
const SRI_LANKA: L.LatLngTuple = [7.8731, 80.7718]
const PRIMARY_CONTAINER = '#0f4c5c'

/** Numbered pin (Tailwind classes are compiled because this file is in the content glob). */
function numberIcon(numbers: number[]): L.DivIcon {
  const text = numbers.join('·')
  const width = Math.max(28, 14 + text.length * 7)
  return L.divIcon({
    className: '',
    iconSize: [width, 28],
    iconAnchor: [width / 2, 14],
    tooltipAnchor: [0, -16],
    html: `<span class="flex h-7 w-full items-center justify-center rounded-full border-2 border-surface bg-secondary px-1 font-label-md text-label-md font-bold tracking-normal text-on-secondary shadow-md">${text}</span>`,
  })
}

function FitBounds({ points }: { points: L.LatLngTuple[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) map.setView(points[0]!, 10)
    // Extra room at the bottom: the "Total Circuit" card overlays the lower-left corner of the map.
    else map.fitBounds(L.latLngBounds(points), { paddingTopLeft: [36, 36], paddingBottomRight: [36, 104] })
  }, [map, points])
  return null
}

/** Leaflet + OpenStreetMap route map (client only — loaded through next/dynamic with ssr: false). */
export default function TourRouteMapLeaflet({ stops, markers, stopLabel }: TourRouteMapLeafletProps) {
  const points = useMemo(() => stops.map((s): L.LatLngTuple => [s.lat, s.lng]), [stops])
  return (
    <MapContainer
      center={points[0] ?? SRI_LANKA}
      zoom={7}
      scrollWheelZoom={false}
      className="h-full w-full bg-surface-container"
    >
      <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} subdomains={['a', 'b', 'c']} />
      {points.length > 1 && (
        <Polyline
          positions={points}
          pathOptions={{ color: PRIMARY_CONTAINER, weight: 3, opacity: 0.85, dashArray: '6 8' }}
        />
      )}
      {markers.map((marker) => (
        <Marker
          key={marker.numbers.join('-')}
          position={[marker.lat, marker.lng]}
          icon={numberIcon(marker.numbers)}
          keyboard={false}
          title={`${stopLabel(marker.numbers)}: ${marker.names.join(' / ')}`}
        >
          <Tooltip direction="top">
            <span className="font-body-md text-body-md">
              <strong>{stopLabel(marker.numbers)}</strong> · {marker.names.join(' / ')}
            </span>
          </Tooltip>
        </Marker>
      ))}
      <FitBounds points={points} />
    </MapContainer>
  )
}
