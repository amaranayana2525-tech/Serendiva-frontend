import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { getDestinations } from '@/lib/api/public'
import type { DestinationCard, Locale } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { Container } from '@/components/ui/Container'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Icon } from '@/components/ui/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { SmartImage } from '@/components/ui/SmartImage'
import { MOSAIC_ASPECTS, MosaicSkeleton } from './HomeSkeletons'
import { loadSection } from './loadSection'

const MOSAIC_SIZE = 8

/**
 * One "Iconic Ceylon Encounters" tile — the Stitch mosaic markup (photo, teal scrim, region / name / tagline) with a
 * hover & keyboard-focus reveal of the destination summary and an "Explore" cue. The whole tile links to the
 * destination. (Local variant of DestinationCard "mosaic", which has no reveal and only a partial click area.)
 */
function DestinationMosaicTile({ destination: d, className }: { destination: DestinationCard; className?: string }) {
  const t = useTranslations('home.destinations')
  const kicker = d.region?.name ?? d.metaLabel
  return (
    <Link
      href={`/destinations/${d.slug}`}
      className={cn(
        'group relative block overflow-hidden rounded-2xl bg-surface shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low',
        className,
      )}
    >
      <SmartImage
        image={d.cover}
        alt=""
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 group-focus-visible:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:scale-100"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-1 p-space-md text-surface">
        {kicker && <span className="font-label-md text-label-md uppercase text-secondary-fixed">{kicker}</span>}
        <h3 className="font-headline-md text-headline-md font-bold">{d.name}</h3>
        {(d.tagline ?? d.summary) && (
          <p className="font-caption text-caption text-surface/80">{d.tagline ?? d.summary}</p>
        )}
        {/* Hover / focus reveal (collapsed to 0 rows otherwise; the text stays available to screen readers). */}
        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr] motion-reduce:transition-none">
          <div className="min-h-0 overflow-hidden">
            {d.tagline && (
              <p className="line-clamp-3 pt-space-xs font-caption text-caption text-surface/90 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                {d.summary}
              </p>
            )}
            <span
              aria-hidden="true"
              className="mt-space-sm inline-flex items-center gap-1 font-label-md text-label-md uppercase tracking-wider text-secondary-fixed opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              {t('explore', { name: d.name })}
              <Icon name="arrow_forward" className="text-sm" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

async function MosaicGrid({ locale }: { locale: Locale }) {
  const result = await loadSection('destinations', () => getDestinations(locale))
  if (!result.ok) return <ErrorState retryHref="/" />
  const items = result.data.items.slice(0, MOSAIC_SIZE)
  if (items.length === 0) return <EmptyState />
  return (
    <ul className="grid grid-cols-1 gap-space-md md:grid-cols-3 lg:grid-cols-4">
      {items.map((destination, i) => (
        <Reveal as="li" key={destination.id} delay={(i % 4) * 0.06}>
          <DestinationMosaicTile destination={destination} className={MOSAIC_ASPECTS[i % MOSAIC_ASPECTS.length]} />
        </Reveal>
      ))}
    </ul>
  )
}

/** Section 7 — "Iconic Ceylon Encounters": 8 destinations in the Stitch asymmetric mosaic → /destinations/<slug>. */
export function DestinationsMosaic({ locale }: { locale: Locale }) {
  const t = useTranslations('home.destinations')
  return (
    <section className="w-full bg-surface-container-low py-space-3xl">
      <Container className="flex flex-col gap-space-2xl">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')} />
        <Suspense fallback={<MosaicSkeleton />}>
          <MosaicGrid locale={locale} />
        </Suspense>
      </Container>
    </section>
  )
}
