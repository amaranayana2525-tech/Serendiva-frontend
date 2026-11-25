/** Small geographic helpers for the destination pages (pure). */

export type CompassPoint = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'

const COMPASS: CompassPoint[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
const toRad = (deg: number) => (deg * Math.PI) / 180

/** Great-circle distance in kilometres. */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Initial bearing from point 1 to point 2, in degrees (0 = north, clockwise). */
export function bearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2))
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1))
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

/** 8-point compass direction for a bearing. */
export function compassPoint(bearing: number): CompassPoint {
  return COMPASS[Math.round((((bearing % 360) + 360) % 360) / 45) % 8]
}

export interface GeoItem {
  slug: string
  latitude: number | null
  longitude: number | null
}

export interface Neighbour<T> {
  item: T
  km: number
  direction: CompassPoint
}

/**
 * The `limit` nearest other destinations, preferring different directions (so "Connecting X to the rest of
 * Ceylon" shows e.g. north / south-east / south-west instead of three neighbours on the same road).
 */
export function nearestNeighbours<T extends GeoItem>(origin: GeoItem, items: readonly T[], limit = 3): Neighbour<T>[] {
  if (origin.latitude === null || origin.longitude === null) return []
  const { latitude: lat, longitude: lng } = origin
  const ranked = items
    .filter(
      (d): d is T & { latitude: number; longitude: number } =>
        d.slug !== origin.slug && d.latitude !== null && d.longitude !== null,
    )
    .map((d) => ({
      item: d as T,
      km: distanceKm(lat, lng, d.latitude, d.longitude),
      direction: compassPoint(bearingDeg(lat, lng, d.latitude, d.longitude)),
    }))
    .filter((n) => n.km >= 1)
    .sort((a, b) => a.km - b.km)

  const picked: Neighbour<T>[] = []
  const usedDirections = new Set<CompassPoint>()
  for (const n of ranked) {
    if (picked.length >= limit) break
    if (usedDirections.has(n.direction)) continue
    picked.push(n)
    usedDirections.add(n.direction)
  }
  for (const n of ranked) {
    if (picked.length >= limit) break
    if (!picked.includes(n)) picked.push(n)
  }
  return picked.sort((a, b) => a.km - b.km)
}
