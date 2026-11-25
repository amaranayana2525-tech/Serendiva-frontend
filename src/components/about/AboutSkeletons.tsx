import { Skeleton, TextSkeleton } from '@/components/ui/Skeleton'
import { LoadingLabel } from '@/components/ui/LoadingLabel'

/** Placeholder for the guest endorsement block while reviews load. */
export function EndorsementSkeleton() {
  return (
    <section className="w-full bg-surface py-space-2xl">
      <div className="mx-auto max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
        <div
          role="status"
          className="grid grid-cols-1 gap-gutter-lg rounded-2xl bg-surface-container p-space-xl md:p-space-2xl lg:grid-cols-12"
        >
          <LoadingLabel />
          <div className="flex flex-col gap-space-sm lg:col-span-4" aria-hidden="true">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-2/3" />
            <TextSkeleton lines={2} />
          </div>
          <div className="rounded-xl bg-surface p-space-xl lg:col-span-8" aria-hidden="true">
            <TextSkeleton lines={4} />
          </div>
        </div>
      </div>
    </section>
  )
}

/** Route-level skeleton for /about (hero split + metrics bar + story columns). */
export function AboutPageSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <LoadingLabel />
      <section className="w-full bg-surface-container-low" aria-hidden="true">
        <div className="mx-auto max-w-[1440px] px-margin pb-space-3xl pt-space-xl md:px-margin-md lg:px-margin-lg">
          <Skeleton className="mb-space-lg h-3 w-56" />
          <div className="grid grid-cols-1 items-center gap-gutter-lg lg:grid-cols-12">
            <div className="flex flex-col gap-space-md lg:col-span-7">
              <Skeleton className="h-7 w-48 rounded-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-4/5" />
              <TextSkeleton lines={3} className="max-w-2xl" />
              <div className="flex gap-space-md pt-space-sm">
                <Skeleton className="h-12 w-44" />
                <Skeleton className="h-12 w-64" />
              </div>
            </div>
            <Skeleton className="aspect-[4/5] w-full rounded-xl lg:col-span-5" />
          </div>
          <Skeleton className="mt-space-2xl h-24 w-full rounded-xl" />
        </div>
      </section>
      <section className="w-full bg-surface py-space-3xl" aria-hidden="true">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-gutter-lg px-margin md:px-margin-md lg:grid-cols-12 lg:px-margin-lg">
          <div className="flex flex-col gap-space-lg lg:col-span-7">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-10 w-3/4" />
            <TextSkeleton lines={8} />
          </div>
          <div className="flex flex-col gap-space-lg lg:col-span-5">
            <Skeleton className="aspect-[16/10] w-full rounded-xl" />
            <Skeleton className="aspect-[16/10] w-full rounded-xl" />
          </div>
        </div>
      </section>
    </div>
  )
}
