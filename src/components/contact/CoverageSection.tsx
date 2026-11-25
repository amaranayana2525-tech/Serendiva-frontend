import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { getDestinations } from '@/lib/api/public'
import type { ContactSettings, Locale } from '@/lib/api/types'
import { Container } from '@/components/ui/Container'
import { ErrorState } from '@/components/ui/ErrorState'
import { Icon } from '@/components/ui/Icon'
import { CoverageMapLazy } from './CoverageMapLazy'
import type { CoverageHub } from './CoverageMap'

const FEATURES = [
  { key: 'fleet', icon: 'directions_car' },
  { key: 'charters', icon: 'airplanemode_active' },
  { key: 'insurance', icon: 'local_police' },
  { key: 'fastTrack', icon: 'star' },
] as const

/** Fallback base when the settings can't be loaded: Colombo. */
const COLOMBO = { lat: 6.9271, lng: 79.8612 }

/** "From the northern tip of Jaffna…" — islandwide coverage copy + live Leaflet map (replaces the Stitch placeholder). */
export function CoverageSection({ locale, contact }: { locale: Locale; contact: ContactSettings | null }) {
  const t = useTranslations('contact.coverage')
  return (
    <section aria-labelledby="coverage-title">
      <Container className="py-space-3xl">
        <div className="grid grid-cols-1 items-center gap-gutter-lg rounded-xl bg-surface-container-lowest p-space-lg shadow-xl sm:p-space-xl md:p-space-2xl lg:grid-cols-12">
          <div className="flex flex-col gap-space-md lg:col-span-6">
            <div className="inline-flex items-center gap-space-xs font-label-md text-label-md uppercase tracking-widest text-secondary">
              <Icon name="pin_drop" className="text-sm" />
              <span>{t('eyebrow')}</span>
            </div>
            <h2 id="coverage-title" className="font-headline-lg text-headline-lg text-primary">
              {t('title')}
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">{t('body')}</p>
            <ul className="grid grid-cols-1 gap-space-md pt-space-sm min-[420px]:grid-cols-2">
              {FEATURES.map((feature) => (
                <li key={feature.key} className="flex items-start gap-space-sm">
                  <Icon name={feature.icon} className="mt-0.5 shrink-0 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-lg font-semibold text-primary">
                      {t(`features.${feature.key}.title`)}
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant">
                      {t(`features.${feature.key}.body`)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-6">
            <div
              role="region"
              aria-label={t('mapLabel')}
              className="relative isolate h-80 w-full overflow-hidden rounded-xl bg-surface-container shadow-md md:h-96"
            >
              <Suspense
                fallback={<div aria-hidden="true" className="absolute inset-0 animate-pulse bg-surface-container" />}
              >
                <CoverageMapPanel locale={locale} contact={contact} />
              </Suspense>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

/** Loads the destination hubs (GET /destinations) and renders the map with its Stitch caption. */
async function CoverageMapPanel({ locale, contact }: { locale: Locale; contact: ContactSettings | null }) {
  const t = await getTranslations({ locale, namespace: 'contact.coverage' })
  let hubs: CoverageHub[]
  try {
    const { items } = await getDestinations(locale)
    hubs = items
      .filter((d) => d.latitude !== null && d.longitude !== null)
      .map((d) => ({
        slug: d.slug,
        name: d.name,
        lat: d.latitude as number,
        lng: d.longitude as number,
        exploreLabel: t('explore', { name: d.name }),
      }))
  } catch {
    return <ErrorState body={t('mapError')} className="absolute inset-0 justify-center rounded-none" />
  }

  const base = {
    lat: contact?.mapLat ?? COLOMBO.lat,
    lng: contact?.mapLng ?? COLOMBO.lng,
    label: t('baseMarker', { area: contact?.address || t('baseFallback') }),
  }
  const names = hubs.slice(0, 6).map((h) => h.name)

  return (
    <>
      <div className="absolute inset-0 z-0">
        <CoverageMapLazy base={base} hubs={hubs} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[450] flex flex-col bg-gradient-to-t from-primary/90 via-primary/70 to-transparent p-space-md pt-space-xl text-on-primary sm:p-space-lg sm:pt-space-xl">
        <span className="font-label-md text-label-md uppercase tracking-wider text-secondary-fixed">
          {t('mapEyebrow')}
        </span>
        <span className="font-headline-sm text-headline-sm">{t('mapTitle')}</span>
        {names.length > 0 && (
          <span className="mt-1 hidden font-caption text-caption opacity-80 sm:block">
            <span className="sr-only">{t('hubsLabel')}: </span>
            {names.join(' · ')}
          </span>
        )}
        <span className="mt-space-xs flex items-center gap-space-xs font-caption text-caption">
          <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-surface bg-secondary" />
          {base.label}
        </span>
      </div>
    </>
  )
}
