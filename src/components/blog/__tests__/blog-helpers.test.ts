import { describe, expect, it } from 'vitest'
import { isGuideAuthor, pickFeatured, plainExcerpt, sortPosts } from '@/components/blog/posts'
import { GUIDE_CHAPTERS } from '@/components/travel-guide/chapters'
import type { BlogCard } from '@/lib/api/types'
import travelGuide from '@/messages/en/travelGuide.json'

const post = (slug: string, publishedAt: string, isFeatured = false): BlogCard =>
  ({
    id: slug,
    slug,
    title: slug,
    excerpt: '',
    category: { slug: 'travel-tips', label: 'Travel Tips' },
    tags: [],
    readingTime: 3,
    cover: null,
    publishedAt,
    isFeatured,
    authorName: 'Dinesh Jayasuriya',
  }) as BlogCard

describe('blog post helpers', () => {
  const posts = [
    post('old-featured', '2026-01-01T00:00:00Z', true),
    post('newest', '2026-09-01T00:00:00Z'),
    post('new-featured', '2026-06-01T00:00:00Z', true),
  ]

  it('sorts newest first without mutating the input', () => {
    expect(sortPosts(posts).map((p) => p.slug)).toEqual(['newest', 'new-featured', 'old-featured'])
    expect(posts[0]?.slug).toBe('old-featured')
  })

  it('features the newest isFeatured post, else the newest post', () => {
    expect(pickFeatured(posts)?.slug).toBe('new-featured')
    expect(pickFeatured([post('a', '2026-01-01T00:00:00Z'), post('b', '2026-02-01T00:00:00Z')])?.slug).toBe('b')
    expect(pickFeatured([])).toBeNull()
  })

  it('recognises the guide as author regardless of case and spacing', () => {
    expect(isGuideAuthor('dinesh  Jayasuriya', 'Dinesh Jayasuriya')).toBe(true)
    expect(isGuideAuthor('Shantha Peiris', 'Dinesh Jayasuriya')).toBe(false)
    expect(isGuideAuthor('Dinesh Jayasuriya', null)).toBe(false)
  })

  it('strips light markdown from excerpts', () => {
    expect(plainExcerpt('Ceylon *Cinnamomum verum* and **cassia** bark')).toBe(
      'Ceylon Cinnamomum verum and cassia bark',
    )
    expect(plainExcerpt('See [my guide](/travel-guide) first')).toBe('See my guide first')
    expect(plainExcerpt('Block 1 vs Lunugamvehera')).toBe('Block 1 vs Lunugamvehera')
  })
})

describe('travel guide chapters', () => {
  it('has a "safety" anchor for the footer link /travel-guide#safety', () => {
    expect(GUIDE_CHAPTERS.map((c) => c.id)).toContain('safety')
  })

  it('has unique ids and navigation labels for every chapter', () => {
    const ids = GUIDE_CHAPTERS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const chapter of GUIDE_CHAPTERS) {
      expect(travelGuide.nav.items[chapter.key]).toBeTruthy()
      expect(travelGuide.nav.short[chapter.key]).toBeTruthy()
      expect(travelGuide[chapter.key].title).toBeTruthy()
    }
  })
})
