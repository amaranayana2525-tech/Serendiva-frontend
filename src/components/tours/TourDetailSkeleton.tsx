import { Skeleton, TextSkeleton } from '@/components/ui/Skeleton'
import { TourAvailabilitySkeleton } from './TourAvailability'
import { LoadingLabel } from '@/components/ui/LoadingLabel'

const container = 'mx-auto w-full max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg'

/** Route-level skeleton for /tours/[slug]: header, gallery bento, sub-nav, content column and inquiry card. */
export function TourDetailSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex w-full flex-col">
      <LoadingLabel />
      <div aria-hidden="true" className="flex w-full flex-col">
        <div className={`${container} pb-space-sm pt-space-md`}>
          <Skeleton className="mb-space-sm h-3.5 w-64" />
        </div>
        <div className={`${container} pb-space-xl`}>
          <div className="mb-space-lg flex flex-col gap-space-sm">
            <div className="flex flex-wrap gap-space-xs">
              {['w-36', 'w-44', 'w-24', 'w-36'].map((width, i) => (
                <Skeleton key={i} className={`h-6 rounded-full ${width}`} />
              ))}
            </div>
            <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-14 w-[min(36rem,80vw)]" />
              </div>
              <Skeleton className="h-16 w-56 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-space-sm md:grid-cols-12">
            <Skeleton className="h-[360px] rounded-xl md:col-span-7 md:h-[500px]" />
            <div className="grid h-[360px] grid-cols-2 gap-space-sm md:col-span-5 md:h-[500px]">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-full rounded-xl" />
              ))}
            </div>
          </div>
          <Skeleton className="mt-space-md h-14 w-full rounded-xl" />
        </div>
        <div className="border-b border-surface-container bg-surface/95 py-space-sm shadow-sm">
          <div className={`${container} flex gap-space-lg overflow-hidden`}>
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-6 w-28 shrink-0" />
            ))}
          </div>
        </div>
        <div className={`${container} py-space-2xl`}>
          <div className="grid grid-cols-1 items-start gap-space-xl lg:grid-cols-12">
            <div className="flex flex-col gap-space-lg lg:col-span-8">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-48 w-full rounded-xl" />
              <TextSkeleton lines={4} />
              <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-space-lg lg:col-span-4">
              <div className="overflow-hidden rounded-xl bg-surface-container shadow-xl">
                <Skeleton className="h-28 rounded-none bg-primary/30" />
                <div className="flex flex-col gap-space-md p-space-lg">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
              <TourAvailabilitySkeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
