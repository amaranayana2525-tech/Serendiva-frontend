import { Container } from '@/components/ui/Container'
import { Skeleton, TextSkeleton } from '@/components/ui/Skeleton'
import { LoadingLabel } from '@/components/ui/LoadingLabel'

/** Route skeleton: meta bar, title block, cover and the first paragraphs beside the table of contents. */
export default function BlogPostLoading() {
  return (
    <div role="status" aria-live="polite" className="w-full">
      <LoadingLabel />
      <div aria-hidden="true" className="w-full bg-surface-container-low/70 py-space-sm">
        <Container>
          <Skeleton className="h-3 w-72" />
        </Container>
      </div>
      <Container aria-hidden="true" className="flex flex-col gap-space-sm py-space-xl lg:py-space-2xl">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-12 w-full max-w-4xl" />
        <Skeleton className="h-12 w-2/3 max-w-2xl" />
        <TextSkeleton lines={2} className="max-w-2xl" />
      </Container>
      <Container aria-hidden="true" className="pb-space-xl">
        <Skeleton className="h-[260px] rounded-xl sm:h-[380px] lg:h-[520px]" />
      </Container>
      <Container aria-hidden="true" className="grid grid-cols-1 gap-gutter-lg pb-space-2xl lg:grid-cols-12">
        <div className="flex flex-col gap-space-md lg:col-span-8">
          <TextSkeleton lines={5} />
          <Skeleton className="h-8 w-1/2" />
          <TextSkeleton lines={6} />
        </div>
        <Skeleton className="hidden h-96 rounded-xl lg:col-span-4 lg:block" />
      </Container>
    </div>
  )
}
