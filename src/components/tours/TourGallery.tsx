'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { TourGalleryItem } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { LightboxLazy } from '@/components/ui/LightboxLazy'
import { SmartImage } from '@/components/ui/SmartImage'
import { useHydrated } from './useHydrated'

export interface TourGalleryProps {
  items: Pick<TourGalleryItem, 'image' | 'title' | 'caption'>[]
  /** Accessible fallback name for photos without a title. */
  tourTitle: string
}

const tileButton =
  'absolute inset-0 z-[1] rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-secondary-fixed'

/**
 * Editorial gallery (Stitch: 1 hero photo, 7 cols + 4-photo bento, 5 cols). Every tile and the "View all N photos"
 * button open the accessible lightbox over all gallery photos (←/→, Esc, swipe, focus restored on close).
 */
export function TourGallery({ items, tourTitle }: TourGalleryProps) {
  const t = useTranslations('tourDetail.gallery')
  const hydrated = useHydrated()
  const [open, setOpenState] = useState<number | null>(null)
  // The lightbox chunk is only loaded on first use, then stays mounted so closing restores focus to the trigger.
  const [loaded, setLoaded] = useState(false)
  const setOpen = (index: number | null) => {
    if (index !== null) setLoaded(true)
    setOpenState(index)
  }
  if (items.length === 0) return null

  const [hero, ...rest] = items
  const bento = rest.slice(0, 4)
  const total = items.length
  const label = (index: number) =>
    t('open', { number: index + 1, total, title: items[index]?.title || items[index]?.image.alt || tourTitle })

  return (
    <>
      <div data-hydrated={hydrated || undefined} className="relative grid grid-cols-1 gap-space-sm md:grid-cols-12">
        {/* Main hero photo */}
        {hero && (
          <div
            className={cn(
              'group relative h-[360px] overflow-hidden rounded-xl md:h-[500px]',
              bento.length > 0 ? 'md:col-span-7' : 'md:col-span-12',
            )}
          >
            <SmartImage
              image={hero.image}
              fill
              priority
              sizes="(min-width: 1440px) 740px, (min-width: 768px) 58vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
            {(hero.caption || hero.title) && (
              <div className="absolute bottom-space-md left-space-md right-space-md text-on-primary">
                {hero.caption && (
                  <span className="mb-1 inline-block rounded-full bg-primary/80 px-2.5 py-1 font-label-md text-label-md uppercase tracking-widest text-primary-fixed backdrop-blur-md">
                    {hero.caption}
                  </span>
                )}
                {hero.title && <p className="font-headline-md text-headline-md text-on-primary">{hero.title}</p>}
              </div>
            )}
            <button type="button" onClick={() => setOpen(0)} aria-label={label(0)} className={tileButton} />
          </div>
        )}

        {/* Asymmetric bento of up to four thumbnails */}
        {bento.length > 0 && (
          <div
            className={cn(
              'grid h-[360px] gap-space-sm md:col-span-5 md:h-[500px]',
              bento.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
              bento.length === 2 && 'grid-cols-1 grid-rows-2',
            )}
          >
            {bento.map((item, i) => {
              const index = i + 1
              return (
                <div
                  key={item.image.id}
                  className={cn(
                    'group relative overflow-hidden rounded-xl',
                    bento.length === 3 && i === 2 && 'col-span-2',
                  )}
                >
                  <SmartImage
                    image={item.image}
                    fill
                    sizes="(min-width: 1440px) 260px, (min-width: 768px) 20vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-primary/20 transition-colors group-hover:bg-transparent" />
                  {item.title && (
                    <span className="absolute bottom-2 left-2 rounded bg-primary/70 px-2 py-0.5 font-caption text-caption text-on-primary backdrop-blur-sm">
                      {item.title}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpen(index)}
                    aria-label={label(index)}
                    className={tileButton}
                  />
                </div>
              )
            })}
          </div>
        )}

        {total > 1 && (
          <button
            type="button"
            onClick={() => setOpen(0)}
            className="absolute bottom-space-md right-space-md z-10 flex items-center gap-2 rounded-lg bg-surface/95 px-space-md py-space-sm font-label-lg text-label-lg text-primary shadow-md backdrop-blur-md transition-all hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 coarse:min-h-11"
          >
            <Icon name="photo_library" className="text-base" />
            <span>{t('viewAll', { count: total })}</span>
          </button>
        )}
      </div>

      {loaded && (
        <LightboxLazy
          items={items.map((item) => ({ image: item.image, title: item.title, caption: item.caption }))}
          index={open}
          onClose={() => setOpen(null)}
          onIndexChange={setOpen}
        />
      )}
    </>
  )
}
