'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

let scrollLocks = 0

/** Opens/closes a native <dialog> as a modal and locks page scroll while open. */
export function useModalDialog(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      scrollLocks++
      document.documentElement.style.overflow = 'hidden'
    }
    if (!open && dialog.open) dialog.close()
    if (!open) return
    return () => {
      scrollLocks = Math.max(0, scrollLocks - 1)
      if (scrollLocks === 0) document.documentElement.style.overflow = ''
      if (dialog.open) dialog.close()
    }
  }, [open])
  return ref
}

export interface ModalProps {
  open: boolean
  /** Called on Esc, backdrop click (when dismissible) and the close button. */
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  /** Sticky footer (buttons). */
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Close on backdrop click (default true). Esc always calls onClose. */
  dismissible?: boolean
  /** Material icon next to the title. */
  icon?: string
  iconTone?: 'default' | 'danger'
  className?: string
  bodyClassName?: string
}

const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' } as const

/** Centered modal on native <dialog> (focus trap, Esc, inert page, restores focus) with header/body/footer. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissible = true,
  icon,
  iconTone = 'default',
  className,
  bodyClassName,
}: ModalProps) {
  const t = useTranslations('admin.kit.dialog')
  const ref = useModalDialog(open)
  const titleId = useId()
  const descId = useId()
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        // A nested <dialog> (media/icon picker) bubbles its own cancel event up through React — ignore it.
        if (e.target !== e.currentTarget) return
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose()
      }}
      className={cn(
        'shadow-ambient max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-hidden rounded-xl bg-surface-container-lowest p-0 text-on-surface',
        widths[size],
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <div className="flex items-start gap-3 border-b border-surface-container px-5 py-4">
            {icon && (
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  iconTone === 'danger' ? 'bg-secondary-fixed text-secondary' : 'bg-surface-container text-primary',
                )}
              >
                <Icon name={icon} className="text-[20px]" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="font-headline-sm text-headline-sm text-primary">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-0.5 font-body-md text-body-md text-on-surface-variant">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('close')}
              className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Icon name="close" className="text-[20px]" />
            </button>
          </div>
          {children !== undefined && (
            <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-4', bodyClassName)}>{children}</div>
          )}
          {footer && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-surface-container bg-surface-container-low/60 px-5 py-3">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  )
}
