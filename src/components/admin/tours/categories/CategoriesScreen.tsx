'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button, IconButton } from '@/components/admin/kit/Button'
import { useConfirm } from '@/components/admin/kit/ConfirmDialog'
import { MediaThumb } from '@/components/admin/kit/media/MediaThumb'
import { PageHeader } from '@/components/admin/kit/PageHeader'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '@/components/admin/kit/Panels'
import { SortableList } from '@/components/admin/kit/SortableList'
import { Icon } from '@/components/ui/Icon'
import { toAdminApiError } from '@/lib/admin/errors'
import { invalidateAdminQueries, useAdminErrorMessage, useAdminQuery } from '@/lib/admin/hooks'
import { adminSession } from '@/lib/admin/session'
import { toast } from '@/lib/admin/toast'
import { useDrawerParam } from '@/lib/admin/url-state'
import type { AdminCategory } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { categoriesApi } from '../api'
import { ToursSectionNav } from '../ToursSectionNav'
import { useSequentialSave } from '../useSequentialSave'
import { CategoryDrawer } from './CategoryDrawer'

/** /admin/tours/categories — tour categories with drag-to-reorder, create/edit drawer (`?id=` / `?id=new`) and delete. */
export function CategoriesScreen() {
  const t = useTranslations('adminTours.categories')
  const tl = useTranslations('admin.kit.locales')
  const describe = useAdminErrorMessage()
  const confirm = useConfirm()
  const drawer = useDrawerParam('id')
  const list = useAdminQuery(['categories', 'admin'], (signal) => categoriesApi.list(signal))
  const [busy, setBusy] = useState<string | null>(null)

  const order = useSequentialSave<AdminCategory[]>({
    run: (items) => categoriesApi.reorder(items.map((c, index) => ({ id: c.id, order: index }))),
    onSuccess: () => {
      toast.success(t('orderSaved'))
      invalidateAdminQueries('categories')
    },
    onError: (error) => {
      const err = toAdminApiError(error)
      if (!(err.isUnauthorized && adminSession.expired)) toast.error(t('orderFailed'), describe(err))
      void list.refetch()
    },
  })

  const reorder = (items: AdminCategory[]) => {
    list.setData(items.map((c, index) => ({ ...c, order: index })))
    order.push(items)
  }

  const remove = async (category: AdminCategory) => {
    const name = category.name.en ?? category.slug
    const ok = await confirm({
      title: t('deleteTitle', { name }),
      body: category.tourCount > 0 ? t('deleteBodyLinked', { count: category.tourCount }) : t('deleteBody'),
      tone: 'danger',
      confirmLabel: t('deleteConfirm'),
    })
    if (!ok) return false
    setBusy(category.id)
    try {
      await categoriesApi.remove(category.id)
      toast.success(t('deleted', { name }))
      list.setData((prev) => prev?.filter((c) => c.id !== category.id))
      invalidateAdminQueries(['categories', 'tours'])
      return true
    } catch (error) {
      const err = toAdminApiError(error)
      if (!(err.isUnauthorized && adminSession.expired)) toast.error(t('deleteFailed'), describe(err))
      return false
    } finally {
      setBusy(null)
    }
  }

  const items = list.data
  const nextOrder = items?.reduce((max, c) => Math.max(max, c.order + 1), 0) ?? 0

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={[{ label: t('breadcrumbTours'), href: '/admin/tours' }, { label: t('title') }]}
        actions={
          <Button variant="primary" icon="add" onClick={() => drawer.open('new')}>
            {t('new')}
          </Button>
        }
      />
      <ToursSectionNav current="categories" className="mb-4" />

      <div className="shadow-ambient flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-body-md text-body-md text-on-surface-variant">
            {items ? t('count', { count: items.length }) : ' '}
          </p>
          <span className="font-caption text-caption text-on-surface-variant" role="status" aria-live="polite">
            {order.saving ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="progress_activity" className="animate-spin text-[14px] text-primary" />
                {t('savingOrder')}
              </span>
            ) : items && items.length > 1 ? (
              <span className="hidden items-center gap-1.5 md:inline-flex">
                <Icon name="drag_indicator" className="text-[15px]" />
                {t('dragHint')}
              </span>
            ) : null}
          </span>
        </div>

        {list.error && !items ? (
          <ErrorPanel error={list.error} onRetry={() => void list.refetch()} variant="inline" />
        ) : !items ? (
          <LoadingPanel variant="table" rows={6} card={false} />
        ) : items.length === 0 ? (
          <EmptyPanel
            icon="category"
            title={t('emptyTitle')}
            body={t('emptyBody')}
            action={
              <Button variant="primary" icon="add" onClick={() => drawer.open('new')}>
                {t('new')}
              </Button>
            }
          />
        ) : (
          <SortableList
            items={items}
            getKey={(c) => c.id}
            label={t('listLabel')}
            itemLabel={(c) => c.name.en ?? c.slug}
            onReorder={reorder}
            renderItem={(c, ctx) => {
              const name = c.name.en ?? c.slug
              return (
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-xl border border-surface-container-high bg-surface-container-lowest p-2 transition-colors md:gap-3',
                    drawer.id === c.id && 'border-primary/50 bg-primary-fixed/20',
                    busy === c.id && 'opacity-60',
                  )}
                >
                  {ctx.handle}
                  <span className="relative hidden aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-md bg-surface-container sm:block">
                    {c.image ? (
                      <MediaThumb media={c.image} alt="" sizes="64px" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-outline">
                        <Icon name="image" className="text-[18px]" />
                      </span>
                    )}
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container text-secondary">
                    <Icon name={c.icon || 'category'} className="text-[20px]" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <button
                      type="button"
                      onClick={() => drawer.open(c.id)}
                      className="truncate rounded text-left font-body-md text-body-md font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {name}
                    </button>
                    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 font-caption text-caption text-on-surface-variant">
                      <span className="truncate font-mono text-[12px]">/{c.slug}</span>
                      {c.shortName?.en && c.shortName.en !== name && <span className="truncate">· {c.shortName.en}</span>}
                    </span>
                  </span>
                  <span
                    className="hidden shrink-0 items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 font-body-md text-[12px] font-medium text-on-surface-variant sm:inline-flex"
                    title={t('tourCountTitle')}
                  >
                    <Icon name="map" className="text-[14px]" />
                    {t('tourCount', { count: c.tourCount })}
                  </span>
                  <span className="hidden items-center gap-1 lg:flex">
                    {(['zh', 'de'] as const).map((locale) => (
                      <span
                        key={locale}
                        className={cn(
                          'rounded-md px-1.5 py-px font-body-md text-[12px] font-semibold',
                          c.translations[locale]
                            ? 'bg-tertiary-fixed/70 text-on-tertiary-fixed-variant'
                            : 'border border-dashed border-outline-variant text-outline',
                        )}
                        title={c.translations[locale] ? t('translated', { language: tl(`${locale}.name`) }) : t('notTranslated', { language: tl(`${locale}.name`) })}
                      >
                        {tl(`${locale}.short`)}
                        <span className="sr-only">
                          {c.translations[locale] ? t('translated', { language: tl(`${locale}.name`) }) : t('notTranslated', { language: tl(`${locale}.name`) })}
                        </span>
                      </span>
                    ))}
                  </span>
                  <span className="hidden md:inline-flex">{ctx.moveButtons}</span>
                  <IconButton icon="edit" size="sm" label={t('edit', { name })} onClick={() => drawer.open(c.id)} />
                  <IconButton
                    icon="delete"
                    size="sm"
                    variant="danger"
                    label={t('delete', { name })}
                    onClick={() => void remove(c)}
                    disabled={busy === c.id}
                  />
                </div>
              )
            }}
          />
        )}
      </div>

      <CategoryDrawer
        id={drawer.id}
        categories={items}
        nextOrder={nextOrder}
        onClose={drawer.close}
        onSaved={(saved, created) => {
          list.setData((prev) => {
            if (!prev) return prev
            const next = created ? [...prev, saved] : prev.map((c) => (c.id === saved.id ? saved : c))
            return next.sort((a, b) => a.order - b.order)
          })
          invalidateAdminQueries(['categories', 'tours'])
        }}
        onDelete={remove}
      />
    </>
  )
}
