'use client'

import { useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { getServerToasts, getToasts, subscribeToasts, toast, type ToastApi, type ToastTone } from '@/lib/admin/toast'
import { cn } from '@/lib/utils'

const toneStyles: Record<ToastTone, { icon: string; className: string }> = {
  success: { icon: 'check_circle', className: 'text-tertiary-container' },
  error: { icon: 'error', className: 'text-error' },
  info: { icon: 'info', className: 'text-primary' },
  warning: { icon: 'warning', className: 'text-secondary' },
}

/** Toast stack (mount once, in the admin root layout). Errors are announced assertively, the rest politely. */
export function Toaster() {
  const t = useTranslations('admin.kit.toast')
  const items = useSyncExternalStore(subscribeToasts, getToasts, getServerToasts)
  return (
    <div
      aria-label={t('region')}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-3 sm:inset-x-auto sm:right-0 sm:items-end sm:p-5"
    >
      {items.map((item) => {
        const style = toneStyles[item.tone]
        const lines = Array.isArray(item.description)
          ? item.description
          : item.description
            ? [item.description]
            : []
        return (
          <div
            key={item.id}
            role={item.tone === 'error' ? 'alert' : 'status'}
            aria-live={item.tone === 'error' ? 'assertive' : 'polite'}
            className="shadow-ambient pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-surface-container bg-surface-container-lowest p-3.5 pr-2"
          >
            <Icon name={style.icon} filled className={cn('mt-0.5 text-[20px]', style.className)} />
            <div className="min-w-0 flex-1">
              <p className="font-body-md text-body-md font-semibold text-on-surface">{item.title}</p>
              {lines.length > 0 && (
                <ul className="mt-0.5 flex flex-col gap-0.5 font-caption text-caption text-on-surface-variant">
                  {lines.map((line, i) => (
                    <li key={i} className="break-words">
                      {line}
                    </li>
                  ))}
                </ul>
              )}
              {item.action && (
                <button
                  type="button"
                  onClick={() => {
                    item.action?.onClick()
                    toast.dismiss(item.id)
                  }}
                  className="mt-1.5 rounded font-body-md text-body-md font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {item.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => toast.dismiss(item.id)}
              aria-label={t('dismiss')}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

/** `const toast = useToast(); toast.success('Saved')` — also `error`, `info`, `warning`, `show({...})`, `dismiss(id)`. */
export function useToast(): ToastApi {
  return toast
}
