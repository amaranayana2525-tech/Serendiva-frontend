import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AdviceCard } from '@/components/blog/AdviceCard'
import { ArticleAuthorBox } from '@/components/blog/ArticleAuthorBox'
import { ArticleFooter } from '@/components/blog/ArticleFooter'
import { ArticleHero } from '@/components/blog/ArticleHero'
import { ArticleInlineCta } from '@/components/blog/ArticleInlineCta'
import { ArticleTocBar, ArticleTocCard } from '@/components/blog/ArticleToc'
import { JournalMetaBar } from '@/components/blog/JournalMetaBar'
import { isGuideAuthor } from '@/components/blog/posts'
import { RelatedDispatches } from '@/components/blog/RelatedDispatches'
import { ScopedMessages } from '@/components/blog/ScopedMessages'
import { articleJsonLd } from '@/components/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLdScript'
import { Container } from '@/components/ui/Container'
import { Markdown } from '@/components/ui/Markdown'
import type { Locale } from '@/i18n/routing'
import { getAllBlogPosts, getBlogPost, getSettings } from '@/lib/api/public'
import type { PublicSettings } from '@/lib/api/types'
import { publicEnv } from '@/lib/env'
import { formatDate } from '@/lib/format'
import { buildMetadata, localizedUrl } from '@/lib/seo'

/** Pre-render every published post per locale (an unreachable API at build time just means on-demand ISR). */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  try {
    const posts = await getAllBlogPosts(params.locale as Locale)
    return posts.map((post) => ({ slug: post.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: PageProps<'/[locale]/blog/[slug]'>): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  const post = await getBlogPost(locale, slug)
  if (!post) {
    const t = await getTranslations({ locale, namespace: 'common.notFound' })
    return { title: t('metaTitle'), robots: { index: false, follow: true } }
  }
  return buildMetadata({
    locale,
    path: `/blog/${post.slug}`,
    title: post.seo.title || post.title,
    description: post.seo.description || post.excerpt,
    image: post.seo.image ?? post.cover,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
  })
}

export default async function BlogPostPage({ params }: PageProps<'/[locale]/blog/[slug]'>) {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  setRequestLocale(locale)

  const post = await getBlogPost(locale, slug)
  if (!post) notFound()

  let settings: PublicSettings | null = null
  try {
    settings = await getSettings(locale)
  } catch {
    settings = null
  }
  const t = await getTranslations({ locale, namespace: 'blog' })
  const guide = settings?.guide ?? null
  const byGuide = guide ? isGuideAuthor(post.authorName, guide.name) : false
  const path = `/blog/${post.slug}`
  const url = localizedUrl(locale, path)
  const hasToc = post.headings.length > 0

  return (
    <>
      <JournalMetaBar
        items={[
          { label: t('breadcrumb.home'), href: '/' },
          { label: t('article.breadcrumbBlog'), href: '/blog' },
          { label: post.title },
        ]}
        meta={
          <>
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-tertiary-container" />
              {post.category.label}
            </span>
            <span aria-hidden="true" className="hidden opacity-30 sm:inline">
              |
            </span>
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
          </>
        }
      />

      <ScopedMessages paths={['blog.article.toc', 'blog.article.share']}>
        <article aria-labelledby="article-title" className="w-full">
          <ArticleHero post={post} locale={locale} authorPortrait={byGuide ? (guide?.portrait ?? null) : null} />

          <div className="relative w-full">
            {hasToc && <ArticleTocBar headings={post.headings} />}
            <Container className="pb-space-2xl pt-space-lg">
              <div className="grid grid-cols-1 items-start gap-gutter-lg lg:grid-cols-12">
                <div className="min-w-0 lg:col-span-8">
                  <Markdown className="max-w-3xl [&_:is(h2,h3)]:scroll-mt-40 lg:[&_:is(h2,h3)]:scroll-mt-28">
                    {post.content}
                  </Markdown>
                  <ArticleFooter tags={post.tags} url={url} title={post.title} />
                  <ArticleAuthorBox locale={locale} authorName={post.authorName} guide={guide} />
                  <ArticleInlineCta title={post.title} />
                </div>
                <aside className="no-scrollbar hidden flex-col gap-space-lg self-start lg:sticky lg:top-24 lg:col-span-4 lg:-m-2 lg:flex lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:p-2 [&>*]:shrink-0">
                  {hasToc && <ArticleTocCard headings={post.headings} />}
                  <AdviceCard
                    title={t('article.advice.title')}
                    body={t('article.advice.body')}
                    cta={t('article.advice.cta')}
                    page={post.title}
                  />
                </aside>
              </div>
            </Container>
          </div>
        </article>
      </ScopedMessages>

      <RelatedDispatches posts={post.related} />
      <JsonLd data={articleJsonLd(post, url, `${publicEnv.siteUrl}/brand/serendiva-logo.png`)} />
    </>
  )
}
