import { Skeleton, TextSkeleton } from '@/components/ui/Skeleton'
import { LoadingLabel } from '@/components/ui/LoadingLabel'

export default function ShareReviewLoading() {
  return (
    <div role="status" aria-live="polite">
      <LoadingLabel />
      <div className="w-full bg-surface-container-low py-space-2xl md:py-space-3xl" aria-hidden="true">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-space-md px-margin md:px-margin-md lg:px-margin-lg">
          <Skeleton className="h-3 w-72" />
          <Skeleton className="h-7 w-44 rounded-full" />
          <Skeleton className="h-14 w-full max-w-3xl" />
          <TextSkeleton lines={2} className="max-w-2xl" />
        </div>
      </div>
      <div className="w-full bg-surface py-space-2xl md:py-space-3xl" aria-hidden="true">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-gutter-lg px-margin md:px-margin-md lg:grid-cols-12 lg:px-margin-lg">
          <div className="flex flex-col gap-space-md rounded-xl p-space-lg shadow-xl md:p-space-2xl lg:col-span-8">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
          <Skeleton className="h-72 w-full rounded-xl lg:col-span-4" />
        </div>
      </div>
    </div>
  )
}
