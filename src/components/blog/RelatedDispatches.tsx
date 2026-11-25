import { useTranslations } from 'next-intl'
import { BlogCard } from '@/components/cards/BlogCard'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { Link } from '@/i18n/navigation'
import type { BlogCard as BlogCardDto } from '@/lib/api/types'

/** "More Field Dispatches" — the API's related posts as journal cards. Renders nothing without related posts. */
export function RelatedDispatches({ posts }: { posts: BlogCardDto[] }) {
  const t = useTranslations('blog.article.related')
  if (posts.length === 0) return null
  return (
    <section aria-labelledby="related-title" className="w-full bg-surface-container-low py-space-2xl">
      <Container>
        <div className="mb-space-lg flex flex-wrap items-end justify-between gap-space-sm">
          <div>
            <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-secondary">
              {t('eyebrow')}
            </span>
            <h2 id="related-title" className="mt-1 font-headline-lg text-headline-lg text-primary">
              {t('title')}
            </h2>
          </div>
          <Link
            href="/blog"
            className="tap-target relative inline-flex items-center gap-1 rounded font-label-md text-label-md font-semibold uppercase tracking-wider text-primary transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {t('all')}
            <Icon name="arrow_forward" className="text-[16px]" />
          </Link>
        </div>
        <ul className="grid grid-cols-1 gap-gutter-lg md:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
            <li key={post.id} className="flex">
              <BlogCard post={post} variant="list" className="w-full" />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
