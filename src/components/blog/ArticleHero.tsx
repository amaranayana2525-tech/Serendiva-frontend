import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'
import { Link } from '@/i18n/navigation'
import type { ApiImage, BlogPostDetail, Locale } from '@/lib/api/types'
import { formatDate } from '@/lib/format'
import { initialsOf } from '@/lib/utils'
import { plainExcerpt } from './posts'

const DAY = 24 * 60 * 60 * 1000

/**
 * Article masthead in the journal's visual language: category / reading-time eyebrow, h1, standfirst, author
 * vignette (published + updated dates) and the cover photo with the featured-card badges.
 */
export function ArticleHero({
  post,
  locale,
  authorPortrait,
}: {
  post: BlogPostDetail
  locale: Locale
  /** Guide portrait when the guide wrote the post (else initials). */
  authorPortrait: ApiImage | null
}) {
  const t = useTranslations('blog.article')
  const updated = Date.parse(post.updatedAt) - Date.parse(post.publishedAt) > DAY
  const badge = post.tags[0]

  return (
    <>
      <header className="w-full bg-surface py-space-xl lg:py-space-2xl">
        <Container>
          <div className="grid grid-cols-1 items-end gap-gutter-lg lg:grid-cols-12">
            <div className="flex flex-col gap-space-xs lg:col-span-8">
              <div className="flex flex-wrap items-center gap-space-xs">
                <Link
                  href={{ pathname: '/blog', query: { category: post.category.slug } }}
                  className="tap-target relative rounded font-label-lg text-label-lg uppercase tracking-[0.25em] text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {post.category.label}
                </Link>
                <span aria-hidden="true" className="inline-block h-px w-8 shrink-0 bg-secondary/40" />
                <span className="flex items-center gap-1 font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
                  <Icon name="schedule" className="text-[14px]" />
                  {t('readingTime', { minutes: post.readingTime })}
                </span>
              </div>
              <h1
                id="article-title"
                className="mt-1 font-headline-xl text-headline-xl-mobile tracking-tight text-primary md:text-headline-xl lg:font-display-lg lg:text-display-lg"
              >
                {post.title}
              </h1>
              <p className="mt-space-xs max-w-2xl font-body-xl text-body-xl text-on-surface-variant">
                {plainExcerpt(post.excerpt)}
              </p>
            </div>
            <div className="flex flex-col items-start justify-end lg:col-span-4 lg:items-end">
              <div className="flex max-w-sm items-center gap-space-md rounded-xl bg-surface-container-high/70 p-space-md shadow-sm">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-container font-headline-sm text-headline-sm text-on-primary shadow-md">
                  {authorPortrait ? (
                    <SmartImage
                      image={authorPortrait}
                      fill
                      sizes="48px"
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span aria-hidden="true">{initialsOf(post.authorName)}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm leading-tight text-primary">
                    {t('by', { name: post.authorName })}
                  </span>
                  <span className="mt-0.5 font-caption text-caption text-on-surface-variant">
                    <time dateTime={post.publishedAt}>
                      {t('published', { date: formatDate(post.publishedAt, locale) })}
                    </time>
                    {updated && (
                      <>
                        {' · '}
                        <time dateTime={post.updatedAt}>
                          {t('updated', { date: formatDate(post.updatedAt, locale) })}
                        </time>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </header>

      <Container className="pb-space-xl">
        <div className="relative h-[260px] overflow-hidden rounded-xl bg-surface-container shadow-xl sm:h-[380px] lg:h-[520px]">
          <SmartImage
            image={post.cover}
            fill
            priority
            sizes="(min-width: 1440px) 1280px, 100vw"
            className="object-cover"
          />
          <div className="absolute left-space-md top-space-md z-10 flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-surface/90 px-space-sm py-1 font-label-md text-label-md uppercase tracking-wider text-primary shadow-sm backdrop-blur-md">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-secondary" />
              {post.category.label}
            </span>
            {badge && (
              <span className="rounded-full bg-tertiary-container px-space-sm py-1 font-label-md text-label-md uppercase tracking-wider text-on-tertiary shadow-sm">
                {badge}
              </span>
            )}
          </div>
        </div>
      </Container>
    </>
  )
}
