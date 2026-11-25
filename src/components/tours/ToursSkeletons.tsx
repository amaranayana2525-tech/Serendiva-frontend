import { CardSkeleton, Skeleton, TextSkeleton } from '@/components/ui/Skeleton'
import { LoadingLabel } from '@/components/ui/LoadingLabel'

const container = 'mx-auto w-full max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg'

/** Filter bar + tour grid placeholder (Suspense fallback of the catalogue). */
export function ToursCatalogueSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div role="status" aria-live="polite" className="w-full">
      <LoadingLabel />
      <div aria-hidden="true" className="bg-surface/95 py-space-md shadow-sm">
        <div className={`${container} flex flex-col gap-space-md`}>
          <div className="flex flex-col items-center justify-between gap-gutter lg:flex-row">
            <Skeleton className="h-10 w-full rounded-xl lg:w-96" />
            <div className="flex w-full items-center justify-between gap-space-lg lg:w-auto">
              <Skeleton className="h-10 w-48 rounded-xl" />
              <Skeleton className="h-7 w-64 rounded-full" />
            </div>
          </div>
          <div className="flex gap-space-xs overflow-hidden">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-7 w-32 shrink-0 rounded-full" />
            ))}
          </div>
        </div>
      </div>
      <div className={`${container} py-space-2xl`}>
        <div className="grid grid-cols-1 gap-gutter-lg md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cards }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

/** FAQ grid placeholder. */
export function ToursFaqSkeleton() {
  return (
    <div aria-hidden="true" className={`${container} py-space-2xl`}>
      <div className="mx-auto mb-space-2xl flex max-w-2xl flex-col items-center gap-space-sm">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-10 w-96 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="flex flex-col gap-space-sm rounded-xl bg-surface-container-lowest p-space-lg shadow-sm"
          >
            <Skeleton className="h-6 w-3/4" />
            <TextSkeleton lines={3} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Route-level skeleton for /tours (loading.tsx): hero, stats card, filter bar and grid. */
export function ToursPageSkeleton() {
  return (
    <div className="flex w-full flex-col">
      <div className="relative w-full pb-space-2xl">
        <div className="flex min-h-[520px] w-full flex-col justify-end bg-surface-container-high/70 lg:min-h-[620px]">
          <div aria-hidden="true" className={`${container} flex flex-col gap-space-sm pb-space-xl`}>
            <Skeleton className="h-3.5 w-40 bg-surface/50" />
            <Skeleton className="h-6 w-64 rounded-full bg-surface/50" />
            <Skeleton className="h-14 w-full max-w-2xl bg-surface/50" />
            <Skeleton className="h-6 w-full max-w-xl bg-surface/50" />
          </div>
        </div>
        <div aria-hidden="true" className={`${container} relative z-20 -mt-10`}>
          <div className="grid grid-cols-1 gap-gutter rounded-xl bg-surface-container-lowest p-space-lg shadow-xl md:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-space-md">
                <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3.5 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ToursCatalogueSkeleton />
    </div>
  )
}
