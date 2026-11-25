import { useLocale, useTranslations } from 'next-intl'
import type { ReviewCard } from '@/lib/api/types'
import { countryName, flagEmoji, formatMonth } from '@/lib/format'
import { reviewParagraphs, reviewPlace } from './format'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'
import { Stars } from '@/components/ui/Stars'

/** Stitch "Featured Spotlight Testimonial" — the `isFeatured` review with its trip photographs. */
export function ReviewSpotlight({ review }: { review: ReviewCard }) {
  const t = useTranslations('reviews.spotlight')
  const locale = useLocale()
  const place = reviewPlace(review.location, countryName(review.country, locale))
  const travelled = review.travelDate ? t('travelled', { date: formatMonth(review.travelDate, locale) }) : null
  const meta = [travelled, review.tourType].filter(Boolean).join(' · ')
  const route = review.tripLabel ?? review.tour?.title
  const paragraphs = reviewParagraphs(review.text)
  const photos = review.tripPhotos.slice(0, 3)

  return (
    <section aria-labelledby="review-spotlight-title" className="w-full bg-surface py-space-3xl">
      <div className="mx-auto max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
        <div className="mb-space-lg flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm">
            <Icon name="auto_awesome" className="shrink-0 text-base text-secondary" />
            <h2
              id="review-spotlight-title"
              className="font-label-md text-label-md font-semibold uppercase tracking-widest text-secondary"
            >
              {t('eyebrow')}
            </h2>
          </div>
          {meta && <span className="text-right font-caption text-caption text-on-surface-variant">{meta}</span>}
        </div>

        <article className="relative overflow-hidden rounded-2xl bg-surface-container-low shadow-xl">
          <div className="grid min-h-[580px] grid-cols-1 lg:grid-cols-12">
            <div className="relative min-h-[380px] bg-primary-container lg:col-span-5 lg:min-h-full">
              <SmartImage
                image={review.photo ?? photos[0] ?? null}
                fill
                sizes="(min-width: 1440px) 560px, (min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent"
              />
              <div className="absolute bottom-space-lg left-space-lg right-space-lg text-on-primary">
                <h3 className="mb-1 block font-headline-sm text-headline-sm">{review.guestName}</h3>
                <span className="block font-body-md text-body-md opacity-90">
                  {place} {flagEmoji(review.country)}
                </span>
                {route && (
                  <span className="mt-1 block font-label-md text-label-md uppercase tracking-wider text-primary-fixed">
                    {t('route', { route })}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-between p-space-xl md:p-space-2xl lg:col-span-7">
              <div>
                <div className="mb-space-md flex items-center justify-between gap-space-md">
                  <Stars rating={review.rating} filled starClassName="text-[20px]" className="gap-1" />
                  <div className="flex items-center gap-1.5 rounded-full bg-surface-container px-space-md py-1">
                    <Icon name="verified_user" className="shrink-0 text-xs text-tertiary-container" />
                    <span className="font-label-md text-label-md text-on-surface">{t(`source.${review.source}`)}</span>
                  </div>
                </div>
                {review.title && (
                  <blockquote className="mb-space-lg font-headline-md text-headline-md leading-snug tracking-tight text-primary">
                    “{review.title}”
                  </blockquote>
                )}
                <div className="flex flex-col gap-space-md font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
                  {paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>

              {photos.length > 0 && (
                <div className="mt-space-xl pt-space-lg">
                  <span className="mb-space-sm block font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                    {t('photos', { name: review.guestName })}
                  </span>
                  <ul className="grid grid-cols-3 gap-space-sm">
                    {photos.map((photo) => (
                      <li key={photo.id} className="relative h-24 overflow-hidden rounded-lg shadow-sm">
                        <SmartImage
                          image={photo}
                          fill
                          sizes="(min-width: 1024px) 15vw, 30vw"
                          className="object-cover"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
