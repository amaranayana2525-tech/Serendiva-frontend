import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ScopedMessages } from '@/components/blog/ScopedMessages'
import { MindfulChecklist } from '@/components/responsible/MindfulChecklist'
import { ResponsibleCredentials } from '@/components/responsible/ResponsibleCredentials'
import { ResponsibleCreed, ResponsibleCreedSkeleton } from '@/components/responsible/ResponsibleCreed'
import { ResponsibleCta } from '@/components/responsible/ResponsibleCta'
import {
  ResponsibleBreadcrumbBar,
  ResponsibleHero,
  ResponsibleHeroPhoto,
} from '@/components/responsible/ResponsibleHero'
import {
  ResponsiblePartnerCards,
  ResponsiblePartnerCardsSkeleton,
  ResponsiblePartnershipsHeader,
} from '@/components/responsible/ResponsiblePartnerships'
import { ResponsiblePillars } from '@/components/responsible/ResponsiblePillars'
import { Container } from '@/components/ui/Container'
import type { Locale } from '@/i18n/routing'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata({ params }: PageProps<'/[locale]/responsible-travel'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'responsible.meta' })
  return buildMetadata({
    locale: locale as Locale,
    path: '/responsible-travel',
    title: t('title'),
    description: t('description'),
  })
}

export default async function ResponsibleTravelPage({ params }: PageProps<'/[locale]/responsible-travel'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'responsible.checklist' })

  return (
    <>
      <ResponsibleBreadcrumbBar />
      <ResponsibleHero
        photo={
          <Suspense fallback={null}>
            <ResponsibleHeroPhoto locale={locale} />
          </Suspense>
        }
      />
      <ResponsiblePillars />

      <section aria-labelledby="checklist-title" className="w-full bg-surface-container-low py-space-3xl">
        <Container>
          <div className="mx-auto mb-space-2xl max-w-2xl text-center">
            <span className="font-label-md text-label-md font-semibold uppercase tracking-[0.2em] text-secondary">
              {t('eyebrow')}
            </span>
            <h2 id="checklist-title" className="mt-space-xs font-headline-xl text-headline-xl text-primary">
              {t('title')}
            </h2>
            <p className="mt-space-xs font-body-md text-body-md text-on-surface-variant">{t('intro')}</p>
          </div>
          <ScopedMessages paths={['responsible.checklist']}>
            <MindfulChecklist />
          </ScopedMessages>
        </Container>
      </section>

      <section aria-labelledby="partnerships-title" className="w-full bg-surface py-space-3xl">
        <Container>
          <ResponsiblePartnershipsHeader />
          <Suspense fallback={<ResponsiblePartnerCardsSkeleton />}>
            <ResponsiblePartnerCards locale={locale} />
          </Suspense>
        </Container>
      </section>

      <ResponsibleCredentials />
      <Suspense fallback={<ResponsibleCreedSkeleton />}>
        <ResponsibleCreed locale={locale} />
      </Suspense>
      <ResponsibleCta />
    </>
  )
}
