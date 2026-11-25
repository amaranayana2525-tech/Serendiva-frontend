'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { GalleryItem } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'
import { CATEGORY_PARAM, resolveCategory } from './GalleryFilters'
import { galleryLayout, SPAN_CLASS, SPAN_SIZES, type PlateSlot } from './layout'
import { MediaLightboxLazy } from './MediaLightboxLazy'
import { useUrlParams } from './useUrlParams'

const pad = (n: number) => String(n).padStart(2, '0')

/** Per-variant styling copied from the Stitch plates (image height, scrim, type sizes). */
const VARIANTS = {
  feature: {
    media: 'h-[420px] md:h-[500px]',
    scrim: 'from-primary/80 via-transparent to-black/20',
    label: 'tracking-[0.2em]',
    title: 'mt-0.5 font-headline-lg text-headline-lg',
    caption: 'mt-1 max-w-xl text-on-primary/90',
  },
  tall: {
    media: 'h-[420px] md:h-[500px]',
    scrim: 'from-primary/85 via-primary/20 to-transparent',
    label: 'tracking-[0.2em]',
    title: 'mt-1 font-headline-md text-headline-md',
    caption: 'mt-1 text-on-primary/80',
  },
  standard: {
    media: 'h-[360px]',
    scrim: 'from-primary/80 via-transparent to-transparent',
    label: 'tracking-wider',
    title: 'mt-1 font-headline-md text-headline-md',
    caption: 'mt-0.5 text-on-primary/80',
  },
  wide: {
    media: 'h-[380px]',
    scrim: 'from-primary/90 via-primary/30 to-transparent',
    label: 'tracking-wider',
    title: 'mt-1 font-headline-md text-headline-md',
    caption: 'mt-0.5 text-on-primary/80',
  },
  compact: {
    media: 'h-[340px]',
    scrim: 'from-primary/85 via-transparent to-transparent',
    label: 'tracking-wider',
    title: 'mt-1 font-headline-sm text-headline-sm',
    caption: '',
  },
  panorama: {
    media: 'h-[340px] md:h-[420px]',
    scrim: 'from-primary/90 via-primary/30 to-transparent',
    label: 'tracking-[0.2em]',
    title: 'mt-1 font-headline-lg text-headline-lg',
    caption: 'mt-1 max-w-xl font-body-lg text-body-lg text-on-primary/85',
  },
} as const

interface PlateProps {
  item: GalleryItem
  slot: PlateSlot
  number: number
  total: number
  categoryLabel: string
  priority: boolean
  onOpen?: () => void
}

function Plate({ item, slot, number, total, categoryLabel, priority, onOpen }: PlateProps) {
  const t = useTranslations('gallery.grid')
  const v = VARIANTS[slot.variant]
  const compact = slot.variant === 'compact'
  const panorama = slot.variant === 'panorama'
  const title = item.title ?? item.image?.alt ?? t('untitled')
  const label = compact
    ? t('plateShort', { number: pad(number), category: categoryLabel })
    : t('plateLong', { number: pad(number), category: categoryLabel })

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-500 hover:shadow-xl',
        SPAN_CLASS[slot.span],
      )}
    >
      <div className={cn('relative w-full overflow-hidden bg-surface-container', v.media)}>
        <SmartImage
          image={item.image}
          fill
          priority={priority}
          sizes={SPAN_SIZES[slot.span]}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 bg-gradient-to-t', v.scrim)} />
        <div
          className={cn(
            'absolute bottom-space-md left-space-md right-space-md text-on-primary',
            panorama && 'bottom-space-lg md:left-space-xl md:right-space-xl',
          )}
        >
          <span className={cn('font-label-md text-label-md uppercase text-secondary-fixed', v.label)}>{label}</span>
          <h3 className={cn('text-on-primary', v.title)}>{title}</h3>
          {!compact && item.caption && <p className={cn('font-body-md text-body-md', v.caption)}>{item.caption}</p>}
        </div>
      </div>
      {compact ? (
        <div className="bg-surface-container-lowest p-space-sm px-space-md font-caption text-caption text-on-surface-variant">
          {item.location ?? categoryLabel}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-lowest p-space-md font-caption text-caption text-on-surface-variant">
          <span className="flex items-center gap-1">
            {item.location && (
              <>
                <Icon name="pin_drop" className="text-[16px] text-primary" />
                {item.location}
              </>
            )}
          </span>
          <span className="flex items-center gap-1 transition-colors group-hover:text-primary">
            {t('view')}
            <Icon name="open_in_full" className="text-[14px]" />
          </span>
        </div>
      )}
      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          aria-label={t('open', { title, number, total })}
          className="absolute inset-0 z-10 cursor-zoom-in rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-secondary"
        />
      )}
    </article>
  )
}

export interface GalleryGridViewProps {
  items: GalleryItem[]
  categoryLabels: Record<string, string>
  onOpen?: (index: number) => void
  onShowAll?: () => void
}

/** Stitch "Editorial Asymmetric Masonry Showcase" — 12-column editorial grid with the repeating row rhythm. */
export function GalleryGridView({ items, categoryLabels, onOpen, onShowAll }: GalleryGridViewProps) {
  const t = useTranslations('gallery.grid')
  const slots = useMemo(() => galleryLayout(items.length), [items.length])

  if (items.length === 0) {
    return (
      <EmptyState
        icon="photo_library"
        title={t('emptyTitle')}
        body={t('emptyBody')}
        action={
          onShowAll ? (
            <button
              type="button"
              onClick={onShowAll}
              className="rounded-lg bg-primary px-space-lg py-space-sm font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {t('showAll')}
            </button>
          ) : undefined
        }
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-gutter-lg md:grid-cols-2 lg:grid-cols-12">
      {items.map((item, index) => (
        <Plate
          key={item.id}
          item={item}
          slot={slots[index]!}
          number={index + 1}
          total={items.length}
          categoryLabel={categoryLabels[item.category] ?? item.category}
          priority={index === 0}
          onOpen={onOpen ? () => onOpen(index) : undefined}
        />
      ))}
    </div>
  )
}

/** URL-filtered (`?category=`) grid + accessible lightbox. Render inside <Suspense> (useSearchParams). */
export function GalleryGrid({
  items,
  categoryLabels,
  lightboxLabel,
}: {
  items: GalleryItem[]
  categoryLabels: Record<string, string>
  lightboxLabel: string
}) {
  const { params, update } = useUrlParams()
  const categories = useMemo(() => Object.keys(categoryLabels).map((slug) => ({ slug })), [categoryLabels])
  const active = resolveCategory(params.get(CATEGORY_PARAM), categories)
  const visible = useMemo(() => (active ? items.filter((i) => i.category === active) : items), [items, active])
  const [open, setOpen] = useState<number | null>(null)

  return (
    <>
      <GalleryGridView
        items={visible}
        categoryLabels={categoryLabels}
        onOpen={setOpen}
        onShowAll={() => update({ [CATEGORY_PARAM]: null })}
      />
      <MediaLightboxLazy
        label={lightboxLabel}
        items={visible.map((i) => ({
          id: i.id,
          type: 'image' as const,
          image: i.image,
          title: i.title,
          caption: i.caption,
          location: i.location,
        }))}
        index={open !== null && open < visible.length ? open : null}
        onClose={() => setOpen(null)}
        onIndexChange={setOpen}
      />
    </>
  )
}
