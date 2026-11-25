import { getTranslations } from 'next-intl/server'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'
import { Link } from '@/i18n/navigation'
import type { GuideSettings, Locale } from '@/lib/api/types'
import { initialsOf } from '@/lib/utils'
import { isGuideAuthor } from './posts'

/**
 * "About the Author" box under the article. The guide (settings.guide: portrait, name, title, licence, years) or —
 * for a guest dispatch (`post.authorName` differs) — the guest's name with a "Reviewed by <guide>" line.
 */
export async function ArticleAuthorBox({
  locale,
  authorName,
  guide,
}: {
  locale: Locale
  authorName: string
  guide: GuideSettings | null
}) {
  const t = await getTranslations({ locale, namespace: 'blog.article.author' })
  const byGuide = guide ? isGuideAuthor(authorName, guide.name) : false

  return (
    <section
      aria-labelledby="article-author-title"
      className="mt-space-2xl flex flex-col items-start gap-space-lg rounded-xl bg-surface-container p-space-lg sm:flex-row lg:p-space-xl"
    >
      {byGuide && guide ? (
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full shadow-md">
          <SmartImage image={guide.portrait} fill sizes="96px" className="h-full w-full object-cover object-top" />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary-container font-headline-lg text-headline-lg text-on-primary shadow-md"
        >
          {initialsOf(authorName)}
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-space-xs">
        <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-secondary">
          {byGuide ? t('eyebrow') : t('guestEyebrow')}
        </span>
        <h2 id="article-author-title" className="font-headline-md text-headline-md text-primary">
          {authorName}
        </h2>
        {byGuide && guide ? (
          <>
            <ul className="flex flex-wrap items-center gap-x-space-lg gap-y-space-xs font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              <li className="flex items-center gap-1.5">
                <Icon name="verified" className="text-[18px] text-secondary" />
                {guide.title}
              </li>
              {guide.licenseNumber && (
                <li className="flex items-center gap-1.5">
                  <Icon name="badge" className="text-[18px] text-secondary" />
                  {t('licence', { number: guide.licenseNumber })}
                </li>
              )}
              <li className="flex items-center gap-1.5">
                <Icon name="military_tech" className="text-[18px] text-secondary" />
                {t('years', { years: guide.yearsGuiding })}
              </li>
            </ul>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {t('bio', { years: guide.yearsGuiding })}
            </p>
          </>
        ) : (
          <>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('guestBio', { name: authorName })}</p>
            {guide && (
              <p className="flex items-center gap-space-sm font-caption text-caption text-on-surface-variant">
                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
                  <SmartImage image={guide.portrait} fill sizes="32px" className="h-full w-full object-cover" alt="" />
                </span>
                {t('reviewedBy', { name: `${guide.name}, ${guide.title}` })}
              </p>
            )}
          </>
        )}
        <Link
          href="/about"
          className="tap-target relative mt-space-xs inline-flex w-fit items-center gap-1 rounded font-label-md text-label-md font-semibold uppercase tracking-wider text-primary transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t('more')}
          <Icon name="arrow_forward" className="text-[16px]" />
        </Link>
      </div>
    </section>
  )
}
