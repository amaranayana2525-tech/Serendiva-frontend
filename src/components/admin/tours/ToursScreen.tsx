'use client'

import NextLink from 'next/link'
import { useState } from 'react'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import { AdminPagination } from '@/components/admin/kit/AdminPagination'
import { Button, IconButton } from '@/components/admin/kit/Button'
import { useConfirm } from '@/components/admin/kit/ConfirmDialog'
import { FilterBar, FilterTabs } from '@/components/admin/kit/FilterBar'
import { Switch } from '@/components/admin/kit/form/Switch'
import { MediaThumb } from '@/components/admin/kit/media/MediaThumb'
import { PageHeader } from '@/components/admin/kit/PageHeader'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '@/components/admin/kit/Panels'
import { SortableList, type SortableItemContext } from '@/components/admin/kit/SortableList'
import { StatusBadge } from '@/components/admin/kit/StatusBadge'
import { Icon } from '@/components/ui/Icon'
import { toAdminApiError } from '@/lib/admin/errors'
import { invalidateAdminQueries, useAdminErrorMessage, useAdminQuery } from '@/lib/admin/hooks'
import { adminSession } from '@/lib/admin/session'
import { toast } from '@/lib/admin/toast'
import { useUrlState } from '@/lib/admin/url-state'
import type { AdminTourListItem } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { isTourStatus, publicTourPath, TOUR_LIST_PAGE_SIZE, toursApi, type TourStatus } from './api'
import { ToursSectionNav } from './ToursSectionNav'
import { useSequentialSave } from './useSequentialSave'

const DEFAULTS = { q: '', status: '', page: '1' }

/** Desktop grid: handle · cover · tour · duration · categories · translations · status · updated · actions. */
const GRID =
  'md:grid md:items-center md:gap-3 md:grid-cols-[2rem_4.5rem_minmax(0,1fr)_6rem_9.5rem_6.75rem] xl:grid-cols-[2rem_4.5rem_minmax(0,2.2fr)_5rem_minmax(0,1.3fr)_6rem_9.25rem_6.5rem_6.75rem]'

const SHOWN_CATEGORIES = 2

/**
 * /admin/tours — searchable, status-filtered list (URL-synced) with drag-to-reorder (unfiltered view only),
 * inline publish switch, view-on-site, edit and delete.
 */
export function ToursScreen() {
  const t = useTranslations('adminTours.list')
  const format = useFormatter()
  const now = useNow({ updateInterval: 60_000 })
  const describe = useAdminErrorMessage()
  const confirm = useConfirm()
  const filters = useUrlState(DEFAULTS)
  const status = isTourStatus(filters.values.status) ? filters.values.status : undefined
  const q = filters.values.q.trim()
  const page = Math.max(1, Number.parseInt(filters.values.page, 10) || 1)
  const filtered = Boolean(q || status)

  // The unfiltered list (also the source of the tab counts) and, while filtering, the filtered list.
  const allQuery = { page: filtered ? 1 : page, pageSize: TOUR_LIST_PAGE_SIZE }
  const all = useAdminQuery(['tours', 'list', allQuery], (signal) => toursApi.list(allQuery, signal))
  const filteredQuery = { q: q || undefined, status, page, pageSize: TOUR_LIST_PAGE_SIZE }
  const search = useAdminQuery(['tours', 'list', filteredQuery], (signal) => toursApi.list(filteredQuery, signal), [], {
    enabled: filtered,
  })
  const list = filtered ? search : all
  const rows = list.data?.items
  const allItems = all.data?.items ?? []
  const multiPage = (all.data?.meta.totalPages ?? 1) > 1
  const sortable = !filtered && !multiPage
  const counts =
    all.data && !multiPage
      ? {
          total: all.data.meta.total,
          published: allItems.filter((i) => i.status === 'published').length,
          draft: allItems.filter((i) => i.status === 'draft').length,
        }
      : undefined

  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set())
  const markBusy = (id: string, on: boolean) =>
    setBusy((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  const order = useSequentialSave<AdminTourListItem[]>({
    run: (items) => toursApi.reorder(items.map((item, index) => ({ id: item.id, order: index }))),
    onSuccess: () => {
      toast.success(t('orderSaved'))
      invalidateAdminQueries('tours')
    },
    onError: (error) => {
      const err = toAdminApiError(error)
      if (!(err.isUnauthorized && adminSession.expired)) toast.error(t('orderFailed'), describe(err))
      void all.refetch()
    },
  })

  const reorder = (items: AdminTourListItem[]) => {
    all.setData((prev) => (prev ? { ...prev, items: items.map((item, index) => ({ ...item, order: index })) } : prev))
    order.push(items)
  }

  const setStatus = async (tour: AdminTourListItem, next: TourStatus) => {
    markBusy(tour.id, true)
    const patch = (value: TourStatus) => (prev: typeof list.data) =>
      prev ? { ...prev, items: prev.items.map((i) => (i.id === tour.id ? { ...i, status: value } : i)) } : prev
    list.setData(patch(next))
    if (list !== all) all.setData(patch(next))
    try {
      await toursApi.setStatus(tour.id, next)
      toast.success(next === 'published' ? t('publishedToast', { title: tour.title }) : t('unpublishedToast', { title: tour.title }))
      invalidateAdminQueries('tours')
    } catch (error) {
      list.setData(patch(tour.status))
      if (list !== all) all.setData(patch(tour.status))
      const err = toAdminApiError(error)
      if (!(err.isUnauthorized && adminSession.expired)) toast.error(t('statusFailed'), describe(err))
    } finally {
      markBusy(tour.id, false)
    }
  }

  const remove = async (tour: AdminTourListItem) => {
    const ok = await confirm({
      title: t('deleteTitle', { title: tour.title }),
      body: tour.status === 'published' ? t('deleteBodyPublished') : t('deleteBody'),
      tone: 'danger',
      confirmLabel: t('deleteConfirm'),
    })
    if (!ok) return
    markBusy(tour.id, true)
    try {
      await toursApi.remove(tour.id)
      toast.success(t('deleted', { title: tour.title }))
      const drop = (prev: typeof list.data) =>
        prev ? { ...prev, items: prev.items.filter((i) => i.id !== tour.id), meta: { ...prev.meta, total: prev.meta.total - 1 } } : prev
      list.setData(drop)
      if (list !== all) all.setData(drop)
      invalidateAdminQueries('tours')
    } catch (error) {
      const err = toAdminApiError(error)
      if (!(err.isUnauthorized && adminSession.expired)) toast.error(t('deleteFailed'), describe(err))
    } finally {
      markBusy(tour.id, false)
    }
  }

  const date = (iso: string) => format.dateTime(new Date(iso), { day: 'numeric', month: 'short', year: 'numeric' })
  // Rows saved after `now` was taken (reorder, publish) must not read "in 5 seconds".
  const relative = (iso: string) => {
    const d = new Date(iso)
    return format.relativeTime(d, new Date(Math.max(now.getTime(), d.getTime())))
  }

  const renderRow = (tour: AdminTourListItem, ctx: SortableItemContext | null) => (
    <TourRow
      tour={tour}
      ctx={ctx}
      busy={busy.has(tour.id)}
      onStatus={(next) => void setStatus(tour, next)}
      onDelete={() => void remove(tour)}
      date={date(tour.updatedAt)}
      relative={relative(tour.updatedAt)}
    />
  )

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button href="/admin/tours/new" variant="primary" icon="add">
            {t('newTour')}
          </Button>
        }
      />
      <ToursSectionNav current="tours" className="mb-4" />

      <div className="shadow-ambient flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 md:p-5">
        <FilterTabs
          label={t('statusTabs')}
          controlsId="tours-results"
          value={status ?? ''}
          onChange={(value) => filters.set({ status: value })}
          tabs={[
            { value: '', label: t('tabs.all'), count: counts?.total },
            { value: 'published', label: t('tabs.published'), count: counts?.published },
            { value: 'draft', label: t('tabs.draft'), count: counts?.draft },
          ]}
        />
        <FilterBar
          state={filters}
          fields={[{ type: 'search', key: 'q', label: t('search'), placeholder: t('searchPlaceholder') }]}
          actions={
            <span className="font-caption text-caption text-on-surface-variant" role="status" aria-live="polite">
              {order.saving ? (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="progress_activity" className="animate-spin text-[14px] text-primary" />
                  {t('savingOrder')}
                </span>
              ) : sortable && rows && rows.length > 1 ? (
                <span className="hidden items-center gap-1.5 md:inline-flex">
                  <Icon name="drag_indicator" className="text-[15px]" />
                  {t('dragHint')}
                </span>
              ) : null}
            </span>
          }
        />

        {filtered && rows && rows.length > 0 && (
          <div className="flex flex-col gap-2 rounded-xl bg-surface-container-low px-4 py-3 sm:flex-row sm:items-center">
            <Icon name="info" className="hidden text-[20px] text-primary sm:block" />
            <p className="min-w-0 flex-1 font-body-md text-body-md text-on-surface-variant">{t('reorderDisabled')}</p>
            <Button size="sm" variant="ghost" icon="filter_alt_off" onClick={() => filters.reset()}>
              {t('clearFilters')}
            </Button>
          </div>
        )}
        {!filtered && multiPage && (
          <p className="rounded-xl bg-surface-container-low px-4 py-3 font-body-md text-body-md text-on-surface-variant">
            {t('reorderTooMany', { max: TOUR_LIST_PAGE_SIZE })}
          </p>
        )}

        <div id="tours-results" aria-busy={list.fetching || undefined}>
          {list.error && !list.data ? (
            <ErrorPanel error={list.error} onRetry={() => void list.refetch()} variant="inline" />
          ) : !rows ? (
            <LoadingPanel variant="table" rows={6} card={false} />
          ) : rows.length === 0 ? (
            filtered ? (
              <EmptyPanel
                icon="filter_alt_off"
                title={t('noMatchesTitle')}
                body={t('noMatchesBody')}
                action={
                  <Button icon="filter_alt_off" onClick={() => filters.reset()}>
                    {t('clearFilters')}
                  </Button>
                }
              />
            ) : (
              <EmptyPanel
                icon="map"
                title={t('emptyTitle')}
                body={t('emptyBody')}
                action={
                  <Button href="/admin/tours/new" variant="primary" icon="add">
                    {t('newTour')}
                  </Button>
                }
              />
            )
          ) : (
            <div className={cn(list.fetching && 'opacity-70 transition-opacity')}>
              <div
                aria-hidden="true"
                className={cn(
                  GRID,
                  'hidden border-b border-surface-container-high px-2 pb-2 font-body-md text-[12px] font-semibold uppercase tracking-wide text-on-surface-variant md:grid',
                )}
              >
                <span />
                <span />
                <span>{t('columns.tour')}</span>
                <span className="hidden xl:block">{t('columns.duration')}</span>
                <span className="hidden xl:block">{t('columns.categories')}</span>
                <span>{t('columns.translations')}</span>
                <span>{t('columns.status')}</span>
                <span className="hidden xl:block">{t('columns.updated')}</span>
                <span className="text-right">{t('columns.actions')}</span>
              </div>
              {sortable ? (
                <SortableList
                  items={rows}
                  getKey={(tour) => tour.id}
                  label={t('listLabel')}
                  itemLabel={(tour) => tour.title}
                  onReorder={reorder}
                  className="gap-0"
                  renderItem={(tour, ctx) => renderRow(tour, ctx)}
                />
              ) : (
                <ul aria-label={t('listLabel')} className="flex flex-col">
                  {rows.map((tour) => (
                    <li key={tour.id}>{renderRow(tour, null)}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {list.data && list.data.meta.totalPages > 1 && (
          <AdminPagination
            page={list.data.meta.page}
            totalPages={list.data.meta.totalPages}
            total={list.data.meta.total}
            pageSize={list.data.meta.pageSize}
            onPageChange={(p) => filters.set({ page: String(p) })}
          />
        )}
      </div>
    </>
  )
}

function TourRow({
  tour,
  ctx,
  busy,
  onStatus,
  onDelete,
  date,
  relative,
}: {
  tour: AdminTourListItem
  ctx: SortableItemContext | null
  busy: boolean
  onStatus: (next: TourStatus) => void
  onDelete: () => void
  date: string
  relative: string
}) {
  const t = useTranslations('adminTours.list')
  const tl = useTranslations('admin.kit.locales')
  const published = tour.status === 'published'
  const editHref = `/admin/tours/${tour.id}`
  const duration = t('duration', { days: tour.durationDays, nights: tour.durationNights })
  const extraCategories = tour.categories.length - SHOWN_CATEGORIES

  const flags = (tour.isFeatured || tour.isMostPopular) && (
    <span className="flex flex-wrap items-center gap-1">
      {tour.isFeatured && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(201,162,75,0.22)] px-2 py-px font-body-md text-[11px] font-semibold text-on-surface">
          <Icon name="star" filled className="text-[12px]" />
          {t('featured')}
        </span>
      )}
      {tour.isMostPopular && (
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary-fixed px-2 py-px font-body-md text-[11px] font-semibold text-on-secondary-fixed-variant">
          <Icon name="local_fire_department" filled className="text-[12px]" />
          {t('mostPopular')}
        </span>
      )}
    </span>
  )

  const categories =
    tour.categories.length > 0 ? (
      <span className="flex flex-wrap gap-1">
        {tour.categories.slice(0, SHOWN_CATEGORIES).map((c) => (
          <span key={c} className="max-w-full truncate rounded-full bg-surface-container px-2 py-px font-body-md text-[12px] text-on-surface-variant">
            {c}
          </span>
        ))}
        {extraCategories > 0 && (
          <span
            className="rounded-full bg-surface-container px-2 py-px font-body-md text-[12px] text-on-surface-variant"
            title={tour.categories.slice(SHOWN_CATEGORIES).join(', ')}
          >
            {t('moreCategories', { count: extraCategories })}
          </span>
        )}
      </span>
    ) : (
      <span className="font-caption text-caption text-outline">{t('noCategories')}</span>
    )

  const translations = (
    <span className="flex items-center gap-1">
      {(['zh', 'de'] as const).map((locale) => {
        const done = tour.translations[locale]
        return (
          <span
            key={locale}
            title={done ? t('translated', { language: tl(`${locale}.name`) }) : t('notTranslated', { language: tl(`${locale}.name`) })}
            className={cn(
              'inline-flex items-center gap-0.5 rounded-md px-1.5 py-px font-body-md text-[12px] font-semibold',
              done ? 'bg-tertiary-fixed/70 text-on-tertiary-fixed-variant' : 'border border-dashed border-outline-variant text-outline',
            )}
          >
            {done && <Icon name="check" className="text-[12px]" />}
            {tl(`${locale}.short`)}
            <span className="sr-only">
              {done ? t('translated', { language: tl(`${locale}.name`) }) : t('notTranslated', { language: tl(`${locale}.name`) })}
            </span>
          </span>
        )
      })}
    </span>
  )

  const statusControl = (
    <span className="flex items-center gap-2">
      <Switch
        size="sm"
        checked={published}
        disabled={busy}
        onCheckedChange={(on) => onStatus(on ? 'published' : 'draft')}
        label={t('publishToggle', { title: tour.title })}
        hideLabel
      />
      <StatusBadge kind="content" status={tour.status} noIcon />
    </span>
  )

  const actions = (
    <span className="flex items-center justify-end gap-0.5">
      {published && (
        <a
          href={publicTourPath(tour.slug)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('viewOnSite', { title: tour.title })}
          title={t('viewOnSiteShort')}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Icon name="open_in_new" className="text-[18px]" />
        </a>
      )}
      <NextLink
        href={editHref}
        aria-label={t('edit', { title: tour.title })}
        title={t('editShort')}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Icon name="edit" className="text-[18px]" />
      </NextLink>
      <NextLink
        href={`/admin/tours/new?duplicate=${tour.id}`}
        aria-label={t('duplicate', { title: tour.title })}
        title={t('duplicateShort')}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Icon name="content_copy" className="text-[18px]" />
      </NextLink>
      <IconButton icon="delete" size="sm" variant="danger" label={t('delete', { title: tour.title })} onClick={onDelete} disabled={busy} />
    </span>
  )

  const thumb = (
    <span className="relative block aspect-[4/3] w-16 shrink-0 self-start overflow-hidden rounded-md bg-surface-container md:w-[4.5rem]">
      {tour.cover ? (
        <MediaThumb media={tour.cover} alt="" sizes="72px" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-outline">
          <Icon name="image" className="text-[20px]" />
        </span>
      )}
    </span>
  )

  const title = (
    <span className="flex min-w-0 flex-col gap-0.5">
      <NextLink
        href={editHref}
        className="line-clamp-2 rounded font-body-md text-body-md font-semibold leading-snug text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {tour.title}
      </NextLink>
      <span className="truncate font-mono text-[12px] text-on-surface-variant">/{tour.slug}</span>
    </span>
  )

  return (
    <div
      className={cn(
        'border-b border-surface-container px-2 py-3 transition-colors last:border-b-0 hover:bg-surface-container-low/60',
        GRID,
        ctx?.isDragging && 'bg-surface-container-low',
        busy && 'opacity-60',
      )}
    >
      {/* phones: card */}
      <div className="flex gap-3 md:hidden">
        {ctx && <span className="-ml-1 flex flex-col">{ctx.handle}</span>}
        {thumb}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {title}
          <span className="font-caption text-caption text-on-surface-variant">{duration}</span>
          {flags}
          {categories}
          <span className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {statusControl}
            {translations}
          </span>
          <span className="flex items-center justify-between gap-2">
            <span className="font-caption text-caption text-on-surface-variant">{t('updated', { date: relative })}</span>
            {actions}
          </span>
        </div>
      </div>

      {/* ≥ md: grid cells */}
      <span className="hidden md:flex">{ctx ? ctx.handle : <span className="w-7" />}</span>
      <span className="hidden md:block">{thumb}</span>
      <span className="hidden min-w-0 flex-col gap-1 md:flex">
        {title}
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 xl:hidden">
          <span className="font-caption text-caption text-on-surface-variant">{duration}</span>
          {flags}
        </span>
        <span className="hidden xl:block">{flags}</span>
        <span className="xl:hidden">{categories}</span>
      </span>
      <span className="hidden flex-col xl:flex">
        <span className="font-body-md text-[13px] text-on-surface">{t('days', { count: tour.durationDays })}</span>
        <span className="font-caption text-caption text-on-surface-variant">{t('nights', { count: tour.durationNights })}</span>
      </span>
      <span className="hidden min-w-0 xl:block">{categories}</span>
      <span className="hidden md:block">{translations}</span>
      <span className="hidden md:block">{statusControl}</span>
      <span className="hidden flex-col xl:flex" title={date}>
        <span className="font-body-md text-[13px] text-on-surface">{date}</span>
        <span className="font-caption text-caption text-on-surface-variant">{relative}</span>
      </span>
      <span className="hidden md:block">{actions}</span>
    </div>
  )
}
