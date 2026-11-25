import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { CardSkeleton, ReviewSkeleton, Skeleton, TextSkeleton, TileSkeleton } from '@/components/ui/Skeleton'

/** Live "Loading…" wrapper for a section's Suspense fallback (the section heading itself is never suspended). */
function Loading({ children, className }: { children: ReactNode; className?: string }) {
  const t = useTranslations('common.a11y')
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{t('loading')}</span>
      <div aria-hidden="true" className="contents">
        {children}
      </div>
    </div>
  )
}

/** Quick-inquiry bar placeholder (same box as the real bar, so the hero does not jump). */
export function QuickInquiryBarSkeleton() {
  return (
    <Loading className="rounded-2xl bg-surface p-space-md shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
      <div className="grid grid-cols-1 items-center gap-space-md sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-[46px] rounded-xl" />
          </div>
        ))}
        <div className="flex items-end pt-2 lg:pt-0">
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </Loading>
  )
}

export function CategoryGridSkeleton() {
  return (
    <Loading className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }, (_, i) => (
        <TileSkeleton key={i} className="aspect-[4/3]" />
      ))}
    </Loading>
  )
}

export function FeaturedToursSkeleton() {
  return (
    <Loading className="grid grid-cols-1 gap-gutter-lg md:grid-cols-2">
      {Array.from({ length: 4 }, (_, i) => (
        <CardSkeleton key={i} imageClassName="h-72" className="rounded-2xl bg-surface shadow-lg" />
      ))}
    </Loading>
  )
}

/** Same aspect rhythm as the mosaic (tall/short on phones, uniform 3:4 from md). */
export const MOSAIC_ASPECTS = [
  'aspect-[3/4]',
  'aspect-[4/3] md:aspect-[3/4]',
  'aspect-[4/3] md:aspect-[3/4]',
  'aspect-[3/4]',
  'aspect-[3/4]',
  'aspect-[4/3] md:aspect-[3/4]',
  'aspect-[4/3] md:aspect-[3/4]',
  'aspect-[3/4]',
] as const

export function MosaicSkeleton() {
  return (
    <Loading className="grid grid-cols-1 gap-space-md md:grid-cols-3 lg:grid-cols-4">
      {MOSAIC_ASPECTS.map((aspect, i) => (
        <TileSkeleton key={i} className={aspect} />
      ))}
    </Loading>
  )
}

export function ReviewsSkeleton() {
  return (
    <Loading className="flex flex-col gap-space-2xl">
      <div className="flex flex-col items-center gap-space-sm rounded-2xl bg-surface-container p-space-xl">
        <Skeleton className="h-9 w-9 rounded-full" />
        <TextSkeleton lines={3} className="w-full max-w-3xl" />
        <Skeleton className="mt-2 h-3 w-48" />
      </div>
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <ReviewSkeleton key={i} className={cn(i > 0 && 'hidden md:flex')} />
        ))}
      </div>
    </Loading>
  )
}

export function FaqSkeleton() {
  return (
    <Loading className="flex flex-col gap-space-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} className={cn('rounded-xl', i === 0 ? 'h-40' : 'h-[60px]')} />
      ))}
    </Loading>
  )
}

export function StoriesSkeleton() {
  return (
    <Loading className="grid grid-cols-1 gap-gutter md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <CardSkeleton key={i} imageClassName="h-56" className="rounded-2xl bg-surface shadow-sm" />
      ))}
    </Loading>
  )
}
