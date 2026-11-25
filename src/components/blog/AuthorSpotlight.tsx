import { getTranslations } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { Skeleton, TextSkeleton } from '@/components/ui/Skeleton'
import { SmartImage } from '@/components/ui/SmartImage'
import { getAllBlogPosts, getSettings } from '@/lib/api/public'
import type { BlogCard, Locale, PublicSettings } from '@/lib/api/types'
import { isGuideAuthor } from './posts'

/** "Voice from the Field" credibility spread: field photo, licence, quote, bio and live dispatch count. */
export async function AuthorSpotlight({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'blog.spotlight' })
  // Hidden by the admin (Page content) → no messages → render nothing.
  if (!t.has('quote')) return null
  let settings: PublicSettings
  let posts: BlogCard[] = []
  try {
    settings = await getSettings(locale)
  } catch {
    return null
  }
  try {
    posts = await getAllBlogPosts(locale)
  } catch {
    posts = []
  }
  const { guide, pageImages } = settings
  const photo = pageImages['guide-field-binoculars-sigiriya'] ?? guide.candid ?? guide.portrait
  const dispatches = posts.filter((p) => isGuideAuthor(p.authorName, guide.name)).length
  const stats = [
    { icon: 'military_tech', label: t('years', { years: guide.yearsGuiding }) },
    ...(dispatches > 0 ? [{ icon: 'menu_book', label: t('dispatches', { count: dispatches }) }] : []),
    { icon: 'nature_people', label: t('conservation') },
  ]

  return (
    <section aria-label={t('eyebrow')} className="w-full bg-surface py-space-2xl">
      <Container>
        <div className="grid grid-cols-1 items-center gap-gutter-lg rounded-xl bg-surface-container p-space-lg lg:grid-cols-12 lg:p-space-xl">
          <div className="relative lg:col-span-4">
            <div className="relative h-80 overflow-hidden rounded-xl shadow-lg">
              <SmartImage
                image={photo}
                fill
                sizes="(min-width: 1024px) 30vw, 100vw"
                className="h-full w-full object-cover"
              />
              {guide.licenseNumber && (
                <div className="absolute bottom-3 left-3 rounded-full bg-surface/90 px-3 py-1 font-label-md text-label-md uppercase tracking-wider text-primary shadow-sm backdrop-blur-sm">
                  {t('licence', { number: guide.licenseNumber })}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-space-sm lg:col-span-8">
            <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-secondary">
              {t('eyebrow')}
            </span>
            <figure className="flex flex-col gap-space-sm">
              <blockquote className="font-headline-lg text-headline-lg text-primary">
                <p>{t('quote')}</p>
              </blockquote>
              <figcaption className="sr-only">{guide.name}</figcaption>
            </figure>
            <p className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
              {t('bio', { years: guide.yearsGuiding })}
            </p>
            <ul className="flex flex-wrap items-center gap-space-lg pt-space-xs font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              {stats.map((stat) => (
                <li key={stat.icon} className="flex items-center gap-2">
                  <Icon name={stat.icon} className="text-[20px] text-secondary" />
                  <span>{stat.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  )
}

export function AuthorSpotlightSkeleton() {
  return (
    <div aria-hidden="true" className="w-full py-space-2xl">
      <Container>
        <div className="grid grid-cols-1 items-center gap-gutter-lg rounded-xl bg-surface-container p-space-lg lg:grid-cols-12 lg:p-space-xl">
          <Skeleton className="h-80 rounded-xl lg:col-span-4" />
          <div className="flex flex-col gap-space-sm lg:col-span-8">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-9 w-full" />
            <TextSkeleton lines={3} />
          </div>
        </div>
      </Container>
    </div>
  )
}
