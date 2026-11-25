import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { BlogCard as BlogCardDto } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'
import { plainExcerpt } from '@/components/blog/posts'

export interface BlogCardProps {
  post: BlogCardDto
  /** 'home' = "Stories & Insider Ceylon Notes" card · 'list' = /blog grid card (category pill, reading time, author bar). */
  variant?: 'home' | 'list'
  headingLevel?: 'h2' | 'h3'
  className?: string
}

/** Category pill colour on the /blog card, as in Stitch (gastronomy = cinnamon, wildlife = tea green, rest = teal). */
const CATEGORY_TONE: Record<string, string> = {
  gastronomy: 'text-secondary',
  wildlife: 'text-tertiary-container',
}

/** Journal article card (whole card is clickable through the title link). */
export function BlogCard({ post, variant = 'home', headingLevel: Heading = 'h3', className }: BlogCardProps) {
  const t = useTranslations('common')
  const href = `/blog/${post.slug}`
  const excerpt = plainExcerpt(post.excerpt)
  const stretched = cn(
    'after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary',
    variant === 'list' ? 'focus-visible:after:rounded-xl' : 'focus-visible:after:rounded-2xl',
  )

  if (variant === 'list') {
    return (
      <article
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-md transition-all duration-300 hover:shadow-xl',
          className,
        )}
      >
        <div className="relative h-60 w-full overflow-hidden">
          <SmartImage
            image={post.cover}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex gap-2">
            <span
              className={cn(
                'rounded-full bg-surface/90 px-2.5 py-1 font-label-md text-label-md font-semibold uppercase tracking-wider shadow-sm backdrop-blur-sm',
                CATEGORY_TONE[post.category.slug] ?? 'text-primary',
              )}
            >
              {post.category.label}
            </span>
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded bg-inverse-surface/80 px-2 py-0.5 font-caption text-caption text-inverse-on-surface backdrop-blur-sm">
            <Icon name="schedule" className="text-[14px]" /> {t('cards.minRead', { minutes: post.readingTime })}
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between p-space-lg">
          <div className="flex flex-col gap-space-xs">
            {post.tags[0] && (
              <span className="font-label-md text-label-md font-medium uppercase tracking-widest text-secondary">
                {post.tags[0]}
              </span>
            )}
            <Heading className="line-clamp-2 font-headline-sm text-headline-sm text-primary transition-colors group-hover:text-secondary">
              <Link href={href} className={stretched}>
                {post.title}
              </Link>
            </Heading>
            <p className="mt-1 line-clamp-2 font-body-md text-body-md text-on-surface-variant">{excerpt}</p>
          </div>
          <div className="-mx-space-lg -mb-space-lg mt-space-md flex items-center justify-between gap-space-sm bg-surface-container-low/50 p-space-md px-space-lg">
            <div className="flex min-w-0 items-center gap-2">
              <Icon name="person" className="shrink-0 text-[18px] text-secondary" />
              <span className="font-caption text-caption font-medium text-on-surface">
                {t('cards.byAuthor', { name: post.authorName })}
              </span>
            </div>
            <span
              aria-hidden="true"
              className="flex shrink-0 items-center gap-1 whitespace-nowrap font-label-md text-label-md font-semibold uppercase tracking-wider text-primary transition-transform group-hover:translate-x-1"
            >
              {t('buttons.readArticle')} <Icon name="arrow_forward" className="text-[16px]" />
            </span>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article
      className={cn(
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-surface shadow-sm',
        className,
      )}
    >
      <div className="relative h-56 w-full overflow-hidden">
        <SmartImage
          image={post.cover}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between gap-space-md p-space-lg">
        <div className="flex flex-col gap-space-xs">
          <span className="font-label-md text-label-md font-semibold uppercase text-secondary">
            {post.category.label}
          </span>
          <Heading className="font-headline-md text-headline-md text-primary transition-colors group-hover:text-secondary">
            <Link href={href} className={stretched}>
              {post.title}
            </Link>
          </Heading>
          <p className="line-clamp-3 font-body-md text-body-md text-on-surface-variant">{excerpt}</p>
        </div>
        <span aria-hidden="true" className="flex items-center gap-1 font-label-md text-label-md font-bold text-primary">
          {t('buttons.readStory')} <Icon name="arrow_forward" className="text-sm" />
        </span>
      </div>
    </article>
  )
}
