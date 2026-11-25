import type { ReviewCard, ReviewSummary } from '@/lib/api/types'
import { aggregateRatingJsonLd } from '@/components/seo/jsonld'

/**
 * TravelAgency with AggregateRating + a sample of the published reviews (only emitted when real reviews exist —
 * the caller checks `summary.count > 0`). No offers/prices.
 */
export function reviewsJsonLd({
  summary,
  reviews,
  name,
  url,
  siteUrl,
  limit = 10,
}: {
  summary: Pick<ReviewSummary, 'average' | 'count'>
  reviews: ReviewCard[]
  name: string
  url: string
  siteUrl: string
  limit?: number
}): Record<string, unknown> | undefined {
  const aggregateRating = aggregateRatingJsonLd(summary)
  if (!aggregateRating) return undefined
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': `${siteUrl}/#business`,
    name,
    url,
    aggregateRating,
    review: reviews.slice(0, limit).map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.guestName },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
      reviewBody: r.text,
      ...(r.title ? { name: r.title } : {}),
      datePublished: r.createdAt.slice(0, 10),
    })),
  }
}
