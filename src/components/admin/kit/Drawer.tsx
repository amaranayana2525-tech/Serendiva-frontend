'use client'

import { useId, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'
import { useModalDialog } from './Modal'

export interface DrawerProps {
  open: boolean
  /** Esc, backdrop click and the close button call this (confirm unsaved changes there if needed). */
  onClose: () => void
  title: ReactNode
  /** Line under the title (reference, date…). */
  subtitle?: ReactNode
  /** Elements next to the title (status badge). */
  meta?: ReactNode
  /** Header buttons left of the close button. */
  actions?: ReactNode
  children?: ReactNode
  /** Sticky footer. */
  footer?: ReactNode
  /** Panel width on ≥ sm screens. Phones always get the full width. */
  size?: 'md' | 'lg' | 'xl'
  className?: string
}

const widths = { md: 'sm:max-w-md', lg: 'sm:max-w-xl', xl: 'sm:max-w-3xl' } as const

/**
 * Right-side panel on native <dialog>: focus trap, Esc, inert background, focus restored on close, page scroll locked.
 * Pair it with `useDrawerParam('id')` for URL-driven open state (`?id=` deep links).
 */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  meta,
  actions,
  children,
  footer,
  size = 'lg',
  className,
}: DrawerProps) {
  const t = useTranslations('admin.kit.dialog')
  const ref = useModalDialog(open)
  const titleId = useId()
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        // A nested <dialog> (media/icon picker) bubbles its own cancel event up through React — ignore it.
        if (e.target !== e.currentTarget) return
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className={cn(
        'fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-surface p-0 text-on-surface shadow-[-16px_0_40px_-12px_rgba(43,43,43,0.18)]',
        widths[size],
        className,
      )}
    >
      {open && (
        <div className="flex h-full flex-col">
          <div className="flex items-start gap-3 border-b border-surface-container-high bg-surface-container-lowest px-4 py-3.5 md:px-6 md:py-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <h2 id={titleId} className="font-headline-sm text-headline-sm text-primary">
                  {title}
                </h2>
                {meta}
              </div>
              {subtitle && <div className="mt-0.5 font-body-md text-body-md text-on-surface-variant">{subtitle}</div>}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
            <button
              type="button"
              onClick={onClose}
              aria-label={t('close')}
              className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Icon name="close" className="text-[22px]" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:py-5">{children}</div>
          {footer && (
            <div className="flex flex-wrap items-center gap-2 border-t border-surface-container-high bg-surface-container-lowest px-4 py-3 md:px-6">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  )
}
