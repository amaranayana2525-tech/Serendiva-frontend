'use client'

import NextLink from 'next/link'
import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { AdminPagination } from '@/components/admin/kit/AdminPagination'
import { Button, IconButton } from '@/components/admin/kit/Button'
import { useConfirm } from '@/components/admin/kit/ConfirmDialog'
import { FilterBar } from '@/components/admin/kit/FilterBar'
import { MediaThumb } from '@/components/admin/kit/media/MediaThumb'
import { PageHeader } from '@/components/admin/kit/PageHeader'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '@/components/admin/kit/Panels'
import { SortableList } from '@/components/admin/kit/SortableList'
import { StatusBadge } from '@/components/admin/kit/StatusBadge'
import { Switch } from '@/components/admin/kit/form/Switch'
import { Icon } from '@/components/ui/Icon'
import { invalidateAdminQueries, useAdminMutation, useAdminQuery } from '@/lib/admin/hooks'
import { toast } from '@/lib/admin/toast'
import { useUrlState } from '@/lib/admin/url-state'
import type { AdminDestinationList, AdminDestinationListItem } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { faqsApi } from '../faqs/api'
import { destinationPublicPath, destinationsApi, regionsApi, type ContentStatus } from './lib/api'
import { toOrderItems, useOrderSaver } from './lib/useOrderSaver'
import { DestinationsSubnav } from './ui/DestinationsSubnav'
import { IconLink } from './ui/IconLink'
import { TranslationChips } from './ui/TranslationChips'

const DEFAULTS = { q: '', regionId: '', status: '', page: '1' }
const PAGE_SIZE = 100

const isStatus = (v: string): v is ContentStatus => v === 'draft' || v === 'published'

/** /admin/destinations — searchable, filterable list with drag-to-reorder, publish toggle, view on site and delete. */
export function DestinationsScreen() {
  const t = useTranslations('adminContent.destinations')
  const tc = useTranslations('adminContent.common')
  const confirm = useConfirm()
  const filters = useUrlState(DEFAULTS)
  const { q, regionId, status: rawStatus, page: rawPage } = filters.values
  const status = isStatus(rawStatus) ? rawStatus : undefined
  const page = Math.max(1, Number.parseInt(rawPage, 10) || 1)
  const query = { q, regionId, status, page, pageSize: PAGE_SIZE }

  const list = useAdminQuery(['destinations', query], (signal) => destinationsApi.list(query, signal))
  const regions = useAdminQuery(['regions'], (signal) => regionsApi.list(signal))
  const regionOptions = (regions.data ?? []).map((r) => ({ value: r.id, label: r.name.en ?? r.slug }))

  const items = list.data?.items
  const filtered = !filters.isDefault(['q', 'regionId', 'status'])
  const multiPage = (list.data?.meta.totalPages ?? 1) > 1
  const canReorder = !filtered && !multiPage

  const order = useOrderSaver(destinationsApi.reorder, {
    onSaved: () => {
      toast.success(t('orderSaved'))
      invalidateAdminQueries((r) => r === 'destinations' || r === 'destination-options')
    },
    onError: () => {
      toast.error(t('orderFailed'))
      void list.refetch()
    },
  })

  const reorder = (next: AdminDestinationListItem[]) => {
    const offset = (page - 1) * PAGE_SIZE
    const withOrder = next.map((item, i) => ({ ...item, order: offset + i }))
    list.setData((prev) => (prev ? { ...prev, items: withOrder } : prev))
    order.schedule(toOrderItems(withOrder, offset))
  }

  const patchItem = (id: string, patch: Partial<AdminDestinationListItem>) =>
    list.setData((prev: AdminDestinationList | undefined) =>
      prev ? { ...prev, items: prev.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) } : prev,
    )

  const setStatus = useAdminMutation(
    (item: AdminDestinationListItem, next: ContentStatus) => destinationsApi.setStatus(item.id, next),
    {
      successToast: (_d, item, next) => (next === 'published' ? t('publishedToast', { name: item.name }) : t('unpublishedToast', { name: item.name })),
      onError: () => void list.refetch(),
      invalidate: ['destination-options'],
    },
  )

  const remove = useAdminMutation((item: AdminDestinationListItem) => destinationsApi.remove(item.id), {
    successToast: (_d, item) => t('deletedToast', { name: item.name }),
    invalidate: ['destinations', 'destination-options', 'faqs', 'regions'],
  })

  const onToggle = (item: AdminDestinationListItem, published: boolean) => {
    const next: ContentStatus = published ? 'published' : 'draft'
    patchItem(item.id, { status: next })
    void setStatus.mutate(item, next)
  }

  const onDelete = async (item: AdminDestinationListItem) => {
    let faqCount: number | null = null
    try {
      faqCount = (await faqsApi.list({ scope: 'destination', destinationId: item.id })).length
    } catch {
      faqCount = null
    }
    const ok = await confirm({
      title: t('deleteTitle', { name: item.name }),
      body: (
        <div className="flex flex-col gap-2">
          <p>{t('deleteBody')}</p>
          <p className="font-semibold text-secondary">
            {faqCount === null ? t('deleteFaqsUnknown') : t('deleteFaqs', { count: faqCount })}
          </p>
          {item.tourCount > 0 && <p>{t('deleteTours', { count: item.tourCount })}</p>}
        </div>
      ),
      confirmLabel: t('deleteConfirm'),
      tone: 'danger',
      icon: 'delete',
    })
    if (ok) await remove.mutate(item)
  }

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button href="/admin/destinations/new" variant="primary" icon="add">
            {t('new')}
          </Button>
        }
      />
      <DestinationsSubnav current="destinations" />

      <div className="shadow-ambient flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 md:p-5">
        <FilterBar
          state={filters}
          fields={[
            { type: 'search', key: 'q', label: tc('search'), placeholder: t('searchPlaceholder') },
            { type: 'select', key: 'regionId', label: t('filters.region'), options: regionOptions, allLabel: t('filters.allRegions') },
            {
              type: 'select',
              key: 'status',
              label: t('filters.status'),
              options: [
                { value: 'published', label: tc('status.published') },
                { value: 'draft', label: tc('status.draft') },
              ],
              allLabel: t('filters.allStatuses'),
            },
          ]}
        />

        {items && items.length > 0 && (
          <p className="flex items-center gap-1.5 font-caption text-caption text-on-surface-variant" aria-live="polite">
            <Icon name={canReorder ? 'drag_indicator' : 'info'} className="text-[16px]" />
            {order.saving ? tc('savingOrder') : canReorder ? t('reorderHint') : t('reorderDisabled')}
          </p>
        )}

        {list.error && !list.data ? (
          <ErrorPanel error={list.error} onRetry={() => void list.refetch()} variant="inline" />
        ) : list.loading || !items ? (
          <LoadingPanel variant="table" rows={6} card={false} />
        ) : items.length === 0 ? (
          filtered ? (
            <EmptyPanel
              icon="filter_alt_off"
              title={tc('noMatchesTitle')}
              body={tc('noMatchesBody')}
              action={
                <Button icon="filter_alt_off" onClick={() => filters.reset()}>
                  {tc('clearFilters')}
                </Button>
              }
            />
          ) : (
            <EmptyPanel
              icon="location_on"
              title={t('emptyTitle')}
              body={t('emptyBody')}
              action={
                <Button href="/admin/destinations/new" variant="primary" icon="add">
                  {t('new')}
                </Button>
              }
            />
          )
        ) : (
          <div className={cn(list.fetching && 'opacity-70 transition-opacity')}>
            <div
              aria-hidden="true"
              className="hidden grid-cols-[2rem_4.5rem_minmax(0,1fr)_11.5rem_7rem_9.5rem_7rem] items-center gap-3 border-b border-surface-container-high px-2 pb-2 font-body-md text-[12px] font-semibold uppercase tracking-wide text-on-surface-variant xl:grid"
            >
              <span />
              <span>{t('columns.cover')}</span>
              <span>{t('columns.name')}</span>
              <span>{t('columns.region')}</span>
              <span>{t('columns.translations')}</span>
              <span>{t('columns.status')}</span>
              <span className="text-right">{t('columns.actions')}</span>
            </div>
            <SortableList
              items={items}
              getKey={(item) => item.id}
              label={t('listLabel')}
              itemLabel={(item) => item.name}
              disabled={!canReorder}
              onReorder={reorder}
              className="mt-2 gap-1.5"
              renderItem={(item, ctx) => (
                <DestinationRow
                  item={item}
                  position={(page - 1) * PAGE_SIZE + ctx.index + 1}
                  handle={ctx.handle}
                  moveButtons={canReorder ? ctx.moveButtons : null}
                  pendingStatus={setStatus.pending}
                  onToggle={(published) => onToggle(item, published)}
                  onDelete={() => void onDelete(item)}
                />
              )}
            />
          </div>
        )}

        {list.data && multiPage && (
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

function DestinationRow({
  item,
  position,
  handle,
  moveButtons,
  pendingStatus,
  onToggle,
  onDelete,
}: {
  item: AdminDestinationListItem
  position: number
  handle: ReactNode
  moveButtons: ReactNode
  pendingStatus: boolean
  onToggle: (published: boolean) => void
  onDelete: () => void
}) {
  const t = useTranslations('adminContent.destinations')
  const tc = useTranslations('adminContent.common')
  const editHref = `/admin/destinations/${item.id}`
  const published = item.status === 'published'
  return (
    <div className="grid grid-cols-[2rem_4rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 rounded-xl border border-surface-container-high bg-surface-container-lowest p-2 transition-colors hover:border-outline-variant xl:grid-cols-[2rem_4.5rem_minmax(0,1fr)_11.5rem_7rem_9.5rem_7rem] xl:rounded-lg xl:border-transparent xl:hover:bg-surface-container-low">
      <div className="flex flex-col items-center">
        {handle}
        <span className="font-caption text-[11px] tabular-nums text-on-surface-variant" title={t('position')}>
          {position}
        </span>
      </div>
      <div className="relative aspect-[4/3] w-16 overflow-hidden rounded-md bg-surface-container xl:w-[4.5rem]">
        {item.cover ? (
          <MediaThumb media={item.cover} alt="" sizes="72px" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-outline">
            <Icon name="image" className="text-[20px]" />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <NextLink
          href={editHref}
          className="block truncate rounded font-body-md text-body-md font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {item.name}
        </NextLink>
        <p className="truncate font-mono text-[12px] text-on-surface-variant">/{item.slug}</p>
        <p className="font-caption text-caption text-on-surface-variant xl:hidden">
          {item.regionName ?? t('noRegion')} · {t('tourCount', { count: item.tourCount })}
        </p>
        {!published && <StatusBadge kind="content" status={item.status} noIcon className="mt-1 sm:hidden" />}
      </div>

      <div className="hidden min-w-0 xl:block">
        <p className="truncate font-body-md text-body-md text-on-surface">
          {item.regionName ?? <span className="text-outline">{t('noRegion')}</span>}
        </p>
        <p className="font-caption text-caption text-on-surface-variant">{t('tourCount', { count: item.tourCount })}</p>
      </div>

      {/* phones: second row spanning the card */}
      <div className="col-span-3 flex items-center justify-between gap-2 border-t border-surface-container pt-2 xl:col-span-1 xl:contents xl:border-0 xl:pt-0">
        <TranslationChips translations={item.translations} />
        <div className="flex items-center gap-2">
          <Switch
            size="sm"
            checked={published}
            disabled={pendingStatus}
            onCheckedChange={onToggle}
            label={t('publishedSwitch', { name: item.name })}
            hideLabel
          />
          <StatusBadge kind="content" status={item.status} noIcon className="hidden sm:inline-flex" />
        </div>
        <div className="flex items-center justify-end gap-0.5">
          {moveButtons && <span className="hidden sm:inline-flex xl:hidden">{moveButtons}</span>}
          <IconLink href={editHref} icon="edit" label={tc('editItem', { name: item.name })} />
          {published ? (
            <IconLink
              href={destinationPublicPath(item.slug)}
              icon="open_in_new"
              label={tc('viewOnSite', { name: item.name })}
              external
            />
          ) : (
            <span className="inline-flex h-8 w-8" aria-hidden="true" />
          )}
          <IconButton icon="delete" size="sm" variant="danger" label={tc('deleteItem', { name: item.name })} onClick={onDelete} />
        </div>
      </div>
    </div>
  )
}
