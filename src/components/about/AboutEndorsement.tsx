import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getAllReviews } from '@/lib/api/public'
import type { Locale, ReviewCard } from '@/lib/api/types'
import { countryName } from '@/lib/format'
import { Icon } from '@/components/ui/Icon'
import { ErrorState } from '@/components/ui/ErrorState'
import { Stars } from '@/components/ui/Stars'
import { pickEndorsement } from './endorsement'

/** Stitch "Guest Endorsement Snapshot" with a real review from the API. */
export async function AboutEndorsement({ locale }: { locale: Locale }) {
  // Explicit locale: implicit next-intl lookups read request headers and would make the page dynamic.
  const t = await getTranslations({ locale, namespace: 'about.endorsement' })

  let reviews: ReviewCard[]
  try {
    reviews = await getAllReviews(locale)
  } catch {
    return (
      <section className="w-full bg-surface py-space-2xl">
        <div className="mx-auto max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
          <ErrorState retryHref="/about" />
        </div>
      </section>
    )
  }

  const review = pickEndorsement(reviews)
  if (!review) return null
  const place = [review.location, countryName(review.country, locale)].filter(Boolean).join(', ')
  const trip = review.tripLabel ?? review.tour?.title ?? ''

  return (
    <section aria-label={t('label')} className="w-full bg-surface py-space-2xl">
      <div className="mx-auto max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
        <div className="relative overflow-hidden rounded-2xl bg-surface-container p-space-md sm:p-space-xl md:p-space-2xl">
          <div className="grid grid-cols-1 items-center gap-gutter-lg lg:grid-cols-12">
            <div className="flex flex-col gap-space-sm lg:col-span-4">
              <Stars rating={5} filled starClassName="text-lg" className="gap-1" />
              <h2 className="font-headline-sm text-headline-sm text-primary">{t('title')}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{t('body')}</p>
              <div className="pt-space-xs">
                <Link
                  href="/reviews"
                  className="tap-target relative flex w-fit items-center gap-1 rounded-sm font-label-lg text-label-lg font-semibold text-primary underline underline-offset-4 transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <span>{reviews.length > 0 ? t('readAll', { count: reviews.length }) : t('readAllFallback')}</span>
                  <Icon name="arrow_forward" className="text-sm" />
                </Link>
              </div>
            </div>
            <figure className="rounded-xl bg-surface p-space-lg shadow-sm sm:p-space-xl lg:col-span-8">
              <blockquote className="mb-space-md font-headline-sm text-headline-sm italic text-on-surface">
                “{review.text.trim()}”
              </blockquote>
              <figcaption className="flex flex-wrap items-center justify-between gap-space-sm">
                <div>
                  <span className="block font-label-lg text-label-lg font-bold text-primary">{review.guestName}</span>
                  <span className="block font-caption text-caption text-on-surface-variant">
                    {trip ? t('meta', { place, trip }) : place}
                  </span>
                </div>
                <span className="font-caption text-caption font-semibold uppercase tracking-wider text-tertiary">
                  {t('verified')}
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  )
}
