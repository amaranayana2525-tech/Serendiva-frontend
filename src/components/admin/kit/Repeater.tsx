'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'
import { Button, IconButton } from './Button'
import { moveItem, SortableList } from './SortableList'

export interface RepeaterItemHelpers<T> {
  index: number
  count: number
  /** Merge a patch (objects) or replace via a function. */
  update: (patch: Partial<T> | ((item: T) => T)) => void
  remove: () => void
  duplicate: () => void
  moveUp: () => void
  moveDown: () => void
}

export interface RepeaterProps<T> {
  items: readonly T[]
  onChange: (items: T[]) => void
  /** Factory for "Add" (new items start expanded). */
  createItem: () => T
  /** Item editor. */
  renderItem: (item: T, helpers: RepeaterItemHelpers<T>) => ReactNode
  /** Header label per item (also used for announcements), e.g. `(day, i) => day.title.en || \`Day ${i + 1}\``. */
  itemLabel: (item: T, index: number) => string
  /** Accessible name of the list (and visible heading unless `hideLabel`). */
  label: string
  hideLabel?: boolean
  /** Stable key per item. Omit for value lists — the Repeater then tracks keys itself. */
  getKey?: (item: T, index: number) => string
  addLabel?: string
  /** Max/min number of items (add/remove buttons disable). */
  max?: number
  min?: number
  /** Drag-to-reorder + move buttons (default true). */
  sortable?: boolean
  /** Items can collapse to their header (default true). */
  collapsible?: boolean
  /** Existing items start collapsed. */
  defaultCollapsed?: boolean
  /** Clone for "Duplicate" (default structuredClone). Return null to hide the button. */
  duplicateItem?: ((item: T) => T) | null
  /** Shown when the list is empty. */
  emptyText?: ReactNode
  /** Extra element in each item header (badge, toggle). */
  headerExtra?: (item: T, index: number) => ReactNode
  error?: string | null
  className?: string
}

let keySeq = 0
const newKey = () => `r${++keySeq}`

/**
 * Editable list of structured items (itinerary days, key features, FAQs in a block…): add, remove, duplicate,
 * drag-to-reorder + keyboard move up/down (via SortableList), collapsible cards with a summary header.
 */
export function Repeater<T>({
  items,
  onChange,
  createItem,
  renderItem,
  itemLabel,
  label,
  hideLabel = false,
  getKey,
  addLabel,
  max,
  min = 0,
  sortable = true,
  collapsible = true,
  defaultCollapsed = false,
  duplicateItem,
  emptyText,
  headerExtra,
  error,
  className,
}: RepeaterProps<T>) {
  const t = useTranslations('admin.kit.repeater')
  // Internal keys for items without ids (kept in sync with our own operations; rebuilt on external length changes).
  const [keys, setKeys] = useState<string[]>(() => items.map(() => newKey()))
  const [collapsed, setCollapsed] = useState<Set<string>>(() => (defaultCollapsed ? new Set(keys) : new Set()))
  let currentKeys = keys
  if (!getKey && keys.length !== items.length) {
    currentKeys = items.map((_, i) => keys[i] ?? newKey())
    setKeys(currentKeys)
  }
  const keyOf = (item: T, index: number) => (getKey ? getKey(item, index) : currentKeys[index])

  const canAdd = max === undefined || items.length < max
  const canRemove = items.length > min
  const clone = duplicateItem === undefined ? (item: T) => structuredClone(item) : duplicateItem

  const commit = (nextItems: T[], nextKeys: string[]) => {
    if (!getKey) setKeys(nextKeys)
    onChange(nextItems)
  }
  const add = () => {
    if (!canAdd) return
    commit([...items, createItem()], [...currentKeys, newKey()])
  }
  const removeAt = (index: number) => {
    if (!canRemove) return
    commit(
      items.filter((_, i) => i !== index),
      currentKeys.filter((_, i) => i !== index),
    )
  }
  const duplicateAt = (index: number) => {
    if (!canAdd || !clone) return
    const nextItems = [...items]
    nextItems.splice(index + 1, 0, clone(items[index]))
    const nextKeys = [...currentKeys]
    nextKeys.splice(index + 1, 0, newKey())
    commit(nextItems, nextKeys)
  }
  const updateAt = (index: number, patch: Partial<T> | ((item: T) => T)) => {
    const nextItems = items.map((item, i) => {
      if (i !== index) return item
      if (typeof patch === 'function') return (patch as (item: T) => T)(item)
      return { ...item, ...patch }
    })
    onChange(nextItems)
  }
  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const keyed = items.map((item, index) => ({ item, key: keyOf(item, index) }))

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className={cn('flex items-center justify-between gap-2', hideLabel && 'sr-only')}>
        <p className="font-body-md text-[13px] font-semibold text-on-surface">
          {label}
          <span className="ml-1.5 font-normal text-on-surface-variant">({items.length})</span>
        </p>
        {collapsible && items.length > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="link" size="sm" onClick={() => setCollapsed(new Set())}>
              {t('expandAll')}
            </Button>
            <span aria-hidden="true" className="text-outline">
              ·
            </span>
            <Button variant="link" size="sm" onClick={() => setCollapsed(new Set(keyed.map((k) => k.key)))}>
              {t('collapseAll')}
            </Button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-outline-variant px-4 py-6 text-center font-body-md text-body-md text-on-surface-variant">
          {emptyText ?? t('empty')}
        </p>
      ) : (
        <SortableList
          items={keyed}
          getKey={(k) => k.key}
          label={label}
          disabled={!sortable}
          itemLabel={(k, i) => itemLabel(k.item, i)}
          onReorder={(next, { from, to }) =>
            commit(
              next.map((k) => k.item),
              moveItem(currentKeys, from, to),
            )
          }
          renderItem={({ item, key }, ctx) => {
            const isCollapsed = collapsible && collapsed.has(key)
            const name = itemLabel(item, ctx.index)
            const bodyId = `${key}-body`
            return (
              <div className="rounded-xl border border-surface-container-high bg-surface-container-lowest">
                <div className="flex items-center gap-1 px-2 py-1.5">
                  {sortable && ctx.handle}
                  {collapsible ? (
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      aria-expanded={!isCollapsed}
                      aria-controls={bodyId}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-surface-container px-1.5 font-body-md text-[12px] font-semibold tabular-nums text-on-surface-variant">
                        {ctx.index + 1}
                      </span>
                      <span className="truncate font-body-md text-body-md font-medium text-on-surface">{name}</span>
                      <Icon
                        name="expand_more"
                        className={cn('ml-auto shrink-0 text-[20px] text-on-surface-variant transition-transform', !isCollapsed && 'rotate-180')}
                      />
                    </button>
                  ) : (
                    <span className="flex min-w-0 flex-1 items-center gap-2 px-1.5">
                      <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-surface-container px-1.5 font-body-md text-[12px] font-semibold tabular-nums text-on-surface-variant">
                        {ctx.index + 1}
                      </span>
                      <span className="truncate font-body-md text-body-md font-medium text-on-surface">{name}</span>
                    </span>
                  )}
                  {headerExtra?.(item, ctx.index)}
                  {sortable && <span className="hidden sm:inline-flex">{ctx.moveButtons}</span>}
                  {clone && (
                    <IconButton
                      icon="content_copy"
                      size="sm"
                      label={t('duplicate', { item: name })}
                      onClick={() => duplicateAt(ctx.index)}
                      disabled={!canAdd}
                    />
                  )}
                  <IconButton
                    icon="delete"
                    size="sm"
                    variant="danger"
                    label={t('remove', { item: name })}
                    onClick={() => removeAt(ctx.index)}
                    disabled={!canRemove}
                  />
                </div>
                <div id={bodyId} hidden={isCollapsed} className="border-t border-surface-container px-3 pb-3 pt-3 md:px-4">
                  {!isCollapsed &&
                    renderItem(item, {
                      index: ctx.index,
                      count: ctx.count,
                      update: (patch) => updateAt(ctx.index, patch),
                      remove: () => removeAt(ctx.index),
                      duplicate: () => duplicateAt(ctx.index),
                      moveUp: ctx.moveUp,
                      moveDown: ctx.moveDown,
                    })}
                </div>
              </div>
            )
          }}
        />
      )}

      {error && (
        <p className="flex items-start gap-1 font-caption text-caption text-error">
          <Icon name="error" className="mt-px text-[14px]" />
          {error}
        </p>
      )}

      <div>
        <Button icon="add" size="sm" onClick={add} disabled={!canAdd}>
          {addLabel ?? t('add')}
        </Button>
        {max !== undefined && !canAdd && (
          <span className="ml-2 font-caption text-caption text-on-surface-variant">{t('maxReached', { max })}</span>
        )}
      </div>
    </div>
  )
}
