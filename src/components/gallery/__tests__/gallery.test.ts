import { describe, expect, it } from 'vitest'
import { galleryLayout } from '../layout'
import { parseVideoUrl, videoEmbedUrl } from '../video'
import { toRoman } from '../format'

describe('galleryLayout', () => {
  const rowSums = (count: number) => {
    const spans = galleryLayout(count).map((s) => s.span)
    const rows: number[] = []
    let sum = 0
    for (const span of spans) {
      sum += span
      if (sum === 12) {
        rows.push(sum)
        sum = 0
      }
    }
    return { spans, complete: sum === 0, rows: rows.length }
  }

  it('follows the Stitch rhythm 8|4 → 4|4|4 → 6|6 → 3|3|3|3 → 12', () => {
    expect(galleryLayout(12).map((s) => s.span)).toEqual([8, 4, 4, 4, 4, 6, 6, 3, 3, 3, 3, 12])
    expect(galleryLayout(12)[0]?.variant).toBe('feature')
    expect(galleryLayout(12)[11]?.variant).toBe('panorama')
  })

  it('always completes the last row for any number of plates', () => {
    for (let n = 0; n <= 40; n++) {
      const { spans, complete } = rowSums(n)
      expect(spans).toHaveLength(n)
      expect(complete).toBe(true)
    }
  })

  it('closes with a matching row when plates run out', () => {
    expect(galleryLayout(1).map((s) => s.span)).toEqual([12])
    expect(galleryLayout(3).map((s) => s.span)).toEqual([8, 4, 12])
    expect(galleryLayout(4).map((s) => s.span)).toEqual([8, 4, 6, 6])
  })
})

describe('parseVideoUrl', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?t=10', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?v=PLACEHOLD01', 'PLACEHOLD01'],
  ])('reads YouTube ids from %s', (url, id) => {
    expect(parseVideoUrl(url)).toEqual({ provider: 'youtube', id })
  })

  it('reads Vimeo ids', () => {
    expect(parseVideoUrl('https://vimeo.com/76979871')).toEqual({ provider: 'vimeo', id: '76979871' })
  })

  it('rejects empty, invalid and unsupported URLs', () => {
    expect(parseVideoUrl(null)).toBeNull()
    expect(parseVideoUrl('')).toBeNull()
    expect(parseVideoUrl('not a url')).toBeNull()
    expect(parseVideoUrl('https://example.com/video.mp4')).toBeNull()
  })

  it('embeds YouTube through the privacy-enhanced domain', () => {
    const url = videoEmbedUrl({ provider: 'youtube', id: 'abc123DEF45' })
    expect(url.startsWith('https://www.youtube-nocookie.com/embed/abc123DEF45?')).toBe(true)
    expect(url).toContain('autoplay=1')
  })
})

describe('toRoman', () => {
  it('formats chapter numbers', () => {
    expect([1, 2, 3, 4, 9, 14].map(toRoman)).toEqual(['I', 'II', 'III', 'IV', 'IX', 'XIV'])
  })
})
