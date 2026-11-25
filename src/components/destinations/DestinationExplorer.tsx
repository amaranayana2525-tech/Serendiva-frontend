'use client'

import { useDeferredValue, useId, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { DestinationCard as DestinationCardDto } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { DestinationCard } from '@/components/cards/DestinationCard'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { Tabs } from '@/components/ui/Tabs'
import { destinationGridLayout } from './gridLayout'
import { useRegionParam } from './useRegionParam'

export interface ExplorerRegion {
  slug: string
  name: string
  /** Position in GET /regions (colour tone). */
  toneIndex: number
}

export interface DestinationExplorerProps {
  destinations: DestinationCardDto[]
  regions: ExplorerRegion[]
}

const ALL = 'all'

const normalise = (value: string) => value.toLocaleLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const searchText = (d: DestinationCardDto) =>
  normalise(
    [
      d.name,
      d.tagline,
      d.summary,
      d.metaLabel,
      d.badge,
      d.bestTimeLabel,
      d.region?.name,
      d.region?.slug,
      ...d.curations,
    ]
      .filter(Boolean)
      .join(' '),
  )

/** Search + URL-synced region tabs (with counts) + the asymmetric Stitch card grid, filtered in memory. */
export function DestinationExplorer(props: DestinationExplorerProps) {
  const [region, setRegion] = useRegionParam(props.regions.map((r) => r.slug))
  return <DestinationExplorerView {...props} region={region} onRegionChange={setRegion} />
}

const noop = () => undefined

/** Unfiltered grid without URL state — the <Suspense> fallback rendered into the static HTML. */
export function DestinationExplorerStatic(props: DestinationExplorerProps) {
  return <DestinationExplorerView {...props} region={null} onRegionChange={noop} />
}

interface ViewProps extends DestinationExplorerProps {
  region: string | null
  onRegionChange: (slug: string | null) => void
}

function DestinationExplorerView({ destinations, regions, region, onRegionChange }: ViewProps) {
  const t = useTranslations('destinations.curations')
  const gridId = useId()
  const searchId = useId()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  const index = useMemo(() => destinations.map((d) => ({ d, text: searchText(d) })), [destinations])
  const toneOf = useMemo(() => new Map(regions.map((r) => [r.slug, r.toneIndex])), [regions])
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of destinations) if (d.region) map.set(d.region.slug, (map.get(d.region.slug) ?? 0) + 1)
    return map
  }, [destinations])

  const terms = normalise(deferredQuery).split(/\s+/).filter(Boolean)
  const visible = index
    .filter(({ d }) => !region || d.region?.slug === region)
    .filter(({ text }) => terms.every((term) => text.includes(term)))
    .map(({ d }) => d)
  const layout = destinationGridLayout(visible.length)

  const tabs = [
    { id: ALL, label: t('all', { count: destinations.length }) },
    ...regions
      .filter((r) => (counts.get(r.slug) ?? 0) > 0)
      .map((r) => ({ id: r.slug, label: t('tab', { name: r.name, count: counts.get(r.slug) ?? 0 }) })),
  ]

  const reset = () => {
    setQuery('')
    onRegionChange(null)
  }

  return (
    <>
      {/* Header + real-time search */}
      <div className="mb-space-xl flex flex-col justify-between gap-space-md md:flex-row md:items-end">
        <div className="flex flex-col gap-space-xs">
          <span className="font-label-lg text-label-lg uppercase tracking-wider text-secondary">{t('eyebrow')}</span>
          <h2 className="font-headline-xl text-headline-xl font-semibold tracking-tight text-primary">{t('title')}</h2>
        </div>
        <div className="relative w-full md:w-96" role="search">
          <label htmlFor={searchId} className="sr-only">
            {t('searchLabel')}
          </label>
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-controls={gridId}
            autoComplete="off"
            className="w-full rounded-xl bg-surface-container-low py-2.5 pl-10 pr-4 font-body-md text-body-md text-on-surface shadow-sm transition-all placeholder:text-outline focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary coarse:min-h-11"
          />
        </div>
      </div>

      {/* Region tabs with counts */}
      <Tabs
        variant="segmented"
        label={t('tabsLabel')}
        items={tabs}
        value={region ?? ALL}
        onValueChange={(id) => onRegionChange(id === ALL ? null : id)}
        controlsId={gridId}
        className="mb-space-2xl"
        listClassName="w-auto min-w-max md:min-w-max lg:min-w-0 lg:flex-wrap"
      />

      <p aria-live="polite" className="sr-only">
        {t('results', { count: visible.length })}
      </p>

      <div id={gridId}>
        {visible.length === 0 ? (
          <EmptyState
            icon={destinations.length === 0 ? 'travel_explore' : 'search_off'}
            title={destinations.length === 0 ? t('emptyAllTitle') : t('emptyTitle')}
            body={destinations.length === 0 ? t('emptyAllBody') : t('emptyBody')}
            action={
              destinations.length > 0 ? (
                <Button variant="primary" leadingIcon="refresh" onClick={reset}>
                  {t('reset')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-gutter-lg md:grid-cols-2 lg:grid-cols-12">
            {visible.map((d, i) => {
              const cell = layout[i]
              return (
                <DestinationCard
                  key={d.slug}
                  destination={d}
                  variant="explorer"
                  featured={cell.featured}
                  tallImage={cell.tallImage}
                  roomy={cell.roomy}
                  index={d.region ? (toneOf.get(d.region.slug) ?? 0) : 0}
                  className={cn(cell.className)}
                />
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
