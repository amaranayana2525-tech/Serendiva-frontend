import { Container } from '@/components/ui/Container'
import { CardSkeleton, Skeleton, TextSkeleton } from '@/components/ui/Skeleton'
import { LoadingLabel } from '@/components/ui/LoadingLabel'

/** /corporate skeleton: teal hero with photo block, client strip and service cards. */
export default function CorporateLoading() {
  return (
    <div role="status" aria-live="polite" className="w-full">
      <LoadingLabel />
      <div aria-hidden="true" className="relative -mt-20 w-full bg-primary-container py-space-3xl pt-36">
        <Container className="grid grid-cols-1 items-center gap-gutter-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-md lg:col-span-7">
            <Skeleton className="h-3 w-56 bg-primary/40" />
            <Skeleton className="h-7 w-72 rounded-full bg-primary/40" />
            <Skeleton className="h-36 w-full bg-primary/40" />
            <TextSkeleton lines={3} className="[&>div]:bg-primary/40" />
            <div className="flex gap-space-md">
              <Skeleton className="h-14 w-64 rounded-xl bg-primary/40" />
              <Skeleton className="h-14 w-64 rounded-xl bg-primary/40" />
            </div>
            <Skeleton className="mt-space-lg h-32 w-full rounded-2xl bg-primary/40" />
          </div>
          <Skeleton className="h-[520px] w-full rounded-2xl bg-primary/40 lg:col-span-5" />
        </Container>
      </div>
      <div aria-hidden="true" className="w-full bg-surface-container py-space-xl">
        <Container>
          <Skeleton className="h-12 w-full" />
        </Container>
      </div>
      <Container aria-hidden="true" className="py-space-3xl">
        <Skeleton className="mb-space-xs h-4 w-40" />
        <Skeleton className="mb-space-2xl h-10 w-2/3 max-w-xl" />
        <div className="grid grid-cols-1 gap-gutter-lg md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <CardSkeleton key={i} imageClassName="h-60" />
          ))}
        </div>
      </Container>
    </div>
  )
}
