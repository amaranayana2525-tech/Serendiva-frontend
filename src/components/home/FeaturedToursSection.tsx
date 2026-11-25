import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { getTours } from '@/lib/api/public'
import type { Locale } from '@/lib/api/types'
import { FeaturedTourCard } from '@/components/cards/FeaturedTourCard'
import { Container } from '@/components/ui/Container'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Icon } from '@/components/ui/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { FeaturedToursSkeleton } from './HomeSkeletons'
import { loadSection } from './loadSection'

async function FeaturedToursGrid({ locale, emptyBody }: { locale: Locale; emptyBody: string }) {
  const result = await loadSection('featured tours', () => getTours(locale, { featured: 'true' }))
  if (!result.ok) return <ErrorState retryHref="/" />
  if (result.data.items.length === 0) return <EmptyState body={emptyBody} />
  return (
    <ul className="grid grid-cols-1 gap-gutter-lg md:grid-cols-2">
      {result.data.items.map((tour, i) => (
        <Reveal as="li" key={tour.id} delay={(i % 2) * 0.08} className="flex">
          <FeaturedTourCard tour={tour} className="w-full" />
        </Reveal>
      ))}
    </ul>
  )
}

/** Section 5 — "Signature Private Itineraries" (featured tours) + the no-checkout concierge notice. */
export function FeaturedToursSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.featured')
  return (
    <section id="featured-tours" className="w-full scroll-mt-20 py-space-3xl">
      <Container className="flex flex-col gap-space-2xl">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')} />
        <Suspense fallback={<FeaturedToursSkeleton />}>
          <FeaturedToursGrid locale={locale} emptyBody={t('emptyBody')} />
        </Suspense>
        <aside className="flex items-center gap-space-sm rounded-xl bg-surface-container p-space-md">
          <Icon name="info" className="text-xl text-secondary" />
          <p className="font-caption text-caption text-on-surface-variant">
            <strong>{t('noticeTitle')}</strong> {t('notice')}
          </p>
        </aside>
      </Container>
    </section>
  )
}
