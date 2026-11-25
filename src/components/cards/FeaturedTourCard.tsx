import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { TourCard } from '@/lib/api/types'
import { contactHref } from '@/lib/prefill'
import { cn } from '@/lib/utils'
import { SmartImage } from '@/components/ui/SmartImage'

export interface FeaturedTourCardProps {
  tour: TourCard
  /** Footer note (defaults to "Private Chauffeur & Expert Lecturer"). */
  footerNote?: string
  /** Stored as the inquiry's source when the visitor clicks "Inquire About This Tour". */
  source?: string
  headingLevel?: 'h2' | 'h3'
  className?: string
}

/**
 * Home "Signature Private Itineraries" card (Stitch markup): h-72 photo with the duration chip, "Most Popular" ribbon,
 * title → /tours/<slug>, route, summary, highlight chips, footer note and "Inquire About This Tour" → /contact?tour=<slug>.
 */
export function FeaturedTourCard({
  tour,
  footerNote,
  source = 'home-featured',
  headingLevel: Heading = 'h3',
  className,
}: FeaturedTourCardProps) {
  const t = useTranslations('common')
  return (
    <article className={cn('group relative flex flex-col overflow-hidden rounded-2xl bg-surface shadow-lg', className)}>
      {tour.isMostPopular && (
        <div className="absolute right-4 top-4 z-20 rounded-full bg-secondary px-space-md py-1 font-label-md text-label-md uppercase tracking-widest text-on-secondary shadow-md">
          {t('cards.mostPopular')}
        </div>
      )}
      <div className="relative h-72 w-full overflow-hidden">
        <SmartImage
          image={tour.cover}
          fill
          sizes="(min-width: 1440px) 620px, (min-width: 768px) 50vw, 100vw"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <div className="absolute bottom-4 left-4 rounded-lg bg-primary/80 px-3 py-1.5 font-label-md text-label-md text-surface backdrop-blur-md">
          {t('cards.duration', { nights: tour.durationNights, days: tour.durationDays })}
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between gap-space-md bg-surface p-space-lg">
        <div className="flex flex-col gap-space-sm">
          <Heading className="font-headline-lg text-headline-lg text-primary">
            <Link
              href={`/tours/${tour.slug}`}
              className="rounded transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {tour.title}
            </Link>
          </Heading>
          {tour.route.length > 0 && (
            <p className="font-caption text-caption font-semibold text-secondary">
              <span className="sr-only">{t('cards.routeLabel')}: </span>
              {tour.route.join(' → ')}
            </p>
          )}
          <p className="font-body-md text-body-md text-on-surface-variant">{tour.summary}</p>
          {tour.highlights.length > 0 && (
            <ul aria-label={t('cards.highlightsLabel')} className="flex flex-wrap gap-2 pt-2">
              {tour.highlights.slice(0, 3).map((h) => (
                <li
                  key={h}
                  className="rounded-full bg-surface-container px-2.5 py-1 font-caption text-caption text-primary"
                >
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-between gap-space-sm pt-space-md">
          <span className="font-caption text-caption text-on-surface-variant">
            {footerNote ?? t('cards.featuredFooter')}
          </span>
          <Link
            href={contactHref({ tour: tour.slug, source })}
            className="rounded-xl bg-primary px-space-md py-2.5 font-label-md text-label-md uppercase tracking-wider text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {t('buttons.inquireAboutTour')}
            <span className="sr-only">: {tour.title}</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
