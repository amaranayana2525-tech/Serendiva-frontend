import type { TourDay } from '@/lib/api/types'

/** One numbered stop of a tour route, in itinerary order. */
export interface RouteStop {
  /** 1-based position along the route (matches the number on the map pin). */
  number: number
  name: string
  lat: number
  lng: number
  /** Itinerary day the stop belongs to. */
  day: number
}

/** A map pin. Stops visited twice at the same place (e.g. the airport on day 1 and day 9) share one pin. */
export interface RouteMarker {
  lat: number
  lng: number
  numbers: number[]
  names: string[]
}

const COORD_EPSILON = 1e-4

const samePlace = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
  Math.abs(a.lat - b.lat) < COORD_EPSILON && Math.abs(a.lng - b.lng) < COORD_EPSILON

const validCoords = (s: { lat: number; lng: number }) =>
  Number.isFinite(s.lat) && Number.isFinite(s.lng) && Math.abs(s.lat) <= 90 && Math.abs(s.lng) <= 180

/**
 * Every stop across the days, in order and numbered. A stop repeated back-to-back (a day ending where the next one
 * starts, e.g. "Negombo" closing day 1 and opening day 2) is counted once.
 */
export function buildRouteStops(days: Pick<TourDay, 'dayNumber' | 'stops'>[]): RouteStop[] {
  const ordered = [...days].sort((a, b) => a.dayNumber - b.dayNumber)
  const stops: RouteStop[] = []
  for (const day of ordered) {
    for (const stop of day.stops) {
      if (!validCoords(stop)) continue
      const previous = stops[stops.length - 1]
      if (previous && (previous.name === stop.name || samePlace(previous, stop))) continue
      stops.push({ number: stops.length + 1, name: stop.name, lat: stop.lat, lng: stop.lng, day: day.dayNumber })
    }
  }
  return stops
}

/** Merges stops that share coordinates into a single pin (numbers kept in order). */
export function groupMarkers(stops: RouteStop[]): RouteMarker[] {
  const markers: RouteMarker[] = []
  for (const stop of stops) {
    const existing = markers.find((m) => samePlace(m, stop))
    if (existing) {
      existing.numbers.push(stop.number)
      if (!existing.names.includes(stop.name)) existing.names.push(stop.name)
    } else {
      markers.push({ lat: stop.lat, lng: stop.lng, numbers: [stop.number], names: [stop.name] })
    }
  }
  return markers
}

/** Stops grouped by itinerary day (for the text list under the map). */
export function stopsByDay(stops: RouteStop[]): { day: number; stops: RouteStop[] }[] {
  const groups: { day: number; stops: RouteStop[] }[] = []
  for (const stop of stops) {
    const last = groups[groups.length - 1]
    if (last && last.day === stop.day) last.stops.push(stop)
    else groups.push({ day: stop.day, stops: [stop] })
  }
  return groups
}
