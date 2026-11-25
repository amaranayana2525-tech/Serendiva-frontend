import { Container } from '@/components/ui/Container'
import { Skeleton, TextSkeleton } from '@/components/ui/Skeleton'
import { LoadingLabel } from '@/components/ui/LoadingLabel'

/** Route skeleton: breadcrumb strip, teal hero and the four pillar cards. */
export default function ResponsibleTravelLoading() {
  return (
    <div role="status" aria-live="polite" className="w-full">
      <LoadingLabel />
      <div aria-hidden="true" className="w-full bg-surface-container-low py-space-sm">
        <Container>
          <Skeleton className="h-3 w-48" />
        </Container>
      </div>
      <div aria-hidden="true" className="w-full bg-primary">
        <Container className="flex flex-col gap-space-md py-space-3xl lg:py-[7rem]">
          <Skeleton className="h-7 w-72 rounded-full bg-primary-container" />
          <Skeleton className="h-14 w-full max-w-2xl bg-primary-container" />
          <Skeleton className="h-14 w-2/3 max-w-xl bg-primary-container" />
          <Skeleton className="h-16 w-full max-w-2xl bg-primary-container" />
        </Container>
      </div>
      <Container aria-hidden="true" className="flex flex-col gap-space-2xl py-space-3xl">
        <div className="flex flex-col gap-space-xs">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-10 w-2/3 max-w-xl" />
        </div>
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-space-md rounded-xl bg-surface-container p-space-lg">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-6 w-3/4" />
              <TextSkeleton lines={4} />
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}
