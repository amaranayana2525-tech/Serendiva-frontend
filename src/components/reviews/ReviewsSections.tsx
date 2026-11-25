import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { getAllReviews, getAllTours, getFaqs, getGallery, getReviewSummary } from '@/lib/api/public'
import type { FaqItem, Locale, PublicSettings, ReviewCard, ReviewSummary, TourCard } from '@/lib/api/types'
import { publicEnv } from '@/lib/env'
import { contactHref } from '@/lib/prefill'
import { localizedUrl } from '@/lib/seo'
import { PageBreadcrumb } from '@/components/about/PageBreadcrumb'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { faqPageJsonLd } from '@/components/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLdScript'
import { Accordion } from '@/components/ui/Accordion'
import { ErrorState } from '@/components/ui/ErrorState'
import { Icon } from '@/components/ui/Icon'
import { Skeleton, TextSkeleton } from '@/components/ui/Skeleton'
import { Stars } from '@/components/ui/Stars'
import { NO_FILTERS, TRAVELLER_FILTERS } from './filters'
import { ReviewsBrowser, ReviewsBrowserView, type ReviewRoute } from './ReviewsBrowser'
import { ReviewsGridSkeleton } from './ReviewsSkeletons'
import { ReviewSpotlight } from './ReviewSpotlight'
import { ReviewVideoCards } from './ReviewVideoCards'
import { reviewsJsonLd } from './reviewsJsonLd'

// ------------------------------------------------------------------------------------------------ hero

async function ScoreCard() {
  const t = await getTranslations('reviews.score')
  let summary: ReviewSummary
  try {
    summary = await getReviewSummary()
  } catch {
    return <ErrorState className="lg:col-span-4" retryHref="/reviews" />
  }
  const hasReviews = summary.count > 0 && summary.average > 0
  return (
    <div
      aria-label={t('label')}
      role="group"
      className="flex flex-col justify-between rounded-xl bg-surface p-space-xl shadow-xl lg:col-span-4"
    >
      <div>
        {hasReviews ? (
          <>
            <div className="mb-space-xs flex items-baseline justify-between gap-space-sm">
              <span className="font-headline-xl text-headline-xl font-bold text-primary">
                {summary.average.toFixed(1)}
              </span>
              <Stars
                rating={summary.average}
                count={summary.count}
                filled
                starClassName="text-[20px]"
                className="gap-1"
              />
            </div>
            <p className="mb-space-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              {summary.average >= 4.95
                ? t('recordFlawless', { count: summary.count })
                : t('record', { count: summary.count, average: summary.average.toFixed(1) })}
            </p>
            <p className="mb-space-lg font-body-md text-body-md leading-relaxed text-on-surface-variant/90">
              {t('body')}
            </p>
          </>
        ) : (
          <>
            <p className="mb-space-xs font-headline-sm text-headline-sm text-primary">{t('emptyTitle')}</p>
            <p className="mb-space-lg font-body-md text-body-md text-on-surface-variant">{t('emptyBody')}</p>
          </>
        )}
      </div>
      <ul className="flex flex-wrap items-center gap-space-sm pt-space-md">
        <li className="inline-flex items-center gap-space-xs rounded-full bg-surface-container px-space-md py-1.5">
          <Icon name="workspace_premium" filled className="text-sm text-secondary" />
          <span className="font-label-md text-label-md text-on-surface">{t('badges.tripadvisor')}</span>
        </li>
        <li className="inline-flex items-center gap-space-xs rounded-full bg-surface-container px-space-md py-1.5">
          <Icon name="verified" filled className="text-sm text-primary" />
          <span className="font-label-md text-label-md text-on-surface">{t('badges.google')}</span>
        </li>
        <li className="inline-flex items-center gap-space-xs rounded-full bg-surface-container px-space-md py-1.5">
          <Icon name="badge" className="text-sm text-tertiary-container" />
          <span className="font-label-md text-label-md text-on-surface">{t('badges.sltda')}</span>
        </li>
      </ul>
    </div>
  )
}

function ScoreCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-space-md rounded-xl bg-surface p-space-xl shadow-xl lg:col-span-4"
    >
      <Skeleton className="h-12 w-24" />
      <TextSkeleton lines={3} />
      <div className="flex flex-wrap gap-space-sm pt-space-md">
        <Skeleton className="h-8 w-40 rounded-full" />
        <Skeleton className="h-8 w-36 rounded-full" />
      </div>
    </div>
  )
}

/** Stitch "Hero & Trust Anchor" with the real average rating / review count. */
export function ReviewsHero() {
  const t = useTranslations('reviews')
  return (
    <section className="relative w-full overflow-hidden bg-surface-container-low py-space-2xl md:py-space-3xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-secondary/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-primary/5 blur-3xl"
      />
      <div className="relative z-10 mx-auto max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
        <PageBreadcrumb
          className="mb-space-lg font-label-md text-label-md uppercase tracking-wider text-on-surface-variant"
          separatorClassName="text-[13px] text-outline-variant"
          items={[{ label: t('breadcrumb.home'), href: '/' }, { label: t('breadcrumb.current') }]}
        />
        <div className="grid grid-cols-1 items-end gap-gutter-lg lg:grid-cols-12">
          <div className="flex flex-col lg:col-span-8">
            <div className="mb-space-md inline-flex w-fit items-center gap-space-sm rounded-full bg-surface px-space-md py-1 shadow-sm">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-secondary" />
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                {t('hero.eyebrow')}
              </span>
            </div>
            <h1 className="mb-space-md font-display-lg text-display-lg tracking-tight text-primary">
              {t.rich('hero.title', { em: (chunks) => <span className="font-normal italic">{chunks}</span> })}
            </h1>
            <p className="max-w-2xl font-body-xl text-body-xl text-on-surface-variant">{t('hero.intro')}</p>
          </div>
          <Suspense fallback={<ScoreCardSkeleton />}>
            <ScoreCard />
          </Suspense>
        </div>
      </div>
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ console + spotlight + grid

const routeLabel = (title: string) => title.replace(/^the\s+/i, '')

/** Tours with at least one review, most-reviewed first (route filter buttons). */
function reviewRoutes(tours: TourCard[], reviews: ReviewCard[]): ReviewRoute[] {
  const counts = new Map<string, number>()
  for (const r of reviews) if (r.tour) counts.set(r.tour.slug, (counts.get(r.tour.slug) ?? 0) + 1)
  return tours
    .filter((tour) => counts.has(tour.slug))
    .sort((a, b) => (counts.get(b.slug) ?? 0) - (counts.get(a.slug) ?? 0))
    .map((tour) => ({ slug: tour.slug, label: routeLabel(tour.title) }))
}

async function ReviewsBrowserSection({ locale, settings }: { locale: Locale; settings: PublicSettings | null }) {
  const t = await getTranslations('reviews')
  let reviews: ReviewCard[]
  let summary: ReviewSummary | null
  let tours: TourCard[]
  try {
    ;[reviews, summary, tours] = await Promise.all([
      getAllReviews(locale),
      getReviewSummary().catch(() => null),
      getAllTours(locale).catch(() => [] as TourCard[]),
    ])
  } catch {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-margin py-space-2xl md:px-margin-md lg:px-margin-lg">
        <ErrorState retryHref="/reviews" />
      </div>
    )
  }

  const typeCounts = Object.fromEntries(
    TRAVELLER_FILTERS.map((type) => [
      type,
      summary?.byTravellerType[type] ?? reviews.filter((r) => r.travellerType === type).length,
    ]),
  )
  const featured = reviews.find((r) => r.isFeatured) ?? null
  const props = {
    reviews,
    typeCounts,
    total: summary?.count ?? reviews.length,
    routes: reviewRoutes(tours, reviews),
    spotlight: featured ? <ReviewSpotlight review={featured} /> : null,
    spotlightId: featured?.id ?? null,
  }

  return (
    <>
      <Suspense fallback={<ReviewsBrowserView {...props} filters={NO_FILTERS} />}>
        <ReviewsBrowser {...props} />
      </Suspense>
      {summary && summary.count > 0 && (
        <JsonLd
          data={reviewsJsonLd({
            summary,
            reviews,
            name: settings?.seo.siteName || t('jsonLd.name'),
            // Same entity as the home page's TravelAgency (@id …/#business), so the same url: the site home.
            url: localizedUrl(locale, '/'),
            siteUrl: publicEnv.siteUrl,
          })}
        />
      )}
    </>
  )
}

export function ReviewsBrowserBlock({ locale, settings }: { locale: Locale; settings: PublicSettings | null }) {
  return (
    <Suspense fallback={<ReviewsGridSkeleton />}>
      <ReviewsBrowserSection locale={locale} settings={settings} />
    </Suspense>
  )
}

// ------------------------------------------------------------------------------------------------ video testimonials

async function ReviewVideosContent({ locale }: { locale: Locale }) {
  const t = await getTranslations('reviews.videos')
  const tg = await getTranslations('gallery.lightbox')
  let videos
  try {
    videos = (await getGallery(locale, { category: 'portraits', type: 'video' })).items.filter(
      (i) => i.type === 'video' && i.category === 'portraits',
    )
  } catch {
    return null
  }
  if (videos.length === 0) return null
  return (
    <section className="w-full bg-surface py-space-3xl">
      <div className="mx-auto max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
        <div className="mx-auto mb-space-2xl max-w-2xl text-center">
          <span className="mb-space-xs block font-label-md text-label-md font-semibold uppercase tracking-widest text-secondary">
            {t('eyebrow')}
          </span>
          <h2 className="mb-space-sm font-headline-xl text-headline-xl tracking-tight text-primary">{t('title')}</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">{t('intro')}</p>
        </div>
        <ReviewVideoCards videos={videos} dialogLabel={tg('videoLabel')} />
      </div>
    </section>
  )
}

/** Stitch "Video Testimonial Showcase" — gallery items in category `portraits` of type video. Hidden when empty. */
export function ReviewVideos({ locale }: { locale: Locale }) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-[600px] w-full animate-pulse bg-surface" />}>
      <ReviewVideosContent locale={locale} />
    </Suspense>
  )
}

// ------------------------------------------------------------------------------------------------ share CTA, FAQ, closing CTA

/** Stitch "Share Your Serendiva Memory" card → /reviews/share (+ TripAdvisor when configured). */
export function ReviewsShareCta({ settings }: { settings: PublicSettings | null }) {
  const t = useTranslations('reviews.share')
  const tc = useTranslations('common.a11y')
  const tripadvisor = settings?.social.tripadvisor
  const buttonBase =
    'inline-flex items-center justify-center gap-space-sm rounded-xl px-space-xl py-space-md text-center font-label-lg text-label-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-primary'
  return (
    <section className="w-full bg-surface-container-low py-space-2xl">
      <div className="mx-auto max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
        <div className="relative overflow-hidden rounded-2xl bg-primary p-space-xl text-on-primary shadow-xl md:p-space-2xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 -right-16 h-80 w-80 rounded-full bg-secondary/20 blur-3xl"
          />
          <div className="relative z-10 grid grid-cols-1 items-center gap-gutter-lg lg:grid-cols-12">
            <div className="flex flex-col gap-space-sm lg:col-span-8">
              <div className="inline-flex w-fit items-center gap-space-xs rounded-full bg-primary-container px-space-md py-1">
                <Icon name="history_edu" className="text-sm text-secondary-container" />
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-primary">
                  {t('eyebrow')}
                </span>
              </div>
              <h2 className="font-headline-xl text-headline-xl tracking-tight">{t('title')}</h2>
              <p className="max-w-2xl font-body-lg text-body-lg opacity-90">{t('body')}</p>
            </div>
            <div className="flex flex-col justify-end gap-space-md sm:flex-row lg:col-span-4 lg:flex-col">
              {tripadvisor && (
                <a
                  href={tripadvisor}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${buttonBase} bg-secondary text-on-secondary shadow-md hover:bg-on-secondary-fixed-variant hover:shadow-lg`}
                >
                  <Icon name="rate_review" className="text-lg" />
                  <span>{t('tripadvisor')}</span>
                  <span className="sr-only"> {tc('opensInNewTab')}</span>
                </a>
              )}
              <Link
                href="/reviews/share"
                className={
                  tripadvisor
                    ? `${buttonBase} bg-surface/10 text-on-primary backdrop-blur-sm hover:bg-surface/20`
                    : `${buttonBase} bg-secondary text-on-secondary shadow-md hover:bg-on-secondary-fixed-variant hover:shadow-lg`
                }
              >
                <Icon name="mail" className="text-lg" />
                <span>{t('direct')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const FAQ_KEYS = ['verified', 'rating', 'references', 'weather'] as const

/**
 * Stitch "FAQ on Reviews & Transparency" + FAQPage JSON-LD. The questions come from the FAQ admin (scope
 * `reviews`); the original copy in messages is only the fallback while the API is unreachable. No FAQs → no section.
 */
export async function ReviewsFaq({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'reviews.faq' })
  const items: FaqItem[] = await getFaqs(locale, { scope: 'reviews' }).catch(() =>
    FAQ_KEYS.map((key) => ({ id: key, question: t(`items.${key}.q`), answer: t(`items.${key}.a`) })),
  )
  const first = items[0]
  if (!first) return null
  return (
    <section className="w-full bg-surface py-space-3xl">
      <div className="mx-auto max-w-[1000px] px-margin md:px-margin-md">
        <div className="mb-space-2xl text-center">
          <span className="mb-space-xs block font-label-md text-label-md font-semibold uppercase tracking-widest text-secondary">
            {t('eyebrow')}
          </span>
          <h2 className="mb-space-sm font-headline-xl text-headline-xl tracking-tight text-primary">{t('title')}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">{t('intro')}</p>
        </div>
        <Accordion
          defaultOpen={[first.id]}
          className="gap-space-md"
          itemClassName="shadow-none"
          buttonClassName="p-space-lg"
          iconClassName="text-primary"
          panelClassName="px-space-lg pb-space-lg font-body-lg text-body-lg leading-relaxed"
          items={items.map((item) => ({ id: item.id, title: item.question, content: <p>{item.answer}</p> }))}
        />
        <JsonLd data={faqPageJsonLd(items)} />
      </div>
    </section>
  )
}

/** Stitch "Warm Invitation CTA". */
export function ReviewsCta() {
  const t = useTranslations('reviews.cta')
  const tc = useTranslations('common.nav')
  return (
    <section className="relative w-full overflow-hidden bg-surface-container-high py-space-3xl">
      <div className="relative z-10 mx-auto flex max-w-[1440px] flex-col items-center px-margin text-center md:px-margin-md lg:px-margin-lg">
        <div className="mb-space-md inline-flex items-center gap-space-sm rounded-full bg-surface px-space-md py-1 shadow-sm">
          <Icon name="favorite" className="text-sm text-secondary" />
          <span className="font-label-md text-label-md font-semibold uppercase tracking-widest text-secondary">
            {t('eyebrow')}
          </span>
        </div>
        <h2 className="mb-space-md max-w-3xl font-display-lg text-display-lg-mobile tracking-tight text-primary md:text-display-lg">
          {t('title')}
        </h2>
        <p className="mb-space-2xl max-w-2xl font-body-xl text-body-xl text-on-surface-variant">{t('body')}</p>
        <div className="flex w-full flex-col items-center gap-space-md sm:w-auto sm:flex-row">
          <Link
            href={contactHref({ source: 'reviews' })}
            className="inline-flex w-full items-center justify-center gap-space-sm rounded-xl bg-secondary px-space-xl py-space-md font-label-lg text-label-lg text-on-secondary shadow-xl transition-all hover:bg-on-secondary-fixed-variant hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 sm:w-auto"
          >
            <Icon name="calendar_month" className="text-lg" />
            <span>{t('plan')}</span>
          </Link>
          <WhatsAppLink
            page={tc('reviews')}
            className="inline-flex w-full items-center justify-center gap-space-sm rounded-xl bg-tertiary-container px-space-xl py-space-md font-label-lg text-label-lg text-on-tertiary shadow-lg transition-all hover:bg-tertiary hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 sm:w-auto"
          >
            <Icon name="chat" className="text-lg" />
            <span>{t('whatsapp')}</span>
          </WhatsAppLink>
        </div>
        <ul className="mt-space-xl flex flex-wrap items-center justify-center gap-space-lg font-label-md text-label-md text-on-surface-variant">
          {(['tailored', 'whatsapp', 'obligation'] as const).map((key) => (
            <li key={key} className="flex items-center gap-1">
              <Icon name="check" className="text-sm text-tertiary-container" /> {t(`checks.${key}`)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
