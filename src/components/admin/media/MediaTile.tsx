'use client'

import { useTranslations } from 'next-intl'
import { MediaThumb } from '@/components/admin/kit/media/MediaThumb'
import { Icon } from '@/components/ui/Icon'
import { formatBytes } from '@/lib/admin/format'
import type { AdminMedia } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { isImageMime, mediaName } from './mediaApi'

export interface MediaTileProps {
  media: AdminMedia
  active?: boolean
  onOpen: () => void
  /** Bulk-select mode: clicking toggles the selection instead of opening the drawer. */
  selection?: { selected: boolean; onToggle: () => void }
}

/** Library grid tile: square thumbnail, usage + missing-alt markers, file name and size. Opens the detail drawer. */
export function MediaTile({ media, active, onOpen, selection }: MediaTileProps) {
  const t = useTranslations('adminLibrary.media')
  const name = mediaName(media)
  const image = isImageMime(media.mime)
  const alt = media.altText.en ?? ''
  const missingAlt = image && !alt.trim()
  return (
    <button
      type="button"
      onClick={selection ? selection.onToggle : onOpen}
      aria-label={selection ? t('selectTile', { name }) : t('openTile', { name })}
      aria-pressed={selection ? selection.selected : undefined}
      aria-current={!selection && active ? true : undefined}
      className={cn(
        'group flex w-full flex-col overflow-hidden rounded-xl border bg-surface-container-lowest text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        selection?.selected || (!selection && active)
          ? 'border-primary ring-2 ring-primary/30'
          : 'border-surface-container-high hover:border-primary/40',
      )}
    >
      <span className="relative block aspect-square w-full overflow-hidden bg-surface-container">
        <MediaThumb
          media={{ url: media.url, thumbUrl: media.thumbUrl, alt, mime: media.mime }}
          alt=""
          sizes="(min-width:1280px) 200px, (min-width:768px) 25vw, 50vw"
          className="transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute left-1.5 top-1.5 flex flex-wrap gap-1">
          {media.usageCount > 0 ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/85 px-1.5 py-px font-body-md text-[11px] font-semibold text-on-primary backdrop-blur-sm">
              <Icon name="link" className="text-[12px]" />
              {t('usedCount', { count: media.usageCount })}
            </span>
          ) : (
            <span className="rounded-full bg-surface-container-lowest/90 px-1.5 py-px font-body-md text-[11px] font-semibold text-on-surface-variant backdrop-blur-sm">
              {t('unused')}
            </span>
          )}
        </span>
        {missingAlt && (
          <span
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-secondary-fixed text-secondary shadow-sm"
            title={t('altMissing')}
          >
            <Icon name="warning" className="text-[14px]" label={t('altMissing')} />
          </span>
        )}
        {selection && (
          <span
            aria-hidden="true"
            className={cn(
              'absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-md border-2 shadow-sm',
              selection.selected
                ? 'border-primary bg-primary text-on-primary'
                : 'border-outline bg-surface-container-lowest/90',
            )}
          >
            {selection.selected && <Icon name="check" className="text-[16px]" />}
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-col px-2.5 py-2">
        <span className="truncate font-body-md text-[13px] font-medium text-on-surface" title={name}>
          {name}
        </span>
        <span className="truncate font-caption text-[11px] tabular-nums text-on-surface-variant">
          {media.width && media.height ? `${media.width}×${media.height} · ` : ''}
          {formatBytes(media.size)}
        </span>
      </span>
    </button>
  )
}
