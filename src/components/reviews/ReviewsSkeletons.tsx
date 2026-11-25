import { Skeleton, TextSkeleton } from '@/components/ui/Skeleton'
import { LoadingLabel } from '@/components/ui/LoadingLabel'

/** Placeholder for the filter console + review grid while reviews load. */
export function ReviewsGridSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <LoadingLabel />
      <div className="w-full bg-surface py-space-xl shadow-sm" aria-hidden="true">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-space-md px-margin md:px-margin-md lg:px-margin-lg">
          <div className="flex gap-space-xs overflow-hidden">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-40 shrink-0 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-7 w-full max-w-3xl" />
        </div>
      </div>
      <div className="w-full bg-surface-container-low py-space-2xl" aria-hidden="true">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-gutter-lg px-margin md:grid-cols-2 md:px-margin-md lg:grid-cols-3 lg:px-margin-lg">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col gap-space-md rounded-xl bg-surface p-space-xl shadow-md">
              <div className="flex items-center gap-space-md">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-4 w-32" />
              <TextSkeleton lines={5} />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Route-level skeleton for /reviews (hero + console + grid). */
export function ReviewsPageSkeleton() {
  return (
    <div>
      <div className="w-full bg-surface-container-low py-space-2xl md:py-space-3xl" aria-hidden="true">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-end gap-gutter-lg px-margin md:px-margin-md lg:grid-cols-12 lg:px-margin-lg">
          <div className="flex flex-col gap-space-md lg:col-span-8">
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-7 w-52 rounded-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-3/4" />
            <TextSkeleton lines={3} className="max-w-2xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-xl lg:col-span-4" />
        </div>
      </div>
      <ReviewsGridSkeleton />
    </div>
  )
}
