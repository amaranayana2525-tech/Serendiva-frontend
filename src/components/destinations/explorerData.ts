import 'server-only'
import { getDestinations, getRegions } from '@/lib/api/public'
import type { DestinationCard, Locale, Region } from '@/lib/api/types'
import { hubPosition, layoutLabels, shortHubLabel } from './islandMapGeometry'
import type { MapHub, MapRegion } from './IslandMap'
import { regionIndexMap } from './regionTones'

export interface ExplorerData {
  destinations: DestinationCard[]
  regions: Region[]
}

/** Published destinations + regions for /destinations (both cached with tags; requests are deduplicated). */
export async function loadExplorerData(locale: Locale): Promise<ExplorerData> {
  const [list, regions] = await Promise.all([getDestinations(locale), getRegions(locale)])
  return { destinations: list.items, regions }
}

/** How many of the first (curated-order) destinations pulse on the map, like the three Stitch signature hubs. */
const SIGNATURE_HUBS = 3

/** Projects destinations with coordinates onto the stylised island and lays out their labels. */
export function buildMapModel({ destinations, regions }: ExplorerData): { hubs: MapHub[]; regions: MapRegion[] } {
  const toneOf = regionIndexMap(regions)
  const located = destinations.filter(
    (d): d is DestinationCard & { latitude: number; longitude: number } => d.latitude !== null && d.longitude !== null,
  )
  const points = located.map((d) => ({ ...hubPosition(d.latitude, d.longitude), label: shortHubLabel(d.name) }))
  const labels = layoutLabels(points)
  const hubs: MapHub[] = located.map((d, i) => ({
    slug: d.slug,
    name: d.name,
    label: points[i].label,
    summary: d.summary,
    regionSlug: d.region?.slug ?? null,
    regionName: d.region?.name ?? null,
    toneIndex: d.region ? (toneOf.get(d.region.slug) ?? 0) : 0,
    signature: i < SIGNATURE_HUBS,
    x: points[i].x,
    y: points[i].y,
    labelX: Math.round(labels[i].x * 10) / 10,
    labelY: Math.round(labels[i].y * 10) / 10,
    anchor: labels[i].anchor,
  }))
  const mapRegions: MapRegion[] = regions.map((r, i) => ({
    slug: r.slug,
    name: r.name,
    description: r.description,
    icon: r.icon,
    toneIndex: i,
  }))
  return { hubs, regions: mapRegions }
}
