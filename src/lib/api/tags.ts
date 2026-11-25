/**
 * Cache tags shared with the API (serendiva-api/src/lib/revalidate.ts → `Tags`). The API POSTs these to
 * /api/revalidate whenever content changes. Keep both files identical.
 */
export const Tags = {
  tours: 'tours',
  tour: (slug: string) => `tour:${slug}`,
  categories: 'categories',
  destinations: 'destinations',
  destination: (slug: string) => `destination:${slug}`,
  regions: 'regions',
  reviews: 'reviews',
  faqs: 'faqs',
  blog: 'blog',
  blogPost: (slug: string) => `blog:${slug}`,
  gallery: 'gallery',
  availability: 'availability',
  settings: 'settings',
  pageContent: 'page-content',
  sitemap: 'sitemap',
} as const

/** Valid tag syntax accepted by /api/revalidate (static tags or `<kind>:<slug>`). */
export const TAG_PATTERN =
  /^(?:tours|categories|destinations|regions|reviews|faqs|blog|gallery|availability|settings|page-content|sitemap|(?:tour|destination|blog):[a-z0-9]+(?:-[a-z0-9]+)*)$/

/** Default ISR window for API data (seconds). On-demand revalidation by tag makes edits appear immediately. */
export const DEFAULT_REVALIDATE = 3600
