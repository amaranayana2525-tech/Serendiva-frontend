import { cn } from '@/lib/utils'
import { videoEmbedUrl, type ParsedVideo } from './video'

export interface VideoFrameProps {
  video: ParsedVideo
  /** Accessible title of the iframe (required by WCAG for frames). */
  title: string
  autoplay?: boolean
  className?: string
}

/** The actual player iframe — only rendered after the visitor pressed play (lite embed). Fills its `relative` parent. */
export function VideoFrame({ video, title, autoplay = true, className }: VideoFrameProps) {
  return (
    <iframe
      src={videoEmbedUrl(video, { autoplay })}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      className={cn('absolute inset-0 h-full w-full border-0 bg-primary', className)}
    />
  )
}
