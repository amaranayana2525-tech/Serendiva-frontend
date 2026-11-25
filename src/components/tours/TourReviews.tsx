import { useLocale, useTranslations } from 'next-intl'
import type { TourDetail } from '@/lib/api/types'
import { formatNumber } from '@/lib/format'
import { ReviewCard } from '@/components/cards/ReviewCard'
import { Icon } from '@/components/ui/Icon'

/** Stitch "SECTION F: VERIFIED GUEST REVIEWS" — rating summary + review rows for this tour. */
export function TourReviews({ tour }: { tour: Pick<TourDetail, 'reviews' | 'reviewSummary'> }) {
  const t = useTranslations('tourDetail.reviews')
  const locale = useLocale()
  const { average, count } = tour.reviewSummary
  const rating = formatNumber(average, locale, { minimumFractionDigits: 1, maximumFractionDigits: 2 })
  return (
    <section id="reviews" aria-labelledby="reviews-title" className="flex scroll-mt-36 flex-col gap-space-lg">
      <div className="flex flex-col justify-between gap-space-sm md:flex-row md:items-end">
        <div>
          <span className="font-label-lg text-label-lg uppercase tracking-widest text-secondary">{t('eyebrow')}</span>
          <h2 id="reviews-title" className="font-headline-lg text-headline-lg text-primary">
            {t('title')}
          </h2>
        </div>
        {count > 0 && (
          <p className="flex items-center gap-1 text-primary">
            <Icon name="star" filled className="text-secondary" />
            <span aria-hidden="true" className="text-headline-sm font-bold">
              {rating}
            </span>
            <span className="sr-only">{t('average', { rating })}</span>
            <span className="font-caption text-caption text-on-surface-variant">{t('count', { count })}</span>
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-space-md">
        {tour.reviews.map((review, i) => (
          <ReviewCard key={review.id} review={review} variant="list" index={i} />
        ))}
      </div>
    </section>
  )
}
