'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { GalleryItem } from '@/lib/api/types'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'
import { MediaLightboxLazy } from '@/components/gallery/MediaLightboxLazy'

/** Stitch "Video Testimonial Showcase" cards — play opens the lite video dialog (iframe only after the click). */
export function ReviewVideoCards({ videos, dialogLabel }: { videos: GalleryItem[]; dialogLabel: string }) {
  const t = useTranslations('reviews.videos')
  const [open, setOpen] = useState<number | null>(null)
  return (
    <>
      <ul className="grid grid-cols-1 gap-gutter-lg lg:grid-cols-2">
        {videos.map((video, index) => {
          const title = video.title ?? video.image?.alt ?? ''
          return (
            <li
              key={video.id}
              className="group relative overflow-hidden rounded-2xl bg-surface-container-low shadow-lg transition-all hover:shadow-2xl"
            >
              <div className="relative h-96 w-full overflow-hidden">
                <SmartImage
                  image={video.image}
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent"
                />
                {video.videoUrl && (
                  <button
                    type="button"
                    onClick={() => setOpen(index)}
                    aria-label={t('play', { title })}
                    className="absolute inset-0 bottom-auto top-space-2xl z-10 m-auto flex h-20 w-20 transform cursor-pointer items-center justify-center rounded-full bg-secondary text-on-secondary shadow-xl transition-all hover:scale-110 hover:bg-on-secondary-fixed-variant focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-surface group-hover:shadow-[0_0_30px_rgba(156,68,30,0.5)] sm:bottom-0 sm:top-0"
                  >
                    <Icon name="play_arrow" filled className="text-4xl" />
                  </button>
                )}
                <div className="absolute bottom-space-lg left-space-lg right-space-lg text-on-primary">
                  <span className="mb-1 block font-label-md text-label-md uppercase tracking-wider text-primary-fixed">
                    {[t('label'), video.location].filter(Boolean).join(' · ')}
                  </span>
                  <h3 className="mb-1 font-headline-md text-headline-md leading-tight">“{title}”</h3>
                  {video.caption && <p className="font-body-md text-body-md opacity-90">{video.caption}</p>}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <MediaLightboxLazy
        label={dialogLabel}
        items={videos.map((v) => ({
          id: v.id,
          type: 'video' as const,
          image: v.image,
          title: v.title,
          caption: v.caption,
          location: v.location,
          videoUrl: v.videoUrl,
        }))}
        index={open}
        onClose={() => setOpen(null)}
        onIndexChange={setOpen}
      />
    </>
  )
}
