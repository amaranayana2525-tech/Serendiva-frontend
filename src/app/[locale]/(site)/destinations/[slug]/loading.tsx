import { Skeleton, TextSkeleton } from '@/components/ui/Skeleton'
import { LoadingLabel } from '@/components/ui/LoadingLabel'

/** Destination detail skeleton: teal hero, overlapping facts bar, 70/30 content + sticky inquiry card. */
export default function DestinationLoading() {
  return (
    <div role="status" aria-live="polite">
      <LoadingLabel />
      <section aria-hidden="true" className="relative -mt-20 w-full bg-primary">
        <div className="mx-auto flex min-h-[720px] max-w-[1440px] flex-col justify-end gap-space-md px-margin pb-28 pt-36 md:px-margin-md md:pb-36 md:pt-44 lg:px-margin-lg">
          <div className="h-4 w-72 animate-pulse rounded bg-surface/15" />
          <div className="h-8 w-64 animate-pulse rounded-full bg-surface/15" />
          <div className="h-14 w-full max-w-4xl animate-pulse rounded-lg bg-surface/15 md:h-16" />
          <div className="h-14 w-2/3 max-w-3xl animate-pulse rounded-lg bg-surface/15 md:h-16" />
          <div className="h-20 w-full max-w-3xl animate-pulse rounded-lg bg-surface/10" />
        </div>
      </section>
      <div
        aria-hidden="true"
        className="relative z-20 mx-auto -mt-10 w-full max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg"
      >
        <div className="grid grid-cols-1 gap-gutter rounded-xl bg-surface-container-lowest p-space-lg shadow-md sm:grid-cols-2 md:p-space-xl lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-start gap-space-md">
              <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <section
        aria-hidden="true"
        className="mx-auto my-space-3xl w-full max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg"
      >
        <div className="grid grid-cols-1 items-start gap-gutter-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-3xl lg:col-span-8">
            <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-xl md:p-space-2xl">
              <div className="flex items-center gap-space-md">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-8 w-2/3" />
              <TextSkeleton lines={6} />
            </div>
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
          <Skeleton className="h-[640px] w-full rounded-xl lg:col-span-4" />
        </div>
      </section>
    </div>
  )
}
