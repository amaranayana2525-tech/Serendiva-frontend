import type { BlogCard } from '@/lib/api/types'

/** Newest first (the API already sorts, but the list page must not depend on it). */
export function sortPosts(posts: BlogCard[]): BlogCard[] {
  return [...posts].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
}

/** The journal hero post: the newest `isFeatured` post, else the newest post. */
export function pickFeatured(posts: BlogCard[]): BlogCard | null {
  const sorted = sortPosts(posts)
  return sorted.find((p) => p.isFeatured) ?? sorted[0] ?? null
}

/** Is `author` the site's guide (case/spacing-insensitive)? Guest dispatches get a different author box. */
export function isGuideAuthor(author: string, guideName: string | null | undefined): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
  return Boolean(guideName) && norm(author) === norm(guideName ?? '')
}

/** Excerpts may contain light markdown (`*Cinnamomum verum*`, links) — cards and heroes show plain text. */
export function plainExcerpt(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|\*|_|`)(\S(?:.*?\S)?)\1/g, '$2')
    .trim()
}
