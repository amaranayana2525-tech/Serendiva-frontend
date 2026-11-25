import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import { LoadingLabel } from '@/components/ui/LoadingLabel'

const PLACEHOLDER_ROWS = [
  ['lg:col-span-8 h-[420px] md:h-[500px]', 'lg:col-span-4 h-[420px] md:h-[500px]'],
  ['lg:col-span-4 h-[360px]', 'lg:col-span-4 h-[360px]', 'lg:col-span-4 h-[360px]'],
] as const

/** Grid placeholder with the first two rows of the Stitch rhythm. */
export function GalleryGridSkeleton() {
  return (
    <div role="status" className="grid grid-cols-1 gap-gutter-lg md:grid-cols-2 lg:grid-cols-12">
      <LoadingLabel />
      {PLACEHOLDER_ROWS.flat().map((classes, i) => (
        <Skeleton key={i} className={cn('w-full rounded-xl', classes)} />
      ))}
    </div>
  )
}

/** Route-level skeleton for /gallery. */
export function GalleryPageSkeleton() {
  return (
    <div>
      <div className="w-full bg-surface-container-low/70 py-space-sm" aria-hidden="true">
        <div className="mx-auto max-w-[1440px] px-margin lg:px-margin-lg">
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div
        className="w-full bg-gradient-to-b from-surface-container-low via-surface to-surface pb-space-xl pt-space-2xl"
        aria-hidden="true"
      >
        <div className="mx-auto flex max-w-[1440px] flex-col gap-space-sm px-margin lg:px-margin-lg">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-14 w-full max-w-2xl" />
          <Skeleton className="h-5 w-full max-w-xl" />
          <Skeleton className="mt-space-xl h-8 w-full max-w-4xl rounded-full" />
        </div>
      </div>
      <div className="mx-auto max-w-[1440px] px-margin pb-space-3xl lg:px-margin-lg">
        <GalleryGridSkeleton />
      </div>
    </div>
  )
}
