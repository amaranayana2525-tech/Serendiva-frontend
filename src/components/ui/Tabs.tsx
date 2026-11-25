'use client'

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from './Icon'

export interface TabItem {
  id: string
  label: ReactNode
  icon?: string
  /** Panel content. Omit when the tabs drive content rendered elsewhere (e.g. a filtered grid) and pass `controlsId`. */
  content?: ReactNode
  disabled?: boolean
}

export interface TabsProps {
  items: TabItem[]
  /** Controlled value. */
  value?: string
  defaultValue?: string
  onValueChange?: (id: string) => void
  /** Accessible name of the tab list. */
  label: string
  /** 'segmented' = /destinations region bar · 'pill' = chip row · 'underline' = sub-navigation style. */
  variant?: 'segmented' | 'pill' | 'underline'
  /** id of the external element the tabs control (when items have no `content`). */
  controlsId?: string
  className?: string
  listClassName?: string
  panelClassName?: string
}

const tabStyles = {
  segmented: {
    list: 'flex w-max min-w-full items-center gap-space-xs rounded-xl bg-surface-container-low p-1 md:min-w-max',
    tab: 'tap-target relative whitespace-nowrap rounded-lg px-space-md py-space-xs font-label-lg text-label-lg transition-all',
    active: 'bg-surface text-primary shadow-sm',
    idle: 'text-on-surface-variant hover:text-primary',
  },
  pill: {
    list: 'relative flex items-center gap-space-xs overflow-x-auto no-scrollbar pb-1 pt-0.5 coarse:-my-2 coarse:py-2',
    tab: 'tap-target relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-space-md py-1.5 font-label-md text-label-md uppercase tracking-wider transition-all',
    active: 'bg-primary text-on-primary shadow-sm',
    idle: 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
  },
  underline: {
    list: 'relative flex items-center gap-space-lg overflow-x-auto no-scrollbar border-b border-surface-container-high',
    tab: 'inline-flex items-center gap-1 whitespace-nowrap border-b-2 py-space-sm font-label-lg text-label-lg transition-colors coarse:min-h-11',
    active: 'border-secondary text-primary',
    idle: 'border-transparent text-on-surface-variant hover:text-primary',
  },
} as const

/** Accessible tabs (roving tabindex, ←/→/Home/End, automatic activation). */
export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  label,
  variant = 'pill',
  controlsId,
  className,
  listClassName,
  panelClassName,
}: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.id ?? '')
  const current = value ?? internal
  const baseId = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const styles = tabStyles[variant]
  const enabled = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0)

  const select = (id: string) => {
    if (value === undefined) setInternal(id)
    onValueChange?.(id)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const pos = enabled.indexOf(index)
    let next: number | undefined
    if (event.key === 'ArrowRight') next = enabled[(pos + 1) % enabled.length]
    else if (event.key === 'ArrowLeft') next = enabled[(pos - 1 + enabled.length) % enabled.length]
    else if (event.key === 'Home') next = enabled[0]
    else if (event.key === 'End') next = enabled[enabled.length - 1]
    if (next === undefined) return
    event.preventDefault()
    const item = items[next]
    if (!item) return
    refs.current[next]?.focus()
    select(item.id)
  }

  const hasPanels = items.some((it) => it.content !== undefined)

  const list = (
    <div role="tablist" aria-label={label} className={cn(styles.list, listClassName)}>
      {items.map((item, index) => {
        const selected = item.id === current
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[index] = el
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${item.id}`}
            aria-selected={selected}
            aria-controls={hasPanels ? `${baseId}-panel-${item.id}` : controlsId}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => select(item.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              styles.tab,
              selected ? styles.active : styles.idle,
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50',
            )}
          >
            {item.icon && <Icon name={item.icon} className="text-sm" />}
            {item.label}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className={className}>
      {variant === 'segmented' ? (
        <div className="no-scrollbar relative w-full overflow-x-auto pb-space-sm coarse:-mt-2 coarse:pt-2">{list}</div>
      ) : (
        list
      )}
      {hasPanels &&
        items.map((item) => (
          <div
            key={item.id}
            role="tabpanel"
            id={`${baseId}-panel-${item.id}`}
            aria-labelledby={`${baseId}-tab-${item.id}`}
            hidden={item.id !== current}
            tabIndex={0}
            className={cn('focus-visible:outline-none', panelClassName)}
          >
            {item.content}
          </div>
        ))}
    </div>
  )
}
