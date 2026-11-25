import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ArticleShare } from './ArticleShare'

/** Tags (each links to the journal search) + share row under the article body. */
export function ArticleFooter({ tags, url, title }: { tags: string[]; url: string; title: string }) {
  const t = useTranslations('blog.article.tags')
  return (
    <div className="mt-space-2xl flex flex-col gap-space-lg border-t border-on-surface/10 pt-space-lg">
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-space-sm">
          <h2 className="mr-space-xs font-label-md text-label-md uppercase tracking-[0.2em] text-on-surface-variant">
            {t('title')}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag}>
                <Link
                  href={{ pathname: '/blog', query: { q: tag } }}
                  aria-label={t('link', { tag })}
                  className="tap-target relative inline-flex rounded-full bg-surface-container px-space-md py-1.5 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ArticleShare url={url} title={title} />
    </div>
  )
}
