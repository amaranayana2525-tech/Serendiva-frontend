'use client'

import { useEffect, useRef, type KeyboardEvent, type TouchEvent } from 'react'
import { useTranslations } from 'next-intl'
import type { ApiImage } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'
import { parseVideoUrl } from './video'
import { VideoFrame } from './VideoFrame'

export interface MediaItem {
  id: string
  type: 'image' | 'video'
  /** Photo, or the poster frame of a video. */
  image: ApiImage | null
  title?: string | null
  caption?: string | null
  location?: string | null
  videoUrl?: string | null
}

export interface MediaLightboxProps {
  items: MediaItem[]
  /** Index of the open item, or null when closed. */
  index: number | null
  onClose: () => void
  onIndexChange: (index: number) => void
  /** Accessible name of the dialog (defaults to "Image viewer"). */
  label?: string
}

/**
 * Gallery variant of the shared ui/Lightbox: native modal <dialog> (focus trapped + restored, page inert, Esc closes),
 * ← / → keys and swipe, counter, title + caption + location, and lite video playback (the YouTube/Vimeo iframe is
 * only created for the open video item). Load it with `MediaLightboxLazy`.
 */
export default function MediaLightbox({ items, index, onClose, onIndexChange, label }: MediaLightboxProps) {
  const t = useTranslations('common')
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
    if (index === null || total < 2) return
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

  const video = current?.type === 'video' ? parseVideoUrl(current.videoUrl) : null
  const title = current?.title ?? current?.image?.alt ?? ''

  return (
    <dialog
      ref={dialogRef}
      aria-label={label ?? t('a11y.lightbox.label')}
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
              {t('a11y.lightbox.counter', { current: index + 1, total })}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('a11y.lightbox.close')}
              className={navButton}
              autoFocus
            >
              <Icon name="close" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 items-center gap-space-md px-space-sm md:px-margin-md">
            {total > 1 && (
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label={t('a11y.lightbox.prev')}
                className={cn(navButton, 'hidden sm:flex')}
              >
                <Icon name="arrow_back" />
              </button>
            )}
            <figure className="relative flex h-full min-w-0 flex-1 flex-col">
              <div className="relative flex min-h-0 flex-1 items-center justify-center">
                {current.type === 'video' ? (
                  <div className="relative aspect-video max-h-full w-full max-w-5xl overflow-hidden rounded-xl bg-primary shadow-2xl">
                    {video ? (
                      <VideoFrame key={current.id} video={video} title={title} />
                    ) : (
                      <>
                        <SmartImage
                          image={current.image}
                          fill
                          sizes="(min-width: 1024px) 80vw, 100vw"
                          className="object-cover opacity-70"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/40 p-space-lg text-center">
                          {current.videoUrl ? (
                            <a
                              href={current.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-space-xs rounded-xl bg-secondary px-space-lg py-space-sm font-label-lg text-label-lg text-on-secondary shadow-xl transition-colors hover:bg-on-secondary-fixed-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface coarse:min-h-11"
                            >
                              <Icon name="play_arrow" filled className="text-[20px]" />
                              {t('buttons.playVideo')}
                              <span className="sr-only"> {t('a11y.opensInNewTab')}</span>
                            </a>
                          ) : (
                            <span className="rounded-full bg-surface/90 px-space-md py-1 font-label-md text-label-md text-primary">
                              {t('a11y.videoPlaceholder')}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <SmartImage
                    key={current.id}
                    image={current.image}
                    fill
                    sizes="100vw"
                    quality={85}
                    className="object-contain"
                  />
                )}
              </div>
              {(current.title || current.caption || current.location) && (
                <figcaption className="mx-auto flex max-w-3xl flex-col items-center gap-1 px-space-md py-space-md text-center">
                  {current.title && (
                    <span className="block font-headline-sm text-headline-sm text-surface">{current.title}</span>
                  )}
                  {current.caption && (
                    <span className="block font-body-md text-body-md text-surface/80">{current.caption}</span>
                  )}
                  {current.location && (
                    <span className="inline-flex items-center gap-1 font-caption text-caption uppercase tracking-wider text-secondary-fixed">
                      <Icon name="pin_drop" className="text-[16px]" />
                      {current.location}
                    </span>
                  )}
                </figcaption>
              )}
            </figure>
            {total > 1 && (
              <button
                type="button"
                onClick={() => go(1)}
                aria-label={t('a11y.lightbox.next')}
                className={cn(navButton, 'hidden sm:flex')}
              >
                <Icon name="arrow_forward" />
              </button>
            )}
          </div>

          {total > 1 && (
            <div className="flex items-center justify-center gap-space-md pb-space-lg sm:hidden">
              <button type="button" onClick={() => go(-1)} aria-label={t('a11y.lightbox.prev')} className={navButton}>
                <Icon name="arrow_back" />
              </button>
              <button type="button" onClick={() => go(1)} aria-label={t('a11y.lightbox.next')} className={navButton}>
                <Icon name="arrow_forward" />
              </button>
            </div>
          )}
        </div>
      )}
    </dialog>
  )
}
