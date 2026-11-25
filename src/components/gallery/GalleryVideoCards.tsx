'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { GalleryItem } from '@/lib/api/types'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'
import { toRoman } from './format'
import { MediaLightboxLazy } from './MediaLightboxLazy'

/** Stitch "Cinematic Chronicles" film cards; play opens the lite video player dialog (iframe created on demand). */
export function GalleryVideoCards({
  videos,
  categoryLabels,
  dialogLabel,
}: {
  videos: GalleryItem[]
  categoryLabels: Record<string, string>
  dialogLabel: string
}) {
  const t = useTranslations('gallery.videos')
  const [open, setOpen] = useState<number | null>(null)
  return (
    <>
      <ul className="grid grid-cols-1 gap-gutter-lg md:grid-cols-3">
        {videos.map((video, index) => {
          const title = video.title ?? video.image?.alt ?? ''
          const playable = Boolean(video.videoUrl)
          return (
            <li
              key={video.id}
              className="group flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-500 hover:shadow-xl"
            >
              <div className="relative h-64 w-full overflow-hidden bg-surface-container">
                <SmartImage
                  image={video.image}
                  fill
                  sizes="(min-width: 768px) 30vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-primary/30 transition-colors duration-300 group-hover:bg-primary/10"
                />
                {playable ? (
                  <button
                    type="button"
                    onClick={() => setOpen(index)}
                    aria-label={t('play', { title })}
                    className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-on-primary shadow-lg transition-all duration-300 hover:bg-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-surface group-hover:scale-110 group-hover:bg-secondary"
                  >
                    <Icon name="play_arrow" className="ml-0.5 text-[28px]" />
                  </button>
                ) : (
                  <span className="absolute inset-x-0 bottom-space-sm mx-auto w-fit rounded-full bg-surface/90 px-space-sm py-0.5 font-label-md text-label-md text-primary">
                    {t('noVideo')}
                  </span>
                )}
                <div className="absolute left-space-sm top-space-sm rounded bg-surface/90 px-space-xs py-0.5 font-label-md text-label-md uppercase text-primary">
                  {t('chapter', { number: toRoman(index + 1) })}
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-between p-space-md">
                <div>
                  <span className="font-label-md text-label-md uppercase tracking-wider text-secondary">
                    {categoryLabels[video.category] ?? video.category}
                  </span>
                  <h3 className="mt-1 font-headline-sm text-headline-sm text-primary transition-colors group-hover:text-secondary">
                    {title}
                  </h3>
                  {video.caption && (
                    <p className="mt-2 font-body-md text-body-md text-on-surface-variant">{video.caption}</p>
                  )}
                </div>
                {video.location && (
                  <div className="mt-space-md flex items-center justify-between gap-space-sm rounded-lg bg-surface-container-low p-space-sm pt-space-md font-caption text-caption text-on-surface-variant">
                    <span>{video.location}</span>
                    <Icon name="headphones" className="shrink-0 text-[16px] text-primary" />
                  </div>
                )}
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
