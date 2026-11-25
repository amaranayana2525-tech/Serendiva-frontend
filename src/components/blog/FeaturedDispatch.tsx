import { getTranslations } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { ErrorState } from '@/components/ui/ErrorState'
import { Icon } from '@/components/ui/Icon'
import { Skeleton, TextSkeleton } from '@/components/ui/Skeleton'
import { SmartImage } from '@/components/ui/SmartImage'
import { Link } from '@/i18n/navigation'
import { getAllBlogPosts, getSettings } from '@/lib/api/public'
import type { BlogCard, Locale, PublicSettings } from '@/lib/api/types'
import { formatDate } from '@/lib/format'
import { initialsOf } from '@/lib/utils'
import { isGuideAuthor, pickFeatured, plainExcerpt } from './posts'

/** Featured editorial hero card (split image / story panel) for the newest featured post. */
export async function FeaturedDispatch({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'blog.featured' })
  let post: BlogCard | null
  let settings: PublicSettings | null = null
  try {
    post = pickFeatured(await getAllBlogPosts(locale))
  } catch {
    return (
      <Container className="pb-space-2xl">
        <ErrorState retryHref="/blog" />
      </Container>
    )
  }
  if (!post) return null
  try {
    settings = await getSettings(locale)
  } catch {
    settings = null
  }
  const byGuide = isGuideAuthor(post.authorName, settings?.guide.name)
  const authorRole = byGuide && settings ? settings.guide.title : t('guestContributor')
  const eyebrow = t('eyebrow', { category: post.category.label, minutes: post.readingTime })
  const badge = post.tags[0]

  return (
    <section aria-label={t('label')} className="w-full pb-space-2xl">
      <Container>
        <article className="group relative grid grid-cols-1 overflow-hidden rounded-xl bg-surface-container-lowest shadow-xl transition-all duration-300 lg:grid-cols-12">
          <div className="relative min-h-[380px] overflow-hidden lg:col-span-7 lg:min-h-[520px]">
            <SmartImage
              image={post.cover}
              fill
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent lg:hidden"
            />
            <div className="absolute left-space-md top-space-md z-10 flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-surface/90 px-space-sm py-1 font-label-md text-label-md uppercase tracking-wider text-primary shadow-sm backdrop-blur-md">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-secondary" />
                {t('badge')}
              </span>
              {badge && (
                <span className="rounded-full bg-tertiary-container px-space-sm py-1 font-label-md text-label-md uppercase tracking-wider text-on-tertiary shadow-sm">
                  {badge}
                </span>
              )}
            </div>
            <div aria-hidden="true" className="absolute bottom-space-md left-space-md z-10 text-on-primary lg:hidden">
              <span className="font-label-md text-label-md uppercase tracking-widest text-primary-fixed">
                {eyebrow}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between bg-surface-container-low/40 p-space-lg lg:col-span-5 lg:p-space-xl">
            <div className="flex flex-col gap-space-sm">
              <div className="hidden items-center justify-between gap-space-sm lg:flex">
                <span className="font-label-md text-label-md font-semibold uppercase tracking-[0.18em] text-secondary">
                  {eyebrow}
                </span>
                <span className="flex shrink-0 items-center gap-1 font-caption text-caption text-on-surface-variant">
                  <Icon name="calendar_today" className="text-[16px] text-tertiary" />
                  <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
                </span>
              </div>
              <span className="sr-only lg:hidden">{eyebrow}</span>
              <h2 className="mt-space-xs font-headline-xl text-headline-xl text-primary transition-colors group-hover:text-primary-container">
                <Link
                  href={`/blog/${post.slug}`}
                  className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-primary"
                >
                  {post.title}
                </Link>
              </h2>
              <p className="mt-space-xs font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
                {plainExcerpt(post.excerpt)}
              </p>
              <div className="mt-space-sm flex items-center gap-space-sm rounded-lg bg-surface-container p-space-sm">
                <Icon name="wb_twilight" className="shrink-0 text-[22px] text-secondary" />
                <p className="font-caption text-caption text-on-surface">
                  <strong>{t('noteLabel')}</strong> {t('note')}
                </p>
              </div>
            </div>
            <div className="-mx-space-lg -mb-space-lg mt-space-md flex flex-wrap items-center justify-between gap-space-md bg-surface-container-low/80 p-space-lg lg:-mx-space-xl lg:-mb-space-xl">
              <div className="flex items-center gap-space-sm">
                <div
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container font-headline-sm text-headline-sm text-on-primary"
                >
                  {initialsOf(post.authorName)}
                </div>
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg font-semibold text-on-surface">{post.authorName}</span>
                  <span className="font-caption text-caption text-on-surface-variant">{authorRole}</span>
                </div>
              </div>
              <span
                aria-hidden="true"
                className="inline-flex items-center gap-space-xs rounded-xl bg-primary px-space-md py-space-sm font-label-lg text-label-lg uppercase tracking-wider text-on-primary shadow-md transition-all duration-200 group-hover:translate-x-1 group-hover:bg-primary-container"
              >
                <span>{t('cta')}</span>
                <Icon name="arrow_forward" className="text-[18px]" />
              </span>
            </div>
          </div>
        </article>
      </Container>
    </section>
  )
}

export function FeaturedDispatchSkeleton() {
  return (
    <div aria-hidden="true" className="w-full pb-space-2xl">
      <Container>
        <div className="grid grid-cols-1 overflow-hidden rounded-xl bg-surface-container-lowest shadow-xl lg:grid-cols-12">
          <Skeleton className="min-h-[380px] rounded-none lg:col-span-7 lg:min-h-[520px]" />
          <div className="flex flex-col gap-space-md p-space-lg lg:col-span-5 lg:p-space-xl">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
            <TextSkeleton lines={4} />
          </div>
        </div>
      </Container>
    </div>
  )
}
