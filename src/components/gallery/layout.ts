/**
 * The Stitch gallery is an editorial 12-column grid whose rows repeat a fixed rhythm:
 *   [8 | 4]  →  [4 | 4 | 4]  →  [6 | 6]  →  [3 | 3 | 3 | 3]  →  [12]
 * Every plate gets a column span and a card variant (heights / type sizes differ per row). When a filter leaves fewer
 * plates than the next row needs, that last row switches to a pattern with exactly that many plates, so rows are
 * always complete (no ragged holes).
 */

export type PlateVariant = 'feature' | 'tall' | 'standard' | 'wide' | 'compact' | 'panorama'

export interface PlateSlot {
  span: 3 | 4 | 6 | 8 | 12
  variant: PlateVariant
}

const ROWS: PlateSlot[][] = [
  [
    { span: 8, variant: 'feature' },
    { span: 4, variant: 'tall' },
  ],
  [
    { span: 4, variant: 'standard' },
    { span: 4, variant: 'standard' },
    { span: 4, variant: 'standard' },
  ],
  [
    { span: 6, variant: 'wide' },
    { span: 6, variant: 'wide' },
  ],
  [
    { span: 3, variant: 'compact' },
    { span: 3, variant: 'compact' },
    { span: 3, variant: 'compact' },
    { span: 3, variant: 'compact' },
  ],
  [{ span: 12, variant: 'panorama' }],
]

/** Rows used to close the grid when only 1–3 plates remain. */
const CLOSING_ROWS: Record<number, PlateSlot[]> = {
  1: [{ span: 12, variant: 'panorama' }],
  2: [
    { span: 6, variant: 'wide' },
    { span: 6, variant: 'wide' },
  ],
  3: [
    { span: 4, variant: 'standard' },
    { span: 4, variant: 'standard' },
    { span: 4, variant: 'standard' },
  ],
}

/** Column span + variant for each of `count` plates, in order. */
export function galleryLayout(count: number): PlateSlot[] {
  const slots: PlateSlot[] = []
  let row = 0
  while (slots.length < count) {
    const remaining = count - slots.length
    let pattern = ROWS[row % ROWS.length]!
    // Not enough plates left for this row's rhythm → close with a row of exactly `remaining` plates.
    if (remaining < pattern.length) pattern = CLOSING_ROWS[remaining]!
    slots.push(...pattern)
    row++
  }
  return slots.slice(0, count)
}

/** Static class names per span (written out so Tailwind sees them). */
export const SPAN_CLASS: Record<PlateSlot['span'], string> = {
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  6: 'lg:col-span-6',
  8: 'lg:col-span-8',
  12: 'lg:col-span-12',
}

/** Responsive `sizes` hint per span (2 columns from md, 12-col grid from lg). */
export const SPAN_SIZES: Record<PlateSlot['span'], string> = {
  3: '(min-width: 1024px) 22vw, (min-width: 768px) 50vw, 100vw',
  4: '(min-width: 1024px) 30vw, (min-width: 768px) 50vw, 100vw',
  6: '(min-width: 1024px) 45vw, (min-width: 768px) 50vw, 100vw',
  8: '(min-width: 1440px) 860px, (min-width: 1024px) 60vw, (min-width: 768px) 50vw, 100vw',
  12: '(min-width: 1440px) 1280px, (min-width: 1024px) 90vw, (min-width: 768px) 50vw, 100vw',
}
