import type { MetadataRoute } from 'next'
import { publicEnv } from '@/lib/env'

/** robots.txt — everything public is crawlable except the admin panel and API routes. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/admin/', '/api/'] }],
    sitemap: `${publicEnv.siteUrl}/sitemap.xml`,
  }
}
