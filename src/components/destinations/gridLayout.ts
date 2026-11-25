/**
 * Asymmetric 12-column rhythm of the Stitch destination grid: rows of 7/5, 5/7, 6/6, 6/6 columns, repeating.
 * The first card is the "hero" (Signature Curations, Private Guided), cards in the first row of each cycle get
 * the taller image, 7-column cards get roomier padding. A lone last card spans the full row.
 */

export interface GridCell {
  /** Tailwind classes for the grid item (literal strings so Tailwind keeps them). */
  className: string
  featured: boolean
  tallImage: boolean
  roomy: boolean
}

const ROWS: readonly (readonly [5 | 6 | 7, 5 | 6 | 7])[] = [
  [7, 5],
  [5, 7],
  [6, 6],
  [6, 6],
]

const SPAN_CLASS: Record<5 | 6 | 7 | 12, string> = {
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  12: 'md:col-span-2 lg:col-span-12',
}

export function destinationGridLayout(count: number): GridCell[] {
  return Array.from({ length: Math.max(0, count) }, (_, i) => {
    const row = Math.floor(i / 2)
    const pattern = ROWS[row % ROWS.length]
    const lone = i === count - 1 && count % 2 === 1
    const span = lone ? 12 : pattern[i % 2]
    return {
      className: SPAN_CLASS[span],
      featured: i === 0,
      tallImage: row % ROWS.length === 0 && !lone,
      roomy: span === 7,
    }
  })
}
