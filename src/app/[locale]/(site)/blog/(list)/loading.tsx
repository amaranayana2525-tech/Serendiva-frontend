import { FeaturedDispatchSkeleton } from '@/components/blog/FeaturedDispatch'
import { JournalListingSkeleton } from '@/components/blog/JournalListing'
import { Container } from '@/components/ui/Container'
import { Skeleton, TextSkeleton } from '@/components/ui/Skeleton'
import { LoadingLabel } from '@/components/ui/LoadingLabel'

/** Route skeleton: masthead, featured card, filter bar and the first row of cards. */
export default function BlogLoading() {
  return (
    <div role="status" aria-live="polite" className="w-full">
      <LoadingLabel />
      <div aria-hidden="true" className="w-full bg-surface-container-low/70 py-space-sm">
        <Container>
          <Skeleton className="h-3 w-56" />
        </Container>
      </div>
      <Container aria-hidden="true" className="flex flex-col gap-space-sm py-space-xl lg:py-space-2xl">
        <Skeleton className="h-3 w-64" />
        <Skeleton className="h-14 w-full max-w-3xl" />
        <TextSkeleton lines={2} className="max-w-2xl" />
      </Container>
      <FeaturedDispatchSkeleton />
      <JournalListingSkeleton />
    </div>
  )
}
