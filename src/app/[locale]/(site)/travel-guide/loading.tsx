import { Container } from '@/components/ui/Container'
import { Skeleton, TextSkeleton } from '@/components/ui/Skeleton'
import { LoadingLabel } from '@/components/ui/LoadingLabel'

/** Route skeleton: masthead, sidebar card and the first chapters. */
export default function TravelGuideLoading() {
  return (
    <div role="status" aria-live="polite" className="w-full">
      <LoadingLabel />
      <div aria-hidden="true" className="w-full bg-surface-container-low">
        <Container className="flex flex-col gap-space-md pb-space-3xl pt-space-lg">
          <Skeleton className="mb-space-lg h-3 w-64" />
          <Skeleton className="h-7 w-full max-w-xl rounded-full" />
          <Skeleton className="h-14 w-full max-w-2xl" />
          <Skeleton className="h-14 w-2/3 max-w-lg" />
          <TextSkeleton lines={3} className="max-w-2xl" />
          <Skeleton className="mt-space-sm h-12 w-full max-w-xl rounded-xl" />
        </Container>
      </div>
      <Container aria-hidden="true" className="grid grid-cols-1 gap-gutter-lg py-space-2xl xl:grid-cols-12">
        <div className="hidden flex-col gap-space-lg xl:col-span-3 xl:flex">
          <Skeleton className="h-[420px] rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <div className="flex flex-col gap-space-md xl:col-span-9">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-12 w-3/4" />
          <TextSkeleton lines={4} />
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-28 rounded-xl" />
        </div>
      </Container>
    </div>
  )
}
