/** Pure text helpers for review cards (shared by cards/ReviewCard, the spotlight and the gallery quote). */

/** "Singapore" + "Singapore" → "Singapore"; "Oxford" + "United Kingdom" → "Oxford, United Kingdom". */
export function reviewPlace(location: string | null | undefined, country: string): string {
  const city = location?.trim()
  if (!city) return country
  if (!country || city.toLowerCase() === country.toLowerCase()) return city
  return `${city}, ${country}`
}

/** Splits review text into paragraphs (blank-line separated, as typed by the guest). */
export function reviewParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
}
