import { Skeleton, TextSkeleton } from '@/components/ui/Skeleton'
import { LoadingLabel } from '@/components/ui/LoadingLabel'

/** Placeholder for the stepper card + first question while tours load. */
export function QuizWizardSkeleton() {
  return (
    <section className="px-margin pb-space-2xl md:px-margin-md lg:px-margin-lg">
      <div role="status" aria-live="polite" className="mx-auto max-w-[1180px]">
        <LoadingLabel />
        <div
          aria-hidden="true"
          className="mb-space-xl rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg"
        >
          <div className="mb-space-md flex items-center gap-space-sm">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
          <div className="mt-space-sm hidden grid-cols-4 gap-space-sm sm:grid">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex flex-col gap-1 py-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
        <div aria-hidden="true" className="mb-space-lg flex flex-col items-center gap-space-xs md:items-start">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full max-w-xl" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <div aria-hidden="true" className="grid grid-cols-1 gap-space-md md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col gap-space-md rounded-xl bg-surface-container p-space-lg shadow-sm">
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <TextSkeleton lines={2} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
