import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { cache } from 'react'
import { getServerEnv } from '@/lib/env'
import type { PageContentOverride } from '@/lib/page-content/merge'
import { api, cachedFetch } from './client'
import { ApiError, isApiErrorBody } from './errors'
import { Tags } from './tags'
import type {
  AvailabilityCalendar,
  AvailabilityQuery,
  BlogCard,
  BlogList,
  BlogPostDetail,
  BlogQuery,
  Category,
  DestinationDetail,
  DestinationList,
  DestinationQuery,
  FaqItem,
  FaqQuery,
  GalleryList,
  GalleryQuery,
  Locale,
  PublicSettings,
  Region,
  ReviewCard,
  ReviewList,
  ReviewQuery,
  ReviewSummary,
  SitemapData,
  TourCard,
  TourDetail,
  TourList,
  TourQuery,
} from './types'

/*
 * Server-only data access for pages (server components, generateMetadata, generateStaticParams, sitemap).
 *  - Every content request passes the locale; responses are cached in Next's data cache with tags + 1 h ISR.
 *  - Failures throw `ApiError` (status 0 = network/timeout). Detail getters return `null` on 404 → call notFound().
 *  - In development (or CONTENT_FALLBACK=true) an unreachable API falls back to the deprecated src/content snapshot.
 */

type ApiResult<T> = { data?: T; error?: unknown; response: Response }
type Outcome<T> = { found: true; data: T } | { found: false }

async function loadFallback<T>(key: string, cause: unknown): Promise<T | undefined> {
  if (!getServerEnv().contentFallback) return undefined
  try {
    // Read from disk (not bundled): the snapshot is a local-development convenience only.
    const file = path.join(process.cwd(), 'src', 'content', `${key.replace(/[^a-z0-9._-]/gi, '_')}.json`)
    const data = JSON.parse(await readFile(file, 'utf8')) as T
    const reason = cause instanceof Error ? cause.message : String(cause)
    console.warn(`[api] "${key}" — API unavailable (${reason}); serving the deprecated src/content snapshot.`)
    return data
  } catch {
    return undefined
  }
}

async function execute<T>(key: string, run: () => Promise<ApiResult<T>>): Promise<Outcome<T>> {
  let result: ApiResult<T>
  try {
    result = await run()
  } catch (err) {
    const fallback = await loadFallback<T>(key, err)
    if (fallback !== undefined) return { found: true, data: fallback }
    const reason = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    throw new ApiError(0, 'NETWORK_ERROR', `API unreachable while loading "${key}" (${reason})`)
  }

  const { data, error, response } = result
  if (response.ok && data !== undefined) return { found: true, data }
  if (response.status === 404) return { found: false }

  const body = isApiErrorBody(error) ? error.error : undefined
  const apiError = new ApiError(
    response.status,
    body?.code ?? 'HTTP_ERROR',
    body?.message ?? `API responded ${response.status} while loading "${key}"`,
    body?.details,
  )
  if (apiError.isUnavailable) {
    const fallback = await loadFallback<T>(key, apiError)
    if (fallback !== undefined) return { found: true, data: fallback }
  }
  throw apiError
}

/** Loads a resource that must exist (404 is an error). */
async function load<T>(key: string, run: () => Promise<ApiResult<T>>): Promise<T> {
  const outcome = await execute(key, run)
  if (!outcome.found) throw new ApiError(404, 'NOT_FOUND', `"${key}" not found`)
  return outcome.data
}

/** Loads a resource that may not exist (404 → null). */
async function loadOrNull<T>(key: string, run: () => Promise<ApiResult<T>>): Promise<T | null> {
  const outcome = await execute(key, run)
  return outcome.found ? outcome.data : null
}

const MAX_PAGE_SIZE = 50

// ------------------------------------------------------------------------------------------------ settings

/** Public site settings: contact (WhatsApp/phone/email), guide profile, counters, trust badges, hero slides, SEO … */
export const getSettings = cache((locale: Locale): Promise<PublicSettings> =>
  load('settings', () =>
    api.GET('/api/v1/settings/public', {
      params: { query: { locale } },
      fetch: cachedFetch({ tags: [Tags.settings] }),
    }),
  ),
)

// ------------------------------------------------------------------------------------------------ page content

/**
 * The admin's page-copy overrides (merged over src/messages by i18n/request.ts). Never throws: when the
 * API is unavailable the site simply shows the JSON defaults.
 */
export const getPageContent = cache(async (locale: Locale): Promise<PageContentOverride[]> => {
  try {
    const { data, response } = await api.GET('/api/v1/page-content/public', {
      params: { query: { locale } },
      fetch: cachedFetch({ tags: [Tags.pageContent] }),
    })
    return response.ok && data ? data.items : []
  } catch {
    return []
  }
})

// ------------------------------------------------------------------------------------------------ tours

export const getCategories = cache((locale: Locale): Promise<Category[]> =>
  load('categories', () =>
    api.GET('/api/v1/categories', { params: { query: { locale } }, fetch: cachedFetch({ tags: [Tags.categories] }) }),
  ),
)

/** One page of published tours (filters are optional; prefer getAllTours + in-memory filtering for list pages). */
export async function getTours(locale: Locale, query: TourQuery = {}): Promise<TourList> {
  return load('tours', () =>
    api.GET('/api/v1/tours', {
      params: { query: { pageSize: MAX_PAGE_SIZE, ...query, locale } },
      fetch: cachedFetch({ tags: [Tags.tours] }),
    }),
  )
}

/** Every published tour (pages through the API). */
export const getAllTours = cache(async (locale: Locale): Promise<TourCard[]> => {
  const first = await getTours(locale, { page: 1, pageSize: MAX_PAGE_SIZE })
  const items = [...first.items]
  for (let page = 2; page <= first.meta.totalPages; page++) {
    items.push(...(await getTours(locale, { page, pageSize: MAX_PAGE_SIZE })).items)
  }
  return items
})

/** Tour detail or `null` when the slug does not exist / is unpublished. */
export const getTour = cache((locale: Locale, slug: string): Promise<TourDetail | null> =>
  loadOrNull(`tour.${slug}`, () =>
    api.GET('/api/v1/tours/{slug}', {
      params: { path: { slug }, query: { locale } },
      fetch: cachedFetch({ tags: [Tags.tour(slug), Tags.tours, Tags.reviews, Tags.faqs] }),
    }),
  ),
)

// ------------------------------------------------------------------------------------------------ destinations

export const getRegions = cache((locale: Locale): Promise<Region[]> =>
  load('regions', () =>
    api.GET('/api/v1/regions', { params: { query: { locale } }, fetch: cachedFetch({ tags: [Tags.regions] }) }),
  ),
)

export async function getDestinations(locale: Locale, query: DestinationQuery = {}): Promise<DestinationList> {
  return load('destinations', () =>
    api.GET('/api/v1/destinations', {
      params: { query: { ...query, locale } },
      fetch: cachedFetch({ tags: [Tags.destinations, Tags.regions] }),
    }),
  )
}

export const getDestination = cache((locale: Locale, slug: string): Promise<DestinationDetail | null> =>
  loadOrNull(`destination.${slug}`, () =>
    api.GET('/api/v1/destinations/{slug}', {
      params: { path: { slug }, query: { locale } },
      fetch: cachedFetch({ tags: [Tags.destination(slug), Tags.destinations, Tags.tours, Tags.faqs] }),
    }),
  ),
)

// ------------------------------------------------------------------------------------------------ reviews

export async function getReviews(locale: Locale, query: ReviewQuery = {}): Promise<ReviewList> {
  return load('reviews', () =>
    api.GET('/api/v1/reviews', {
      params: { query: { pageSize: MAX_PAGE_SIZE, ...query, locale } },
      fetch: cachedFetch({ tags: [Tags.reviews] }),
    }),
  )
}

/** Every approved review (pages through the API). */
export const getAllReviews = cache(async (locale: Locale): Promise<ReviewCard[]> => {
  const first = await getReviews(locale, { page: 1, pageSize: MAX_PAGE_SIZE })
  const items = [...first.items]
  for (let page = 2; page <= first.meta.totalPages; page++) {
    items.push(...(await getReviews(locale, { page, pageSize: MAX_PAGE_SIZE })).items)
  }
  return items
})

/** Average rating, count and breakdowns (not localised). */
export const getReviewSummary = cache((): Promise<ReviewSummary> =>
  load('reviews-summary', () => api.GET('/api/v1/reviews/summary', { fetch: cachedFetch({ tags: [Tags.reviews] }) })),
)

// ------------------------------------------------------------------------------------------------ faqs

/** FAQs by scope ('general' | 'booking' | 'corporate' | 'tour' | 'destination'), or attached to a tour/destination slug. */
export async function getFaqs(locale: Locale, query: FaqQuery = {}): Promise<FaqItem[]> {
  const key = `faqs.${query.scope ?? query.tour ?? query.destination ?? 'all'}`
  return load(key, () =>
    api.GET('/api/v1/faqs', { params: { query: { ...query, locale } }, fetch: cachedFetch({ tags: [Tags.faqs] }) }),
  )
}

// ------------------------------------------------------------------------------------------------ blog

export async function getBlogPosts(locale: Locale, query: BlogQuery = {}): Promise<BlogList> {
  return load('blog', () =>
    api.GET('/api/v1/blog', {
      params: { query: { pageSize: MAX_PAGE_SIZE, ...query, locale } },
      fetch: cachedFetch({ tags: [Tags.blog] }),
    }),
  )
}

/** Every published post (pages through the API). */
export const getAllBlogPosts = cache(async (locale: Locale): Promise<BlogCard[]> => {
  const first = await getBlogPosts(locale, { page: 1, pageSize: MAX_PAGE_SIZE })
  const items = [...first.items]
  for (let page = 2; page <= first.meta.totalPages; page++) {
    items.push(...(await getBlogPosts(locale, { page, pageSize: MAX_PAGE_SIZE })).items)
  }
  return items
})

export const getBlogPost = cache((locale: Locale, slug: string): Promise<BlogPostDetail | null> =>
  loadOrNull(`blog.${slug}`, () =>
    api.GET('/api/v1/blog/{slug}', {
      params: { path: { slug }, query: { locale } },
      fetch: cachedFetch({ tags: [Tags.blogPost(slug), Tags.blog] }),
    }),
  ),
)

// ------------------------------------------------------------------------------------------------ gallery & availability

export async function getGallery(locale: Locale, query: GalleryQuery = {}): Promise<GalleryList> {
  return load('gallery', () =>
    api.GET('/api/v1/gallery', {
      params: { query: { ...query, locale } },
      fetch: cachedFetch({ tags: [Tags.gallery] }),
    }),
  )
}

/** Busy / available date ranges (defaults: today → +12 months). Not localised. */
export async function getAvailability(query: AvailabilityQuery = {}): Promise<AvailabilityCalendar> {
  return load('availability', () =>
    api.GET('/api/v1/availability', { params: { query }, fetch: cachedFetch({ tags: [Tags.availability] }) }),
  )
}

// ------------------------------------------------------------------------------------------------ sitemap

export const getSitemapData = cache((): Promise<SitemapData> =>
  load('sitemap-data', () => api.GET('/api/v1/sitemap-data', { fetch: cachedFetch({ tags: [Tags.sitemap] }) })),
)
