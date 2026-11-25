/**
 * Heading anchors — a copy of serendiva-api/src/modules/blog/blog.headings.ts (github-slugger algorithm) so the ids
 * rendered by <Markdown> match the `headings` table of contents returned by the API. Keep both in sync.
 */

/** github-slugger `slug()`: lowercase, drop everything except letters, marks, numbers, "_", "-" and spaces; spaces → "-". */
export function headingSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
    .replace(/ /g, '-')
}

/** github-slugger `BananaSlug`: repeated slugs get "-1", "-2", … appended. */
export function createSlugger() {
  const occurrences = new Map<string, number>()
  return (text: string): string => {
    const original = headingSlug(text)
    let result = original
    while (occurrences.has(result)) {
      const n = (occurrences.get(original) ?? 0) + 1
      occurrences.set(original, n)
      result = `${original}-${n}`
    }
    occurrences.set(result, 0)
    return result
  }
}
