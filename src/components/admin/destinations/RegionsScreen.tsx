'use client'

import { useTranslations } from 'next-intl'
import { Button, IconButton } from '@/components/admin/kit/Button'
import { useConfirm } from '@/components/admin/kit/ConfirmDialog'
import { MediaThumb } from '@/components/admin/kit/media/MediaThumb'
import { PageHeader } from '@/components/admin/kit/PageHeader'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '@/components/admin/kit/Panels'
import { SortableList } from '@/components/admin/kit/SortableList'
import { Icon } from '@/components/ui/Icon'
import { invalidateAdminQueries, useAdminMutation, useAdminQuery } from '@/lib/admin/hooks'
import { toast } from '@/lib/admin/toast'
import { useDrawerParam } from '@/lib/admin/url-state'
import type { AdminRegion } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { regionsApi } from './lib/api'
import { toOrderItems, useOrderSaver } from './lib/useOrderSaver'
import { RegionDrawer } from './RegionDrawer'
import { BestMonthsStrip } from './ui/BestMonthsEditor'
import { DestinationsSubnav } from './ui/DestinationsSubnav'
import { TranslationChips } from './ui/TranslationChips'

/** /admin/destinations/regions — region list with drag order, best-months strip and a create/edit drawer (`?id=`). */
export function RegionsScreen() {
  const t = useTranslations('adminContent.regions')
  const tc = useTranslations('adminContent.common')
  const tn = useTranslations('admin.nav')
  const confirm = useConfirm()
  const drawer = useDrawerParam('id')
  const list = useAdminQuery(['regions'], (signal) => regionsApi.list(signal))
  const regions = list.data

  const order = useOrderSaver(regionsApi.reorder, {
    onSaved: () => toast.success(t('orderSaved')),
    onError: () => {
      toast.error(t('orderFailed'))
      void list.refetch()
    },
  })

  const remove = useAdminMutation((region: AdminRegion) => regionsApi.remove(region.id), {
    successToast: (_d, region) => t('deletedToast', { name: region.name.en ?? region.slug }),
    invalidate: ['regions', 'destinations'],
  })

  const onDelete = async (region: AdminRegion) => {
    const name = region.name.en ?? region.slug
    const ok = await confirm({
      title: t('deleteTitle', { name }),
      body: t('deleteBody', { count: region.destinationCount }),
      confirmLabel: t('deleteConfirm'),
      tone: 'danger',
      icon: 'delete',
    })
    if (ok) await remove.mutate(region)
  }

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={[{ label: tn('destinations'), href: '/admin/destinations' }, { label: t('title') }]}
        actions={
          <Button variant="primary" icon="add" onClick={() => drawer.open('new')}>
            {t('new')}
          </Button>
        }
      />
      <DestinationsSubnav current="regions" />

      <div className="shadow-ambient flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 md:p-5">
        {regions && regions.length > 1 && (
          <p className="flex items-center gap-1.5 font-caption text-caption text-on-surface-variant" aria-live="polite">
            <Icon name="drag_indicator" className="text-[16px]" />
            {order.saving ? tc('savingOrder') : t('reorderHint')}
          </p>
        )}
        {list.error && !regions ? (
          <ErrorPanel error={list.error} onRetry={() => void list.refetch()} variant="inline" />
        ) : list.loading || !regions ? (
          <LoadingPanel variant="table" rows={6} card={false} />
        ) : regions.length === 0 ? (
          <EmptyPanel
            icon="public"
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
            items={regions}
            getKey={(r) => r.id}
            label={t('listLabel')}
            itemLabel={(r) => r.name.en ?? r.slug}
            onReorder={(next) => {
              const withOrder = next.map((r, i) => ({ ...r, order: i }))
              list.setData(withOrder)
              order.schedule(toOrderItems(withOrder))
              invalidateAdminQueries('region-options')
            }}
            className={cn('gap-1.5', list.fetching && 'opacity-70')}
            renderItem={(region, ctx) => {
              const name = region.name.en ?? region.slug
              return (
                <div
                  className={cn(
                    'grid grid-cols-[2rem_4rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-xl border bg-surface-container-lowest p-2 transition-colors xl:grid-cols-[2rem_5rem_minmax(0,1fr)_11rem_7rem_7.5rem_auto]',
                    drawer.id === region.id ? 'border-primary/50 bg-primary-fixed/20' : 'border-surface-container-high hover:border-outline-variant',
                  )}
                >
                  <div className="flex flex-col items-center">
                    {ctx.handle}
                    <span className="font-caption text-[11px] tabular-nums text-on-surface-variant">{ctx.index + 1}</span>
                  </div>
                  <div className="relative aspect-[4/3] w-16 overflow-hidden rounded-md bg-surface-container xl:w-20">
                    {region.image ? (
                      <MediaThumb media={region.image} alt="" sizes="80px" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-outline">
                        <Icon name="image" className="text-[20px]" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => drawer.open(region.id)}
                      className="flex max-w-full items-center gap-1.5 rounded text-left font-body-md text-body-md font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {region.icon && <Icon name={region.icon} className="shrink-0 text-[18px] text-secondary" />}
                      <span className="truncate">{name}</span>
                    </button>
                    <p className="truncate font-caption text-caption text-on-surface-variant">
                      {region.places?.en ?? region.description?.en ?? ''}
                    </p>
                    <p className="font-caption text-caption text-on-surface-variant xl:hidden">
                      {t('destinationCount', { count: region.destinationCount })}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 xl:order-last">
                    <span className="hidden sm:inline-flex xl:hidden">{ctx.moveButtons}</span>
                    <IconButton icon="edit" size="sm" label={tc('editItem', { name })} onClick={() => drawer.open(region.id)} />
                    <IconButton
                      icon="delete"
                      size="sm"
                      variant="danger"
                      label={tc('deleteItem', { name })}
                      onClick={() => void onDelete(region)}
                    />
                  </div>
                  <div className="col-span-4 flex flex-wrap items-center justify-between gap-2 border-t border-surface-container pt-2 xl:col-span-1 xl:contents">
                    <BestMonthsStrip value={region.bestMonths} />
                    <span className="hidden font-body-md text-body-md tabular-nums text-on-surface xl:block">
                      {t('destinationCount', { count: region.destinationCount })}
                    </span>
                    <TranslationChips translations={region.translations} />
                  </div>
                </div>
              )
            }}
          />
        )}
      </div>

      <RegionDrawer id={drawer.id} regions={regions} onClose={drawer.close} />
    </>
  )
}
