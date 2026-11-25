'use client'

import { useCallback, useSyncExternalStore, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'serendiva:mindful-checklist'
const CHANGE_EVENT = 'serendiva:mindful-checklist-change'

const item = <G extends 'road' | 'nature', I extends string>(group: G, id: I) =>
  ({ id, title: `${group}.items.${id}.title`, body: `${group}.items.${id}.body` }) as const

const GROUPS = [
  {
    key: 'road',
    icon: 'directions_car',
    tone: 'bg-secondary-fixed text-on-secondary-fixed',
    items: [item('road', 'tote'), item('road', 'plastics'), item('road', 'claypot'), item('road', 'greetings')],
  },
  {
    key: 'nature',
    icon: 'nature_people',
    tone: 'bg-tertiary-fixed text-on-tertiary-fixed',
    items: [item('nature', 'perimeter'), item('nature', 'linen'), item('nature', 'craftsmen'), item('nature', 'coral')],
  },
] as const

const TOTAL = GROUPS.reduce((sum, g) => sum + g.items.length, 0)

// ---------------------------------------------------------------------------------- tiny localStorage-backed store
let memory = '[]'

function read(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? '[]'
  } catch {
    return memory
  }
}

function write(ids: string[]) {
  const value = JSON.stringify(ids)
  memory = value
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Private mode / storage disabled: keep the in-memory copy.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(CHANGE_EVENT, callback)
  }
}

function parse(snapshot: string): string[] {
  try {
    const value: unknown = JSON.parse(snapshot)
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

const em = (chunks: ReactNode) => <em className="italic">{chunks}</em>

/** Interactive "Traveler's Mindful Checklist": real checkboxes, progress, remembered on this device. */
export function MindfulChecklist() {
  const t = useTranslations('responsible.checklist')
  const snapshot = useSyncExternalStore(subscribe, read, () => '[]')
  const checked = parse(snapshot)
  const done = checked.length

  const toggle = useCallback((id: string) => {
    const current = parse(read())
    write(current.includes(id) ? current.filter((x) => x !== id) : [...current, id])
  }, [])

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-space-lg">
      <div className="grid grid-cols-1 gap-gutter-lg lg:grid-cols-2">
        {GROUPS.map((group) => (
          <fieldset
            key={group.key}
            className="flex flex-col gap-space-lg rounded-xl bg-surface p-space-lg shadow-[0_16px_36px_-12px_rgba(43,43,43,0.05)] sm:p-space-xl"
          >
            <legend className="sr-only">{t(`${group.key}.title`)}</legend>
            <div aria-hidden="true" className="flex items-center gap-space-md pb-space-sm">
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', group.tone)}>
                <Icon name={group.icon} className="text-[20px]" />
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-primary">{t(`${group.key}.title`)}</h3>
                <p className="font-caption text-caption text-on-surface-variant">{t(`${group.key}.subtitle`)}</p>
              </div>
            </div>
            <div className="flex flex-col gap-space-md">
              {group.items.map((entry) => {
                const id = `${group.key}.${entry.id}`
                const inputId = `mindful-${group.key}-${entry.id}`
                return (
                  <label
                    key={entry.id}
                    htmlFor={inputId}
                    className="group flex cursor-pointer items-start gap-space-md rounded-lg p-space-sm transition-colors hover:bg-surface-container has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary"
                  >
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={checked.includes(id)}
                      onChange={() => toggle(id)}
                      className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded accent-primary focus:outline-none"
                    />
                    <span className="flex flex-col">
                      <span className="font-headline-sm text-base font-medium text-primary">{t(entry.title)}</span>
                      <span className="font-body-md text-body-md text-on-surface-variant">
                        {t.rich(entry.body, { em })}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-space-md">
        <p
          aria-live="polite"
          className="flex items-center gap-space-xs font-label-md text-label-md uppercase tracking-wider text-tertiary"
        >
          <Icon name="eco" filled className="text-[16px]" />
          {t('progress', { done, total: TOTAL })}
        </p>
        {done > 0 && (
          <button
            type="button"
            onClick={() => write([])}
            className="rounded-xl px-space-sm py-1 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {t('reset')}
          </button>
        )}
      </div>
    </div>
  )
}
