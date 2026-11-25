import type { BlogPostDetail, FaqItem, PublicSettings, ReviewSummary, TourDetail } from '@/lib/api/types'

/*
 * schema.org builders (pure functions → plain objects for <JsonLd data={…} />). Absolute URLs come from
 * lib/seo.ts `localizedUrl()`. Business rule: never emit prices/offers. AggregateRating only with real reviews.
 */

type Thing = Record<string, unknown>

const clean = <T extends Thing>(obj: T): T =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0),
    ),
  ) as T

/** AggregateRating — returns undefined unless there is at least one real review. */
export function aggregateRatingJsonLd(
  summary: Pick<ReviewSummary, 'average' | 'count'> | null | undefined,
): Thing | undefined {
  if (!summary || summary.count < 1 || summary.average <= 0) return undefined
  return {
    '@type': 'AggregateRating',
    ratingValue: Number(summary.average.toFixed(2)),
    reviewCount: summary.count,
    bestRating: 5,
    worstRating: 1,
  }
}

export interface TravelAgencyOptions {
  settings: PublicSettings
  siteUrl: string
  /** Absolute URL of the home page in the current locale. */
  url: string
  logoUrl: string
  imageUrl?: string
}

/** TravelAgency (a LocalBusiness) for the home page. */
export function travelAgencyJsonLd({ settings, siteUrl, url, logoUrl, imageUrl }: TravelAgencyOptions): Thing {
  const { contact, social, guide, seo } = settings
  const sameAs = [social.instagram, social.facebook, social.tripadvisor, social.google, social.youtube].filter(
    (v): v is string => Boolean(v),
  )
  return clean({
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': `${siteUrl}/#business`,
    name: seo.siteName || 'Serendiva',
    description: seo.defaultDescription,
    url,
    logo: logoUrl,
    image: imageUrl ?? logoUrl,
    telephone: contact.phone || undefined,
    email: contact.email || undefined,
    address: contact.address
      ? { '@type': 'PostalAddress', streetAddress: contact.address, addressCountry: 'LK' }
      : undefined,
    geo:
      Number.isFinite(contact.mapLat) && Number.isFinite(contact.mapLng)
        ? { '@type': 'GeoCoordinates', latitude: contact.mapLat, longitude: contact.mapLng }
        : undefined,
    areaServed: { '@type': 'Country', name: 'Sri Lanka' },
    knowsLanguage: guide.languages,
    founder: guide.name ? { '@type': 'Person', name: guide.name, jobTitle: guide.title } : undefined,
    sameAs,
    aggregateRating: aggregateRatingJsonLd(settings.reviewSummary),
  })
}

/** TouristTrip for a tour detail page (itinerary = ordered stops; no offers/prices). */
export function touristTripJsonLd(tour: TourDetail, url: string, providerName = 'Serendiva'): Thing {
  const stops = tour.days.flatMap((d) => d.stops)
  const seen = new Set<string>()
  const places = stops.filter((s) => (seen.has(s.name) ? false : (seen.add(s.name), true)))
  return clean({
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: tour.title,
    description: tour.summary,
    url,
    image: tour.cover?.url,
    touristType: tour.travellerTypes,
    itinerary:
      places.length > 0
        ? {
            '@type': 'ItemList',
            numberOfItems: places.length,
            itemListElement: places.map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'Place',
                name: p.name,
                geo: { '@type': 'GeoCoordinates', latitude: p.lat, longitude: p.lng },
              },
            })),
          }
        : undefined,
    provider: { '@type': 'TravelAgency', name: providerName },
    aggregateRating: aggregateRatingJsonLd(tour.reviewSummary),
  })
}

/** FAQPage (answers may contain markdown — pass plain text if possible). */
export function faqPageJsonLd(items: Pick<FaqItem, 'question' | 'answer'>[]): Thing | undefined {
  if (items.length === 0) return undefined
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}

/** BreadcrumbList (items without url = current page). */
export function breadcrumbListJsonLd(items: { name: string; url?: string }[]): Thing | undefined {
  if (items.length === 0) return undefined
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) =>
      clean({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url }),
    ),
  }
}

/** BlogPosting for an article page. */
export function articleJsonLd(post: BlogPostDetail, url: string, publisherLogoUrl: string): Thing {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.cover?.url,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: post.authorName },
    publisher: { '@type': 'Organization', name: 'Serendiva', logo: { '@type': 'ImageObject', url: publisherLogoUrl } },
    mainEntityOfPage: url,
    keywords: post.tags.join(', ') || undefined,
    articleSection: post.category.label,
  })
}
