import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getDestinations } from '@/lib/api/public'
import type { DestinationDetail, Locale } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { nearestNeighbours } from './geo'

const DISTANCE_TONES = ['text-secondary', 'text-tertiary', 'text-primary'] as const

/**
 * "Connecting <name> to the Rest of Ceylon": the three nearest published destinations (in different directions),
 * computed from coordinates — the CMS has no drive-time field, so the straight-line distance is shown.
 */
export async function RegionalConnections({
  locale,
  destination: d,
}: {
  locale: Locale
  destination: Pick<DestinationDetail, 'slug' | 'name' | 'latitude' | 'longitude'>
}) {
  if (d.latitude === null || d.longitude === null) return null
  const t = await getTranslations({ locale, namespace: 'destinationDetail.connections' })
  let neighbours
  try {
    neighbours = nearestNeighbours(d, (await getDestinations(locale)).items, 3)
  } catch (error) {
    console.error('[destination] connections unavailable:', error instanceof Error ? error.message : error)
    return (
      <section className="mx-auto w-full max-w-[1440px] px-margin py-space-2xl md:px-margin-md lg:px-margin-lg">
        <ErrorState />
      </section>
    )
  }
  if (neighbours.length === 0) return null

  return (
    <section
      aria-labelledby="connections-title"
      className="mx-auto w-full max-w-[1440px] px-margin py-space-2xl md:px-margin-md lg:px-margin-lg"
    >
      <div className="flex flex-col justify-between gap-space-lg rounded-xl bg-surface-container-high p-space-lg shadow-sm md:p-space-xl lg:flex-row lg:items-center">
        <div className="flex max-w-xl flex-col">
          <span className="font-label-md text-label-md font-semibold uppercase tracking-widest text-secondary">
            {t('eyebrow')}
          </span>
          <h2 id="connections-title" className="mt-1 font-headline-md text-headline-md font-semibold text-primary">
            {t('title', { name: d.name })}
          </h2>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{t('intro')}</p>
        </div>
        <ul className="grid grid-cols-1 gap-space-md sm:grid-cols-3 lg:max-w-[50%] lg:shrink-0 lg:gap-space-lg">
          {neighbours.map(({ item, km, direction }, i) => (
            <li key={item.slug}>
              <Link
                href={`/destinations/${item.slug}`}
                className="group flex h-full flex-col rounded-lg bg-surface p-space-md shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="font-label-md text-label-md uppercase text-on-surface-variant">
                  {t(`direction.${direction}`)}
                </span>
                <span className="mt-1 font-headline-sm text-headline-sm font-semibold text-on-surface transition-colors group-hover:text-secondary">
                  {item.name}
                </span>
                <span
                  className={cn(
                    'mt-0.5 font-caption text-caption font-semibold',
                    DISTANCE_TONES[i % DISTANCE_TONES.length],
                  )}
                >
                  {t('distance', { km: Math.round(km) })}
                </span>
                {item.tagline && (
                  <span className="mt-1 font-caption text-caption text-on-surface-variant">{item.tagline}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function ConnectionsSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto w-full max-w-[1440px] px-margin py-space-2xl md:px-margin-md lg:px-margin-lg"
    >
      <Skeleton className="h-52 w-full rounded-xl" />
    </div>
  )
}
