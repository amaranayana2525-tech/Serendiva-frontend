'use client'

import { useEffect, useEffectEvent, useId, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import type { UrlState, UrlStateValues } from '@/lib/admin/url-state'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { controlClass } from './form/FieldShell'
import type { SelectOption } from './form/SelectField'

export type FilterField<K extends string = string> =
  | { type: 'search'; key: K; label: string; placeholder?: string }
  | { type: 'select'; key: K; label: string; options: readonly SelectOption[]; allLabel?: string }
  | { type: 'text'; key: K; label: string; placeholder?: string; suggestions?: readonly string[] }
  | { type: 'dateRange'; fromKey: K; toKey: K; label: string }

export interface FilterBarProps<T extends UrlStateValues> {
  /** From `useUrlState(defaults)` — the bar reads and writes the URL through it. */
  state: UrlState<T>
  fields: readonly FilterField<Extract<keyof T, string>>[]
  /** Extra controls on the right (export button…). */
  actions?: ReactNode
  /** Search debounce in ms (default 350). */
  debounce?: number
  className?: string
}

const keysOf = <K extends string>(field: FilterField<K>): K[] =>
  field.type === 'dateRange' ? [field.fromKey, field.toKey] : [field.key]

/**
 * Filter row synced to URL search params: debounced search, selects, free text (with suggestions), date range and a
 * reset button (shown when any filter is active). Changing a filter resets `page`.
 */
export function FilterBar<T extends UrlStateValues>({
  state,
  fields,
  actions,
  debounce = 350,
  className,
}: FilterBarProps<T>) {
  const t = useTranslations('admin.kit.filters')
  const [expanded, setExpanded] = useState(false)
  const allKeys = fields.flatMap((f) => keysOf(f)) as (keyof T)[]
  const active = !state.isDefault(allKeys)
  // Phones: the first search stays visible, the other filters fold behind a "Filters (n)" toggle.
  const primarySearch = fields.find((f) => f.type === 'search')
  const secondary = fields.filter((f) => f !== primarySearch)
  const secondaryActive = secondary.filter((f) => !state.isDefault(keysOf(f) as (keyof T)[])).length
  const panelId = useId()
  const render = (field: FilterField<Extract<keyof T, string>>) => {
    switch (field.type) {
      case 'search':
        return <SearchFilter key={field.key} field={field} state={state} debounce={debounce} />
      case 'text':
        return <TextFilter key={field.key} field={field} state={state} debounce={debounce} />
      case 'select':
        return <SelectFilter key={field.key} field={field} state={state} />
      case 'dateRange':
        return <DateRangeFilter key={field.fromKey} field={field} state={state} />
    }
  }
  return (
    <div
      role="search"
      aria-label={t('label')}
      className={cn('flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-end', className)}
    >
      {primarySearch && (
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">{render(primarySearch)}</div>
          {secondary.length > 0 && (
            <Button
              className="lg:hidden"
              icon="tune"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setExpanded((v) => !v)}
            >
              {secondaryActive ? t('moreActive', { count: secondaryActive }) : t('more')}
            </Button>
          )}
        </div>
      )}
      <div
        id={panelId}
        className={cn(
          'flex-col gap-2 lg:flex lg:flex-row lg:flex-wrap lg:items-end',
          !primarySearch || expanded ? 'flex' : 'hidden',
        )}
      >
        {secondary.map(render)}
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
        {active && (
          <Button variant="ghost" icon="filter_alt_off" onClick={() => state.reset(allKeys)}>
            {t('reset')}
          </Button>
        )}
        {actions}
      </div>
    </div>
  )
}

/** Local text that pushes to the URL after a debounce and adopts external URL changes (reset, back button). */
function useDebouncedUrlText<T extends UrlStateValues>(state: UrlState<T>, key: keyof T, delay: number) {
  const urlValue: string = state.values[key] ?? ''
  const [text, setText] = useState<string>(urlValue)
  const [seenUrl, setSeenUrl] = useState<string>(urlValue)
  const [pushed, setPushed] = useState<string | null>(null)
  // Adjust local state when the URL changes from outside (not our own debounced push).
  if (urlValue !== seenUrl) {
    setSeenUrl(urlValue)
    if (urlValue !== pushed) setText(urlValue)
  }
  const commit = (value: string) => {
    if (value.trim() === urlValue.trim()) return
    setPushed(value)
    state.set({ [key]: value } as Partial<T>)
  }
  const push = useEffectEvent(commit)
  useEffect(() => {
    const id = window.setTimeout(() => push(text), delay)
    return () => window.clearTimeout(id)
  }, [text, delay])
  return { text, set: setText, flush: () => commit(text) }
}

function SearchFilter<T extends UrlStateValues>({
  field,
  state,
  debounce,
}: {
  field: Extract<FilterField, { type: 'search' }>
  state: UrlState<T>
  debounce: number
}) {
  const t = useTranslations('admin.kit.filters')
  const id = useId()
  const { text, set, flush } = useDebouncedUrlText(state, field.key, debounce)
  return (
    <div className="flex min-w-0 flex-col gap-1 lg:w-72">
      <label htmlFor={id} className="font-body-md text-[12px] font-semibold text-on-surface-variant">
        {field.label}
      </label>
      <div className="relative">
        <Icon
          name="search"
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant"
        />
        <input
          id={id}
          type="search"
          value={text}
          placeholder={field.placeholder ?? t('searchPlaceholder')}
          onChange={(e) => set(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') flush()
          }}
          className={cn(controlClass, 'pl-9')}
        />
      </div>
    </div>
  )
}

function TextFilter<T extends UrlStateValues>({
  field,
  state,
  debounce,
}: {
  field: Extract<FilterField, { type: 'text' }>
  state: UrlState<T>
  debounce: number
}) {
  const id = useId()
  const listId = `${id}-list`
  const { text, set, flush } = useDebouncedUrlText(state, field.key, debounce)
  return (
    <div className="flex min-w-0 flex-col gap-1 lg:w-44">
      <label htmlFor={id} className="font-body-md text-[12px] font-semibold text-on-surface-variant">
        {field.label}
      </label>
      <input
        id={id}
        value={text}
        list={field.suggestions?.length ? listId : undefined}
        placeholder={field.placeholder}
        onChange={(e) => set(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') flush()
        }}
        className={controlClass}
      />
      {field.suggestions?.length ? (
        <datalist id={listId}>
          {field.suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      ) : null}
    </div>
  )
}

function SelectFilter<T extends UrlStateValues>({
  field,
  state,
}: {
  field: Extract<FilterField, { type: 'select' }>
  state: UrlState<T>
}) {
  const t = useTranslations('admin.kit.filters')
  const id = useId()
  return (
    <div className="flex min-w-0 flex-col gap-1 lg:w-52">
      <label htmlFor={id} className="font-body-md text-[12px] font-semibold text-on-surface-variant">
        {field.label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={state.values[field.key] ?? ''}
          onChange={(e) => state.set({ [field.key]: e.target.value } as Partial<T>)}
          className={cn(controlClass, 'cursor-pointer appearance-none pr-9')}
        >
          <option value="">{field.allLabel ?? t('all')}</option>
          {field.options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon
          name="expand_more"
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
        />
      </div>
    </div>
  )
}

function DateRangeFilter<T extends UrlStateValues>({
  field,
  state,
}: {
  field: Extract<FilterField, { type: 'dateRange' }>
  state: UrlState<T>
}) {
  const t = useTranslations('admin.kit.filters')
  const id = useId()
  const from = state.values[field.fromKey] ?? ''
  const to = state.values[field.toKey] ?? ''
  return (
    <fieldset className="flex min-w-0 flex-col gap-1">
      <legend className="mb-1 font-body-md text-[12px] font-semibold text-on-surface-variant">{field.label}</legend>
      <div className="flex items-center gap-1.5">
        <label htmlFor={`${id}-from`} className="sr-only">
          {t('from')}
        </label>
        <input
          id={`${id}-from`}
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => state.set({ [field.fromKey]: e.target.value } as Partial<T>)}
          className={cn(controlClass, 'min-w-0 tabular-nums lg:w-40')}
        />
        <span aria-hidden="true" className="text-on-surface-variant">
          –
        </span>
        <label htmlFor={`${id}-to`} className="sr-only">
          {t('to')}
        </label>
        <input
          id={`${id}-to`}
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => state.set({ [field.toKey]: e.target.value } as Partial<T>)}
          className={cn(controlClass, 'min-w-0 tabular-nums lg:w-40')}
        />
      </div>
    </fieldset>
  )
}

export interface FilterTab<V extends string = string> {
  value: V
  label: string
  count?: number
  icon?: string
}

export interface FilterTabsProps<V extends string = string> {
  tabs: readonly FilterTab<V>[]
  value: V
  onChange: (value: V) => void
  /** Accessible name ("Status"). */
  label: string
  /** id of the region the tabs filter (table/list container). */
  controlsId?: string
  className?: string
}

/** Status tabs with counts above a list (All · New 3 · Replied · Closed). Buttons with aria-pressed; scrolls on phones. */
export function FilterTabs<V extends string = string>({ tabs, value, onChange, label, controlsId, className }: FilterTabsProps<V>) {
  return (
    <div className={cn('relative -mx-1 overflow-x-auto px-1 no-scrollbar', className)}>
      <div role="group" aria-label={label} className="flex w-max items-center gap-1 border-b border-surface-container-high">
        {tabs.map((tab) => {
          const active = tab.value === value
          return (
            <button
              key={tab.value}
              type="button"
              aria-pressed={active}
              aria-controls={controlsId}
              onClick={() => onChange(tab.value)}
              className={cn(
                '-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 font-body-md text-body-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                active ? 'border-secondary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary',
              )}
            >
              {tab.icon && <Icon name={tab.icon} className="text-[18px]" />}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'min-w-6 rounded-full px-1.5 py-px text-center text-[12px] font-semibold tabular-nums',
                    active ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
