import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { TourCard as TourCardDto } from '@/lib/api/types'
import { contactHref } from '@/lib/prefill'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'

interface CardTone {
  /** Text colour of the frosted category badge (top left). */
  badge: string
  /** Background/text of the small tag next to the duration (bottom right). */
  tag: string
}

const TEAL: CardTone = { badge: 'text-primary', tag: 'bg-primary-container/80 text-surface' }
const GREEN: CardTone = { badge: 'text-tertiary', tag: 'bg-tertiary-container/80 text-surface' }

/** Exact Stitch colour pairs per (seeded) category — the tours grid colour-codes cards by their main category. */
const CATEGORY_TONES: Record<string, CardTone> = {
  'cultural-heritage': TEAL,
  'wildlife-safari': GREEN,
  'hill-country': TEAL,
  'pristine-beaches': {
    badge: 'text-secondary',
    tag: 'bg-secondary-container/80 text-on-secondary-container font-semibold',
  },
  honeymoon: { badge: 'text-secondary', tag: 'bg-secondary/80 text-surface' },
  'trekking-adventure': { badge: 'text-tertiary', tag: 'bg-tertiary/80 text-surface' },
  'ramayana-trail': { badge: 'text-secondary', tag: 'bg-primary-container/80 text-surface' },
  family: { badge: 'text-primary', tag: 'bg-surface/80 text-primary font-bold' },
  'ayurveda-wellness': GREEN,
}

/** Categories created later in the CMS keep the Stitch teal / green / cinnamon rhythm by grid position. */
const FALLBACK_TONES: readonly CardTone[] = [
  TEAL,
  GREEN,
  { badge: 'text-secondary', tag: 'bg-secondary/80 text-surface' },
]

function toneFor(categorySlug: string | undefined, index: number): CardTone {
  return (
    (categorySlug ? CATEGORY_TONES[categorySlug] : undefined) ?? FALLBACK_TONES[index % FALLBACK_TONES.length] ?? TEAL
  )
}

export interface TourCardProps {
  tour: TourCardDto
  /** Position in the grid (badge colour rhythm). */
  index?: number
  /** 'default' = /tours grid card · 'compact' = "You may also consider" related card. */
  variant?: 'default' | 'compact'
  /** Heading level inside the page outline. */
  headingLevel?: 'h2' | 'h3'
  /** Pass for the first row on /tours so the first images load eagerly. */
  priority?: boolean
  className?: string
}

/** Tour card from the Stitch tours grid (image + badges + duration, title, route, highlights, View Itinerary / Inquire). */
export function TourCard({
  tour,
  index = 0,
  variant = 'default',
  headingLevel: Heading = 'h3',
  priority,
  className,
}: TourCardProps) {
  const t = useTranslations('common')
  const href = `/tours/${tour.slug}`
  const category = tour.categories[0]
  const tone = toneFor(category?.slug, index)
  const duration = t('cards.duration', { nights: tour.durationNights, days: tour.durationDays })

  if (variant === 'compact') {
    return (
      <article
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-xl bg-surface shadow-sm transition-shadow hover:shadow-md',
          className,
        )}
      >
        <div className="relative h-56 overflow-hidden">
          <SmartImage
            image={tour.cover}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <Badge variant="dark" className="absolute left-space-sm top-space-sm px-2.5 py-1 tracking-wider">
            {duration}
          </Badge>
        </div>
        <div className="flex flex-1 flex-col justify-between gap-space-md p-space-lg">
          <div>
            {category && (
              <span className="font-label-md text-label-md uppercase tracking-wider text-secondary">
                {category.name}
              </span>
            )}
            <Heading className="mt-1 font-headline-sm text-headline-sm text-primary transition-colors group-hover:text-secondary">
              <Link
                href={href}
                className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-primary"
              >
                {tour.title}
              </Link>
            </Heading>
            <p className="mt-2 line-clamp-2 font-body-md text-body-md text-on-surface-variant">{tour.summary}</p>
          </div>
          <div className="flex items-center justify-between pt-space-sm">
            <span className="font-caption text-caption text-on-surface-variant">
              {tour.route.slice(0, 3).join(' · ')}
            </span>
            <Icon name="arrow_forward" className="text-primary transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    )
  }

  return (
    <article
      className={cn(
        'group flex transform flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
        className,
      )}
    >
      <div className="relative h-64 overflow-hidden">
        <SmartImage
          image={tour.cover}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
        {(category || tour.isMostPopular) && (
          // One wrapping row (category left, "Most popular" right) so the badges never overlap on narrow cards.
          <div className="absolute left-space-md right-space-md top-space-md flex flex-wrap items-center justify-between gap-space-xs">
            {category ? (
              <Badge variant="glass" className={tone.badge}>
                {category.shortName || category.name}
              </Badge>
            ) : (
              <span />
            )}
            {tour.isMostPopular && <Badge variant="accent">{t('cards.mostPopularStar')}</Badge>}
          </div>
        )}
        <div className="absolute bottom-space-md left-space-md right-space-md flex items-center justify-between gap-space-sm text-on-primary">
          <span className="flex shrink-0 items-center gap-1 whitespace-nowrap font-label-lg text-label-lg font-medium">
            <Icon name="dark_mode" className="text-sm" /> {duration}
          </span>
          {tour.cardTag && (
            <span
              className={cn(
                'min-w-0 truncate rounded px-2 py-0.5 font-caption text-caption uppercase tracking-wider',
                tone.tag,
              )}
            >
              {tour.cardTag}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between gap-space-md p-space-lg">
        <div className="flex flex-col gap-space-sm">
          <Heading className="font-headline-md text-headline-md text-primary transition-colors group-hover:text-secondary">
            <Link
              href={href}
              className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {tour.title}
            </Link>
          </Heading>
          {tour.route.length > 0 && (
            <div className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant">
              <Icon name="route" className="shrink-0 text-base text-secondary" />
              <span className="sr-only">{t('cards.routeLabel')}: </span>
              <span className="truncate">{tour.route.join(' → ')}</span>
            </div>
          )}
          {tour.highlights.length > 0 && (
            <ul aria-label={t('cards.highlightsLabel')} className="flex flex-wrap gap-1.5 pt-space-xs">
              {tour.highlights.slice(0, 3).map((h) => (
                <li
                  key={h}
                  className="rounded-full bg-surface-container px-2.5 py-1 font-caption text-caption text-on-surface-variant"
                >
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-between gap-space-sm pt-space-md">
          <Link
            href={href}
            aria-label={`${t('buttons.viewItinerary')}: ${tour.title}`}
            className="flex w-1/2 items-center justify-center rounded-lg bg-surface-container py-2.5 text-center font-label-md text-label-md font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 coarse:min-h-11"
          >
            {t('buttons.viewItinerary')}
          </Link>
          <Link
            href={contactHref({ tour: tour.slug, source: 'tour-card' })}
            aria-label={`${t('buttons.inquire')}: ${tour.title}`}
            className="flex w-1/2 items-center justify-center rounded-lg bg-primary py-2.5 text-center font-label-md text-label-md font-semibold uppercase tracking-wider text-on-primary shadow-sm transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 coarse:min-h-11"
          >
            {t('buttons.inquire')}
          </Link>
        </div>
      </div>
    </article>
  )
}
