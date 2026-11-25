import { Skeleton, TextSkeleton } from '@/components/ui/Skeleton'
import { CurationsSkeleton, MapSkeleton } from '@/components/destinations/ExplorerSections'
import { LoadingLabel } from '@/components/ui/LoadingLabel'

/** /destinations skeleton: hero copy + map card, then the curated grid. */
export default function DestinationsLoading() {
  return (
    <div role="status" aria-live="polite">
      <LoadingLabel />
      <section className="w-full bg-surface-container-low px-margin pb-space-3xl pt-space-xl md:px-margin-md lg:px-margin-lg">
        <div aria-hidden="true" className="mx-auto flex max-w-[1440px] flex-col gap-space-xl">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-6 w-72 rounded-full" />
          </div>
          <div className="grid grid-cols-1 items-end gap-gutter-lg lg:grid-cols-12">
            <div className="flex flex-col gap-space-md lg:col-span-8">
              <Skeleton className="h-12 w-full max-w-3xl lg:h-16" />
              <Skeleton className="h-12 w-2/3 lg:h-16" />
              <TextSkeleton lines={3} className="max-w-3xl" />
            </div>
            <Skeleton className="h-28 w-full max-w-sm rounded-xl lg:col-span-4 lg:justify-self-end" />
          </div>
          <MapSkeleton />
        </div>
      </section>
      <section className="mx-auto w-full max-w-[1440px] px-margin py-space-3xl md:px-margin-md lg:px-margin-lg">
        <CurationsSkeleton />
      </section>
    </div>
  )
}
