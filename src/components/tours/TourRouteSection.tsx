import { useTranslations } from 'next-intl'
import type { TourDetail } from '@/lib/api/types'
import { Icon } from '@/components/ui/Icon'
import { buildRouteStops, groupMarkers, stopsByDay } from './route-stops'
import { TourRouteMap } from './TourRouteMap'

/**
 * Stitch "SECTION D: ROUTE MAP & DISTANCE VISUALIZATION": Leaflet map with numbered stops (in place of the static
 * map photo), the "Total Circuit" summary, terrain cards and a text list of every stop (accessible fallback).
 */
export function TourRouteSection({ tour }: { tour: Pick<TourDetail, 'title' | 'days' | 'routeSummary' | 'terrains'> }) {
  const t = useTranslations('tourDetail.route')
  const stops = buildRouteStops(tour.days)
  const markers = groupMarkers(stops)
  const groups = stopsByDay(stops)

  return (
    <section id="route" aria-labelledby="route-title" className="flex scroll-mt-36 flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <span className="font-label-lg text-label-lg uppercase tracking-widest text-secondary">{t('eyebrow')}</span>
        <h2 id="route-title" className="font-headline-lg text-headline-lg text-primary">
          {t('title')}
        </h2>
      </div>

      {stops.length > 0 && (
        <div className="flex flex-col gap-space-sm">
          <div className="relative overflow-hidden rounded-xl shadow-md">
            <TourRouteMap stops={stops} markers={markers} tourTitle={tour.title} describedBy="route-map-hint" />
            {tour.routeSummary && (
              <div className="pointer-events-none absolute bottom-space-md left-space-md z-10 mr-space-md rounded-lg bg-surface/90 px-space-md py-space-sm shadow-sm backdrop-blur-md">
                <span className="block font-label-md text-label-md font-bold uppercase tracking-wider text-primary">
                  {t('totalCircuit')}
                </span>
                <span className="font-headline-sm text-headline-sm text-primary">{tour.routeSummary}</span>
              </div>
            )}
          </div>
          <p id="route-map-hint" className="sr-only">
            {t('mapHint')}
          </p>
          <details className="group rounded-xl">
            <summary className="tap-target relative flex w-fit cursor-pointer list-none items-center gap-1 rounded font-label-lg text-label-lg text-primary underline transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
              <Icon name="format_list_numbered" className="text-base" />
              <span className="group-open:hidden">{t('showStops', { count: stops.length })}</span>
              <span className="hidden group-open:inline">{t('hideStops')}</span>
            </summary>
            <div className="mt-space-sm rounded-xl bg-surface-container-low p-space-md">
              <h3 className="sr-only">{t('stopsTitle')}</h3>
              <ol className="grid grid-cols-1 gap-x-space-lg gap-y-space-sm sm:grid-cols-2">
                {groups.map((group) => (
                  <li key={group.day} className="flex flex-col gap-1">
                    <span className="font-label-md text-label-md uppercase tracking-wider text-secondary">
                      {t('stopDay', { day: group.day })}
                    </span>
                    <ol className="flex flex-col gap-1">
                      {group.stops.map((stop) => (
                        <li key={stop.number} className="flex items-center gap-space-sm font-body-md text-body-md">
                          <span
                            aria-hidden="true"
                            className="flex h-6 min-w-6 items-center justify-center rounded-full bg-secondary px-1 font-label-md text-label-md font-bold tracking-normal text-on-secondary"
                          >
                            {stop.number}
                          </span>
                          <span className="sr-only">{t('stopNumber', { number: stop.number })}: </span>
                          <span className="text-on-surface">{stop.name}</span>
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ol>
            </div>
          </details>
        </div>
      )}

      {tour.terrains.length > 0 && (
        <ul className="grid grid-cols-1 gap-space-md md:grid-cols-3">
          {tour.terrains.map((terrain, i) => (
            <li key={i} className="flex flex-col gap-1 rounded-xl bg-surface-container-low p-space-md">
              <span className="font-label-md text-label-md uppercase tracking-wider text-secondary">
                {terrain.label}
              </span>
              <h3 className="font-headline-sm text-headline-sm text-primary">{terrain.place}</h3>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{terrain.note}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
