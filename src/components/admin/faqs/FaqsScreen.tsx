'use client'

import { useMemo, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Button, IconButton } from '@/components/admin/kit/Button'
import { useConfirm } from '@/components/admin/kit/ConfirmDialog'
import { FilterBar, FilterTabs } from '@/components/admin/kit/FilterBar'
import { PageHeader } from '@/components/admin/kit/PageHeader'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '@/components/admin/kit/Panels'
import { SortableList } from '@/components/admin/kit/SortableList'
import { StatusBadge } from '@/components/admin/kit/StatusBadge'
import { Switch } from '@/components/admin/kit/form/Switch'
import { Icon } from '@/components/ui/Icon'
import { invalidateAdminQueries, useAdminErrorMessage, useAdminQuery } from '@/lib/admin/hooks'
import { toast } from '@/lib/admin/toast'
import { useDrawerParam, useUrlState } from '@/lib/admin/url-state'
import type { AdminFaq } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { toOrderItems, useOrderSaver } from '../destinations/lib/useOrderSaver'
import { TranslationChips } from '../destinations/ui/TranslationChips'
import { FAQ_SCOPES, faqsApi, isFaqScope, type FaqScope } from './api'
import { FaqDrawer, groupKeyOf, type FaqGroupTarget } from './FaqDrawer'

const DEFAULTS = { scope: 'general', q: '' }

const SCOPE_ICONS: Record<FaqScope, string> = {
  general: 'help',
  booking: 'event_available',
  corporate: 'business_center',
  reviews: 'reviews',
  travelGuide: 'menu_book',
  tour: 'map',
  destination: 'location_on',
}

interface FaqGroup {
  key: string
  title: string | null
  href: string | null
  target: FaqGroupTarget
  items: AdminFaq[]
}

const matches = (faq: AdminFaq, q: string) => {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  return [...Object.values(faq.question), ...Object.values(faq.answer)].some((v) => v.toLowerCase().includes(needle))
}

/** /admin/faqs — FAQs grouped by scope (and by tour / destination), drag-to-reorder within a group, publish toggle. */
export function FaqsScreen() {
  const t = useTranslations('adminContent.faqs')
  const tc = useTranslations('adminContent.common')
  const describe = useAdminErrorMessage()
  const confirm = useConfirm()
  const filters = useUrlState(DEFAULTS)
  const drawer = useDrawerParam('id')
  const scope: FaqScope = isFaqScope(filters.values.scope) ? filters.values.scope : 'general'
  const q = filters.values.q
  const searching = q.trim().length > 0

  const list = useAdminQuery(['faqs'], (signal) => faqsApi.list({}, signal))
  const all = list.data

  const counts = useMemo(() => {
    const out = Object.fromEntries(FAQ_SCOPES.map((s) => [s, 0])) as Record<FaqScope, number>
    for (const f of all ?? []) if (matches(f, q)) out[f.scope]++
    return out
  }, [all, q])

  const groups = useMemo<FaqGroup[]>(() => {
    const items = (all ?? []).filter((f) => f.scope === scope && matches(f, q)).sort((a, b) => a.order - b.order)
    if (scope !== 'tour' && scope !== 'destination') {
      return [{ key: scope, title: null, href: null, target: { scope }, items }]
    }
    const map = new Map<string, FaqGroup>()
    for (const f of items) {
      const key = groupKeyOf(f)
      let group = map.get(key)
      if (!group) {
        group =
          scope === 'tour'
            ? {
                key,
                title: f.tour?.title ?? t('unlinked'),
                href: f.tour ? `/admin/tours/${f.tour.id}` : null,
                target: { scope, tourId: f.tourId ?? undefined },
                items: [],
              }
            : {
                key,
                title: f.destination?.name ?? t('unlinked'),
                href: f.destination ? `/admin/destinations/${f.destination.id}` : null,
                target: { scope, destinationId: f.destinationId ?? undefined },
                items: [],
              }
        map.set(key, group)
      }
      group.items.push(f)
    }
    return [...map.values()].sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
  }, [all, scope, q, t])

  const order = useOrderSaver(faqsApi.reorder, {
    onSaved: () => toast.success(t('orderSaved')),
    onError: () => {
      toast.error(t('orderFailed'))
      void list.refetch()
    },
  })

  const reorderGroup = (next: AdminFaq[]) => {
    const orders = new Map(next.map((f, i) => [f.id, i]))
    list.setData((prev) => prev?.map((f) => (orders.has(f.id) ? { ...f, order: orders.get(f.id) ?? f.order } : f)))
    order.schedule(toOrderItems(next))
  }

  const patch = (id: string, change: Partial<AdminFaq>) =>
    list.setData((prev) => prev?.map((f) => (f.id === id ? { ...f, ...change } : f)))

  const toggleStatus = async (faq: AdminFaq, published: boolean) => {
    const next = published ? 'published' : 'draft'
    patch(faq.id, { status: next })
    try {
      await faqsApi.setStatus(faq.id, next)
      toast.success(published ? t('publishedToast') : t('unpublishedToast'))
    } catch (error) {
      patch(faq.id, { status: faq.status })
      toast.error(describe(error))
    }
  }

  const onDelete = async (faq: AdminFaq) => {
    const ok = await confirm({
      title: t('deleteTitle'),
      body: (
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-on-surface">“{faq.question.en}”</p>
          <p>{t('deleteBody')}</p>
        </div>
      ),
      confirmLabel: t('deleteConfirm'),
      tone: 'danger',
      icon: 'delete',
    })
    if (!ok) return
    try {
      await faqsApi.remove(faq.id)
      toast.success(t('deletedToast'))
      invalidateAdminQueries('faqs')
    } catch (error) {
      toast.error(describe(error))
    }
  }

  const newTarget: FaqGroupTarget = groups.length === 1 ? groups[0].target : { scope }

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
          label={t('scopeTabs')}
          controlsId="faqs-results"
          value={scope}
          onChange={(value) => filters.set({ scope: value })}
          tabs={FAQ_SCOPES.map((s) => ({ value: s, label: t(`scopes.${s}`), count: all ? counts[s] : undefined, icon: SCOPE_ICONS[s] }))}
        />
        <FilterBar state={filters} fields={[{ type: 'search', key: 'q', label: tc('search'), placeholder: t('searchPlaceholder') }]} />

        <div id="faqs-results" className="flex flex-col gap-4">
          {list.error && !all ? (
            <ErrorPanel error={list.error} onRetry={() => void list.refetch()} variant="inline" />
          ) : list.loading || !all ? (
            <LoadingPanel variant="table" rows={5} card={false} />
          ) : groups.every((g) => g.items.length === 0) ? (
            searching ? (
              <EmptyPanel
                icon="filter_alt_off"
                title={tc('noMatchesTitle')}
                body={tc('noMatchesBody')}
                action={
                  <Button icon="filter_alt_off" onClick={() => filters.set({ q: '' })}>
                    {tc('clearFilters')}
                  </Button>
                }
              />
            ) : (
              <EmptyPanel
                icon="quiz"
                title={t('emptyTitle', { scope: t(`scopes.${scope}`) })}
                body={t(`emptyBody.${scope}`)}
                action={
                  <Button variant="primary" icon="add" onClick={() => drawer.open('new')}>
                    {t('add')}
                  </Button>
                }
              />
            )
          ) : (
            <>
              <p className="flex items-center gap-1.5 font-caption text-caption text-on-surface-variant" aria-live="polite">
                <Icon name={searching ? 'info' : 'drag_indicator'} className="text-[16px]" />
                {order.saving ? tc('savingOrder') : searching ? t('reorderDisabled') : t(`reorderHint.${scope}`)}
              </p>
              {groups.map((group) => (
                <section key={group.key} className="flex flex-col gap-2">
                  {group.title !== null && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-container pb-1.5">
                      <h2 className="flex items-center gap-2 font-body-lg text-body-lg font-semibold text-primary">
                        <Icon name={SCOPE_ICONS[scope]} className="text-[18px] text-secondary" />
                        {group.title}
                        <span className="font-body-md text-body-md font-normal text-on-surface-variant">({group.items.length})</span>
                      </h2>
                      {group.href && (
                        <Button href={group.href} size="sm" variant="ghost" icon="edit_square" aria-label={t('openParent', { name: group.title })}>
                          {scope === 'tour' ? t('openTour') : t('openDestination')}
                        </Button>
                      )}
                    </div>
                  )}
                  <SortableList
                    items={group.items}
                    getKey={(f) => f.id}
                    label={group.title ? t('groupLabel', { name: group.title }) : t('listLabel', { scope: t(`scopes.${scope}`) })}
                    itemLabel={(f) => f.question.en ?? ''}
                    disabled={searching}
                    onReorder={reorderGroup}
                    className="gap-1.5"
                    renderItem={(faq, ctx) => (
                      <FaqRow
                        faq={faq}
                        handle={ctx.handle}
                        moveButtons={searching ? null : ctx.moveButtons}
                        active={drawer.id === faq.id}
                        onEdit={() => drawer.open(faq.id)}
                        onToggle={(published) => void toggleStatus(faq, published)}
                        onDelete={() => void onDelete(faq)}
                      />
                    )}
                  />
                </section>
              ))}
            </>
          )}
        </div>
      </div>

      <FaqDrawer id={drawer.id} faqs={all} defaultTarget={newTarget} onClose={drawer.close} />
    </>
  )
}

function FaqRow({
  faq,
  handle,
  moveButtons,
  active,
  onEdit,
  onToggle,
  onDelete,
}: {
  faq: AdminFaq
  handle: ReactNode
  moveButtons: ReactNode
  active: boolean
  onEdit: () => void
  onToggle: (published: boolean) => void
  onDelete: () => void
}) {
  const t = useTranslations('adminContent.faqs')
  const tc = useTranslations('adminContent.common')
  const question = faq.question.en ?? ''
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-xl border bg-surface-container-lowest p-2 transition-colors',
        active ? 'border-primary/50 bg-primary-fixed/20' : 'border-surface-container-high hover:border-outline-variant',
      )}
    >
      <div className="pt-0.5">{handle}</div>
      <div className="min-w-0 flex-1 py-1">
        <button
          type="button"
          onClick={onEdit}
          className="block max-w-full rounded text-left font-body-md text-body-md font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {question}
        </button>
        <p className="mt-0.5 line-clamp-2 font-body-md text-[13px] leading-5 text-on-surface-variant">{faq.answer.en}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 md:hidden">
          <TranslationChips translations={faq.translations} />
          <StatusBadge kind="content" status={faq.status} noIcon />
        </div>
      </div>
      <div className="hidden shrink-0 items-center gap-3 pt-1.5 md:flex">
        <TranslationChips translations={faq.translations} />
        <span className="flex w-[8.5rem] items-center gap-2">
          <Switch
            size="sm"
            checked={faq.status === 'published'}
            onCheckedChange={onToggle}
            label={t('publishedSwitch', { question })}
            hideLabel
          />
          <StatusBadge kind="content" status={faq.status} noIcon />
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5 sm:flex-row sm:items-center">
        <span className="md:hidden">
          <Switch
            size="sm"
            checked={faq.status === 'published'}
            onCheckedChange={onToggle}
            label={t('publishedSwitch', { question })}
            hideLabel
            className="h-8 items-center px-1.5"
          />
        </span>
        {moveButtons && <span className="hidden sm:inline-flex">{moveButtons}</span>}
        <IconButton icon="edit" size="sm" label={tc('editItem', { name: question })} onClick={onEdit} />
        <IconButton icon="delete" size="sm" variant="danger" label={tc('deleteItem', { name: question })} onClick={onDelete} />
      </div>
    </div>
  )
}
