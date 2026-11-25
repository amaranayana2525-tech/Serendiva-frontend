import { Skeleton } from '@/components/ui/Skeleton'
import { QuizWizardSkeleton } from '@/components/quiz/QuizWizardSkeleton'

/** Route skeleton: hero lines + the wizard placeholder. */
export default function TripQuizLoading() {
  return (
    <>
      <div aria-hidden="true" className="flex flex-col items-center gap-space-md px-margin pb-space-lg pt-space-xl">
        <Skeleton className="h-7 w-80 max-w-full rounded-full" />
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Skeleton className="h-5 w-full max-w-xl" />
        <Skeleton className="h-5 w-full max-w-lg" />
      </div>
      <QuizWizardSkeleton />
    </>
  )
}
