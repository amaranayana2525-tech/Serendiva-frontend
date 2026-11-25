import { useTranslations } from 'next-intl'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { Icon } from '@/components/ui/Icon'
import { Link } from '@/i18n/navigation'
import { contactHref } from '@/lib/prefill'

/** Deep-teal card after the article: plan this dispatch into a private journey (prefilled inquiry) or ask on WhatsApp. */
export function ArticleInlineCta({ title }: { title: string }) {
  const t = useTranslations('blog.article.inlineCta')
  return (
    <aside
      aria-labelledby="article-cta-title"
      className="relative mt-space-xl overflow-hidden rounded-xl bg-primary p-space-lg text-on-primary shadow-xl sm:p-space-xl"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-16 opacity-5">
        <svg fill="currentColor" height="280" viewBox="0 0 200 200" width="280">
          <path d="M100 0 C45 0 0 45 0 100 C0 155 45 200 100 200 C155 200 200 155 200 100 C200 45 155 0 100 0 Z M100 20 C144 20 180 56 180 100 C180 144 144 180 100 180 C56 180 20 144 20 100 C20 56 56 20 100 20 Z M100 40 C67 40 40 67 40 100 C40 133 67 160 100 160 C133 160 160 133 160 100 C160 67 133 40 100 40 Z" />
        </svg>
      </div>
      <div className="relative z-10 flex flex-col gap-space-sm">
        <div className="flex items-center gap-space-xs">
          <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-secondary" />
          <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-primary-fixed">
            {t('eyebrow')}
          </span>
        </div>
        <h2
          id="article-cta-title"
          className="font-headline-lg text-headline-lg-mobile text-on-primary md:text-headline-lg"
        >
          {t('title')}
        </h2>
        <p className="max-w-xl font-body-lg text-body-lg leading-relaxed text-on-primary-container">{t('body')}</p>
        <div className="mt-space-sm flex flex-col gap-space-sm sm:flex-row">
          <Link
            href={contactHref({ source: 'blog-article', message: t('message', { title }) })}
            className="inline-flex items-center justify-center gap-space-xs rounded-xl bg-secondary px-space-lg py-space-sm font-label-lg text-label-lg uppercase tracking-wider text-on-secondary shadow-md transition-all hover:bg-[#a64a22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-primary active:scale-95 coarse:min-h-11"
          >
            <Icon name="map" className="text-[18px]" />
            {t('plan')}
          </Link>
          <WhatsAppLink
            page={title}
            className="inline-flex items-center justify-center gap-space-xs rounded-xl bg-surface-container-lowest px-space-lg py-space-sm font-label-lg text-label-lg uppercase tracking-wider text-primary shadow-md transition-all hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-primary active:scale-95 coarse:min-h-11"
          >
            <Icon name="chat" className="text-[18px] text-tertiary-container" />
            {t('whatsapp')}
          </WhatsAppLink>
        </div>
      </div>
    </aside>
  )
}
