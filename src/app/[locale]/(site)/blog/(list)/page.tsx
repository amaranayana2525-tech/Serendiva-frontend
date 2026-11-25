import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AuthorSpotlight, AuthorSpotlightSkeleton } from '@/components/blog/AuthorSpotlight'
import { DispatchNewsletter } from '@/components/blog/DispatchNewsletter'
import { FeaturedDispatch, FeaturedDispatchSkeleton } from '@/components/blog/FeaturedDispatch'
import { JournalFinalCta } from '@/components/blog/JournalFinalCta'
import { JournalHeader } from '@/components/blog/JournalHeader'
import { JournalListing, JournalListingSkeleton } from '@/components/blog/JournalListing'
import { JournalMetaBar } from '@/components/blog/JournalMetaBar'
import type { Locale } from '@/i18n/routing'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata({ params }: PageProps<'/[locale]/blog'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'blog.meta' })
  return buildMetadata({ locale: locale as Locale, path: '/blog', title: t('title'), description: t('description') })
}

export default async function BlogPage({ params }: PageProps<'/[locale]/blog'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'blog' })

  return (
    <>
      <JournalMetaBar
        items={[{ label: t('breadcrumb.home'), href: '/' }, { label: t('breadcrumb.current') }]}
        meta={
          <>
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-tertiary-container" />
              {t('metaBar.live')}
            </span>
            <span aria-hidden="true" className="opacity-30">
              |
            </span>
            <span>{t('metaBar.desk')}</span>
          </>
        }
      />
      <JournalHeader />
      <Suspense fallback={<FeaturedDispatchSkeleton />}>
        <FeaturedDispatch locale={locale} />
      </Suspense>
      <Suspense fallback={<JournalListingSkeleton />}>
        <JournalListing locale={locale} />
      </Suspense>
      <DispatchNewsletter />
      <Suspense fallback={<AuthorSpotlightSkeleton />}>
        <AuthorSpotlight locale={locale} />
      </Suspense>
      <JournalFinalCta />
    </>
  )
}
