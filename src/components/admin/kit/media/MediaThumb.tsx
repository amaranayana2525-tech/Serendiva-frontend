'use client'

import Image from 'next/image'
import { Icon } from '@/components/ui/Icon'
import type { AdminMedia, AdminMediaRef } from '@/lib/api/types'
import { cn } from '@/lib/utils'

export interface MediaThumbProps {
  media: Pick<AdminMediaRef, 'url' | 'thumbUrl' | 'alt'> & { mime?: string }
  /** Override the alt text ('' = decorative). */
  alt?: string
  /** Responsive sizes hint. */
  sizes?: string
  className?: string
}

/** True for image media (by mime, or by file extension when the mime is unknown). */
export function isImageMedia(media: { mime?: string; url: string }): boolean {
  if (media.mime) return media.mime.startsWith('image/')
  return /\.(webp|jpe?g|png|gif|avif|svg)(\?|$)/i.test(media.url)
}

/**
 * Admin thumbnail: the API's 400 px WebP preview (served as-is — no Next optimisation needed for previews) or a
 * document icon. Fills its `relative` parent.
 */
export function MediaThumb({ media, alt, sizes = '200px', className }: MediaThumbProps) {
  if (!isImageMedia(media)) {
    return (
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center bg-surface-container text-on-surface-variant',
          className,
        )}
      >
        <Icon name="description" className="text-[32px]" />
      </span>
    )
  }
  return (
    <Image
      src={media.thumbUrl ?? media.url}
      alt={alt ?? media.alt ?? ''}
      fill
      sizes={sizes}
      unoptimized
      className={cn('bg-surface-container object-cover', className)}
    />
  )
}

/** AdminMedia (library item) → AdminMediaRef (what records store/return), using the English alt text. */
export function toMediaRef(media: AdminMedia): AdminMediaRef {
  return { id: media.id, url: media.url, thumbUrl: media.thumbUrl, alt: media.altText.en ?? '' }
}
