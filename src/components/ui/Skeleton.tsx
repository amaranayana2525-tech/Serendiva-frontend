import { cn } from '@/lib/utils'
import { Container } from './Container'
import { LoadingLabel } from './LoadingLabel'

/** Pulsing placeholder block. Size it with className (h-*, w-*, rounded-*). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-surface-container-high/70', className)} />
}

/** Lines of text placeholder. */
export function TextSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}

/** Shape of a tour/blog card (image on top, text below). */
export function CardSkeleton({ imageClassName = 'h-64', className }: { imageClassName?: string; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-md', className)}
    >
      <Skeleton className={cn('rounded-none', imageClassName)} />
      <div className="flex flex-col gap-space-sm p-space-lg">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
        <TextSkeleton lines={2} className="pt-space-xs" />
        <div className="flex gap-space-sm pt-space-md">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </div>
    </div>
  )
}

/** Photo tile (category / destination mosaic). */
export function TileSkeleton({ className = 'aspect-[4/3]' }: { className?: string }) {
  return <Skeleton className={cn('rounded-2xl', className)} />
}

/** Review card placeholder. */
export function ReviewSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('flex flex-col gap-space-md rounded-2xl bg-surface-container-low p-space-lg', className)}
    >
      <Skeleton className="h-4 w-24" />
      <TextSkeleton lines={4} />
      <div className="flex items-center gap-3 pt-space-xs">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  )
}

export interface SectionSkeletonProps {
  /** Number of items in the grid. */
  count?: number
  /** 'cards' (tour/blog cards) · 'tiles' (photo tiles) · 'reviews' · 'text'. */
  variant?: 'cards' | 'tiles' | 'reviews' | 'text'
  /** Grid columns classes. */
  gridClassName?: string
  /** Wrap in <Container> + section padding (default true). */
  contained?: boolean
  className?: string
}

/** Fallback for a data-driven section inside <Suspense>. Announces "Loading…" to screen readers. */
export function SectionSkeleton({
  count = 3,
  variant = 'cards',
  gridClassName,
  contained = true,
  className,
}: SectionSkeletonProps) {
  const grid =
    gridClassName ??
    (variant === 'tiles' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3')
  const body = (
    <div role="status" aria-live="polite" className={cn('flex flex-col gap-space-2xl', className)}>
      <LoadingLabel />
      <div className="flex flex-col gap-space-xs" aria-hidden="true">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-2/3 max-w-xl" />
      </div>
      {variant === 'text' ? (
        <TextSkeleton lines={6} />
      ) : (
        <div className={cn('grid gap-gutter-lg', grid)}>
          {Array.from({ length: count }, (_, i) =>
            variant === 'tiles' ? (
              <TileSkeleton key={i} />
            ) : variant === 'reviews' ? (
              <ReviewSkeleton key={i} />
            ) : (
              <CardSkeleton key={i} />
            ),
          )}
        </div>
      )}
    </div>
  )
  return contained ? <Container className="py-space-3xl">{body}</Container> : body
}
