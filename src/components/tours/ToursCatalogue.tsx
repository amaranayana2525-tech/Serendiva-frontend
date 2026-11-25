import type { Locale } from '@/i18n/routing'
import { ClientMessages } from '@/i18n/ClientMessages'
import { getAllTours, getCategories } from '@/lib/api/public'
import type { Category, TourCard } from '@/lib/api/types'
import { Container } from '@/components/ui/Container'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ToursBrowser } from './ToursBrowser'

/** Data section of /tours: every published tour + categories → client-side filtering (URL-synced). */
export async function ToursCatalogue({ locale }: { locale: Locale }) {
  let tours: TourCard[]
  let categories: Category[]
  try {
    ;[tours, categories] = await Promise.all([getAllTours(locale), getCategories(locale)])
  } catch {
    return (
      <Container className="py-space-2xl">
        <ErrorState retryHref="/tours" />
      </Container>
    )
  }

  if (tours.length === 0) {
    return (
      <Container className="py-space-2xl">
        <EmptyState icon="travel_explore" />
      </Container>
    )
  }

  return (
    <ClientMessages namespaces={['tours']}>
      <ToursBrowser
        tours={tours}
        categories={categories.map(({ slug, name, shortName }) => ({ slug, name, shortName }))}
      />
    </ClientMessages>
  )
}
