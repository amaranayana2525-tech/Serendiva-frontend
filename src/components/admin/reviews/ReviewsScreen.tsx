'use client'

import { useTranslations } from 'next-intl'
import { AdminPagination } from '@/components/admin/kit/AdminPagination'
import { Button, IconButton } from '@/components/admin/kit/Button'
import { DataTable, type DataTableColumn } from '@/components/admin/kit/DataTable'
import { FilterBar, FilterTabs } from '@/components/admin/kit/FilterBar'
import { MediaThumb } from '@/components/admin/kit/media/MediaThumb'
import { PageHeader } from '@/components/admin/kit/PageHeader'
import { EmptyPanel, ErrorPanel } from '@/components/admin/kit/Panels'
import { StatusBadge } from '@/components/admin/kit/StatusBadge'
import { Icon } from '@/components/ui/Icon'
import { invalidateAdminQueries, useAdminErrorMessage, useAdminQuery } from '@/lib/admin/hooks'
import { toast } from '@/lib/admin/toast'
import { useDrawerParam, useUrlState } from '@/lib/admin/url-state'
import type { AdminReview, AdminReviewList } from '@/lib/api/types'
import { countryName, flagEmoji } from '@/lib/format'
import { cn } from '@/lib/utils'
import { isReviewStatus, isTravellerType, reviewsApi, TRAVELLER_TYPES, type ReviewStatus } from './api'
import { RatingStars } from './Rating'
import { ReviewDrawer } from './ReviewDrawer'
import { useReviewFormat } from './useReviewFormat'

const DEFAULTS = { status: 'pending', q: '', travellerType: '', featured: '', page: '1' }
const PAGE_SIZE = 20

/** /admin/reviews — moderation queue: status tabs (pending first), search, filters, inline approve/reject/feature. */
export function ReviewsScreen() {
  const t = useTranslations('adminContent.reviews')
  const tc = useTranslations('adminContent.common')
  const f = useReviewFormat()
  const describe = useAdminErrorMessage()
  const filters = useUrlState(DEFAULTS)
  const drawer = useDrawerParam('id')
  const { status: rawStatus, q, travellerType: rawType, featured: rawFeatured, page: rawPage } = filters.values
  const status = isReviewStatus(rawStatus) ? rawStatus : undefined
  const tab = status ?? 'all'
  const travellerType = isTravellerType(rawType) ? rawType : undefined
  const featured = rawFeatured === 'true' ? ('true' as const) : undefined
  const page = Math.max(1, Number.parseInt(rawPage, 10) || 1)
  const query = { status, q, travellerType, featured, page, pageSize: PAGE_SIZE }

  const list = useAdminQuery(['reviews', query], (signal) => reviewsApi.list(query, signal))
  const counts = list.data?.counts
  const total = counts ? counts.pending + counts.approved + counts.rejected : undefined

  const patchRow = (id: string, patch: Partial<AdminReview>) =>
    list.setData((prev: AdminReviewList | undefined) =>
      prev ? { ...prev, items: prev.items.map((r) => (r.id === id ? { ...r, ...patch } : r)) } : prev,
    )

  const setStatus = async (review: AdminReview, next: ReviewStatus, undo = false) => {
    const previous = review.status
    patchRow(review.id, { status: next })
    try {
      await reviewsApi.setStatus(review.id, next)
      invalidateAdminQueries(['reviews', 'review', 'stats', 'dashboard'])
      if (undo) {
        toast.info(t('statusRestored', { name: review.guestName }))
        return
      }
      toast.success(t(`statusToast.${next}`, { name: review.guestName }), undefined, {
        duration: 8000,
        action: { label: t('undo'), onClick: () => void setStatus({ ...review, status: next }, previous, true) },
      })
    } catch (error) {
      patchRow(review.id, { status: previous })
      toast.error(describe(error))
    }
  }

  const setFeatured = async (review: AdminReview) => {
    const next = !review.isFeatured
    patchRow(review.id, { isFeatured: next })
    try {
      await reviewsApi.setFeatured(review.id, next)
      invalidateAdminQueries(['reviews', 'review'])
      toast.success(next ? t('featuredToast', { name: review.guestName }) : t('unfeaturedToast', { name: review.guestName }))
    } catch (error) {
      patchRow(review.id, { isFeatured: !next })
      toast.error(describe(error))
    }
  }

  const moderation = (row: AdminReview, labels: 'responsive' | 'always' = 'responsive') => (
    <ModerationActions review={row} labels={labels} onStatus={(s) => void setStatus(row, s)} />
  )
  const featureToggle = (row: AdminReview) => (
    <IconButton
      icon="star"
      filled={row.isFeatured}
      size="sm"
      aria-pressed={row.isFeatured}
      label={row.isFeatured ? t('unfeature', { name: row.guestName }) : t('feature', { name: row.guestName })}
      onClick={() => void setFeatured(row)}
      className={cn(row.isFeatured ? 'text-secondary hover:text-secondary' : 'text-outline')}
    />
  )

  const columns: DataTableColumn<AdminReview>[] = [
    {
      key: 'guest',
      header: t('columns.guest'),
      primary: true,
      className: 'min-w-[11rem]',
      cell: (row) => <GuestCell review={row} />,
    },
    {
      key: 'review',
      header: t('columns.review'),
      className: 'min-w-[14rem]',
      cell: (row) => (
        <span className="flex max-w-[24rem] flex-col gap-0.5">
          <RatingStars value={row.rating} />
          {row.title && <span className="font-semibold text-on-surface">{row.title}</span>}
          <span className="line-clamp-2 text-on-surface-variant">{row.text}</span>
          {row.tour && (
            <span className="inline-flex items-center gap-1 font-caption text-caption text-primary">
              <Icon name="map" className="text-[14px]" />
              {row.tour.title}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'source',
      header: t('columns.source'),
      hideBelow: 'xl',
      cell: (row) => (
        <span className="flex flex-col whitespace-nowrap">
          <span>{t(`sources.${row.source}`)}</span>
          <span className="font-caption text-caption text-on-surface-variant">{f.travelMonth(row.travelDate) || '—'}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: t('columns.status'),
      mobile: 'badge',
      className: 'w-[1%]',
      cell: (row) => (
        <span className="flex flex-col items-start gap-2">
          <StatusBadge kind="review" status={row.status} />
          <span className="flex items-center gap-1">
            {featureToggle(row)}
            {moderation(row)}
          </span>
        </span>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button variant="primary" icon="add" onClick={() => drawer.open('new')}>
            {t('add')}
          </Button>
        }
      />
      <div className="shadow-ambient flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 md:p-5">
        <FilterTabs
          label={t('statusTabs')}
          controlsId="reviews-results"
          value={tab}
          onChange={(value) => filters.set({ status: value })}
          tabs={[
            { value: 'pending', label: t('tabs.pending'), count: counts?.pending, icon: 'hourglass_top' },
            { value: 'approved', label: t('tabs.approved'), count: counts?.approved },
            { value: 'rejected', label: t('tabs.rejected'), count: counts?.rejected },
            { value: 'all', label: t('tabs.all'), count: total },
          ]}
        />
        <FilterBar
          state={filters}
          fields={[
            { type: 'search', key: 'q', label: tc('search'), placeholder: t('searchPlaceholder') },
            {
              type: 'select',
              key: 'travellerType',
              label: t('filters.travellerType'),
              allLabel: t('filters.allTravellers'),
              options: TRAVELLER_TYPES.map((v) => ({ value: v, label: t(`travellerTypes.${v}`) })),
            },
            {
              type: 'select',
              key: 'featured',
              label: t('filters.featured'),
              allLabel: t('filters.anyFeatured'),
              options: [{ value: 'true', label: t('filters.featuredOnly') }],
            },
          ]}
        />

        {list.error && !list.data ? (
          <ErrorPanel error={list.error} onRetry={() => void list.refetch()} variant="inline" />
        ) : (
          <DataTable
            id="reviews-results"
            caption={t('tableCaption')}
            columns={columns}
            rows={list.data?.items}
            loading={list.loading}
            fetching={list.fetching}
            getRowId={(row) => row.id}
            onRowClick={(row) => drawer.open(row.id)}
            rowLabel={(row) => t('openRow', { name: row.guestName })}
            activeRowId={drawer.id}
            renderCard={(row) => (
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <GuestCell review={row} />
                  <StatusBadge kind="review" status={row.status} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <RatingStars value={row.rating} />
                  <span className="font-caption text-caption text-on-surface-variant">
                    {t(`sources.${row.source}`)}
                    {row.travelDate ? ` · ${f.travelMonth(row.travelDate)}` : ''}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 font-body-md text-body-md">
                  {row.title && <span className="font-semibold text-on-surface">{row.title}</span>}
                  <span className="line-clamp-3 text-on-surface-variant">{row.text}</span>
                  {row.tour && <span className="font-caption text-caption text-primary">{row.tour.title}</span>}
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-surface-container pt-2" data-row-ignore="">
                  {featureToggle(row)}
                  {moderation(row, 'always')}
                </div>
              </div>
            )}
            empty={
              filters.isDefault(['q', 'travellerType', 'featured']) ? (
                <EmptyPanel
                  icon={tab === 'pending' ? 'task_alt' : 'reviews'}
                  title={tab === 'pending' ? t('emptyPendingTitle') : t('emptyTitle')}
                  body={tab === 'pending' ? t('emptyPendingBody') : t('emptyBody')}
                />
              ) : (
                <EmptyPanel
                  icon="filter_alt_off"
                  title={tc('noMatchesTitle')}
                  body={tc('noMatchesBody')}
                  action={
                    <Button icon="filter_alt_off" onClick={() => filters.reset(['q', 'travellerType', 'featured'])}>
                      {tc('clearFilters')}
                    </Button>
                  }
                />
              )
            }
          />
        )}

        {list.data && list.data.meta.total > 0 && (
          <AdminPagination
            page={list.data.meta.page}
            totalPages={list.data.meta.totalPages}
            total={list.data.meta.total}
            pageSize={list.data.meta.pageSize}
            onPageChange={(p) => filters.set({ page: String(p) })}
          />
        )}
      </div>

      <ReviewDrawer id={drawer.id} onClose={drawer.close} />
    </>
  )
}

function GuestCell({ review }: { review: AdminReview }) {
  const t = useTranslations('adminContent.reviews')
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container font-body-md text-[13px] font-semibold text-primary">
        {review.photo ? <MediaThumb media={review.photo} alt="" sizes="36px" /> : initials(review.guestName)}
      </span>
      <span className="flex min-w-0 max-w-[12rem] flex-col">
        <span className="flex items-start gap-1.5 font-semibold text-primary">
          <span className="min-w-0 break-words">{review.guestName}</span>
          {review.isFeatured && <Icon name="star" filled className="text-[14px] text-secondary" label={t('featuredBadge')} />}
        </span>
        <span className="truncate font-caption text-caption text-on-surface-variant">
          <span aria-hidden="true">{flagEmoji(review.country)} </span>
          {countryName(review.country, 'en')}
          {review.location ? ` · ${review.location}` : ''}
        </span>
      </span>
    </span>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

/** Approve / reject (pending) or switch / return to pending (moderated) — at most two buttons. */
function ModerationActions({
  review,
  labels,
  onStatus,
}: {
  review: AdminReview
  /** 'responsive' = icon-only below xl (dense table), 'always' = text everywhere (phone cards). */
  labels: 'responsive' | 'always'
  onStatus: (status: ReviewStatus) => void
}) {
  const t = useTranslations('adminContent.reviews')
  const name = review.guestName
  const text = labels === 'always' ? undefined : 'hidden xl:inline'
  return (
    <span className="inline-flex items-center justify-end gap-1">
      {review.status !== 'approved' && (
        <Button
          size="sm"
          variant={review.status === 'pending' ? 'primary' : 'secondary'}
          icon="check"
          onClick={() => onStatus('approved')}
          aria-label={t('approveLabel', { name })}
          title={t('approveLabel', { name })}
        >
          <span className={text}>{t('approve')}</span>
        </Button>
      )}
      {review.status !== 'rejected' && (
        <Button
          size="sm"
          variant="dangerGhost"
          icon="block"
          onClick={() => onStatus('rejected')}
          aria-label={t('rejectLabel', { name })}
          title={t('rejectLabel', { name })}
        >
          <span className={text}>{t('reject')}</span>
        </Button>
      )}
      {review.status !== 'pending' && (
        <IconButton icon="undo" size="sm" label={t('toPendingLabel', { name })} onClick={() => onStatus('pending')} />
      )}
    </span>
  )
}
