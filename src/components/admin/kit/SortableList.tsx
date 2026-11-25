'use client'

import { useId, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

/** Moves one element (returns a new array). */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list]
  if (from === to || from < 0 || from >= next.length) return next
  const [item] = next.splice(from, 1)
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item)
  return next
}

export interface SortableItemContext {
  index: number
  count: number
  isDragging: boolean
  /** Ready-made drag handle (grip button: drag with the mouse, ↑/↓ with the keyboard). Place it in your row. */
  handle: ReactNode
  /** Ready-made "move up / move down" buttons. */
  moveButtons: ReactNode
  moveUp: () => void
  moveDown: () => void
  moveTo: (index: number) => void
}

export interface SortableListProps<T> {
  items: readonly T[]
  /** Stable key per item (id/slug). */
  getKey: (item: T, index: number) => string
  /** New order + the move that produced it. */
  onReorder: (items: T[], move: { from: number; to: number }) => void
  renderItem: (item: T, ctx: SortableItemContext) => ReactNode
  /** Human label per item, used in screen-reader announcements ("Day 2 — Sigiriya"). */
  itemLabel: (item: T, index: number) => string
  /** Accessible name of the list. */
  label: string
  disabled?: boolean
  as?: 'ul' | 'ol'
  className?: string
  itemClassName?: string
}

/**
 * Reorderable list: HTML5 drag & drop from the grip handle, keyboard ↑/↓ on the handle, explicit move buttons, and
 * polite live-region announcements. Focus follows the moved item.
 */
export function SortableList<T>({
  items,
  getKey,
  onReorder,
  renderItem,
  itemLabel,
  label,
  disabled = false,
  as = 'ul',
  className,
  itemClassName,
}: SortableListProps<T>) {
  const t = useTranslations('admin.kit.sortable')
  const [armed, setArmed] = useState<string | null>(null)
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [drop, setDrop] = useState<{ index: number; after: boolean } | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const listId = useId()

  // After a keyboard move, keep focus on the moved item's handle (its DOM node was re-ordered by React).
  const focusHandle = (key: string) => {
    requestAnimationFrame(() => {
      const handles = document.querySelectorAll<HTMLButtonElement>('[data-sort-handle]')
      for (const handle of handles) if (handle.dataset.sortHandle === `${listId}:${key}`) handle.focus()
    })
  }

  const count = items.length
  const move = (from: number, to: number, viaKeyboard = false) => {
    if (disabled || to < 0 || to >= count || from === to) return
    const item = items[from]
    const key = getKey(item, from)
    onReorder(moveItem(items, from, to), { from, to })
    setAnnouncement(t('moved', { item: itemLabel(item, from), position: to + 1, count }))
    if (viaKeyboard) focusHandle(key)
  }

  const onHandleKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      move(index, index - 1, true)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      move(index, index + 1, true)
    } else if (e.key === 'Home') {
      e.preventDefault()
      move(index, 0, true)
    } else if (e.key === 'End') {
      e.preventDefault()
      move(index, count - 1, true)
    }
  }

  const onDragOver = (e: DragEvent<HTMLLIElement>, index: number) => {
    if (!dragKey) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const rect = e.currentTarget.getBoundingClientRect()
    const after = e.clientY > rect.top + rect.height / 2
    if (!drop || drop.index !== index || drop.after !== after) setDrop({ index, after })
  }

  const onDrop = (e: DragEvent<HTMLLIElement>) => {
    e.preventDefault()
    if (!dragKey || !drop) return
    const from = items.findIndex((it, i) => getKey(it, i) === dragKey)
    let to = drop.after ? drop.index + 1 : drop.index
    if (from < to) to -= 1
    move(from, to)
    setDragKey(null)
    setDrop(null)
    setArmed(null)
  }

  const List = as
  return (
    <>
      <List aria-label={label} className={cn('flex flex-col gap-2', className)}>
        {items.map((item, index) => {
          const key = getKey(item, index)
          const name = itemLabel(item, index)
          const isDragging = dragKey === key
          const showBefore = drop?.index === index && !drop.after && dragKey !== null
          const showAfter = drop?.index === index && drop.after && dragKey !== null
          const handle = (
            <button
              type="button"
              data-sort-handle={`${listId}:${key}`}
              disabled={disabled}
              aria-label={t('handle', { item: name, position: index + 1, count })}
              title={t('handleHint')}
              onPointerDown={() => setArmed(key)}
              onPointerUp={() => setArmed(null)}
              onKeyDown={(e) => onHandleKey(e, index)}
              className="flex h-8 w-7 shrink-0 cursor-grab items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="drag_indicator" className="text-[20px]" />
            </button>
          )
          const moveButtons = (
            <span className="inline-flex items-center">
              <button
                type="button"
                onClick={() => move(index, index - 1, true)}
                disabled={disabled || index === 0}
                aria-label={t('moveUp', { item: name })}
                title={t('moveUpShort')}
                className="flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30"
              >
                <Icon name="arrow_upward" className="text-[18px]" />
              </button>
              <button
                type="button"
                onClick={() => move(index, index + 1, true)}
                disabled={disabled || index === count - 1}
                aria-label={t('moveDown', { item: name })}
                title={t('moveDownShort')}
                className="flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30"
              >
                <Icon name="arrow_downward" className="text-[18px]" />
              </button>
            </span>
          )
          return (
            <li
              key={key}
              draggable={!disabled && armed === key}
              onDragStart={(e) => {
                setDragKey(key)
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', name)
                setAnnouncement(t('grabbed', { item: name }))
              }}
              onDragEnd={() => {
                setDragKey(null)
                setDrop(null)
                setArmed(null)
              }}
              onDragOver={(e) => onDragOver(e, index)}
              onDrop={onDrop}
              className={cn(
                'relative',
                isDragging && 'opacity-50',
                showBefore &&
                  'before:absolute before:-top-[5px] before:left-0 before:right-0 before:h-0.5 before:rounded-full before:bg-secondary',
                showAfter &&
                  'after:absolute after:-bottom-[5px] after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-secondary',
                itemClassName,
              )}
            >
              {renderItem(item, {
                index,
                count,
                isDragging,
                handle,
                moveButtons,
                moveUp: () => move(index, index - 1, true),
                moveDown: () => move(index, index + 1, true),
                moveTo: (to) => move(index, to, true),
              })}
            </li>
          )
        })}
      </List>
      <p aria-live="polite" role="status" className="sr-only">
        {announcement}
      </p>
    </>
  )
}
