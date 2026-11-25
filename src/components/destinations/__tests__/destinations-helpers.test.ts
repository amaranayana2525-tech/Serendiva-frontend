import { describe, expect, it } from 'vitest'
import { paragraphs, plainText, splitDescription, splitExperienceMeta } from '../content'
import { compassPoint, distanceKm, nearestNeighbours } from '../geo'
import { destinationGridLayout } from '../gridLayout'
import {
  ISLAND_POLYGONS,
  MAP_VIEWBOX,
  hubPosition,
  isInsideIsland,
  labelWidth,
  layoutLabels,
  projectLatLng,
  shortHubLabel,
} from '../islandMapGeometry'
import { regionTone } from '../regionTones'

/** All 12 seeded destinations in display order: [label, lat, lng]. */
const SEEDED_DESTINATIONS: readonly [string, number, number][] = [
  ['Ella', 6.8667, 81.0466],
  ['Sigiriya', 7.957, 80.7603],
  ['Galle Fort', 6.0267, 80.217],
  ['Yala', 6.3725, 81.5169],
  ['Kandy', 7.2906, 80.6337],
  ['Mirissa', 5.9483, 80.4716],
  ['Nuwara Eliya', 6.9497, 80.7891],
  ['Trincomalee', 8.5874, 81.2152],
  ['Anuradhapura', 7.9403, 81.0188],
  ['Udawalawe', 6.4333, 80.8833],
  ['Colombo', 6.9271, 79.8612],
  ['Bentota', 6.421, 79.998],
]

describe('island map projection', () => {
  it('uses an unsheared true-scale projection aligned to Sri Lanka proportions', () => {
    const base = projectLatLng(7.5, 80.5)
    const east1 = projectLatLng(7.5, 81.5)
    const north1 = projectLatLng(8.5, 80.5)

    // Pure longitude step keeps y invariant; pure latitude step keeps x invariant (zero shear).
    expect(east1.y).toBeCloseTo(base.y, 6)
    expect(north1.x).toBeCloseTo(base.x, 6)

    const scaleX = east1.x - base.x
    const scaleY = base.y - north1.y
    expect(scaleX / scaleY).toBeCloseTo(Math.cos((7.8774 * Math.PI) / 180), 4)

    // Real geographic tilt: northern tip Point Pedro sits west of southern tip Dondra Head.
    const pointPedro = projectLatLng(9.83, 80.21)
    const dondraHead = projectLatLng(5.92, 80.59)
    expect(pointPedro.x).toBeLessThan(dondraHead.x)

    // Overall bounding-box aspect ratio (mainland + offshore islands) matches real Sri Lanka (~0.56–0.57).
    const allPts = ISLAND_POLYGONS.flat()
    const xs = allPts.map((p) => p.x)
    const ys = allPts.map((p) => p.y)
    const width = Math.max(...xs) - Math.min(...xs)
    const height = Math.max(...ys) - Math.min(...ys)
    const ratio = width / height
    expect(ratio).toBeGreaterThan(0.53)
    expect(ratio).toBeLessThan(0.6)
  })

  it('keeps every seeded destination and coastal extreme inside the island without inland yanking', () => {
    const locations: readonly [string, number, number][] = [
      ...SEEDED_DESTINATIONS,
      ['Point Pedro', 9.83, 80.21],
      ['Dondra Head', 5.92, 80.59],
      ['Kalpitiya', 8.23, 79.76],
      ['Sangaman Kanda', 7.02, 81.88],
      ['Jaffna', 9.6615, 80.0255],
      ['Mannar', 8.981, 79.9044],
      ['Arugam Bay', 6.84, 81.836],
    ]

    for (const [name, lat, lng] of locations) {
      const raw = projectLatLng(lat, lng)
      const hub = hubPosition(lat, lng)
      expect(isInsideIsland(hub), name).toBe(true)
      expect(Math.hypot(hub.x - raw.x, hub.y - raw.y), `${name} shift`).toBeLessThan(5)
      expect(hub.x, `${name} x in viewBox`).toBeGreaterThan(0)
      expect(hub.x, `${name} x in viewBox`).toBeLessThan(MAP_VIEWBOX.width)
      expect(hub.y, `${name} y in viewBox`).toBeGreaterThan(0)
      expect(hub.y, `${name} y in viewBox`).toBeLessThan(MAP_VIEWBOX.height)
    }

    // Offshore islands such as Mannar register as land, whereas open ocean stays outside.
    expect(isInsideIsland(projectLatLng(8.981, 79.9044))).toBe(true)
    for (const [lat, lng] of [
      [5.5, 79.5],
      [9.0, 82.0],
      [9.3, 79.5],
    ]) {
      expect(isInsideIsland(projectLatLng(lat, lng))).toBe(false)
    }
  })

  it('preserves real north-south and west-east geographic ordering', () => {
    const jaffna = hubPosition(9.6615, 80.0255)
    const trincomalee = hubPosition(8.5874, 81.2152)
    const sigiriya = hubPosition(7.957, 80.7603)
    const kandy = hubPosition(7.2906, 80.6337)
    const ella = hubPosition(6.8667, 81.0466)
    const galle = hubPosition(6.0267, 80.217)
    const mirissa = hubPosition(5.9483, 80.4716)
    const kalpitiya = hubPosition(8.23, 79.76)
    const colombo = hubPosition(6.9271, 79.8612)
    const yala = hubPosition(6.3725, 81.5169)
    const arugamBay = hubPosition(6.84, 81.836)

    expect(jaffna.y).toBeLessThan(trincomalee.y)
    expect(trincomalee.y).toBeLessThan(sigiriya.y)
    expect(sigiriya.y).toBeLessThan(kandy.y)
    expect(kandy.y).toBeLessThan(ella.y)
    expect(ella.y).toBeLessThan(galle.y)
    expect(galle.y).toBeLessThan(mirissa.y)

    expect(kalpitiya.x).toBeLessThan(colombo.x)
    expect(colombo.x).toBeLessThan(galle.x)
    expect(galle.x).toBeLessThan(kandy.x)
    expect(kandy.x).toBeLessThan(ella.x)
    expect(ella.x).toBeLessThan(trincomalee.x)
    expect(trincomalee.x).toBeLessThan(yala.x)
    expect(yala.x).toBeLessThan(arugamBay.x)
  })

  it('shortens compound names for map labels', () => {
    expect(shortHubLabel('Sigiriya & Dambulla')).toBe('Sigiriya')
    expect(shortHubLabel('Yala and Bundala')).toBe('Yala')
    expect(shortHubLabel('Ella')).toBe('Ella')
  })

  it('places labels for all 12 seeded destinations cleanly inside MAP_VIEWBOX without overlaps', () => {
    const hubs = SEEDED_DESTINATIONS.map(([label, lat, lng]) => ({
      ...hubPosition(lat, lng),
      label,
    }))
    const placements = layoutLabels(hubs)
    const boxes = placements.map((p, i) => {
      const w = labelWidth(hubs[i].label)
      const x1 = p.anchor === 'start' ? p.x : p.anchor === 'end' ? p.x - w : p.x - w / 2
      return { x1, x2: x1 + w, y1: p.y - 8.5, y2: p.y + 3 }
    })

    for (let i = 0; i < boxes.length; i++) {
      expect(boxes[i].x1, `${hubs[i].label} left bound`).toBeGreaterThanOrEqual(0)
      expect(boxes[i].x2, `${hubs[i].label} right bound`).toBeLessThanOrEqual(MAP_VIEWBOX.width)
      expect(boxes[i].y1, `${hubs[i].label} top bound`).toBeGreaterThanOrEqual(0)
      expect(boxes[i].y2, `${hubs[i].label} bottom bound`).toBeLessThanOrEqual(MAP_VIEWBOX.height)
    }

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]
        const b = boxes[j]
        const overlaps = a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2
        expect(overlaps, `${hubs[i].label} / ${hubs[j].label}`).toBe(false)
      }
    }
  })
})

describe('destination grid rhythm', () => {
  it('follows the Stitch 7/5 · 5/7 · 6/6 · 6/6 rows', () => {
    const cells = destinationGridLayout(8)
    expect(cells.map((c) => c.className)).toEqual([
      'lg:col-span-7',
      'lg:col-span-5',
      'lg:col-span-5',
      'lg:col-span-7',
      'lg:col-span-6',
      'lg:col-span-6',
      'lg:col-span-6',
      'lg:col-span-6',
    ])
    expect(cells.map((c) => c.featured)).toEqual([true, false, false, false, false, false, false, false])
    expect(cells.map((c) => c.tallImage)).toEqual([true, true, false, false, false, false, false, false])
    expect(cells.map((c) => c.roomy)).toEqual([true, false, false, true, false, false, false, false])
  })

  it('lets a lone last card span the full row', () => {
    const cells = destinationGridLayout(3)
    expect(cells[2].className).toBe('md:col-span-2 lg:col-span-12')
    expect(destinationGridLayout(0)).toEqual([])
  })
})

describe('content helpers', () => {
  it('splits the description into a plain hero lead and the rest', () => {
    const { lead, rest } = splitDescription({
      description: 'Where the **ridge** drops [1,000 m](https://x.y).\n\nSecond paragraph.\n\nThird.',
      summary: 'Summary',
    })
    expect(lead).toBe('Where the ridge drops 1,000 m.')
    expect(rest).toEqual(['Second paragraph.', 'Third.'])
    expect(splitDescription({ description: '', summary: 'Summary' })).toEqual({ lead: 'Summary', rest: [] })
    expect(paragraphs('a\n\n\n b ')).toEqual(['a', 'b'])
    expect(plainText('# Title\n_it_')).toBe('Title it')
  })

  it('splits experience meta like Stitch', () => {
    expect(splitExperienceMeta('Moderate • 1.5 Hours • 05:40 AM Departure')).toEqual([
      'Moderate • 1.5 Hours',
      '05:40 AM Departure',
    ])
    expect(splitExperienceMeta('Easy • 2 Hours')).toEqual(['Easy • 2 Hours'])
    expect(splitExperienceMeta(null)).toEqual([])
  })
})

describe('geo helpers', () => {
  it('measures distances and directions', () => {
    // Ella → Nuwara Eliya ≈ 30 km to the north-west
    expect(distanceKm(6.8667, 81.0466, 6.9497, 80.7891)).toBeGreaterThan(25)
    expect(distanceKm(6.8667, 81.0466, 6.9497, 80.7891)).toBeLessThan(35)
    expect(compassPoint(0)).toBe('N')
    expect(compassPoint(135)).toBe('SE')
    expect(compassPoint(350)).toBe('N')
  })

  it('picks the nearest destinations in different directions', () => {
    const origin = { slug: 'ella', latitude: 6.8667, longitude: 81.0466 }
    const items = [
      origin,
      { slug: 'nuwara-eliya', latitude: 6.9497, longitude: 80.7891 },
      { slug: 'yala', latitude: 6.3725, longitude: 81.5169 },
      { slug: 'galle', latitude: 6.0267, longitude: 80.217 },
      { slug: 'kandy', latitude: 7.2906, longitude: 80.6337 },
      { slug: 'nowhere', latitude: null, longitude: null },
    ]
    const result = nearestNeighbours(origin, items, 3)
    expect(result).toHaveLength(3)
    expect(result.map((r) => r.item.slug)).not.toContain('ella')
    expect(result.map((r) => r.item.slug)).not.toContain('nowhere')
    expect(result[0].item.slug).toBe('nuwara-eliya')
    expect(nearestNeighbours({ slug: 'x', latitude: null, longitude: null }, items)).toEqual([])
  })
})

describe('region tones', () => {
  it('cycles through the six Stitch tones', () => {
    expect(regionTone(0).text).toBe('text-secondary')
    expect(regionTone(1).text).toBe('text-tertiary')
    expect(regionTone(6)).toEqual(regionTone(0))
    expect(regionTone(-1)).toEqual(regionTone(0))
  })
})
