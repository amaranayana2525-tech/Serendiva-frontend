'use client'

import { useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { IconButton } from '@/components/admin/kit/Button'
import { controlClass } from '@/components/admin/kit/form/FieldShell'
import { MediaThumb } from '@/components/admin/kit/media/MediaThumb'
import { ErrorPanel, LoadingPanel } from '@/components/admin/kit/Panels'
import { SortableList } from '@/components/admin/kit/SortableList'
import { StatusBadge } from '@/components/admin/kit/StatusBadge'
import { Icon } from '@/components/ui/Icon'
import { useAdminQuery } from '@/lib/admin/hooks'
import type { AdminDestinationListItem } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { destinationOptionsApi } from '../api'
import { EditorSection, FieldError } from './fields'
import { errorUnder, LIMITS } from './model'
import type { EditorTabProps } from './types'

const normalise = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/** Destinations tab: searchable multi-select of destinations; the selected list keeps its order (drag / ↑ ↓). */
export function DestinationsTab({ form, errors, update }: EditorTabProps) {
  const t = useTranslations('adminTours.editor.destinations')
  const options = useAdminQuery(['destinations', 'options'], (signal) => destinationOptionsApi.list(signal))
  const [query, setQuery] = useState('')
  const searchId = useId()
  const all = options.data?.items ?? []
  const byId = new Map(all.map((d) => [d.id, d]))
  const selected = form.destinationIds
  const full = selected.length >= LIMITS.destinations
  const q = normalise(query.trim())
  const filtered = q
    ? all.filter((d) => normalise(`${d.name} ${d.slug} ${d.regionName ?? ''}`).includes(q))
    : all

  const toggle = (id: string) => {
    if (selected.includes(id)) update('destinationIds', selected.filter((x) => x !== id))
    else if (!full) update('destinationIds', [...selected, id])
  }

  if (options.error && !options.data) {
    return <ErrorPanel error={options.error} onRetry={() => void options.refetch()} />
  }
  if (!options.data) return <LoadingPanel variant="table" rows={6} />

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
      <EditorSection
        title={t('selected')}
        description={t('selectedHint')}
        aside={
          <span className="rounded-full bg-surface-container px-2.5 py-1 font-body-md text-[13px] font-semibold tabular-nums text-on-surface-variant">
            {selected.length} / {LIMITS.destinations}
          </span>
        }
      >
        <FieldError message={errorUnder(errors, 'destinationIds')} />
        {selected.length === 0 ? (
          <p className="rounded-xl border border-dashed border-outline-variant px-4 py-8 text-center font-body-md text-body-md text-on-surface-variant">
            {t('noneSelected')}
          </p>
        ) : (
          <SortableList
            items={selected}
            getKey={(id) => id}
            label={t('selected')}
            itemLabel={(id) => byId.get(id)?.name ?? t('unknown')}
            onReorder={(next) => update('destinationIds', next)}
            renderItem={(id, ctx) => {
              const d = byId.get(id)
              return (
                <div className="flex items-center gap-2 rounded-xl border border-surface-container-high bg-surface-container-lowest p-2">
                  {ctx.handle}
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-surface-container px-1.5 font-body-md text-[12px] font-semibold tabular-nums text-on-surface-variant">
                    {ctx.index + 1}
                  </span>
                  <DestinationLabel destination={d} fallback={t('unknown')} />
                  <span className="hidden sm:inline-flex">{ctx.moveButtons}</span>
                  <IconButton
                    icon="close"
                    size="sm"
                    variant="danger"
                    label={t('remove', { name: d?.name ?? t('unknown') })}
                    onClick={() => toggle(id)}
                  />
                </div>
              )
            }}
          />
        )}
      </EditorSection>

      <EditorSection title={t('all')} description={t('allHint')}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={searchId} className="font-body-md text-[13px] font-semibold text-on-surface">
            {t('search')}
          </label>
          <div className="relative">
            <Icon
              name="search"
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant"
            />
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className={cn(controlClass, 'pl-9')}
            />
          </div>
        </div>
        <p className="font-caption text-caption text-on-surface-variant" aria-live="polite">
          {full ? t('full', { max: LIMITS.destinations }) : t('results', { count: filtered.length })}
        </p>
        {filtered.length === 0 ? (
          <p className="px-2 py-6 text-center font-body-md text-body-md text-on-surface-variant">{t('noResults')}</p>
        ) : (
          <ul className="flex max-h-[32rem] flex-col gap-1 overflow-y-auto pr-1" aria-label={t('all')}>
            {filtered.map((d) => {
              const active = selected.includes(d.id)
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    disabled={!active && full}
                    onClick={() => toggle(d.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-xl border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50',
                      active
                        ? 'border-primary/50 bg-primary-fixed/25'
                        : 'border-transparent hover:border-outline-variant hover:bg-surface-container-low',
                    )}
                  >
                    <DestinationLabel destination={d} fallback={t('unknown')} />
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                        active ? 'bg-primary text-on-primary' : 'border border-outline-variant text-on-surface-variant',
                      )}
                    >
                      <Icon name={active ? 'check' : 'add'} className="text-[16px]" />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </EditorSection>
    </div>
  )
}

function DestinationLabel({ destination, fallback }: { destination: AdminDestinationListItem | undefined; fallback: string }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2.5">
      <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-surface-container">
        {destination?.cover && <MediaThumb media={destination.cover} alt="" sizes="56px" />}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-body-md text-body-md font-medium text-on-surface">{destination?.name ?? fallback}</span>
        <span className="flex min-w-0 items-center gap-1.5">
          {destination?.regionName && (
            <span className="truncate font-caption text-caption text-on-surface-variant">{destination.regionName}</span>
          )}
          {destination?.status === 'draft' && <StatusBadge kind="content" status="draft" noIcon />}
        </span>
      </span>
    </span>
  )
}
