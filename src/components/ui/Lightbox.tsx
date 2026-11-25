'use client'

import { useEffect, useRef, type KeyboardEvent, type TouchEvent } from 'react'
import { useTranslations } from 'next-intl'
import type { ApiImage } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { Icon } from './Icon'
import { SmartImage } from './SmartImage'

export interface LightboxItem {
  image: ApiImage | null
  title?: string | null
  caption?: string | null
}

export interface LightboxProps {
  items: LightboxItem[]
  /** Index of the open image, or null when closed. */
  index: number | null
  onClose: () => void
  onIndexChange: (index: number) => void
}

/**
 * Accessible image viewer on a native modal <dialog> (focus is trapped and restored by the browser, page is inert).
 * Keys: ← / → navigate, Esc closes. Swipe on touch. Load it lazily: `import { LightboxLazy } from '@/components/ui/LightboxLazy'`.
 */
export default function Lightbox({ items, index, onClose, onIndexChange }: LightboxProps) {
  const t = useTranslations('common.a11y.lightbox')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const touchX = useRef<number | null>(null)
  const total = items.length
  const current = index !== null ? items[index] : undefined

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (index !== null && !dialog.open) dialog.showModal()
    if (index === null && dialog.open) dialog.close()
  }, [index])

  useEffect(() => {
    if (index === null) return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [index])

  const go = (delta: number) => {
    if (index === null || total === 0) return
    onIndexChange((index + delta + total) % total)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      go(1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      go(-1)
    }
  }

  const onTouchStart = (e: TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null
  }
  const onTouchEnd = (e: TouchEvent) => {
    const start = touchX.current
    const end = e.changedTouches[0]?.clientX
    touchX.current = null
    if (start === null || end === undefined) return
    if (Math.abs(end - start) > 50) go(end < start ? 1 : -1)
  }

  const navButton =
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface/15 text-surface backdrop-blur-md transition-colors hover:bg-surface/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface'

  return (
    <dialog
      ref={dialogRef}
      aria-label={t('label')}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onKeyDown={onKeyDown}
      className="m-0 h-[100dvh] max-h-none w-screen max-w-none bg-transparent p-0 text-surface backdrop:bg-[rgba(0,26,33,0.92)] backdrop:backdrop-blur-sm"
    >
      {current && index !== null && (
        <div className="flex h-full flex-col" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="flex items-center justify-between px-margin py-space-md md:px-margin-md">
            <span aria-live="polite" className="font-label-lg text-label-lg tracking-widest text-surface/80">
              {t('counter', { current: index + 1, total })}
            </span>
            <button type="button" onClick={onClose} aria-label={t('close')} className={navButton} autoFocus>
              <Icon name="close" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 items-center gap-space-md px-space-sm md:px-margin-md">
            {total > 1 && (
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label={t('prev')}
                className={cn(navButton, 'hidden sm:flex')}
              >
                <Icon name="arrow_back" />
              </button>
            )}
            <figure className="relative flex h-full min-w-0 flex-1 flex-col">
              <div className="relative min-h-0 flex-1">
                <SmartImage
                  key={index}
                  image={current.image}
                  fill
                  sizes="100vw"
                  quality={85}
                  className="object-contain"
                />
              </div>
              {(current.title || current.caption) && (
                <figcaption className="mx-auto max-w-3xl px-space-md py-space-md text-center">
                  {current.title && (
                    <span className="block font-headline-sm text-headline-sm text-surface">{current.title}</span>
                  )}
                  {current.caption && (
                    <span className="block font-body-md text-body-md text-surface/80">{current.caption}</span>
                  )}
                </figcaption>
              )}
            </figure>
            {total > 1 && (
              <button
                type="button"
                onClick={() => go(1)}
                aria-label={t('next')}
                className={cn(navButton, 'hidden sm:flex')}
              >
                <Icon name="arrow_forward" />
              </button>
            )}
          </div>

          {total > 1 && (
            <div className="flex items-center justify-center gap-space-md pb-space-lg sm:hidden">
              <button type="button" onClick={() => go(-1)} aria-label={t('prev')} className={navButton}>
                <Icon name="arrow_back" />
              </button>
              <button type="button" onClick={() => go(1)} aria-label={t('next')} className={navButton}>
                <Icon name="arrow_forward" />
              </button>
            </div>
          )}
        </div>
      )}
    </dialog>
  )
}
