import type { ReviewCard } from '@/lib/api/types'

const CARD_COUNT = 3

/** First sentence of a review (banner fallback when the featured review has no pull-quote title). */
export const leadSentence = (text: string) => text.split(/(?<=[.!?])\s+/)[0] ?? text

/**
 * Picks the banner review (first featured one) and the three cards (other featured reviews first, then the
 * highest-rated most recent ones). `reviews` arrive sorted by rating, then travel date (API `sort=rating`).
 */
export function pickHomeReviews(reviews: ReviewCard[]): { banner: ReviewCard | null; cards: ReviewCard[] } {
  const banner = reviews.find((r) => r.isFeatured) ?? null
  const rest = reviews.filter((r) => r !== banner)
  const cards = [...rest.filter((r) => r.isFeatured), ...rest.filter((r) => !r.isFeatured)].slice(0, CARD_COUNT)
  return { banner, cards }
}
