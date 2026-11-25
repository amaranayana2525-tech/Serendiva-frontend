import { describe, expect, it } from 'vitest'
import type { ReviewCard } from '@/lib/api/types'
import { leadSentence, pickHomeReviews } from '../reviewPicks'

const review = (id: string, isFeatured = false) => ({ id, isFeatured }) as unknown as ReviewCard

describe('pickHomeReviews', () => {
  it('uses the first featured review for the banner and fills 3 cards (featured first, then API order)', () => {
    const { banner, cards } = pickHomeReviews([
      review('a'),
      review('b'),
      review('f1', true),
      review('c'),
      review('f2', true),
    ])
    expect(banner?.id).toBe('f1')
    expect(cards.map((r) => r.id)).toEqual(['f2', 'a', 'b'])
  })

  it('works without featured reviews and with short lists', () => {
    expect(pickHomeReviews([review('a'), review('b')])).toEqual({ banner: null, cards: [review('a'), review('b')] })
    expect(pickHomeReviews([])).toEqual({ banner: null, cards: [] })
  })
})

describe('leadSentence', () => {
  it('returns the first sentence', () => {
    expect(leadSentence('Wonderful trip. We will be back! Thanks.')).toBe('Wonderful trip.')
    expect(leadSentence('No full stop')).toBe('No full stop')
  })
})
