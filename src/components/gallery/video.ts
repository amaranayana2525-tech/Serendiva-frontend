/**
 * Video URL helpers for the lite embeds (gallery films, review interviews, the about-page introduction).
 * Only YouTube (rendered through the privacy-friendly youtube-nocookie.com domain) and Vimeo are embedded —
 * both are allowed by the CSP `frame-src`. Anything else is opened in a new tab instead.
 */

export interface ParsedVideo {
  provider: 'youtube' | 'vimeo'
  id: string
}

const YOUTUBE_ID = /^[\w-]{6,20}$/

/** Extracts the provider + id from common YouTube / Vimeo URL shapes. Returns null for anything else. */
export function parseVideoUrl(raw: string | null | undefined): ParsedVideo | null {
  const value = raw?.trim()
  if (!value) return null
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }
  const host = url.hostname.replace(/^www\.|^m\./, '')
  const segments = url.pathname.split('/').filter(Boolean)

  if (host === 'youtu.be') {
    const id = segments[0]
    return id && YOUTUBE_ID.test(id) ? { provider: 'youtube', id } : null
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'music.youtube.com') {
    const fromQuery = url.searchParams.get('v')
    if (fromQuery && YOUTUBE_ID.test(fromQuery)) return { provider: 'youtube', id: fromQuery }
    const [kind, id] = segments
    if (id && (kind === 'embed' || kind === 'shorts' || kind === 'live' || kind === 'v') && YOUTUBE_ID.test(id)) {
      return { provider: 'youtube', id }
    }
    return null
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = [...segments].reverse().find((s) => /^\d+$/.test(s))
    return id ? { provider: 'vimeo', id } : null
  }
  return null
}

/** Embed URL for an iframe. `autoplay` is used after an explicit click on a play button (lite embed). */
export function videoEmbedUrl(video: ParsedVideo, { autoplay = true }: { autoplay?: boolean } = {}): string {
  if (video.provider === 'vimeo') {
    const params = new URLSearchParams({ dnt: '1', ...(autoplay ? { autoplay: '1' } : {}) })
    return `https://player.vimeo.com/video/${video.id}?${params.toString()}`
  }
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    ...(autoplay ? { autoplay: '1' } : {}),
  })
  return `https://www.youtube-nocookie.com/embed/${video.id}?${params.toString()}`
}
