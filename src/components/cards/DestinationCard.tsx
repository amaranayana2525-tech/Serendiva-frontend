import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { DestinationCard as DestinationCardDto } from '@/lib/api/types'
import { contactHref } from '@/lib/prefill'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'
import { shortHubLabel } from '@/components/destinations/islandMapGeometry'
import { regionTone } from '@/components/destinations/regionTones'

export interface DestinationCardProps {
  destination: DestinationCardDto
  /**
   * 'explorer' = /destinations asymmetric card (image, badges, best time, tagline, curations, links)
   * 'mosaic'   = home "Iconic Ceylon Encounters" photo tile (set the aspect ratio with className, e.g. 'aspect-[3/4]')
   */
  variant?: 'explorer' | 'mosaic'
  /** Explorer only: the large hero card of a row (taller image, "Signature Curations", "Private Guided"). */
  featured?: boolean
  /** Explorer only: taller image (h-80 sm:h-96) without the other hero treatments (Stitch first-row partner card). */
  tallImage?: boolean
  /** Explorer only: roomier padding + list spacing of the 7-column cards. */
  roomy?: boolean
  /**
   * Explorer meta-badge colour. Pass the destination region's position in GET /regions so the badge uses the
   * region tone (Stitch: hill country green, Cultural Triangle cinnamon, coasts teal…).
   */
  index?: number
  headingLevel?: 'h2' | 'h3'
  className?: string
}

/** Destination card in its two Stitch forms. Grid spans (lg:col-span-7 …) are passed through className. */
export function DestinationCard({
  destination: d,
  variant = 'explorer',
  featured = false,
  tallImage = false,
  roomy = false,
  index = 0,
  headingLevel: Heading = 'h3',
  className,
}: DestinationCardProps) {
  const t = useTranslations('common')
  const href = `/destinations/${d.slug}`
  const tall = featured || tallImage
  const spacious = featured || roomy

  if (variant === 'mosaic') {
    return (
      <div className={cn('group relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface shadow-md', className)}>
        <SmartImage
          image={d.cover}
          alt=""
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-1 p-space-md text-surface">
          {(d.region?.name ?? d.metaLabel) && (
            <span className="font-label-md text-label-md uppercase text-secondary-fixed">
              {d.region?.name ?? d.metaLabel}
            </span>
          )}
          <Heading className="font-headline-md text-headline-md font-bold">
            <Link
              href={href}
              className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-surface"
            >
              {d.name}
            </Link>
          </Heading>
          <p className="font-caption text-caption text-surface/80">{d.tagline ?? d.summary}</p>
        </div>
      </div>
    )
  }

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl bg-surface shadow-sm transition-all duration-300 hover:shadow-xl',
        className,
      )}
    >
      <div className={cn('relative w-full overflow-hidden', tall ? 'h-80 sm:h-96' : 'h-80')}>
        <SmartImage
          image={d.cover}
          alt=""
          fill
          sizes={
            spacious
              ? '(min-width: 1024px) 58vw, (min-width: 768px) 50vw, 100vw'
              : '(min-width: 1024px) 42vw, (min-width: 768px) 50vw, 100vw'
          }
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
        {(d.metaLabel || d.badge) && (
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {d.metaLabel && (
              <Badge variant="glass" uppercase={false} className={cn('font-semibold', regionTone(index).text)}>
                {d.metaLabel}
              </Badge>
            )}
            {d.badge && (
              <Badge variant="accent" uppercase={false} className="font-semibold tracking-[0.1em] shadow-sm">
                {d.badge}
              </Badge>
            )}
          </div>
        )}
        {d.bestTimeLabel && (
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-on-primary">
            <span className="flex items-center gap-1 font-caption text-caption uppercase tracking-wider opacity-90">
              <Icon name="wb_sunny" className="text-sm" /> {t('cards.bestTime', { months: d.bestTimeLabel })}
            </span>
            {featured && <span className="font-caption text-caption opacity-80">{t('cards.privateGuided')}</span>}
          </div>
        )}
      </div>
      <div className={cn('flex flex-1 flex-col justify-between gap-space-md p-space-lg', spacious && 'md:p-space-xl')}>
        <div className="flex flex-col gap-space-xs">
          <Heading className="font-headline-lg text-headline-lg font-semibold text-primary transition-colors group-hover:text-secondary">
            {d.name}
          </Heading>
          {d.tagline && (
            <p className="font-headline-sm text-headline-sm font-normal italic text-on-surface-variant">
              “{d.tagline}”
            </p>
          )}
          <p className={cn('font-body-md text-body-md text-on-surface-variant', featured ? 'mt-2' : 'mt-1')}>
            {d.summary}
          </p>
        </div>
        {d.curations.length > 0 && (
          <div className="flex flex-col gap-space-xs rounded-xl bg-surface-container-low p-space-md">
            <span className="font-label-md text-label-md font-semibold uppercase tracking-wider text-primary">
              {featured ? t('cards.signatureCurations') : t('cards.curations')}
            </span>
            <ul
              className={cn(
                'flex flex-col font-body-md text-body-md text-on-surface-variant',
                spacious ? 'gap-1.5' : 'gap-1',
              )}
            >
              {d.curations.slice(0, 3).map((c) => (
                <li key={c} className="flex items-start gap-2">
                  {/* Aligned with the first line (body-md: 22px line height) when the text wraps on phones. */}
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
          <Link
            href={href}
            className="tap-target relative inline-flex items-center gap-1.5 rounded font-label-lg text-label-lg text-primary transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>
              {featured
                ? t('buttons.exploreDestination', { name: d.name })
                : t('buttons.exploreDestinationShort', { name: shortHubLabel(d.name) })}
            </span>
            <Icon name="arrow_right_alt" className="text-sm" />
          </Link>
          <Link
            href={contactHref({ destination: d.slug, source: 'destination-card' })}
            aria-label={`${t('buttons.inquire')}: ${d.name}`}
            className="tap-target relative rounded-lg bg-surface-container-high px-space-md py-space-xs font-label-lg text-label-lg text-primary transition-all hover:bg-primary hover:text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {featured ? t('buttons.inquireHub') : t('buttons.inquire')}
          </Link>
        </div>
      </div>
    </article>
  )
}
