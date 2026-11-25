import type { DestinationDetail } from '@/lib/api/types'

type Thing = Record<string, unknown>

const clean = (obj: Thing): Thing =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0),
    ),
  )

export interface TouristDestinationOptions {
  /** Absolute URL of the destination page in the current locale. */
  url: string
  /** Plain-text description (hero lead or SEO description). */
  description: string
  /** Absolute URL of the parent /destinations page (for containedInPlace). */
  regionUrl?: string
}

/**
 * schema.org TouristDestination for a destination detail page: geo, images, landmarks (mapPoints as
 * TouristAttraction) and the region it belongs to. No offers/prices (business rule).
 */
export function touristDestinationJsonLd(
  d: DestinationDetail,
  { url, description, regionUrl }: TouristDestinationOptions,
): Thing {
  const images = [d.cover?.url, ...d.gallery.map((g) => g.image.url)].filter((v): v is string => Boolean(v))
  return clean({
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: d.name,
    alternateName: d.headline !== d.name ? d.headline : undefined,
    description,
    url,
    image: [...new Set(images)].slice(0, 6),
    geo:
      d.latitude !== null && d.longitude !== null
        ? clean({
            '@type': 'GeoCoordinates',
            latitude: d.latitude,
            longitude: d.longitude,
            elevation: d.elevation ?? undefined,
          })
        : undefined,
    touristType: d.interests,
    includesAttraction: d.mapPoints.map((p) => ({
      '@type': 'TouristAttraction',
      name: p.name,
      geo: { '@type': 'GeoCoordinates', latitude: p.lat, longitude: p.lng },
    })),
    containedInPlace: d.region
      ? clean({
          '@type': 'Place',
          name: d.region.name,
          url: regionUrl,
          containedInPlace: { '@type': 'Country', name: 'Sri Lanka' },
        })
      : { '@type': 'Country', name: 'Sri Lanka' },
  })
}
