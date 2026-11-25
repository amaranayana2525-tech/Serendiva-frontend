import { useLocale, useTranslations } from 'next-intl'
import type { ReviewCard as ReviewCardDto } from '@/lib/api/types'
import { countryName, flagEmoji, formatMonth } from '@/lib/format'
import { cn, initialsOf } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'
import { Stars } from '@/components/ui/Stars'
import { reviewParagraphs, reviewPlace } from '@/components/reviews/format'

export interface ReviewCardProps {
  review: ReviewCardDto
  /**
   * 'compact' = home testimonial card · 'list' = tour-detail review row · 'full' = /reviews grid card (photo, title, trip photo)
   */
  variant?: 'compact' | 'list' | 'full'
  /** Avatar colour rhythm ('list'). */
  index?: number
  className?: string
}

const AVATAR_TONES = [
  'bg-primary/10 text-primary',
  'bg-tertiary/10 text-tertiary',
  'bg-secondary-fixed text-on-secondary-fixed',
] as const

/** Guest review card in the three Stitch layouts. Text comes verbatim from the API. */
export function ReviewCard({ review: r, variant = 'compact', index = 0, className }: ReviewCardProps) {
  const t = useTranslations('common.cards')
  const locale = useLocale()
  const country = countryName(r.country, locale)
  const place = reviewPlace(r.location, country)
  const initials = r.initials || initialsOf(r.guestName)
  const traveled = r.travelDate ? t('traveled', { date: formatMonth(r.travelDate, locale) }) : null

  if (variant === 'list') {
    return (
      <article
        className={cn('flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-lg shadow-sm', className)}
      >
        <div className="flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <div
              aria-hidden="true"
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold',
                AVATAR_TONES[index % AVATAR_TONES.length],
              )}
            >
              {initials}
            </div>
            <div>
              <h3 className="font-headline-sm text-base text-primary">{r.guestName}</h3>
              <span className="font-caption text-caption text-on-surface-variant">
                {[place, traveled].filter(Boolean).join(' · ')}
              </span>
            </div>
          </div>
          <Stars rating={r.rating} filled className="shrink-0" />
        </div>
        <p className="font-body-md text-body-md leading-relaxed text-on-surface">“{r.text}”</p>
      </article>
    )
  }

  if (variant === 'full') {
    const tripPhoto = r.tripPhotos[0]
    // The party label is skipped when it only repeats the trip badge ("Friends Group" / "Friends Group").
    const party = r.partyLabel && r.partyLabel.toLowerCase() !== r.tourType?.toLowerCase() ? r.partyLabel : null
    return (
      <article
        className={cn(
          'flex flex-col justify-between rounded-xl bg-surface p-space-lg shadow-md transition-all duration-300 hover:shadow-xl sm:p-space-xl',
          className,
        )}
      >
        <div>
          <div className="mb-space-md flex flex-wrap items-start justify-between gap-space-sm">
            {/* basis-48: on narrow phones the tour-type badge wraps below instead of squeezing the name. */}
            <div className="flex min-w-0 flex-1 basis-48 items-center gap-space-md">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full shadow-sm">
                {r.photo ? (
                  <SmartImage image={r.photo} alt="" fill sizes="48px" className="object-cover" />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-full w-full items-center justify-center bg-primary font-bold text-on-primary"
                  >
                    {initials}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm leading-tight text-primary">{r.guestName}</h3>
                <span className="block font-label-md text-label-md text-on-surface-variant">
                  {place} {flagEmoji(r.country)}
                  {party ? ` · ${party}` : ''}
                </span>
              </div>
            </div>
            {r.tourType && (
              <span className="rounded bg-surface-container px-space-sm py-1 font-label-md text-label-md text-primary">
                {r.tourType}
              </span>
            )}
          </div>
          <div className="mb-space-md flex items-center gap-space-sm">
            <Stars rating={r.rating} filled starClassName="text-[18px]" />
            {traveled && <span className="font-caption text-caption text-on-surface-variant">{traveled}</span>}
          </div>
          {r.title && <h4 className="mb-space-xs font-headline-sm text-headline-sm text-primary">“{r.title}”</h4>}
          <div className="mb-space-md flex flex-col gap-space-sm font-body-md text-body-md leading-relaxed text-on-surface-variant">
            {reviewParagraphs(r.text).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
        <div className="pt-space-md">
          {tripPhoto && (
            <div className="relative mb-space-sm h-32 overflow-hidden rounded-lg shadow-sm">
              <SmartImage
                image={tripPhoto}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 90vw"
                className="object-cover"
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-space-sm font-label-md text-label-md text-on-surface-variant">
            <span>{r.tripLabel ?? r.tour?.title ?? ''}</span>
            <span className="flex shrink-0 items-center gap-1 font-semibold text-tertiary-container">
              <Icon name="check_circle" className="text-[14px]" /> {t('verified')}
            </span>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article
      className={cn(
        'flex flex-col justify-between gap-space-md rounded-2xl bg-surface-container-low p-space-lg shadow-sm',
        className,
      )}
    >
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <Stars rating={r.rating} filled={false} />
          <span className="flex items-center gap-1 font-caption text-caption font-semibold text-tertiary">
            <Icon name="verified" className="text-xs" /> {t(`source.${r.source}`)}
          </span>
        </div>
        <p className="font-body-md text-body-md italic text-on-surface">“{r.text}”</p>
      </div>
      <div className="flex items-center gap-3 pt-space-xs">
        <div
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary"
        >
          {initials}
        </div>
        <div className="flex flex-col">
          <span className="font-label-lg text-label-lg text-primary">{r.guestName}</span>
          <span className="font-caption text-caption text-on-surface-variant">
            {[place, r.tripLabel].filter(Boolean).join(' · ')}
          </span>
        </div>
      </div>
    </article>
  )
}
