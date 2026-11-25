'use client'

import { useState } from 'react'
import type { ApiImage } from '@/lib/api/types'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'
import { parseVideoUrl } from '@/components/gallery/video'
import { VideoFrame } from '@/components/gallery/VideoFrame'

export interface IntroVideoPlayerProps {
  videoUrl: string | null
  poster: ApiImage | null
  /** Accessible name of the play button. */
  playLabel: string
  /** Title of the iframe once playing. */
  frameTitle: string
  /** Text of the bottom-left pill. */
  badge: string
  /** Shown instead of the play button when there is no (embeddable) video yet. */
  comingSoon: string
}

/**
 * Lite video embed for the about page: a poster with the Stitch play button; the YouTube/Vimeo iframe is created only
 * after a click (no third-party requests on page load). Without a usable URL the poster stays, with a "coming soon" pill.
 */
export function IntroVideoPlayer({
  videoUrl,
  poster,
  playLabel,
  frameTitle,
  badge,
  comingSoon,
}: IntroVideoPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const video = parseVideoUrl(videoUrl)

  return (
    <div className="relative aspect-video overflow-hidden bg-primary lg:col-span-7 lg:aspect-auto lg:min-h-[480px]">
      {playing && video ? (
        <VideoFrame video={video} title={frameTitle} />
      ) : (
        <>
          <SmartImage
            image={poster}
            fill
            sizes="(min-width: 1440px) 750px, (min-width: 1024px) 55vw, 100vw"
            className="object-cover opacity-90 transition-opacity hover:opacity-100"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-[1px]">
            {video ? (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                aria-label={playLabel}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-2xl transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                <Icon name="play_arrow" className="ml-1 text-4xl" />
              </button>
            ) : (
              <span className="rounded-full bg-surface/90 px-space-md py-1 font-label-md text-label-md text-primary shadow-sm">
                {comingSoon}
              </span>
            )}
          </div>
          <div className="absolute bottom-space-md left-space-md flex items-center gap-1 rounded-full bg-surface/90 px-space-md py-1 font-label-md text-label-md text-primary shadow-sm backdrop-blur-md">
            <Icon name="videocam" className="text-xs text-secondary" />
            <span>{badge}</span>
          </div>
        </>
      )}
    </div>
  )
}
