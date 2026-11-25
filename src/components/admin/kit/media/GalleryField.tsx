'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { compactOptional, type AdminLocale, type Translatable } from '@/lib/admin/translatable'
import type { AdminMediaRef } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { Button, IconButton } from '../Button'
import { SortableList } from '../SortableList'
import { MediaPicker } from './MediaPicker'
import { MediaThumb, toMediaRef } from './MediaThumb'

/** Caption of one gallery image in one locale (tour/destination galleries, gallery bulk). */
export interface GalleryCaption {
  title?: string
  caption?: string
}

/** One gallery entry as records return it (`gallery[]`: `{ mediaId, media, caption }`). */
export interface GalleryFieldItem {
  mediaId: string
  media: AdminMediaRef
  caption?: Translatable<GalleryCaption> | null
}

/** Write shape for the API: `{ mediaId, caption }[]` with empty caption locales dropped (null when none). */
export function toGalleryWrite(items: readonly GalleryFieldItem[]): { mediaId: string; caption: Translatable<GalleryCaption> | null }[] {
  return items.map((item) => ({ mediaId: item.mediaId, caption: compactOptional(item.caption ?? null) }))
}

export interface GalleryFieldProps {
  label: string
  value: readonly GalleryFieldItem[]
  onChange: (items: GalleryFieldItem[]) => void
  /** Edit captions (title + caption) for this locale. Omit `captions` or pass false for photo-only lists. */
  captions?: boolean
  locale?: AdminLocale
  max?: number
  hint?: ReactNode
  error?: string | null
  folder?: string
  className?: string
}

/**
 * Multiple images: add from the media library (multi-select + upload), drag/keyboard reorder, per-image caption
 * (title + caption in the active locale; English shown as placeholder), remove.
 */
export function GalleryField({
  label,
  value,
  onChange,
  captions = true,
  locale = 'en',
  max,
  hint,
  error,
  folder,
  className,
}: GalleryFieldProps) {
  const t = useTranslations('admin.kit.media')
  const [open, setOpen] = useState(false)
  const remaining = max === undefined ? undefined : Math.max(0, max - value.length)

  const updateCaption = (index: number, patch: GalleryCaption) => {
    onChange(
      value.map((item, i) => {
        if (i !== index) return item
        const caption = { ...(item.caption ?? {}) }
        caption[locale] = { ...(caption[locale] ?? {}), ...patch }
        return { ...item, caption }
      }),
    )
  }

  const inputClass =
    'block w-full rounded-md border border-outline-variant bg-surface-container-lowest px-2.5 py-1.5 font-body-md text-[13px] placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25'

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-end justify-between gap-2">
        <p className="font-body-md text-[13px] font-semibold text-on-surface">
          {label}
          <span className="ml-1.5 font-normal text-on-surface-variant">
            ({value.length}
            {max !== undefined ? ` / ${max}` : ''})
          </span>
        </p>
        <Button size="sm" icon="add_photo_alternate" onClick={() => setOpen(true)} disabled={remaining === 0}>
          {t('addImages')}
        </Button>
      </div>
      {hint && !error && <p className="font-caption text-caption text-on-surface-variant">{hint}</p>}

      {value.length === 0 ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-outline-variant px-4 py-8 text-on-surface-variant hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Icon name="photo_library" className="text-[28px]" />
          <span className="font-body-md text-body-md">{t('galleryEmpty')}</span>
        </button>
      ) : (
        <SortableList
          items={value}
          getKey={(item) => item.mediaId}
          label={label}
          itemLabel={(item, i) => item.caption?.en?.title || item.media.alt || t('imageN', { n: i + 1 })}
          onReorder={(items) => onChange(items)}
          renderItem={(item, ctx) => {
            const own = item.caption?.[locale] ?? {}
            const en = item.caption?.en ?? {}
            return (
              <div className="flex items-start gap-2 rounded-xl border border-surface-container-high bg-surface-container-lowest p-2">
                <div className="flex flex-col items-center gap-0.5 pt-1">{ctx.handle}</div>
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md bg-surface-container sm:h-24 sm:w-32">
                  <MediaThumb media={item.media} sizes="128px" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  {captions ? (
                    <>
                      <label className="sr-only" htmlFor={`${item.mediaId}-title`}>
                        {t('captionTitle')}
                      </label>
                      <input
                        id={`${item.mediaId}-title`}
                        value={own.title ?? ''}
                        maxLength={120}
                        lang={locale}
                        placeholder={locale !== 'en' && en.title ? en.title : t('captionTitle')}
                        onChange={(e) => updateCaption(ctx.index, { title: e.target.value })}
                        className={inputClass}
                      />
                      <label className="sr-only" htmlFor={`${item.mediaId}-caption`}>
                        {t('captionText')}
                      </label>
                      <input
                        id={`${item.mediaId}-caption`}
                        value={own.caption ?? ''}
                        maxLength={200}
                        lang={locale}
                        placeholder={locale !== 'en' && en.caption ? en.caption : t('captionText')}
                        onChange={(e) => updateCaption(ctx.index, { caption: e.target.value })}
                        className={inputClass}
                      />
                    </>
                  ) : (
                    <p className="truncate font-caption text-caption text-on-surface-variant">
                      {item.media.alt || t('altMissing')}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <span className="hidden sm:inline-flex">{ctx.moveButtons}</span>
                  <IconButton
                    icon="delete"
                    size="sm"
                    variant="danger"
                    label={t('removeImage', { n: ctx.index + 1 })}
                    onClick={() => onChange(value.filter((_, i) => i !== ctx.index))}
                  />
                </div>
              </div>
            )
          }}
        />
      )}
      {error && (
        <p className="flex items-start gap-1 font-caption text-caption text-error">
          <Icon name="error" className="mt-px text-[14px]" />
          {error}
        </p>
      )}
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        multiple
        max={remaining}
        folder={folder}
        onSelect={(media) => {
          const existing = new Set(value.map((v) => v.mediaId))
          const added = media
            .filter((m) => !existing.has(m.id))
            .map<GalleryFieldItem>((m) => ({ mediaId: m.id, media: toMediaRef(m), caption: null }))
          onChange([...value, ...added])
        }}
      />
    </div>
  )
}
