'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useUrlParams } from './useUrlParams'

export interface GalleryCategoryOption {
  slug: string
  label: string
  count: number
}

export const CATEGORY_PARAM = 'category'

/** The active category from the URL, or null for "all" (unknown slugs fall back to all). */
export function resolveCategory(value: string | null, categories: { slug: string }[]): string | null {
  return value && categories.some((c) => c.slug === value) ? value : null
}

interface GalleryFiltersViewProps {
  categories: GalleryCategoryOption[]
  total: number
  active: string | null
  onSelect?: (slug: string | null) => void
}

/** Stitch "Curated Category Filters" chip row (horizontal scroll on small screens). */
export function GalleryFiltersView({ categories, total, active, onSelect }: GalleryFiltersViewProps) {
  const t = useTranslations('gallery.filters')
  const shown = active ? (categories.find((c) => c.slug === active)?.count ?? 0) : total
  const chip = (slug: string | null, label: string, count: number) => {
    const isActive = active === slug
    return (
      <button
        key={slug ?? 'all'}
        type="button"
        aria-pressed={isActive}
        onClick={() => onSelect?.(slug)}
        className={cn(
          'tap-target relative whitespace-nowrap rounded-full px-space-md py-space-xs font-label-md text-label-md uppercase tracking-wider transition-all duration-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          isActive
            ? 'bg-primary text-on-primary shadow-sm hover:scale-[1.02]'
            : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-primary',
        )}
      >
        {label} {t('count', { count })}
      </button>
    )
  }
  return (
    <div className="no-scrollbar relative mt-space-xl overflow-x-auto pt-space-md coarse:-mb-2">
      <div
        role="group"
        aria-label={t('label')}
        className="flex min-w-max items-center gap-space-xs pb-space-xs coarse:pb-3"
      >
        {chip(null, t('all'), total)}
        {categories.map((c) => chip(c.slug, c.label, c.count))}
      </div>
      <p aria-live="polite" className="sr-only">
        {t('results', { count: shown })}
      </p>
    </div>
  )
}

/** URL-synced (`?category=`) gallery filter chips. Render inside <Suspense> (useSearchParams). */
export function GalleryFilters(props: Omit<GalleryFiltersViewProps, 'active' | 'onSelect'>) {
  const { params, update } = useUrlParams()
  const active = resolveCategory(params.get(CATEGORY_PARAM), props.categories)
  return <GalleryFiltersView {...props} active={active} onSelect={(slug) => update({ [CATEGORY_PARAM]: slug })} />
}
