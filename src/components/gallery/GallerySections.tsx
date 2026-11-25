import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { getAllReviews } from '@/lib/api/public'
import type { Locale, PublicSettings, ReviewCard } from '@/lib/api/types'
import { countryName } from '@/lib/format'
import { contactHref } from '@/lib/prefill'
import { initialsOf } from '@/lib/utils'
import { reviewPlace } from '@/components/reviews/format'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { Skeleton } from '@/components/ui/Skeleton'
import { SmartImage } from '@/components/ui/SmartImage'
import { PageBreadcrumb } from '@/components/about/PageBreadcrumb'
import { loadGallery } from './data'
import { GalleryFilters, GalleryFiltersView } from './GalleryFilters'
import { GalleryGrid, GalleryGridView } from './GalleryGrid'
import { GalleryVideoCards } from './GalleryVideoCards'
import { GalleryGridSkeleton } from './GallerySkeletons'

// ------------------------------------------------------------------------------------------------ hero

/** Stitch "Top Archival Navigation & Breadcrumbs Bar". */
export function GalleryArchiveBar() {
  const t = useTranslations('gallery')
  return (
    <section className="w-full bg-surface-container-low/70 py-space-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-space-md px-margin lg:px-margin-lg">
        <PageBreadcrumb
          separator="slash"
          className="font-label-md text-label-md uppercase tracking-[0.16em] text-on-surface-variant"
          items={[{ label: t('breadcrumb.home'), href: '/' }, { label: t('breadcrumb.current') }]}
        />
        <div className="hidden items-center gap-space-sm font-label-md text-label-md uppercase tracking-widest text-on-surface-variant md:flex">
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 animate-pulse rounded-full bg-tertiary-container motion-reduce:animate-none"
          />
          <span>{t('archive')}</span>
        </div>
      </div>
    </section>
  )
}

async function GalleryCount({ locale }: { locale: Locale }) {
  const t = await getTranslations('gallery.hero')
  let count: number
  try {
    count = (await loadGallery(locale)).images.length
  } catch {
    return null
  }
  if (count === 0) return null
  return (
    <div className="flex items-center gap-space-md rounded-xl bg-surface-container p-space-md shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary">
        <Icon name="camera_roll" className="text-[24px]" />
      </div>
      <div>
        <p className="font-headline-sm text-headline-sm leading-none text-primary">{t('plates', { count })}</p>
        <p className="mt-1 font-caption text-caption text-on-surface-variant">{t('platesCaption')}</p>
      </div>
    </div>
  )
}

async function GalleryChips({ locale }: { locale: Locale }) {
  let data
  try {
    data = await loadGallery(locale)
  } catch {
    return null
  }
  if (data.categories.length === 0) return null
  const props = { categories: data.categories, total: data.images.length }
  return (
    <Suspense fallback={<GalleryFiltersView {...props} active={null} />}>
      <GalleryFilters {...props} />
    </Suspense>
  )
}

/** Stitch "Gallery Hero Introduction" + category chips. */
export function GalleryHero({ locale }: { locale: Locale }) {
  const t = useTranslations('gallery.hero')
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-surface-container-low via-surface to-surface pb-space-xl pt-space-2xl">
      <div className="mx-auto max-w-[1440px] px-margin lg:px-margin-lg">
        <div className="grid grid-cols-1 items-end gap-gutter-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-sm lg:col-span-8">
            <div className="inline-flex items-center gap-space-xs font-label-lg text-label-lg uppercase tracking-[0.25em] text-secondary">
              <span aria-hidden="true" className="h-[1px] w-8 bg-secondary/50" />
              {t('eyebrow')}
            </div>
            <h1 className="mt-1 font-display-lg text-display-lg font-medium tracking-tight text-primary">
              {t('title')}
            </h1>
            <p className="mt-space-xs max-w-2xl font-body-xl text-body-xl font-light text-on-surface-variant">
              {t('intro')}
            </p>
          </div>
          <div className="flex flex-col items-start justify-end gap-space-sm pb-1 sm:flex-row lg:col-span-4 lg:flex-col lg:items-end">
            <Suspense fallback={<Skeleton className="h-20 w-72 rounded-xl" />}>
              <GalleryCount locale={locale} />
            </Suspense>
          </div>
        </div>
        <Suspense fallback={<Skeleton className="mt-space-xl h-8 w-full max-w-4xl rounded-full" />}>
          <GalleryChips locale={locale} />
        </Suspense>
      </div>
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ plates

async function GalleryPlates({ locale }: { locale: Locale }) {
  const t = await getTranslations('gallery')
  let data
  try {
    data = await loadGallery(locale)
  } catch {
    return <ErrorState retryHref="/gallery" />
  }
  if (data.images.length === 0) {
    return <EmptyState icon="photo_library" title={t('grid.emptyTitle')} body={t('grid.emptyBody')} />
  }
  return (
    <Suspense fallback={<GalleryGridView items={data.images} categoryLabels={data.labels} />}>
      <GalleryGrid items={data.images} categoryLabels={data.labels} lightboxLabel={t('lightbox.label')} />
    </Suspense>
  )
}

/** Picks the featured review (else the newest 5-star) for the "Guest Chronicle" quote. */
function pickQuote(reviews: ReviewCard[]): ReviewCard | null {
  return reviews.find((r) => r.isFeatured) ?? reviews.find((r) => r.rating >= 5) ?? reviews[0] ?? null
}

async function GalleryQuote({ locale }: { locale: Locale }) {
  const t = await getTranslations('gallery.quote')
  let review: ReviewCard | null
  try {
    review = pickQuote(await getAllReviews(locale))
  } catch {
    return null
  }
  if (!review) return null
  const quote = review.title ?? review.text
  const place = reviewPlace(review.location, countryName(review.country, locale))
  return (
    <figure className="relative mt-space-2xl overflow-hidden rounded-xl bg-surface-container-low p-space-xl">
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-10 -right-8 select-none opacity-5">
        <span className="font-display-lg text-[220px] leading-none text-primary">“</span>
      </div>
      <div className="relative z-10 max-w-3xl">
        <span className="mb-2 block font-label-md text-label-md font-semibold uppercase tracking-[0.2em] text-secondary">
          {t('eyebrow')}
        </span>
        <blockquote className="font-headline-md text-headline-md italic leading-relaxed text-primary">
          <p>“{quote.trim()}”</p>
        </blockquote>
        <figcaption className="mt-space-md flex items-center gap-space-md">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-headline-sm text-headline-sm text-on-primary"
          >
            {(review.initials || initialsOf(review.guestName)).charAt(0)}
          </div>
          <div>
            <p className="font-headline-sm text-headline-sm text-primary">{review.guestName}</p>
            <p className="font-caption text-caption text-on-surface-variant">
              {[review.tripLabel ?? review.tour?.title, place].filter(Boolean).join(' • ')}
            </p>
          </div>
        </figcaption>
      </div>
    </figure>
  )
}

/** Stitch "Editorial Asymmetric Masonry Showcase" + "Curated Quote Overlay". */
export function GalleryPlatesSection({ locale }: { locale: Locale }) {
  const t = useTranslations('gallery.grid')
  return (
    <section aria-labelledby="gallery-plates-title" className="w-full bg-surface pb-space-3xl">
      <div className="mx-auto max-w-[1440px] px-margin lg:px-margin-lg">
        <h2 id="gallery-plates-title" className="sr-only">
          {t('title')}
        </h2>
        <Suspense fallback={<GalleryGridSkeleton />}>
          <GalleryPlates locale={locale} />
        </Suspense>
        <Suspense fallback={null}>
          <GalleryQuote locale={locale} />
        </Suspense>
      </div>
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ films

async function GalleryFilmsContent({ locale }: { locale: Locale }) {
  const t = await getTranslations('gallery')
  let data
  try {
    data = await loadGallery(locale)
  } catch {
    return <ErrorState retryHref="/gallery" />
  }
  // Guest interviews (portraits) live on /reviews; the gallery shows the destination films.
  const films = data.videos.filter((v) => v.category !== 'portraits')
  const videos = films.length > 0 ? films : data.videos
  if (videos.length === 0) return null
  return (
    <section className="relative w-full bg-surface-container-high py-space-3xl">
      <div className="mx-auto max-w-[1440px] px-margin lg:px-margin-lg">
        <div className="flex flex-col justify-between gap-space-md pb-space-xl md:flex-row md:items-end">
          <div>
            <span className="inline-flex items-center gap-2 font-label-lg text-label-lg uppercase tracking-[0.2em] text-secondary">
              <Icon name="videocam" className="text-[18px]" />
              {t('videos.eyebrow')}
            </span>
            <h2 className="mt-1 font-headline-xl text-headline-xl font-medium text-primary">{t('videos.title')}</h2>
            <p className="mt-1 max-w-xl font-body-lg text-body-lg text-on-surface-variant">{t('videos.intro')}</p>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-space-md py-space-xs font-label-md text-label-md uppercase tracking-wider text-primary shadow-sm">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-secondary" />
              {t('videos.badge')}
            </span>
          </div>
        </div>
        <GalleryVideoCards videos={videos} categoryLabels={data.labels} dialogLabel={t('lightbox.videoLabel')} />
      </div>
    </section>
  )
}

/** Stitch "Featured Expedition Films Section" — gallery items of type video (lite embeds). */
export function GalleryFilms({ locale }: { locale: Locale }) {
  return (
    <Suspense
      fallback={<div className="h-[640px] w-full animate-pulse bg-surface-container-high" aria-hidden="true" />}
    >
      <GalleryFilmsContent locale={locale} />
    </Suspense>
  )
}

// ------------------------------------------------------------------------------------------------ instagram + CTA

/** Stitch "Instagram Community Aesthetic Stream" (settings.instagramFeed). */
export function GalleryInstagram({ settings }: { settings: PublicSettings | null }) {
  const t = useTranslations('gallery.instagram')
  const tc = useTranslations('common.a11y')
  const feed = (settings?.instagramFeed ?? []).slice(0, 6)
  if (feed.length === 0) return null
  const url = settings?.social.instagram
  const handle = settings?.social.instagramHandle
  const tileClass = 'group relative block aspect-square overflow-hidden rounded-lg bg-surface-container'
  const tileInner = (image: (typeof feed)[number]) => (
    <>
      <SmartImage
        image={image}
        fill
        sizes="(min-width: 1024px) 16vw, (min-width: 768px) 33vw, 50vw"
        className="object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center bg-primary/40 text-on-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        <Icon name="favorite" className="text-[24px]" />
      </div>
    </>
  )
  return (
    <section className="w-full bg-surface py-space-2xl">
      <div className="mx-auto max-w-[1440px] px-margin lg:px-margin-lg">
        <div className="mb-space-lg flex flex-col items-start justify-between gap-space-sm sm:flex-row sm:items-end">
          <div>
            <span className="font-label-md text-label-md font-semibold uppercase tracking-[0.2em] text-secondary">
              {t('eyebrow')}
            </span>
            <h2 className="mt-1 font-headline-lg text-headline-lg font-medium text-primary">
              {handle ? t('title', { handle }) : t('titleNoHandle')}
            </h2>
          </div>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target relative inline-flex items-center gap-space-xs rounded-sm font-label-lg text-label-lg uppercase tracking-wider text-primary transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span>{t('explore')}</span>
              <Icon name="arrow_outward" className="text-[18px]" />
              <span className="sr-only"> {tc('opensInNewTab')}</span>
            </a>
          )}
        </div>
        <ul className="grid grid-cols-2 gap-space-sm md:grid-cols-3 lg:grid-cols-6">
          {feed.map((image) => (
            <li key={image.id}>
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${t('openPost', { alt: image.alt })} ${tc('opensInNewTab')}`}
                  className={`${tileClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
                >
                  {tileInner(image)}
                </a>
              ) : (
                <div className={tileClass}>{tileInner(image)}</div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Stitch "Final Visual Bespoke Call to Action". */
export function GalleryCta() {
  const t = useTranslations('gallery.cta')
  const tc = useTranslations('common')
  return (
    <section className="relative w-full overflow-hidden bg-surface-container-high py-space-3xl">
      <div className="mx-auto max-w-[1440px] px-margin lg:px-margin-lg">
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-xl shadow-xl md:p-space-2xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-0 top-0 hidden w-1/3 opacity-10 lg:block"
          >
            <svg
              className="h-full w-full text-primary"
              fill="none"
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 0C44.77 0 0 44.77 0 100C0 155.23 44.77 200 100 200C155.23 200 200 155.23 200 100C200 44.77 155.23 0 100 0ZM100 180C55.82 180 20 144.18 20 100C20 55.82 55.82 20 100 20C144.18 20 180 55.82 180 100C180 144.18 144.18 180 100 180Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="relative z-10 max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-space-xs font-label-md text-label-md font-semibold uppercase tracking-[0.2em] text-secondary">
              <Icon name="map" className="text-[16px]" />
              {t('eyebrow')}
            </div>
            <h2 className="font-headline-xl text-headline-xl font-medium tracking-tight text-primary">{t('title')}</h2>
            <p className="mt-space-sm font-body-lg text-body-lg font-light text-on-surface-variant">{t('body')}</p>
            <div className="mt-space-xl flex flex-col items-stretch gap-space-md sm:flex-row sm:items-center">
              <Link
                href={contactHref({ source: 'gallery' })}
                className="inline-flex transform items-center justify-center gap-space-xs rounded-xl bg-secondary px-space-xl py-space-md text-center font-label-lg text-label-lg uppercase tracking-widest text-on-secondary shadow-md transition-all duration-300 hover:bg-on-secondary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 active:scale-95"
              >
                <span>{t('plan')}</span>
                <Icon name="east" className="text-[18px]" />
              </Link>
              <WhatsAppLink
                page={tc('nav.gallery')}
                className="inline-flex items-center justify-center gap-space-xs rounded-xl bg-tertiary-container px-space-lg py-space-md text-center font-label-lg text-label-lg uppercase tracking-widest text-on-tertiary shadow-sm transition-all duration-300 hover:bg-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2"
              >
                <Icon name="chat" className="text-[20px]" />
                <span>{t('whatsapp')}</span>
              </WhatsAppLink>
            </div>
            <ul className="mt-space-lg flex flex-wrap items-center gap-space-lg pt-space-md font-caption text-caption text-on-surface-variant">
              <li className="flex items-center gap-1">
                <Icon name="verified" className="text-[16px] text-secondary" />
                {t('tailored')}
              </li>
              <li className="flex items-center gap-1">
                <Icon name="schedule" className="text-[16px] text-secondary" />
                {t('proposals')}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
