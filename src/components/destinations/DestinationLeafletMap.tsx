'use client'

import 'leaflet/dist/leaflet.css'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import { AttributionControl, MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { ICON_SPRITE_VERSION } from '@/components/ui/icon-names.generated'

export interface LeafletPoint {
  name: string
  lat: number
  lng: number
}

export interface DestinationLeafletMapProps {
  centre: { lat: number; lng: number } | null
  centreLabel: string
  points: LeafletPoint[]
  /** Tailwind background class per point (same order as the legend). */
  dotClasses: string[]
  /** Index of the point to fly to (legend selection), or null. */
  focus: number | null
  /** Pixels kept free at the bottom (the floating legend). */
  bottomPadding: number
  attribution: string
}

const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

const dotIcon = (bg: string) =>
  L.divIcon({
    className: '',
    // 32 px hit area (WCAG 2.5.8) around the 18 px Stitch dot.
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    tooltipAnchor: [0, -10],
    html: `<span class="flex h-8 w-8 items-center justify-center"><span class="block h-[18px] w-[18px] rounded-full border-[3px] border-surface ${bg} shadow-md"></span></span>`,
  })

const centreIcon = () =>
  L.divIcon({
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    tooltipAnchor: [0, -18],
    html: `<span class="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-primary text-on-primary shadow-lg ring-4 ring-surface/80"><svg aria-hidden="true" class="icon text-[18px]"><use href="/icons/sprite.svg?v=${ICON_SPRITE_VERSION}#location_on"></use></svg></span>`,
  })

function FitToPoints({ coords, bottomPadding }: { coords: L.LatLngTuple[]; bottomPadding: number }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length === 0) return
    // Extra bottom padding keeps the markers clear of the floating legend.
    map.fitBounds(L.latLngBounds(coords), {
      paddingTopLeft: [40, 48],
      paddingBottomRight: [40, bottomPadding],
      maxZoom: coords.length === 1 ? 13 : 14,
    })
  }, [map, coords, bottomPadding])
  return null
}

function FlyTo({ target, onArrive }: { target: L.LatLngTuple | null; onArrive: () => void }) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      map.setView(target, Math.max(map.getZoom(), 14))
      onArrive()
    } else {
      map.once('moveend', onArrive)
      map.flyTo(target, Math.max(map.getZoom(), 14), { duration: 0.8 })
    }
  }, [map, target, onArrive])
  return null
}

/** Leaflet + OpenStreetMap map of a destination and its landmarks (client only — loaded with ssr: false). */
export default function DestinationLeafletMap({
  centre,
  centreLabel,
  points,
  dotClasses,
  focus,
  bottomPadding,
  attribution,
}: DestinationLeafletMapProps) {
  const markers = useRef<(L.Marker | null)[]>([])
  const coords = useMemo(() => {
    const list: L.LatLngTuple[] = points.map((p) => [p.lat, p.lng])
    if (centre) list.push([centre.lat, centre.lng])
    return list
  }, [points, centre])
  const target = useMemo<L.LatLngTuple | null>(
    () => (focus !== null && points[focus] ? [points[focus].lat, points[focus].lng] : null),
    [focus, points],
  )
  const openFocused = useCallback(() => {
    if (focus !== null) markers.current[focus]?.openTooltip()
  }, [focus])
  const icons = useMemo(() => points.map((_, i) => dotIcon(dotClasses[i % dotClasses.length])), [points, dotClasses])
  const pin = useMemo(() => centreIcon(), [])

  return (
    <MapContainer
      center={coords[0] ?? [7.8731, 80.7718]}
      zoom={12}
      scrollWheelZoom={false}
      attributionControl={false}
      className="h-full w-full bg-surface-container"
    >
      {/* Top-right: the bottom edge is covered by the floating legend. */}
      <AttributionControl position="topright" prefix={false} />
      <TileLayer url={OSM_TILES} attribution={attribution} subdomains={['a', 'b', 'c']} />
      {centre && (
        <Marker position={[centre.lat, centre.lng]} icon={pin} title={centreLabel} zIndexOffset={500}>
          <Tooltip direction="top">
            <span className="font-label-md text-label-md font-semibold text-primary">{centreLabel}</span>
          </Tooltip>
        </Marker>
      )}
      {points.map((p, i) => (
        <Marker
          key={`${p.name}-${i}`}
          ref={(m) => {
            markers.current[i] = m
          }}
          position={[p.lat, p.lng]}
          icon={icons[i]}
          title={p.name}
        >
          <Tooltip direction="top">
            <span className="font-label-md text-label-md font-semibold text-on-surface">{p.name}</span>
          </Tooltip>
        </Marker>
      ))}
      <FitToPoints coords={coords} bottomPadding={bottomPadding} />
      <FlyTo target={target} onArrive={openFocused} />
    </MapContainer>
  )
}
