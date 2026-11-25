import type { ReviewCard } from '@/lib/api/types'

/**
 * Picks a short, real 5-star testimonial for the about page: TripAdvisor first (the block is framed as a Travelers'
 * Choice endorsement), untitled "snapshot" reviews, family journeys and a 200–400 character length score higher;
 * ties go to the most recent trip. The featured review is kept for the /reviews spotlight.
 */
export function pickEndorsement(reviews: ReviewCard[]): ReviewCard | null {
  const score = (r: ReviewCard) =>
    (r.source === 'tripadvisor' ? 2 : 0) +
    (r.title ? 0 : 1) +
    (r.travellerType === 'family' ? 1 : 0) +
    (r.text.length >= 200 && r.text.length <= 400 ? 1 : 0)
  const candidates = reviews.filter((r) => r.rating >= 5 && !r.isFeatured && r.text.length <= 600)
  const pool = candidates.length > 0 ? candidates : reviews
  const time = (r: ReviewCard) => Date.parse(r.travelDate ?? r.createdAt) || 0
  return [...pool].sort((a, b) => score(b) - score(a) || time(b) - time(a))[0] ?? null
}
