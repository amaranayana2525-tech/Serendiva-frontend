'use client'

import { useId, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { moveItem } from '@/components/admin/kit/SortableList'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

export interface SortableGridItemContext {
  index: number
  count: number
  isDragging: boolean
  /** Grip button: drag with the mouse, ←/→ (or ↑/↓, Home/End) with the keyboard. */
  handle: ReactNode
  moveBy: (delta: number) => void
}

export interface SortableGridProps<T> {
  items: readonly T[]
  getKey: (item: T) => string
  /** Human label per item for announcements and the handle's name. */
  itemLabel: (item: T, index: number) => string
  /** Accessible name of the grid. */
  label: string
  onReorder: (items: T[], move: { from: number; to: number }) => void
  renderItem: (item: T, ctx: SortableGridItemContext) => ReactNode
  disabled?: boolean
  className?: string
}

/**
 * Reorderable card grid: HTML5 drag & drop from the grip (drop position follows the pointer's horizontal half, so it
 * works across rows), keyboard moves on the grip with focus following the card, and live-region announcements.
 * (The kit's SortableList is a vertical list; this is its grid counterpart.)
 */
export function SortableGrid<T>({
  items,
  getKey,
  itemLabel,
  label,
  onReorder,
  renderItem,
  disabled = false,
  className,
}: SortableGridProps<T>) {
  const t = useTranslations('adminLibrary.sortable')
  const gridId = useId()
  const [armed, setArmed] = useState<string | null>(null)
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [drop, setDrop] = useState<{ index: number; after: boolean } | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const count = items.length

  const focusHandle = (key: string) => {
    requestAnimationFrame(() => {
      document
        .querySelectorAll<HTMLButtonElement>('[data-grid-handle]')
        .forEach((el) => el.dataset.gridHandle === `${gridId}:${key}` && el.focus())
    })
  }

  const move = (from: number, to: number, viaKeyboard = false) => {
    if (disabled || from === to || to < 0 || to >= count || from < 0) return
    const item = items[from]
    onReorder(moveItem(items, from, to), { from, to })
    setAnnouncement(t('moved', { item: itemLabel(item, from), position: to + 1, count }))
    if (viaKeyboard) focusHandle(getKey(item))
  }

  const onHandleKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const map: Record<string, number> = {
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      Home: 0,
      End: count - 1,
    }
    if (!(e.key in map)) return
    e.preventDefault()
    move(index, map[e.key], true)
  }

  const onDragOver = (e: DragEvent<HTMLLIElement>, index: number) => {
    if (!dragKey) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const rect = e.currentTarget.getBoundingClientRect()
    const after = e.clientX > rect.left + rect.width / 2
    if (!drop || drop.index !== index || drop.after !== after) setDrop({ index, after })
  }

  const endDrag = () => {
    setDragKey(null)
    setDrop(null)
    setArmed(null)
  }

  const onDrop = (e: DragEvent<HTMLLIElement>) => {
    if (!dragKey) return
    e.preventDefault()
    if (drop) {
      const from = items.findIndex((it) => getKey(it) === dragKey)
      let to = drop.after ? drop.index + 1 : drop.index
      if (from < to) to -= 1
      move(from, to)
    }
    endDrag()
  }

  return (
    <>
      <ul aria-label={label} className={cn('grid', className)}>
        {items.map((item, index) => {
          const key = getKey(item)
          const name = itemLabel(item, index)
          const isDragging = dragKey === key
          const before = dragKey !== null && drop?.index === index && !drop.after
          const after = dragKey !== null && drop?.index === index && drop.after
          const handle = (
            <button
              type="button"
              data-grid-handle={`${gridId}:${key}`}
              disabled={disabled}
              aria-label={t('handle', { item: name, position: index + 1, count })}
              title={t('handleHint')}
              onPointerDown={() => setArmed(key)}
              onPointerUp={() => setArmed(null)}
              onKeyDown={(e) => onHandleKey(e, index)}
              className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-md bg-surface-container-lowest/90 text-on-surface-variant shadow-sm backdrop-blur-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="drag_indicator" className="text-[20px]" />
            </button>
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
              onDragEnd={endDrag}
              onDragOver={(e) => onDragOver(e, index)}
              onDrop={onDrop}
              className={cn(
                'relative min-w-0',
                isDragging && 'opacity-40',
                before &&
                  'before:absolute before:-left-[7px] before:bottom-2 before:top-2 before:w-1 before:rounded-full before:bg-secondary',
                after &&
                  'after:absolute after:-right-[7px] after:bottom-2 after:top-2 after:w-1 after:rounded-full after:bg-secondary',
              )}
            >
              {renderItem(item, {
                index,
                count,
                isDragging,
                handle,
                moveBy: (delta) => move(index, index + delta, true),
              })}
            </li>
          )
        })}
      </ul>
      <p aria-live="polite" role="status" className="sr-only">
        {announcement}
      </p>
    </>
  )
}
