import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { TourCard } from '@/lib/api/types'
import { contactHref } from '@/lib/prefill'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'

const MAX_JOURNEYS = 3

/**
 * Local variant of cards/TourCard: the Stitch "Journeys Weaving Through Ella" itinerary card (duration pill,
 * theme kicker, route + summary, "Explore Route"). The shared TourCard renders the /tours grid design instead.
 */
export function RouteTourCard({ tour }: { tour: TourCard }) {
  const t = useTranslations('destinationDetail.journeys')
  const tc = useTranslations('common.cards')
  const kicker = tour.categories[0]?.name ?? tour.cardTag
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-60 w-full overflow-hidden">
        <SmartImage
          image={tour.cover}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute left-space-md top-space-md rounded-full bg-surface/90 px-space-md py-1 font-label-md text-label-md font-semibold uppercase text-primary backdrop-blur-md">
          {tc('duration', { nights: tour.durationNights, days: tour.durationDays })}
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-space-lg">
        <div>
          {kicker && (
            <span className="font-caption text-caption font-semibold uppercase tracking-wider text-secondary">
              {kicker}
            </span>
          )}
          <h3 className="mb-space-sm mt-1 font-headline-sm text-headline-sm font-semibold text-on-surface">
            {tour.title}
          </h3>
          <p className="mb-space-md line-clamp-5 font-body-md text-body-md text-on-surface-variant">
            {tour.route.length > 0 && <span>{tour.route.join(' → ')}. </span>}
            {tour.summary}
          </p>
        </div>
        <div className="flex items-center justify-between gap-space-sm border-t border-surface-container pt-space-md">
          <span className="font-caption text-caption font-medium text-primary">{t('footer')}</span>
          <Link
            href={`/tours/${tour.slug}`}
            aria-label={t('exploreLabel', { title: tour.title })}
            className="tap-target relative flex shrink-0 items-center gap-1 rounded font-label-md text-label-md font-semibold text-secondary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            {t('explore')} <Icon name="arrow_forward" className="text-sm" />
          </Link>
        </div>
      </div>
    </article>
  )
}

/** "Journeys Weaving Through <name>" — published tours that visit the destination (empty → custom-journey CTA). */
export function RelatedJourneys({ name, slug, tours }: { name: string; slug: string; tours: TourCard[] }) {
  const t = useTranslations('destinationDetail.journeys')
  const tc = useTranslations('common.buttons')
  return (
    <section aria-labelledby="journeys-title" className="w-full bg-surface-container-low py-space-3xl">
      <div className="mx-auto max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
        <div className="mb-space-2xl flex flex-col justify-between gap-space-md md:flex-row md:items-end">
          <div>
            <span className="font-label-lg text-label-lg uppercase tracking-widest text-secondary">{t('eyebrow')}</span>
            <h2 id="journeys-title" className="mt-1 font-headline-xl text-headline-xl font-semibold text-primary">
              {t('title', { name })}
            </h2>
          </div>
          <p className="max-w-md font-body-md text-body-md text-on-surface-variant">{t('intro', { name })}</p>
        </div>
        {tours.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-gutter-lg md:grid-cols-3">
              {tours.slice(0, MAX_JOURNEYS).map((tour) => (
                <RouteTourCard key={tour.slug} tour={tour} />
              ))}
            </div>
            {tours.length > MAX_JOURNEYS && (
              <div className="mt-space-xl flex justify-center">
                <Button href="/tours" variant="secondary" trailingIcon="arrow_forward">
                  {tc('exploreTours')}
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon="route"
            title={t('emptyTitle', { name })}
            body={t('emptyBody', { name })}
            className="bg-surface"
            action={
              <Button
                href={contactHref({ destination: slug, source: 'destination-no-journeys' })}
                variant="accent"
                trailingIcon="arrow_forward"
              >
                {t('emptyCta', { name })}
              </Button>
            }
          />
        )}
      </div>
    </section>
  )
}
