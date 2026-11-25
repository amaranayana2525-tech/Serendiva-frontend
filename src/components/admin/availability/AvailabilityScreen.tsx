'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button, IconButton } from '@/components/admin/kit/Button'
import { Card } from '@/components/admin/kit/Card'
import { useConfirm } from '@/components/admin/kit/ConfirmDialog'
import { PageHeader } from '@/components/admin/kit/PageHeader'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '@/components/admin/kit/Panels'
import { Switch } from '@/components/admin/kit/form/Switch'
import { Icon } from '@/components/ui/Icon'
import { todayIso } from '@/lib/admin/format'
import { invalidateAdminQueries, useAdminErrorMessage, useAdminQuery } from '@/lib/admin/hooks'
import { toast } from '@/lib/admin/toast'
import type { AdminAvailabilityRange } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { availabilityApi, overlaps, rangeDays } from './api'
import { RangeCalendar } from './RangeCalendar'
import { RangeDialog, type RangeDialogState } from './RangeDialog'
import { useRangeFormat } from './useRangeFormat'

/** /admin/availability — month calendar of busy / available ranges + the list of upcoming ranges. */
export function AvailabilityScreen() {
  const t = useTranslations('adminContent.availability')
  const describe = useAdminErrorMessage()
  const confirm = useConfirm()
  const fmt = useRangeFormat()
  const list = useAdminQuery(['availability'], (signal) => availabilityApi.list(signal))
  const [today] = useState(todayIso)
  const [dialog, setDialog] = useState<RangeDialogState | null>(null)
  const [showPast, setShowPast] = useState(false)
  const [highlight, setHighlight] = useState<string | null>(null)

  const ranges = useMemo(
    () => [...(list.data ?? [])].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate)),
    [list.data],
  )
  const visible = showPast ? ranges : ranges.filter((r) => r.endDate >= today)
  const pastCount = ranges.length - ranges.filter((r) => r.endDate >= today).length

  const onDelete = async (range: AdminAvailabilityRange) => {
    const ok = await confirm({
      title: t('deleteTitle'),
      body: t('deleteBody', { range: fmt.range(range.startDate, range.endDate), type: t(`calendar.types.${range.type}`) }),
      confirmLabel: t('deleteConfirm'),
      tone: 'danger',
      icon: 'delete',
    })
    if (!ok) return
    try {
      await availabilityApi.remove(range.id)
      toast.success(t('deletedToast'))
      invalidateAdminQueries('availability')
    } catch (error) {
      toast.error(describe(error))
    }
  }

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button variant="primary" icon="add" onClick={() => setDialog({ mode: 'new', startDate: today })}>
            {t('add')}
          </Button>
        }
      />

      {list.error && !list.data ? (
        <ErrorPanel error={list.error} onRetry={() => void list.refetch()} />
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Card title={t('calendarTitle')} icon="calendar_month" description={t('calendarHint')} className="xl:sticky xl:top-20 xl:self-start">
            {list.data ? (
              <RangeCalendar
                ranges={ranges}
                today={today}
                highlightId={highlight}
                onDayActivate={(day, covering) => {
                  const target = covering.find((r) => r.type === 'busy') ?? covering[0]
                  setDialog(target ? { mode: 'edit', range: target } : { mode: 'new', startDate: day })
                }}
              />
            ) : (
              <LoadingPanel variant="cards" rows={2} card={false} />
            )}
          </Card>

          <Card
            title={showPast ? t('allTitle') : t('upcomingTitle')}
            icon="event_note"
            className="xl:self-start"
            actions={
              pastCount > 0 ? (
                <Switch size="sm" checked={showPast} onCheckedChange={setShowPast} label={t('showPast', { count: pastCount })} />
              ) : undefined
            }
          >
            {!list.data ? (
              <LoadingPanel variant="detail" rows={5} card={false} />
            ) : visible.length === 0 ? (
              <EmptyPanel
                icon="event_available"
                title={t('emptyTitle')}
                body={t('emptyBody')}
                action={
                  <Button icon="add" onClick={() => setDialog({ mode: 'new', startDate: today })}>
                    {t('add')}
                  </Button>
                }
                className="px-2 py-8"
              />
            ) : (
              <ul className={cn('flex flex-col divide-y divide-surface-container', list.fetching && 'opacity-70')} aria-label={t('listLabel')}>
                {visible.map((range) => {
                  const past = range.endDate < today
                  const current = range.startDate <= today && today <= range.endDate
                  const clashes = ranges.filter((r) => r.id !== range.id && overlaps(r, range)).length
                  const label = fmt.range(range.startDate, range.endDate)
                  return (
                    <li
                      key={range.id}
                      onMouseEnter={() => setHighlight(range.id)}
                      onMouseLeave={() => setHighlight(null)}
                      className={cn('flex items-start gap-2 py-2.5 first:pt-0 last:pb-0', past && 'opacity-60')}
                    >
                      <span
                        aria-hidden="true"
                        className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', range.type === 'busy' ? 'bg-secondary' : 'bg-tertiary-container')}
                      />
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => setDialog({ mode: 'edit', range })}
                          onFocus={() => setHighlight(range.id)}
                          onBlur={() => setHighlight(null)}
                          className="rounded text-left font-body-md text-body-md font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {label}
                        </button>
                        <p className="flex flex-wrap items-center gap-x-2 font-caption text-caption text-on-surface-variant">
                          <span className={cn('font-semibold', range.type === 'busy' ? 'text-secondary' : 'text-tertiary')}>
                            {t(`calendar.types.${range.type}`)}
                          </span>
                          <span>{t('days', { count: rangeDays(range.startDate, range.endDate) })}</span>
                          {current && (
                            <span className="rounded-full bg-primary px-1.5 font-semibold text-on-primary">{t('now')}</span>
                          )}
                          {clashes > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-secondary">
                              <Icon name="warning" className="text-[13px]" />
                              {t('overlapsCount', { count: clashes })}
                            </span>
                          )}
                        </p>
                        {range.note && (
                          <p className="mt-0.5 flex items-start gap-1 font-caption text-caption italic text-on-surface-variant">
                            <Icon name="lock" className="mt-px shrink-0 text-[12px] not-italic" />
                            <span className="line-clamp-2">{range.note}</span>
                          </p>
                        )}
                      </div>
                      <IconButton icon="edit" size="sm" label={t('editLabel', { range: label })} onClick={() => setDialog({ mode: 'edit', range })} />
                      <IconButton
                        icon="delete"
                        size="sm"
                        variant="danger"
                        label={t('deleteLabel', { range: label })}
                        onClick={() => void onDelete(range)}
                      />
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      )}

      <RangeDialog state={dialog} ranges={ranges} onClose={() => setDialog(null)} />
    </>
  )
}
