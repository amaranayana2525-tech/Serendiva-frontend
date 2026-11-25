'use client'

import { useTranslations } from 'next-intl'
import { IconButton } from '@/components/admin/kit/Button'
import { Switch } from '@/components/admin/kit/form/Switch'
import { MediaThumb } from '@/components/admin/kit/media/MediaThumb'
import { Icon } from '@/components/ui/Icon'
import type { AdminGalleryItem } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import type { SortableGridItemContext } from './SortableGrid'

export interface GalleryCardProps {
  item: AdminGalleryItem
  ctx: SortableGridItemContext
  label: string
  /** Category name shown as a chip (in the "All" view). */
  categoryLabel?: string
  active?: boolean
  busy?: boolean
  onEdit: () => void
  onDelete: () => void
  onStatus: (published: boolean) => void
}

/** One gallery tile: thumbnail (video badge, hidden state), reorder controls, title/location, visibility switch. */
export function GalleryCard({
  item,
  ctx,
  label,
  categoryLabel,
  active,
  busy,
  onEdit,
  onDelete,
  onStatus,
}: GalleryCardProps) {
  const t = useTranslations('adminLibrary.gallery')
  const published = item.status === 'published'
  const name = label || t('untitled')
  return (
    <article
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-xl border bg-surface-container-lowest transition-shadow',
        active ? 'border-primary ring-2 ring-primary/25' : 'border-surface-container-high',
        !published && 'border-dashed',
        ctx.isDragging && 'shadow-lg',
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container">
        <button
          type="button"
          onClick={onEdit}
          aria-label={t('editItem', { name })}
          className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        >
          {item.media ? (
            <MediaThumb
              media={item.media}
              alt=""
              sizes="(min-width:1280px) 260px, (min-width:768px) 30vw, 50vw"
              className={cn('transition-[filter]', !published && 'grayscale-[60%]')}
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
              <Icon name={item.type === 'video' ? 'videocam' : 'hide_image'} className="text-[32px]" />
            </span>
          )}
          {item.type === 'video' && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/80 text-on-primary shadow-md backdrop-blur-sm">
                <Icon name="play_arrow" filled className="text-[26px]" />
              </span>
            </span>
          )}
        </button>
        <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-1">
          <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg bg-surface-container-lowest/80 p-0.5 shadow-sm backdrop-blur-sm">
            {ctx.handle}
            <button
              type="button"
              onClick={() => ctx.moveBy(-1)}
              disabled={ctx.index === 0}
              aria-label={t('moveEarlier', { name })}
              title={t('moveEarlierShort')}
              className="flex h-8 w-7 items-center justify-center rounded-md text-on-surface-variant hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30"
            >
              <Icon name="arrow_back" className="text-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => ctx.moveBy(1)}
              disabled={ctx.index === ctx.count - 1}
              aria-label={t('moveLater', { name })}
              title={t('moveLaterShort')}
              className="flex h-8 w-7 items-center justify-center rounded-md text-on-surface-variant hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30"
            >
              <Icon name="arrow_forward" className="text-[18px]" />
            </button>
          </div>
          <div className="flex flex-col items-end gap-1">
            {item.type === 'video' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/85 px-2 py-0.5 font-body-md text-[11px] font-semibold text-on-primary">
                <Icon name="videocam" className="text-[13px]" />
                {t('video')}
              </span>
            )}
            {!published && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-highest px-2 py-0.5 font-body-md text-[11px] font-semibold text-on-surface-variant">
                <Icon name="visibility_off" className="text-[13px]" />
                {t('hidden')}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 px-3 pb-2 pt-2.5">
        <p
          className={cn(
            'line-clamp-2 font-body-md text-body-md font-semibold',
            label ? 'text-primary' : 'italic text-outline',
          )}
        >
          {name}
        </p>
        {item.location && (
          <p className="flex min-w-0 items-center gap-1 font-caption text-caption text-on-surface-variant">
            <Icon name="location_on" className="shrink-0 text-[14px]" />
            <span className="truncate">{item.location}</span>
          </p>
        )}
        {categoryLabel && (
          <span className="mt-auto max-w-full self-start truncate rounded-md bg-surface-container px-2 py-0.5 font-body-md text-[11px] font-semibold text-on-surface-variant">
            {categoryLabel}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 border-t border-surface-container px-2 py-1.5">
        <Switch
          size="sm"
          checked={published}
          disabled={busy}
          onCheckedChange={onStatus}
          label={
            <span className="font-caption text-caption font-semibold text-on-surface-variant">
              <span className="max-sm:sr-only">{t('visible')}</span>
              <span className="sr-only">: {name}</span>
            </span>
          }
          className="min-w-0 items-center gap-2"
        />
        <span className="ml-auto flex items-center">
          <IconButton icon="edit" size="sm" label={t('editItem', { name })} onClick={onEdit} />
          <IconButton icon="delete" size="sm" variant="danger" label={t('deleteItem', { name })} onClick={onDelete} />
        </span>
      </div>
    </article>
  )
}
