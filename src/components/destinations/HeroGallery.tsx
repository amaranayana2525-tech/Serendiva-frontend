'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { DestinationDetail } from '@/lib/api/types'
import { Icon } from '@/components/ui/Icon'
import { LightboxLazy } from '@/components/ui/LightboxLazy'
import { SmartImage } from '@/components/ui/SmartImage'

export interface HeroGalleryProps {
  name: string
  items: DestinationDetail['gallery']
}

/**
 * Stitch hero thumbnail strip (first four gallery photos, desktop) + a "view photos" pill on smaller screens.
 * Every thumbnail opens the shared lightbox on the full destination gallery.
 */
export function HeroGallery({ name, items }: HeroGalleryProps) {
  const t = useTranslations('destinationDetail.hero')
  const [index, setIndex] = useState<number | null>(null)
  if (items.length === 0) return null

  return (
    <>
      <ul
        aria-label={t('galleryLabel', { name })}
        className="mt-space-2xl hidden max-w-4xl grid-cols-4 gap-space-md border-t border-white/10 pt-space-lg lg:grid"
      >
        {items.slice(0, 4).map((item, i) => {
          const title = item.title ?? item.image.alt ?? name
          return (
            <li key={`${item.image.url}-${i}`}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t('openImage', { title })}
                className="group flex w-full cursor-pointer items-center gap-space-sm rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-primary focus-visible:ring-offset-4 focus-visible:ring-offset-primary"
              >
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg shadow-md">
                  <SmartImage
                    image={item.image}
                    alt=""
                    fill
                    sizes="48px"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </span>
                <span className="flex flex-col">
                  {item.title && <span className="font-label-md text-label-md text-on-primary">{item.title}</span>}
                  {item.caption && (
                    <span className="font-caption text-caption text-on-primary-container">{item.caption}</span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        onClick={() => setIndex(0)}
        className="tap-target relative mt-space-lg inline-flex w-fit items-center gap-space-xs rounded-full bg-surface-container/20 px-space-md py-1.5 font-label-md text-label-md uppercase tracking-widest text-surface shadow-sm backdrop-blur-md transition-colors hover:bg-surface-container/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-primary lg:hidden"
      >
        <Icon name="photo_library" className="text-sm" />
        {t('viewGallery', { count: items.length })}
      </button>
      <LightboxLazy
        items={items.map((g) => ({ image: g.image, title: g.title, caption: g.caption }))}
        index={index}
        onClose={() => setIndex(null)}
        onIndexChange={setIndex}
      />
    </>
  )
}
