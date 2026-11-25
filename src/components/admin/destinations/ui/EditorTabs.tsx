'use client'

import { useRef, type KeyboardEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

export interface EditorTabItem<V extends string> {
  value: V
  label: string
  icon?: string
  /** Number of validation errors in this tab (red badge). */
  errors?: number
}

export interface EditorTabsProps<V extends string> {
  tabs: readonly EditorTabItem<V>[]
  value: V
  onChange: (value: V) => void
  /** Accessible name of the tab list. */
  label: string
  /** id prefix: tabs get `${idPrefix}-tab-${value}`, the panel `${idPrefix}-panel`. */
  idPrefix: string
  className?: string
}

/** Editor section tabs (WAI-ARIA tabs: arrow keys / Home / End, roving tabindex) with per-tab error badges. */
export function EditorTabs<V extends string>({ tabs, value, onChange, label, idPrefix, className }: EditorTabsProps<V>) {
  const t = useTranslations('adminContent.common')
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    else return
    e.preventDefault()
    onChange(tabs[next].value)
    refs.current[next]?.focus()
  }
  return (
    <div className={cn('relative min-w-0 overflow-x-auto no-scrollbar', className)}>
      <div role="tablist" aria-label={label} className="flex w-max items-center gap-1">
        {tabs.map((tab, index) => {
          const active = tab.value === value
          return (
            <button
              key={tab.value}
              ref={(el) => {
                refs.current[index] = el
              }}
              id={`${idPrefix}-tab-${tab.value}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`${idPrefix}-panel`}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(tab.value)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 font-body-md text-body-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                active
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-primary',
              )}
            >
              {tab.icon && <Icon name={tab.icon} className="text-[18px]" />}
              {tab.label}
              {tab.errors ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 font-body-md text-[11px] font-semibold text-on-error">
                  {tab.errors}
                  <span className="sr-only"> {t('errorsInTab', { count: tab.errors })}</span>
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
