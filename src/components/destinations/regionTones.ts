/**
 * Colour tone of a region, by its position in GET /regions (the CMS order). Reproduces the Stitch
 * destinations explorer: legend icon tiles, map hubs and the card meta badges all share the region's tone.
 * Class names are literal so Tailwind keeps them.
 */
export interface RegionTone {
  /** Legend icon tile (background + icon colour). */
  tile: string
  /** Text colour for badges / labels. */
  text: string
  /** Solid dot (map tooltip). */
  dot: string
  /** SVG fill for map hubs. */
  fill: string
  /** SVG stroke for the highlighted-hub ring. */
  stroke: string
  /** SVG fill for map labels. */
  labelFill: string
}

export const REGION_TONES: readonly RegionTone[] = [
  {
    tile: 'bg-secondary/10 text-secondary',
    text: 'text-secondary',
    dot: 'bg-secondary',
    fill: 'fill-secondary',
    stroke: 'stroke-secondary',
    labelFill: 'fill-secondary',
  },
  {
    tile: 'bg-tertiary/10 text-tertiary',
    text: 'text-tertiary',
    dot: 'bg-tertiary',
    fill: 'fill-tertiary',
    stroke: 'stroke-tertiary',
    labelFill: 'fill-tertiary',
  },
  {
    tile: 'bg-primary/10 text-primary',
    text: 'text-primary',
    dot: 'bg-primary',
    fill: 'fill-primary',
    stroke: 'stroke-primary',
    labelFill: 'fill-primary',
  },
  {
    tile: 'bg-primary-container/10 text-primary-container',
    text: 'text-primary',
    dot: 'bg-primary-container',
    fill: 'fill-primary-container',
    stroke: 'stroke-primary-container',
    labelFill: 'fill-primary',
  },
  {
    tile: 'bg-tertiary-container/10 text-tertiary',
    text: 'text-tertiary',
    dot: 'bg-tertiary',
    fill: 'fill-tertiary',
    stroke: 'stroke-tertiary',
    labelFill: 'fill-tertiary',
  },
  {
    tile: 'bg-secondary-container/20 text-secondary',
    text: 'text-secondary',
    dot: 'bg-secondary',
    fill: 'fill-secondary',
    stroke: 'stroke-secondary',
    labelFill: 'fill-secondary',
  },
]

/** Tone for a region position (cycles when the CMS has more than six regions). Negative → first tone. */
export function regionTone(index: number): RegionTone {
  const safe = Number.isFinite(index) && index >= 0 ? Math.floor(index) : 0
  return REGION_TONES[safe % REGION_TONES.length]
}

/** Map of region slug → position in the regions list (for `regionTone`). */
export function regionIndexMap(regions: readonly { slug: string }[]): Map<string, number> {
  return new Map(regions.map((r, i) => [r.slug, i]))
}
