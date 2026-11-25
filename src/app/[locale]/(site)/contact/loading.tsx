import { ConciergeCardSkeleton } from '@/components/contact/ConciergeCard'
import { Container } from '@/components/ui/Container'
import { Skeleton, TextSkeleton } from '@/components/ui/Skeleton'
import { LoadingLabel } from '@/components/ui/LoadingLabel'

/** /contact skeleton: hero copy, planner card with step tabs, concierge column. */
export default function ContactLoading() {
  return (
    <div role="status" aria-live="polite" className="w-full">
      <LoadingLabel />
      <Container className="pb-space-lg pt-space-xl" aria-hidden="true">
        <Skeleton className="mb-space-lg h-4 w-40" />
        <Skeleton className="mb-space-md h-7 w-96 max-w-full rounded-full" />
        <Skeleton className="mb-space-md h-14 w-full max-w-3xl" />
        <TextSkeleton lines={3} className="max-w-3xl" />
      </Container>
      <Container className="pb-space-3xl" aria-hidden="true">
        <div className="grid grid-cols-1 items-start gap-gutter-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-lg rounded-xl bg-surface-container-lowest p-space-md shadow-xl md:p-space-xl lg:col-span-8">
            <div className="grid grid-cols-2 gap-space-sm md:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-2/3" />
            <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 md:grid-cols-3">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <div className="lg:col-span-4">
            <ConciergeCardSkeleton />
          </div>
        </div>
      </Container>
    </div>
  )
}
