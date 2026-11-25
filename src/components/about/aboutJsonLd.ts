import type { PublicSettings } from '@/lib/api/types'

/**
 * schema.org ProfilePage → Person (the guide) working for the TravelAgency. No prices/offers; the agency's
 * AggregateRating is only included when real reviews exist.
 */
export function aboutPageJsonLd({
  settings,
  url,
  siteUrl,
  description,
}: {
  settings: PublicSettings
  url: string
  siteUrl: string
  description: string
}): Record<string, unknown> {
  const { guide, social, seo, reviewSummary } = settings
  const sameAs = [social.instagram, social.facebook, social.tripadvisor, social.google, social.youtube].filter(
    (v): v is string => Boolean(v),
  )
  const portrait = settings.pageImages?.['guide-portrait-sigiriya'] ?? guide.portrait
  const person: Record<string, unknown> = {
    '@type': 'Person',
    '@id': `${siteUrl}/#guide`,
    name: guide.name,
    jobTitle: guide.title,
    description,
    knowsLanguage: guide.languages,
    worksFor: {
      '@type': 'TravelAgency',
      '@id': `${siteUrl}/#business`,
      name: seo.siteName || 'Serendiva',
      url: siteUrl,
      ...(reviewSummary.count > 0 && reviewSummary.average > 0
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: Number(reviewSummary.average.toFixed(2)),
              reviewCount: reviewSummary.count,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
    },
    ...(guide.licenseNumber
      ? {
          hasCredential: {
            '@type': 'EducationalOccupationalCredential',
            credentialCategory: 'license',
            name: guide.title,
            identifier: guide.licenseNumber,
            recognizedBy: { '@type': 'Organization', name: 'Sri Lanka Tourism Development Authority' },
          },
        }
      : {}),
    ...(portrait?.url ? { image: portrait.url } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url,
    mainEntity: person,
  }
}
