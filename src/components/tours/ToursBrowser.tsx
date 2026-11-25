'use client'

import { Suspense, useCallback, useEffect, useId, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { TourCard as TourCardDto } from '@/lib/api/types'
import { contactHref } from '@/lib/prefill'
import { TourCard } from '@/components/cards/TourCard'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import {
  categoryFacets,
  DURATION_BANDS,
  EMPTY_FILTERS,
  filterTours,
  parseTourFilters,
  tourFiltersToQuery,
  type DurationBand,
  type TourFilters,
} from './tour-filters'
import { useHydrated } from './useHydrated'

export interface ToursBrowserCategory {
  slug: string
  name: string
  shortName: string
}

export interface ToursBrowserProps {
  /** Every published tour (fetched once on the server, cached). */
  tours: TourCardDto[]
  /** Categories in CMS order (chips; counts are computed from `tours`). */
  categories: ToursBrowserCategory[]
}

const SEARCH_DEBOUNCE_MS = 300

/** Canonical form of a filter set (what ends up in the URL). */
const filtersKey = (filters: TourFilters) => new URLSearchParams(tourFiltersToQuery(filters)).toString()

/**
 * Sticky filter bar (search, duration, category chips, live result count) + tour grid for /tours.
 * Filters live in the URL (`?category=&duration=&q=`) so results are shareable and survive back/forward.
 *
 * The page stays static: while the URL-aware version suspends (useSearchParams during prerender), the same view is
 * server-rendered with no filters, so crawlers and no-JS visitors still get the complete list of tours.
 */
export function ToursBrowser(props: ToursBrowserProps) {
  return (
    <Suspense fallback={<ToursBrowserView {...props} filters={EMPTY_FILTERS} onChange={noop} />}>
      <UrlSyncedToursBrowser {...props} />
    </Suspense>
  )
}

function noop() {}

function UrlSyncedToursBrowser(props: ToursBrowserProps) {
  const searchParams = useSearchParams()
  const filters = useMemo(() => parseTourFilters(searchParams), [searchParams])
  return <ToursBrowserView {...props} filters={filters} onChange={replaceUrl} />
}

/**
 * Writes the filters to the URL with the native History API, which Next.js integrates with its router
 * (useSearchParams updates). Unlike `router.replace`, it does not re-request the page's RSC payload for every chip
 * or keystroke, and it never scrolls. `replaceState` (not push): filter tweaks don't flood the history, while
 * back/forward to and from a tour still restore the filters from the URL.
 */
function replaceUrl(next: TourFilters) {
  const query = new URLSearchParams(tourFiltersToQuery(next)).toString()
  const { pathname, hash } = window.location
  window.history.replaceState(null, '', `${pathname}${query ? `?${query}` : ''}${hash}`)
}

interface ToursBrowserViewProps extends ToursBrowserProps {
  /** Filters from the URL. */
  filters: TourFilters
  onChange: (next: TourFilters) => void
}

function ToursBrowserView({ tours, categories, filters, onChange }: ToursBrowserViewProps) {
  const t = useTranslations('tours')
  const searchId = useId()
  const durationId = useId()
  const resultsTitleId = useId()
  const hydrated = useHydrated()

  // The UI reacts instantly to local state; the URL follows (immediately for chips/duration, debounced for typing).
  const [state, setState] = useState<TourFilters>(filters)
  const urlKey = filtersKey(filters)
  const [seenUrlKey, setSeenUrlKey] = useState(urlKey)
  // URLs we have written that the router has not reported back yet (its updates arrive asynchronously).
  const [pending, setPending] = useState<string[]>([])
  if (urlKey !== seenUrlKey) {
    setSeenUrlKey(urlKey)
    const echo = pending.indexOf(urlKey)
    if (echo >= 0) {
      setPending(pending.slice(echo + 1))
    } else {
      // A URL we did not write ourselves (link to /tours?…, back/forward) wins over the local state.
      setState(filters)
      setPending([])
    }
  }
  const committedKey = pending.length > 0 ? pending[pending.length - 1] : urlKey

  const commit = useCallback(
    (next: TourFilters) => {
      const key = filtersKey(next)
      if (key === committedKey) return // the URL already says this
      setPending((list) => [...list, key])
      onChange(next)
    },
    [onChange, committedKey],
  )

  // Debounced URL update while typing in the search box.
  useEffect(() => {
    if (filtersKey(state) === committedKey) return
    const timer = window.setTimeout(() => commit(state), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [state, committedKey, commit])

  const results = useMemo(() => filterTours(tours, state), [tours, state])
  const facets = useMemo(() => categoryFacets(categories, tours, state.category), [categories, tours, state.category])

  const apply = (patch: Partial<TourFilters>) => {
    const next = { ...state, ...patch }
    setState(next)
    commit(next)
  }
  const setCategory = (category: string | null) => apply({ category })
  const setDuration = (value: string) =>
    apply({ duration: (DURATION_BANDS as readonly string[]).includes(value) ? (value as DurationBand) : null })
  const reset = () => apply({ ...EMPTY_FILTERS })

  return (
    <div className="w-full" data-hydrated={hydrated || undefined}>
      {/* Sticky filter bar & search (sticky from md up; on phones it would cover a third of the screen). */}
      <section
        aria-label={t('filters.label')}
        className="z-30 bg-surface/95 py-space-md shadow-sm backdrop-blur-md md:sticky md:top-20"
      >
        <div className="mx-auto flex max-w-[1440px] flex-col gap-space-md px-margin md:px-margin-md lg:px-margin-lg">
          <div className="flex flex-col items-center justify-between gap-gutter lg:flex-row">
            <div role="search" className="relative w-full lg:w-96">
              <label htmlFor={searchId} className="sr-only">
                {t('filters.searchLabel')}
              </label>
              <Icon
                name="search"
                className="pointer-events-none absolute left-space-md top-1/2 -translate-y-1/2 text-xl text-outline"
              />
              <input
                id={searchId}
                type="search"
                value={state.q}
                onChange={(e) => setState({ ...state, q: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit(state)
                }}
                maxLength={100}
                autoComplete="off"
                enterKeyHint="search"
                placeholder={t('filters.searchPlaceholder')}
                className="w-full rounded-xl bg-surface-container-lowest py-space-sm pl-11 pr-space-md font-body-md text-body-md text-on-surface shadow-sm placeholder:text-outline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary coarse:min-h-11"
              />
            </div>
            <div className="flex w-full flex-wrap items-center justify-between gap-x-space-lg gap-y-space-sm lg:w-auto lg:flex-nowrap lg:justify-end">
              <div className="flex items-center gap-space-sm">
                <label
                  htmlFor={durationId}
                  className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant"
                >
                  {t('filters.durationLabel')}
                </label>
                <select
                  id={durationId}
                  value={state.duration ?? 'all'}
                  onChange={(e) => setDuration(e.target.value)}
                  className="cursor-pointer rounded-xl bg-surface-container-lowest px-space-md py-space-sm font-body-md text-body-md text-on-surface shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary coarse:min-h-11"
                >
                  <option value="all">{t('filters.durationAll')}</option>
                  {DURATION_BANDS.map((band) => (
                    <option key={band} value={band}>
                      {t(`filters.durations.${band}`)}
                    </option>
                  ))}
                </select>
              </div>
              <p
                aria-live="polite"
                aria-atomic="true"
                className="flex items-center gap-space-xs rounded-full bg-primary/5 px-space-md py-space-xs text-primary"
              >
                <Icon name="travel_explore" className="text-sm" />
                <span className="font-label-md text-label-md font-semibold sm:whitespace-nowrap">
                  {t('filters.count', { count: results.length })}
                </span>
              </p>
            </div>
          </div>
          {/* Filter chips carousel (px/-mx keep the focus ring visible inside the scroll container). */}
          <div
            role="group"
            aria-label={t('filters.categoriesLabel')}
            className="no-scrollbar relative -mx-0.5 flex items-center gap-space-xs overflow-x-auto px-0.5 pb-1 pt-0.5 coarse:-my-2 coarse:py-2"
          >
            <Chip
              active={!state.category}
              count={tours.length}
              onClick={() => setCategory(null)}
              className="focus-visible:ring-secondary focus-visible:ring-offset-0"
            >
              {t('filters.allTours')}
            </Chip>
            {facets.map((facet) => (
              <Chip
                key={facet.slug}
                active={state.category === facet.slug}
                count={facet.count}
                onClick={() => setCategory(state.category === facet.slug ? null : facet.slug)}
                className="focus-visible:ring-secondary focus-visible:ring-offset-0"
              >
                {facet.label}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      {/* Tours grid */}
      <section
        aria-labelledby={resultsTitleId}
        className="mx-auto w-full max-w-[1440px] px-margin py-space-2xl md:px-margin-md lg:px-margin-lg"
      >
        <h2 id={resultsTitleId} className="sr-only">
          {t('results.title')}
        </h2>
        {results.length > 0 ? (
          <ul className="grid grid-cols-1 gap-gutter-lg md:grid-cols-2 lg:grid-cols-3">
            {results.map((tour, index) => (
              <li key={tour.id} className="flex">
                <TourCard tour={tour} index={index} className="w-full" />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon="travel_explore"
            title={t('results.emptyTitle')}
            body={t('results.emptyBody')}
            action={
              <>
                <Button variant="primary" leadingIcon="restart_alt" onClick={reset}>
                  {t('results.reset')}
                </Button>
                <Button variant="secondary" leadingIcon="edit_note" href={contactHref({ source: 'tours-empty' })}>
                  {t('results.custom')}
                </Button>
              </>
            }
          />
        )}
      </section>
    </div>
  )
}
