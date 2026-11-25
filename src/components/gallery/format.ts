/** Small formatting helpers for the gallery UI. */

const ROMAN: [number, string][] = [
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
]

/** 1 → "I", 14 → "XIV" (chapter labels on the film cards). */
export function toRoman(value: number): string {
  let n = Math.max(1, Math.floor(value))
  let out = ''
  for (const [amount, glyph] of ROMAN) {
    while (n >= amount) {
      out += glyph
      n -= amount
    }
  }
  return out
}
