'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Icon } from './Icon'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  /** Max width preset. */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Close when clicking the backdrop (default true). */
  dismissible?: boolean
  className?: string
}

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' } as const

/** Modal dialog on native <dialog> (focus trap, Esc, inert page, teal 40% blurred backdrop from DESIGN.md). */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  dismissible = true,
  className,
}: DialogProps) {
  const t = useTranslations('common.a11y')
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose()
      }}
      className={cn(
        'shadow-ambient w-[calc(100%-2rem)] rounded-2xl bg-surface p-0 text-on-surface',
        sizes[size],
        className,
      )}
    >
      {open && (
        <div className="flex flex-col gap-space-md p-space-lg md:p-space-xl">
          <div className="flex items-start justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <h2 id={titleId} className="font-headline-md text-headline-md text-primary">
                {title}
              </h2>
              {description && (
                <p id={descId} className="font-body-md text-body-md text-on-surface-variant">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('close')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Icon name="close" className="text-xl" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
