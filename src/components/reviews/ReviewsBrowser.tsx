'use client'

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import type { ReviewCard as ReviewCardDto, TravellerType } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { ReviewCard } from '@/components/cards/ReviewCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { useUrlParams } from '@/components/gallery/useUrlParams'
import {
  FILTER_PARAMS,
  filterReviews,
  hasActiveFilters,
  NO_FILTERS,
  ORIGIN_KEYS,
  orderForGrid,
  parseReviewFilters,
  TRAVELLER_FILTERS,
  type OriginKey,
  type ReviewFilters,
} from './filters'

const PAGE_SIZE = 6

export interface ReviewRoute {
  slug: string
  label: string
}

export interface ReviewsBrowserProps {
  /** Every approved review (API order = newest trips first). */
  reviews: ReviewCardDto[]
  /** Review counts per traveller type (GET /reviews/summary → byTravellerType). */
  typeCounts: Partial<Record<TravellerType, number>>
  total: number
  /** Tours that have at least one review (route filter buttons). */
  routes: ReviewRoute[]
  /** Server-rendered featured review spotlight, shown when no filter is active. */
  spotlight?: ReactNode
  spotlightId?: string | null
}

interface ViewProps extends ReviewsBrowserProps {
  filters: ReviewFilters
  onChange?: (patch: Partial<ReviewFilters>) => void
}

/** Filter console + spotlight + bento grid of review cards with "load more" (static markup when `onChange` is absent). */
export function ReviewsBrowserView({
  reviews,
  typeCounts,
  total,
  routes,
  spotlight,
  spotlightId,
  filters,
  onChange,
}: ViewProps) {
  const t = useTranslations('reviews')
  const ids = useId()
  const routeLabelId = `${ids}-route`
  const originId = `${ids}-origin`
  const active = hasActiveFilters(filters)
  const matches = useMemo(() => filterReviews(reviews, filters), [reviews, filters])
  const showSpotlight = Boolean(spotlight && spotlightId && !active && matches.some((r) => r.id === spotlightId))
  const gridReviews = useMemo(
    () => orderForGrid(showSpotlight ? matches.filter((r) => r.id !== spotlightId) : matches),
    [matches, showSpotlight, spotlightId],
  )

  // Number of grid cards shown; resets to one page whenever the filters change.
  const filterKey = `${filters.type}|${filters.tour}|${filters.origin}`
  const [limit, setLimit] = useState({ key: filterKey, count: PAGE_SIZE })
  const count = limit.key === filterKey ? limit.count : PAGE_SIZE
  const visible = gridReviews.slice(0, count)
  const remaining = gridReviews.length - visible.length
  const shown = visible.length + (showSpotlight ? 1 : 0)

  // After "load more", move focus to the first newly revealed card (keyboard & screen-reader users keep their place).
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])
  const focusIndex = useRef<number | null>(null)
  useEffect(() => {
    if (focusIndex.current === null) return
    itemRefs.current[focusIndex.current]?.focus()
    focusIndex.current = null
  }, [count])

  const showMore = (all: boolean) => {
    focusIndex.current = visible.length
    setLimit({ key: filterKey, count: all ? gridReviews.length : count + PAGE_SIZE })
  }

  const pill = (type: TravellerType | null, label: string, value: number) => {
    const isActive = filters.type === type
    return (
      <button
        key={type ?? 'all'}
        type="button"
        aria-pressed={isActive}
        onClick={() => onChange?.({ type })}
        className={cn(
          'tap-target relative whitespace-nowrap rounded-full px-space-md py-2 font-label-lg text-label-lg transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          isActive
            ? 'bg-primary text-on-primary shadow-sm'
            : 'bg-surface-container text-on-surface hover:bg-surface-container-high',
        )}
      >
        {label} <span className="ml-1 font-normal opacity-75">({value})</span>
      </button>
    )
  }

  return (
    <>
      {/* SECTION 2: interactive filter console */}
      <section
        aria-label={t('filters.label')}
        className="w-full bg-surface/95 py-space-xl shadow-sm backdrop-blur-md transition-all md:sticky md:top-20 md:z-30"
      >
        <div className="mx-auto flex max-w-[1440px] flex-col gap-space-md px-margin md:px-margin-md lg:px-margin-lg">
          <div className="no-scrollbar relative flex items-center justify-between gap-space-md overflow-x-auto pb-space-xs coarse:-my-1.5 coarse:py-1.5">
            <div
              role="group"
              aria-label={t('filters.travellerLabel')}
              className="flex shrink-0 items-center gap-space-xs"
            >
              {pill(null, t('filters.all'), total)}
              {TRAVELLER_FILTERS.map((type) => pill(type, t(`filters.types.${type}`), typeCounts[type] ?? 0))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-space-md pt-space-xs">
            {routes.length > 0 && (
              <div className="flex w-full min-w-0 items-center gap-space-sm font-label-md text-label-md text-on-surface-variant md:w-auto md:flex-1">
                <span id={routeLabelId} className="shrink-0 uppercase tracking-widest text-on-surface-variant">
                  {t('filters.route')}
                </span>
                <div className="no-scrollbar relative min-w-0 overflow-x-auto pr-space-lg [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] coarse:-my-2.5 coarse:py-2.5">
                  <div
                    role="group"
                    aria-labelledby={routeLabelId}
                    className="flex min-w-max items-center gap-space-sm p-0.5"
                  >
                    {routes.map((route) => {
                      const isActive = filters.tour === route.slug
                      return (
                        <button
                          key={route.slug}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => onChange?.({ tour: isActive ? null : route.slug })}
                          className={cn(
                            'tap-target relative whitespace-nowrap rounded px-space-sm py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                            isActive
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container-low text-on-surface hover:bg-surface-container',
                          )}
                        >
                          {route.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-space-sm">
              {active && (
                <button
                  type="button"
                  onClick={() => onChange?.(NO_FILTERS)}
                  className="flex items-center gap-1 rounded px-space-xs py-1 font-label-md text-label-md uppercase tracking-wider text-secondary transition-colors hover:text-on-secondary-fixed-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Icon name="close" className="text-sm" />
                  {t('filters.reset')}
                </button>
              )}
              <label
                htmlFor={originId}
                className="shrink-0 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant"
              >
                {t('filters.origin')}
              </label>
              <select
                id={originId}
                value={filters.origin ?? ''}
                onChange={(e) => onChange?.({ origin: (e.target.value || null) as OriginKey | null })}
                className="cursor-pointer rounded-lg bg-surface-container px-space-md py-1.5 font-label-md text-label-md text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary coarse:min-h-11"
              >
                <option value="">{t('filters.origins.all')}</option>
                {ORIGIN_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {t(`filters.origins.${key}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p aria-live="polite" className="sr-only">
            {active ? t('filters.results', { count: matches.length }) : ''}
          </p>
        </div>
      </section>

      {showSpotlight && spotlight}

      {/* SECTION 4: curated review grid */}
      <section aria-labelledby={`${ids}-grid`} className="w-full bg-surface-container-low py-space-2xl">
        <div className="mx-auto max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
          <div className="mb-space-2xl flex flex-col justify-between gap-space-md md:flex-row md:items-end">
            <div>
              <span className="mb-space-xs block font-label-md text-label-md font-semibold uppercase tracking-widest text-secondary">
                {t('grid.eyebrow')}
              </span>
              <h2 id={`${ids}-grid`} className="font-headline-xl text-headline-xl tracking-tight text-primary">
                {t('grid.title')}
              </h2>
            </div>
            <p className="max-w-md font-body-md text-body-md text-on-surface-variant">{t('grid.intro')}</p>
          </div>

          {matches.length === 0 ? (
            <EmptyState
              icon="rate_review"
              title={active ? t('grid.emptyTitle') : t('grid.noneTitle')}
              body={active ? t('grid.emptyBody') : t('grid.noneBody')}
              action={
                active ? (
                  <button
                    type="button"
                    onClick={() => onChange?.(NO_FILTERS)}
                    className="rounded-lg bg-primary px-space-lg py-space-sm font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 coarse:min-h-11"
                  >
                    {t('filters.reset')}
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              {visible.length > 0 && (
                <ul className="grid grid-cols-1 gap-gutter-lg md:grid-cols-2 lg:grid-cols-3">
                  {visible.map((review, index) => (
                    <li
                      key={review.id}
                      ref={(el) => {
                        itemRefs.current[index] = el
                      }}
                      tabIndex={-1}
                      className="flex rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <ReviewCard review={review} variant="full" className="w-full" />
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-space-2xl flex flex-col items-center justify-between gap-space-md rounded-xl bg-surface p-space-lg shadow-sm sm:flex-row">
                <div className="flex items-center gap-space-sm">
                  <Icon name="dataset" className="shrink-0 text-xl text-primary" />
                  <span className="font-body-md text-body-md text-on-surface-variant">
                    {remaining > 0 ? t('grid.showing', { shown, total: matches.length }) : t('grid.allShown')}
                  </span>
                </div>
                {remaining > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-space-sm">
                    <button
                      type="button"
                      onClick={() => showMore(false)}
                      className="rounded-lg bg-surface-container px-space-lg py-space-sm font-label-lg text-label-lg text-on-surface transition-all hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 coarse:min-h-11"
                    >
                      {t('grid.loadMore', { count: Math.min(PAGE_SIZE, remaining) })}
                    </button>
                    <button
                      type="button"
                      onClick={() => showMore(true)}
                      className="rounded-lg bg-primary px-space-lg py-space-sm font-label-lg text-label-lg text-on-primary transition-all hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 coarse:min-h-11"
                    >
                      {t('grid.browseAll', { count: matches.length })}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}

/** URL-synced (`?type=&tour=&origin=`) reviews browser. Render inside <Suspense> (useSearchParams). */
export function ReviewsBrowser(props: ReviewsBrowserProps) {
  const { params, update } = useUrlParams()
  const tourSlugs = useMemo(() => props.routes.map((r) => r.slug), [props.routes])
  const filters = useMemo(() => parseReviewFilters(params, tourSlugs), [params, tourSlugs])
  const onChange = (patch: Partial<ReviewFilters>) => {
    const next = { ...filters, ...patch }
    update({ [FILTER_PARAMS.type]: next.type, [FILTER_PARAMS.tour]: next.tour, [FILTER_PARAMS.origin]: next.origin })
  }
  return <ReviewsBrowserView {...props} filters={filters} onChange={onChange} />
}
