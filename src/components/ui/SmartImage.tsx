import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { ApiImage } from '@/lib/api/types'
import { cn } from '@/lib/utils'

export interface SmartImageProps {
  /** Image object from the API (url, alt, width, height, blurDataUrl). `null` renders a sand gradient placeholder. */
  image: ApiImage | null | undefined
  /** Override the API alt text. Pass '' for purely decorative images. */
  alt?: string
  /** Fill the nearest `relative` parent (Stitch background-image divs / object-cover <img>). */
  fill?: boolean
  /** Responsive sizes hint — always set it for fill images, e.g. "(min-width: 1024px) 33vw, 100vw". */
  sizes?: string
  /** Above-the-fold LCP image (hero). Maps to next/image `preload` (Next 16 replacement for `priority`). */
  priority?: boolean
  quality?: 60 | 75 | 85
  className?: string
  /** Classes for the gradient placeholder (when `image` is null). Defaults to `className`. */
  placeholderClassName?: string
}

/**
 * The only way to render content images. Wraps next/image with the API's blur placeholder and falls back to a sand
 * gradient (with the alt text for screen readers) when the CMS has no image yet.
 *
 *   <div className="relative h-64 overflow-hidden"><SmartImage image={tour.cover} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover" /></div>
 */
export function SmartImage({
  image,
  alt,
  fill = false,
  sizes,
  priority = false,
  quality,
  className,
  placeholderClassName,
}: SmartImageProps) {
  const t = useTranslations('common.a11y')

  if (!image?.url) {
    const label = alt ?? image?.alt ?? ''
    return (
      <div
        role={label ? 'img' : undefined}
        aria-label={label ? t('imagePlaceholder', { alt: label }) : undefined}
        aria-hidden={label ? undefined : true}
        className={cn(
          'bg-gradient-to-br from-surface-container-high via-surface-container to-secondary-fixed/40',
          fill && 'absolute inset-0 h-full w-full',
          placeholderClassName ?? className,
        )}
      />
    )
  }

  const blur =
    image.blurDataUrl && image.blurDataUrl.startsWith('data:image/') && image.blurDataUrl.length > 40
      ? image.blurDataUrl
      : undefined
  const altText = alt ?? image.alt ?? ''
  const common = {
    src: image.url,
    sizes,
    quality,
    preload: priority || undefined,
    placeholder: blur ? ('blur' as const) : ('empty' as const),
    blurDataURL: blur,
    className: cn('bg-surface-container', className),
  }

  if (fill) return <Image {...common} alt={altText} fill sizes={sizes ?? '100vw'} />
  return <Image {...common} alt={altText} width={image.width ?? 1200} height={image.height ?? 800} />
}
