import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import type { Locale } from '@/i18n/routing'
import { getDestination } from '@/lib/api/public'

/**
 * Checks that the slug exists *before* the page streams. The page has a loading.tsx (a Suspense boundary), so a
 * notFound() inside the page would arrive after the 200 headers (a "soft 404" with noindex); thrown here, outside
 * that boundary, the response gets a real 404 status. The request is deduplicated with the page's own fetch.
 * API errors are ignored here — the page renders its error state for those.
 */
export default async function DestinationLayout({
  children,
  params,
}: LayoutProps<'/[locale]/destinations/[slug]'>): Promise<ReactNode> {
  const { locale, slug } = await params
  const entity = await getDestination(locale as Locale, slug).catch(() => undefined)
  if (entity === null) notFound()
  return children
}
