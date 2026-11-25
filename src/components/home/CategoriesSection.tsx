import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { getCategories } from '@/lib/api/public'
import type { Locale } from '@/lib/api/types'
import { CategoryTile } from '@/components/cards/CategoryTile'
import { Container } from '@/components/ui/Container'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { CategoryGridSkeleton } from './HomeSkeletons'
import { loadSection } from './loadSection'

async function CategoryGrid({ locale }: { locale: Locale }) {
  const result = await loadSection('categories', () => getCategories(locale))
  if (!result.ok) return <ErrorState retryHref="/" />
  if (result.data.length === 0) return <EmptyState />
  return (
    <ul className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3">
      {result.data.map((category, i) => (
        <Reveal as="li" key={category.id} delay={(i % 3) * 0.08}>
          <CategoryTile category={category} />
        </Reveal>
      ))}
    </ul>
  )
}

/** Section 4 — "Choose Your Island Horizon": the 9 tour categories → /tours?category=… */
export function CategoriesSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.categories')
  return (
    <section className="w-full bg-surface-container-low py-space-3xl">
      <Container className="flex flex-col gap-space-2xl">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')} />
        <Suspense fallback={<CategoryGridSkeleton />}>
          <CategoryGrid locale={locale} />
        </Suspense>
      </Container>
    </section>
  )
}
