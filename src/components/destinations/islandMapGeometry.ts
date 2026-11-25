/*
 * Geometry and true-scale projection of the Sri Lanka map on /destinations (pure — shared by the
 * server section and unit tests).
 *
 * Both the island silhouette (mainland + Jaffna Peninsula + offshore islands), highland elevation contours,
 * marine corridors and every destination pin pass through the same equirectangular projection calibrated
 * for Sri Lanka's mean latitude (cos 7.8774° ≈ 0.9906) so coasts, peninsulas and inland markers align
 * accurately with real WGS84 coordinates.
 */

import {
  ADAMS_BRIDGE_COORDS,
  CENTRAL_HIGHLANDS_INNER_COORDS,
  CENTRAL_HIGHLANDS_OUTER_COORDS,
  EAST_REEF_COORDS,
  SOUTH_WHALE_SHELF_COORDS,
  SRI_LANKA_MAINLAND_COORDS,
  SRI_LANKA_OFFSHORE_ISLANDS,
  type LatLngTuple,
} from './sriLankaCoastline'

export const MAP_VIEWBOX = { width: 480, height: 628 } as const

export interface Point {
  x: number
  y: number
}

/** True-scale equirectangular projection parameters centred on Sri Lanka. */
const REF_LAT = 7.8774
const REF_LNG = 80.765
const SCALE_Y = 138
const SCALE_X = SCALE_Y * Math.cos((REF_LAT * Math.PI) / 180)
const CX = 240
const CY = 306

const round1 = (value: number): number => Math.round(value * 10) / 10

/** True-scale equirectangular projection of WGS84 coordinates into the SVG viewBox. */
export function projectLatLng(lat: number, lng: number): Point {
  return {
    x: CX + (lng - REF_LNG) * SCALE_X,
    y: CY - (lat - REF_LAT) * SCALE_Y,
  }
}

function projectRing(coords: readonly LatLngTuple[]): Point[] {
  return coords.map(([lat, lng]) => {
    const p = projectLatLng(lat, lng)
    return { x: round1(p.x), y: round1(p.y) }
  })
}

function polygonToSvgPath(polygon: readonly Point[]): string {
  return `M ${polygon.map((p) => `${p.x} ${p.y}`).join(' L ')} Z`
}

/** Closed Catmull-Rom spline converted to SVG cubic Bézier segments for smooth highland contours. */
function smoothClosedPath(coords: readonly LatLngTuple[]): string {
  const pts = coords.map(([lat, lng]) => projectLatLng(lat, lng))
  const n = pts.length
  if (n < 3) return ''
  let d = ''
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    if (i === 0) d += `M ${round1(p1.x)} ${round1(p1.y)}`
    const c1x = round1(p1.x + (p2.x - p0.x) / 6)
    const c1y = round1(p1.y + (p2.y - p0.y) / 6)
    const c2x = round1(p2.x - (p3.x - p1.x) / 6)
    const c2y = round1(p2.y - (p3.y - p1.y) / 6)
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${round1(p2.x)} ${round1(p2.y)}`
  }
  return `${d} Z`
}

function smoothOpenPath(coords: readonly LatLngTuple[]): string {
  const pts = coords.map(([lat, lng]) => projectLatLng(lat, lng))
  if (pts.length === 4) {
    return `M ${round1(pts[0].x)} ${round1(pts[0].y)} C ${round1(pts[1].x)} ${round1(pts[1].y)}, ${round1(pts[2].x)} ${round1(pts[2].y)}, ${round1(pts[3].x)} ${round1(pts[3].y)}`
  }
  if (pts.length === 3) {
    return `M ${round1(pts[0].x)} ${round1(pts[0].y)} Q ${round1(pts[1].x)} ${round1(pts[1].y)} ${round1(pts[2].x)} ${round1(pts[2].y)}`
  }
  return `M ${pts.map((p) => `${round1(p.x)} ${round1(p.y)}`).join(' L ')}`
}

/** Mainland polygon sampled in SVG viewBox coordinates (for point-in-island checks). */
export const ISLAND_POLYGON: Point[] = projectRing(SRI_LANKA_MAINLAND_COORDS)

/** Projected polygons of Mannar and the Jaffna archipelago islands. */
export const OFFSHORE_POLYGONS: Point[][] = SRI_LANKA_OFFSHORE_ISLANDS.map(projectRing)

/** All land polygons of Sri Lanka (mainland + offshore islands). */
export const ISLAND_POLYGONS: Point[][] = [ISLAND_POLYGON, ...OFFSHORE_POLYGONS]

export const ISLAND_PATH: string = polygonToSvgPath(ISLAND_POLYGON)
export const OFFSHORE_ISLAND_PATHS: string[] = OFFSHORE_POLYGONS.map(polygonToSvgPath)
export const HILL_CONTOUR_PATH: string = smoothClosedPath(CENTRAL_HIGHLANDS_OUTER_COORDS)
export const HIGHLAND_PEAK_CONTOUR_PATH: string = smoothClosedPath(CENTRAL_HIGHLANDS_INNER_COORDS)
export const REEF_PATH: string = smoothOpenPath(EAST_REEF_COORDS)
export const WHALE_CORRIDOR_PATH: string = smoothOpenPath(SOUTH_WHALE_SHELF_COORDS)
export const ADAMS_BRIDGE_PATH: string = smoothOpenPath(ADAMS_BRIDGE_COORDS)

function pointInPolygon(point: Point, polygon: readonly Point[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]
    const b = polygon[j]
    if (a.y > point.y !== b.y > point.y && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside
    }
  }
  return inside
}

/** Ray-casting point-in-island check (covers mainland + offshore islands when no polygon is passed). */
export function isInsideIsland(point: Point, polygon?: readonly Point[]): boolean {
  if (polygon) return pointInPolygon(point, polygon)
  return ISLAND_POLYGONS.some((poly) => pointInPolygon(point, poly))
}

interface EdgeInfo {
  dist: number
  proj: Point
  nx: number
  ny: number
}

function nearestEdgeInfo(point: Point, polygon: readonly Point[]): EdgeInfo {
  let best: EdgeInfo = { dist: Infinity, proj: point, nx: 0, ny: 0 }
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len2 = dx * dx + dy * dy
    if (len2 < 1e-9) continue
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len2))
    const px = a.x + t * dx
    const py = a.y + t * dy
    const dist = Math.hypot(point.x - px, point.y - py)
    if (dist < best.dist) {
      const len = Math.sqrt(len2)
      best = { dist, proj: { x: px, y: py }, nx: -dy / len, ny: dx / len }
    }
  }
  // Ensure the unit normal points inward into `polygon`.
  const probe = { x: best.proj.x + best.nx * 0.6, y: best.proj.y + best.ny * 0.6 }
  if (!pointInPolygon(probe, polygon)) {
    best.nx = -best.nx
    best.ny = -best.ny
  }
  return best
}

function stepInwardFromEdge(info: EdgeInfo, polygon: readonly Point[], inset: number): Point | null {
  for (const step of [inset, inset * 0.6, 1.0, 0.5]) {
    const candidate = { x: info.proj.x + info.nx * step, y: info.proj.y + info.ny * step }
    if (pointInPolygon(candidate, polygon)) {
      return { x: round1(candidate.x), y: round1(candidate.y) }
    }
  }
  return null
}

/**
 * Projected hub position, nudged by at most a few viewBox units along the local inward coast normal
 * when a coastal or cape coordinate falls right on or just seaward of the simplified outline.
 */
export function hubPosition(lat: number, lng: number, inset = 2.5): Point {
  const raw = projectLatLng(lat, lng)
  const targetPoly = ISLAND_POLYGONS.find((poly) => pointInPolygon(raw, poly))
  if (targetPoly) {
    const info = nearestEdgeInfo(raw, targetPoly)
    if (info.dist >= inset) {
      return { x: round1(raw.x), y: round1(raw.y) }
    }
    return stepInwardFromEdge(info, targetPoly, inset) ?? { x: round1(raw.x), y: round1(raw.y) }
  }

  let bestPoly = ISLAND_POLYGON
  let bestInfo = nearestEdgeInfo(raw, ISLAND_POLYGON)
  for (const poly of OFFSHORE_POLYGONS) {
    const info = nearestEdgeInfo(raw, poly)
    if (info.dist < bestInfo.dist) {
      bestInfo = info
      bestPoly = poly
    }
  }

  const nudged = stepInwardFromEdge(bestInfo, bestPoly, inset)
  if (nudged) return nudged

  // Radial fallback for tight headlands or acute polygon vertices.
  for (const r of [1.5, 3, 5]) {
    for (let a = 0; a < 16; a++) {
      const rad = (a * Math.PI) / 8
      const candidate = { x: bestInfo.proj.x + Math.cos(rad) * r, y: bestInfo.proj.y + Math.sin(rad) * r }
      if (pointInPolygon(candidate, bestPoly)) {
        return { x: round1(candidate.x), y: round1(candidate.y) }
      }
    }
  }

  return { x: round1(raw.x), y: round1(raw.y) }
}

/** Short map label: the first place of a compound name ("Sigiriya & Dambulla" -> "Sigiriya"). */
export function shortHubLabel(name: string): string {
  const first = name.split(/\s+(?:&|and|und|和|·|\/)\s+|,\s*/)[0]?.trim()
  return first || name
}

// ------------------------------------------------------------------------------------------------ labels

export type LabelAnchor = 'start' | 'end' | 'middle'

export interface LabelPlacement {
  x: number
  y: number
  anchor: LabelAnchor
}

interface Box {
  x1: number
  y1: number
  x2: number
  y2: number
}

const overlap = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) * Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1))

/** Approximate rendered width of an 11-unit Inter semibold label. */
export const labelWidth = (text: string, fontSize = 11) => Math.ceil(text.length * fontSize * 0.58)

export interface LabelInput {
  x: number
  y: number
  label: string
  /** Hub radius (labels keep clear of the dot). */
  radius?: number
}

/**
 * Greedy 8-direction label placement: tries coast-aware cardinal and diagonal offsets, picking the
 * first slot that avoids collisions with hub markers and previously placed labels while staying inside
 * MAP_VIEWBOX. Hubs are processed in display priority order.
 */
export function layoutLabels(hubs: LabelInput[], fontSize = 11): LabelPlacement[] {
  const ascent = fontSize * 0.78
  const descent = fontSize * 0.26
  const pad = 3
  const dots: Box[] = hubs.map((h) => {
    const r = (h.radius ?? 6) + 5
    return { x1: h.x - r, y1: h.y - r, x2: h.x + r, y2: h.y + r }
  })
  const placed: Box[] = []

  return hubs.map((hub, index) => {
    const w = labelWidth(hub.label, fontSize)
    const gap = (hub.radius ?? 6) + 7
    const baseline = hub.y + fontSize * 0.36
    const right = {
      x: hub.x + gap,
      y: baseline,
      anchor: 'start' as const,
      box: { x1: hub.x + gap, x2: hub.x + gap + w },
    }
    const left = {
      x: hub.x - gap,
      y: baseline,
      anchor: 'end' as const,
      box: { x1: hub.x - gap - w, x2: hub.x - gap },
    }
    const above = {
      x: hub.x,
      y: hub.y - gap,
      anchor: 'middle' as const,
      box: { x1: hub.x - w / 2, x2: hub.x + w / 2 },
    }
    const below = {
      x: hub.x,
      y: hub.y + gap + ascent,
      anchor: 'middle' as const,
      box: { x1: hub.x - w / 2, x2: hub.x + w / 2 },
    }
    const diag = gap * 0.75
    const aboveRight = {
      x: hub.x + diag,
      y: hub.y - diag,
      anchor: 'start' as const,
      box: { x1: hub.x + diag, x2: hub.x + diag + w },
    }
    const aboveLeft = {
      x: hub.x - diag,
      y: hub.y - diag,
      anchor: 'end' as const,
      box: { x1: hub.x - diag - w, x2: hub.x - diag },
    }
    const belowRight = {
      x: hub.x + diag,
      y: hub.y + diag + ascent,
      anchor: 'start' as const,
      box: { x1: hub.x + diag, x2: hub.x + diag + w },
    }
    const belowLeft = {
      x: hub.x - diag,
      y: hub.y + diag + ascent,
      anchor: 'end' as const,
      box: { x1: hub.x - diag - w, x2: hub.x - diag },
    }

    let order
    if (hub.y > 548) {
      order =
        hub.x < 185
          ? [left, belowLeft, below, aboveLeft, right, belowRight, above, aboveRight]
          : [below, belowRight, right, belowLeft, left, above, aboveRight, aboveLeft]
    } else if (hub.x < 200) {
      order = [left, aboveLeft, belowLeft, above, below, right, aboveRight, belowRight]
    } else {
      order = [right, aboveRight, belowRight, left, above, below, aboveLeft, belowLeft]
    }

    let best: { placement: LabelPlacement; box: Box; cost: number } | null = null
    for (const candidate of order) {
      const box: Box = {
        x1: candidate.box.x1 - pad,
        x2: candidate.box.x2 + pad,
        y1: candidate.y - ascent - pad,
        y2: candidate.y + descent + pad,
      }
      const outOfBounds = box.x1 < 4 || box.x2 > MAP_VIEWBOX.width - 4 || box.y1 < 4 || box.y2 > MAP_VIEWBOX.height - 4
      const cost =
        (outOfBounds ? 10_000 : 0) +
        dots.reduce((sum, dot, i) => (i === index ? sum : sum + overlap(box, dot) * 6), 0) +
        placed.reduce((sum, other) => sum + overlap(box, other) * 3, 0)
      if (!best || cost < best.cost) {
        best = {
          placement: { x: round1(candidate.x), y: round1(candidate.y), anchor: candidate.anchor },
          box,
          cost,
        }
      }
      if (cost === 0) break
    }
    // `order` is never empty, so `best` is always set here.
    const chosen = best as { placement: LabelPlacement; box: Box; cost: number }
    placed.push(chosen.box)
    return chosen.placement
  })
}
