import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { getReviews } from '@/lib/api/public'
import type { Locale } from '@/lib/api/types'
import { countryName } from '@/lib/format'
import { ReviewCard } from '@/components/cards/ReviewCard'
import { Container } from '@/components/ui/Container'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Icon } from '@/components/ui/Icon'
import { ReviewsSkeleton } from './HomeSkeletons'
import { loadSection } from './loadSection'
import { ReviewCarousel } from './ReviewCarousel'
import { leadSentence, pickHomeReviews } from './reviewPicks'

async function ReviewsContent({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.reviews' })
  const result = await loadSection('reviews', () => getReviews(locale, { sort: 'rating', pageSize: 12 }))
  if (!result.ok) return <ErrorState retryHref="/" />
  const { banner, cards } = pickHomeReviews(result.data.items)
  if (!banner && cards.length === 0) return <EmptyState icon="reviews" body={t('emptyBody')} />
  const place = banner ? [banner.location, countryName(banner.country, locale)].filter(Boolean).join(', ') : ''

  return (
    <div className="flex flex-col gap-space-2xl">
      {banner && (
        <figure className="flex flex-col items-center gap-space-sm rounded-2xl bg-surface-container p-space-xl text-center">
          <Icon name="format_quote" className="text-4xl text-secondary" />
          <blockquote className="max-w-4xl font-headline-lg text-headline-lg-mobile italic text-primary md:text-headline-lg">
            “{banner.title || leadSentence(banner.text)}”
          </blockquote>
          <figcaption className="mt-2 font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
            {place
              ? t('attribution', { name: banner.guestName, place })
              : t('attributionName', { name: banner.guestName })}
          </figcaption>
        </figure>
      )}
      {cards.length > 0 && (
        <ReviewCarousel label={t('carouselLabel')}>
          {cards.map((review) => (
            <ReviewCard key={review.id} review={review} variant="compact" className="w-full" />
          ))}
        </ReviewCarousel>
      )}
    </div>
  )
}

/** Section 9 — guest reviews: featured quote banner + 3 review cards (swipeable carousel on phones). */
export function ReviewsSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.reviews')
  return (
    <section aria-labelledby="home-reviews-title" className="w-full bg-surface py-space-3xl">
      <Container className="flex flex-col gap-space-2xl">
        <h2 id="home-reviews-title" className="sr-only">
          {t('title')}
        </h2>
        <Suspense fallback={<ReviewsSkeleton />}>
          <ReviewsContent locale={locale} />
        </Suspense>
      </Container>
    </section>
  )
}
