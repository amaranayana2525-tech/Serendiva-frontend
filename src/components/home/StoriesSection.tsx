import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { getBlogPosts } from '@/lib/api/public'
import type { Locale, PublicSettings } from '@/lib/api/types'
import { BlogCard } from '@/components/cards/BlogCard'
import { Container } from '@/components/ui/Container'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Icon } from '@/components/ui/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { SmartImage } from '@/components/ui/SmartImage'
import { StoriesSkeleton } from './HomeSkeletons'
import { loadSection } from './loadSection'

async function LatestStories({ locale, emptyBody }: { locale: Locale; emptyBody: string }) {
  const result = await loadSection('blog', () => getBlogPosts(locale, { page: 1, pageSize: 3 }))
  if (!result.ok) return <ErrorState retryHref="/" />
  if (result.data.items.length === 0) return <EmptyState icon="menu_book" body={emptyBody} />
  return (
    <ul className="grid grid-cols-1 gap-gutter md:grid-cols-3">
      {result.data.items.slice(0, 3).map((post, i) => (
        <Reveal as="li" key={post.id} delay={i * 0.08} className="flex">
          <BlogCard post={post} variant="home" className="w-full" />
        </Reveal>
      ))}
    </ul>
  )
}

/** Six-square Instagram strip (settings.instagramFeed) with the handle and a follow link. */
function InstagramStrip({ settings }: { settings: PublicSettings }) {
  const t = useTranslations('home.stories')
  const tA11y = useTranslations('common.a11y')
  const feed = settings.instagramFeed.slice(0, 6)
  const { instagram, instagramHandle } = settings.social
  if (feed.length === 0) return null
  return (
    <div className="flex flex-col gap-space-md pt-space-md">
      <div className="flex items-center justify-between gap-space-sm">
        <div className="flex min-w-0 items-center gap-2">
          <Icon name="photo_camera" className="text-secondary" />
          {instagramHandle && (
            <span className="truncate font-label-lg text-label-lg font-bold uppercase tracking-widest text-primary">
              {instagramHandle}
            </span>
          )}
        </div>
        {instagram && (
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target relative shrink-0 rounded font-label-md text-label-md font-semibold text-secondary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {t('instagramFollow')}
            <span className="sr-only">
              {' '}
              {instagramHandle} {tA11y('opensInNewTab')}
            </span>
          </a>
        )}
      </div>
      <ul aria-label={t('instagramLabel')} className="grid grid-cols-2 gap-space-sm sm:grid-cols-3 lg:grid-cols-6">
        {feed.map((image, i) => (
          <li key={image.id || i} className="group relative aspect-square overflow-hidden rounded-xl shadow-sm">
            <SmartImage
              image={image}
              fill
              sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Section 12 — 3 latest field dispatches (BlogCard) + the Instagram strip. */
export function StoriesSection({ locale, settings }: { locale: Locale; settings: PublicSettings | null }) {
  const t = useTranslations('home.stories')
  return (
    <section className="w-full bg-surface-container-low py-space-3xl">
      <Container className="flex flex-col gap-space-2xl">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')} />
        <Suspense fallback={<StoriesSkeleton />}>
          <LatestStories locale={locale} emptyBody={t('emptyBody')} />
        </Suspense>
        {settings && <InstagramStrip settings={settings} />}
      </Container>
    </section>
  )
}
