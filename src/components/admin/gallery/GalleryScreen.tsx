'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { useConfirm } from '@/components/admin/kit/ConfirmDialog'
import { FilterTabs } from '@/components/admin/kit/FilterBar'
import { SelectField } from '@/components/admin/kit/form/SelectField'
import { PageHeader } from '@/components/admin/kit/PageHeader'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '@/components/admin/kit/Panels'
import { Icon } from '@/components/ui/Icon'
import { toAdminApiError } from '@/lib/admin/errors'
import { invalidateAdminQueries, useAdminErrorMessage, useAdminQuery } from '@/lib/admin/hooks'
import { toast } from '@/lib/admin/toast'
import { useDrawerParam, useUrlState } from '@/lib/admin/url-state'
import type { AdminGalleryItem } from '@/lib/api/types'
import { mediaApi } from '../media/mediaApi'
import { DeleteWithMediaBody } from './DeleteWithMediaBody'
import { GalleryAddDialog } from './GalleryAddDialog'
import { GalleryCard } from './GalleryCard'
import { GalleryItemDrawer } from './GalleryItemDrawer'
import { applyViewOrder, categoryList, galleryApi, galleryItemLabel } from './galleryApi'
import { SortableGrid } from './SortableGrid'
import { useGalleryCategoryLabel } from './useGalleryCategoryLabel'

const DEFAULTS = { category: '', status: '' }
const ORDER_SAVE_DELAY = 700

type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

/** /admin/gallery — category tabs, drag-to-reorder grid, visibility toggles, multi-upload, edit drawer (`?item=`). */
export function GalleryScreen() {
  const t = useTranslations('adminLibrary.gallery')
  const describe = useAdminErrorMessage()
  const confirm = useConfirm()
  const categoryLabel = useGalleryCategoryLabel()
  const filters = useUrlState(DEFAULTS)
  const drawer = useDrawerParam('item')
  const [addOpen, setAddOpen] = useState(false)
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set())
  const [orderState, setOrderState] = useState<SaveState>('idle')

  const list = useAdminQuery(['gallery'], (signal) => galleryApi.list(signal))
  const all = list.data ?? []
  const categories = categoryList(all)
  const { category, status } = filters.values
  const view = all.filter(
    (g) =>
      (!category || g.category === category) && (!status || g.status === (status === 'hidden' ? 'draft' : 'published')),
  )

  // ------------------------------------------------------------------ order (debounced PATCH /gallery/order)
  const pendingOrder = useRef(new Map<string, number>())
  const timer = useRef<number | null>(null)

  const flushOrder = async () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
    const changes = [...pendingOrder.current.entries()].map(([id, order]) => ({ id, order }))
    pendingOrder.current.clear()
    if (!changes.length) return
    setOrderState('saving')
    try {
      await galleryApi.reorder(changes)
      setOrderState('saved')
    } catch (error) {
      setOrderState('error')
      toast.error(t('orderFailed'), describe(error))
      void list.refetch()
    }
  }

  // Save a pending reorder when leaving the page.
  useEffect(() => {
    const pending = pendingOrder.current
    return () => {
      const changes = [...pending.entries()].map(([id, order]) => ({ id, order }))
      if (changes.length) void galleryApi.reorder(changes).catch(() => undefined)
    }
  }, [])

  const onReorder = (nextView: AdminGalleryItem[]) => {
    const next = applyViewOrder(all, nextView)
    const before = new Map(all.map((g) => [g.id, g.order]))
    for (const item of next) if (before.get(item.id) !== item.order) pendingOrder.current.set(item.id, item.order)
    list.setData(next)
    setOrderState('pending')
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void flushOrder(), ORDER_SAVE_DELAY)
  }

  // ------------------------------------------------------------------ status + delete
  const markBusy = (id: string, busy: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev)
      if (busy) next.add(id)
      else next.delete(id)
      return next
    })

  const setVisible = async (item: AdminGalleryItem, visible: boolean) => {
    const nextStatus = visible ? 'published' : 'draft'
    list.setData((prev) => prev?.map((g) => (g.id === item.id ? { ...g, status: nextStatus } : g)))
    markBusy(item.id, true)
    try {
      const saved = await galleryApi.setStatus(item.id, nextStatus)
      list.setData((prev) => prev?.map((g) => (g.id === saved.id ? saved : g)))
      toast.success(visible ? t('shown') : t('hiddenToast'), galleryItemLabel(saved) || undefined)
    } catch (error) {
      list.setData((prev) => prev?.map((g) => (g.id === item.id ? item : g)))
      toast.error(t('statusFailed'), describe(error))
    } finally {
      markBusy(item.id, false)
    }
  }

  const removeItem = async (item: AdminGalleryItem) => {
    const name = galleryItemLabel(item) || t('untitled')
    const choice = { deleteMedia: false }
    const ok = await confirm({
      title: t('deleteTitle'),
      body: (
        <DeleteWithMediaBody
          text={t('deleteBody', { name })}
          canDeleteMedia={Boolean(item.mediaId)}
          onChange={(v) => {
            choice.deleteMedia = v
          }}
        />
      ),
      confirmLabel: t('deleteConfirm'),
      tone: 'danger',
      icon: 'delete',
    })
    if (!ok) return
    markBusy(item.id, true)
    try {
      await galleryApi.remove(item.id)
      list.setData((prev) => prev?.filter((g) => g.id !== item.id))
      if (drawer.id === item.id) drawer.close()
      if (choice.deleteMedia && item.mediaId) {
        try {
          await mediaApi.remove(item.mediaId)
          toast.success(t('deletedWithMedia'), name)
        } catch (error) {
          const err = toAdminApiError(error)
          if (err.code === 'MEDIA_IN_USE') toast.info(t('deletedMediaKept'), err.message)
          else toast.warning(t('deletedMediaFailed'), describe(err))
        }
        invalidateAdminQueries('media')
      } else {
        toast.success(t('deleted'), name)
      }
    } catch (error) {
      toast.error(t('deleteFailed'), describe(error))
    } finally {
      markBusy(item.id, false)
      void list.refetch()
    }
  }

  // ------------------------------------------------------------------ render
  const counts = new Map<string, number>()
  for (const g of all) counts.set(g.category, (counts.get(g.category) ?? 0) + 1)
  const orderMessage =
    orderState === 'pending' || orderState === 'saving'
      ? t('orderSaving')
      : orderState === 'saved'
        ? t('orderSaved')
        : orderState === 'error'
          ? t('orderError')
          : t('orderHint')

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <>
            <Button href="/gallery" external icon="open_in_new" variant="ghost">
              {t('viewOnSite')}
            </Button>
            <Button icon="videocam" onClick={() => drawer.open('new')}>
              {t('addVideo')}
            </Button>
            <Button variant="primary" icon="add_photo_alternate" onClick={() => setAddOpen(true)}>
              {t('addPhotos')}
            </Button>
          </>
        }
      />

      <div className="shadow-ambient flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <FilterTabs
            label={t('categoryTabs')}
            controlsId="gallery-results"
            value={category}
            onChange={(value) => filters.set({ category: value })}
            className="min-w-0 lg:flex-1"
            tabs={[
              { value: '', label: t('allCategories'), count: list.data ? all.length : undefined },
              ...categories.map((slug) => ({
                value: slug,
                label: categoryLabel(slug),
                count: list.data ? (counts.get(slug) ?? 0) : undefined,
              })),
            ]}
          />
          <SelectField
            label={t('statusFilter')}
            value={status}
            onValueChange={(v) => filters.set({ status: v })}
            fieldClassName="lg:w-48"
            options={[
              { value: '', label: t('statusAll') },
              { value: 'visible', label: t('statusVisible') },
              { value: 'hidden', label: t('statusHidden') },
            ]}
          />
        </div>

        {list.data && view.length > 1 && (
          <p className="flex items-center gap-1.5 font-caption text-caption text-on-surface-variant" aria-live="polite">
            <Icon
              name={
                orderState === 'saving' || orderState === 'pending'
                  ? 'progress_activity'
                  : orderState === 'error'
                    ? 'error'
                    : 'drag_indicator'
              }
              className={
                orderState === 'saving' || orderState === 'pending'
                  ? 'animate-spin text-[16px] text-primary'
                  : 'text-[16px]'
              }
            />
            {orderMessage}
          </p>
        )}

        {list.error && !list.data ? (
          <ErrorPanel error={list.error} onRetry={() => void list.refetch()} variant="inline" />
        ) : list.loading || !list.data ? (
          <LoadingPanel variant="cards" rows={8} card={false} />
        ) : view.length === 0 ? (
          <EmptyPanel
            icon="photo_library"
            title={category || status ? t('emptyFilteredTitle') : t('emptyTitle')}
            body={category ? t('emptyCategoryBody', { category: categoryLabel(category) }) : t('emptyBody')}
            action={
              <Button variant="primary" icon="add_photo_alternate" onClick={() => setAddOpen(true)}>
                {t('addPhotos')}
              </Button>
            }
          />
        ) : (
          <div id="gallery-results">
            <SortableGrid
              items={view}
              getKey={(g) => g.id}
              label={category ? t('gridLabelCategory', { category: categoryLabel(category) }) : t('gridLabel')}
              itemLabel={(g) => galleryItemLabel(g) || t('untitled')}
              onReorder={onReorder}
              className="grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
              renderItem={(item, ctx) => (
                <GalleryCard
                  item={item}
                  ctx={ctx}
                  label={galleryItemLabel(item)}
                  categoryLabel={category ? undefined : categoryLabel(item.category)}
                  active={drawer.id === item.id}
                  busy={busyIds.has(item.id)}
                  onEdit={() => drawer.open(item.id)}
                  onDelete={() => void removeItem(item)}
                  onStatus={(v) => void setVisible(item, v)}
                />
              )}
            />
          </div>
        )}
      </div>

      <GalleryAddDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        categories={categories}
        defaultCategory={category || undefined}
        onAdded={() => void list.refetch()}
      />

      <GalleryItemDrawer
        id={drawer.id}
        items={all}
        categories={categories}
        defaultCategory={category || undefined}
        loading={list.loading}
        onClose={drawer.close}
        onSaved={(saved, created) => {
          list.setData((prev) =>
            prev ? (created ? [...prev, saved] : prev.map((g) => (g.id === saved.id ? saved : g))) : prev,
          )
          if (created) drawer.open(saved.id)
        }}
        onDelete={(item) => void removeItem(item)}
      />
    </>
  )
}
