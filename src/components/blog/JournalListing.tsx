import { Suspense } from 'react'
import { CardSkeleton, Skeleton } from '@/components/ui/Skeleton'
import { Container } from '@/components/ui/Container'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { getAllBlogPosts, getBlogPosts } from '@/lib/api/public'
import type { BlogCard, BlogCategoryCount, Locale } from '@/lib/api/types'
import { BlogExplorer, BlogExplorerFallback } from './BlogExplorer'
import { pickFeatured, sortPosts } from './posts'
import { ScopedMessages } from './ScopedMessages'

/** Data for the filter bar + grid: every published post and the category chips with counts. */
export async function JournalListing({ locale }: { locale: Locale }) {
  let posts: BlogCard[]
  let categories: BlogCategoryCount[]
  try {
    const [all, firstPage] = await Promise.all([
      getAllBlogPosts(locale),
      getBlogPosts(locale, { page: 1, pageSize: 50 }),
    ])
    posts = sortPosts(all)
    categories = firstPage.categories.filter((c) => c.count > 0)
  } catch {
    return (
      <Container className="py-space-2xl">
        <ErrorState retryHref="/blog" />
      </Container>
    )
  }
  if (posts.length === 0) {
    return (
      <Container className="py-space-2xl">
        <EmptyState icon="menu_book" />
      </Container>
    )
  }
  const props = { posts, categories, featuredSlug: pickFeatured(posts)?.slug ?? null }
  return (
    <ScopedMessages paths={['blog.filters', 'blog.grid', 'blog.empty']}>
      <Suspense fallback={<BlogExplorerFallback {...props} />}>
        <BlogExplorer {...props} />
      </Suspense>
    </ScopedMessages>
  )
}

export function JournalListingSkeleton() {
  return (
    <div aria-hidden="true" className="w-full">
      <div className="w-full bg-surface-container py-space-md">
        <Container className="flex gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-36 shrink-0 rounded-full" />
          ))}
        </Container>
      </div>
      <Container className="grid grid-cols-1 gap-gutter-lg py-space-2xl md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <CardSkeleton key={i} imageClassName="h-60" />
        ))}
      </Container>
    </div>
  )
}
