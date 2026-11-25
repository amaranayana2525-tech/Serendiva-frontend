import { Suspense, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { getFaqs } from '@/lib/api/public'
import type { Locale } from '@/lib/api/types'
import { FaqSection } from '@/components/sections/FaqSection'
import { Container } from '@/components/ui/Container'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Icon } from '@/components/ui/Icon'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { FaqSkeleton } from './HomeSkeletons'
import { loadSection } from './loadSection'

const CLIMATE_REGIONS = ['southWest', 'eastNorth', 'highlands'] as const

/** FAQ heading shown while loading / on error / when empty (FaqSection renders its own heading with the list). */
function FaqHeadingWith({ children }: { children: ReactNode }) {
  const t = useTranslations('common.faq')
  return (
    <div className="flex flex-col gap-space-lg lg:col-span-7">
      <SectionHeading align="left" eyebrow={t('eyebrow')} title={t('title')} />
      {children}
    </div>
  )
}

async function HomeFaqs({ locale }: { locale: Locale }) {
  const result = await loadSection('faqs', () => getFaqs(locale, { scope: 'general' }))
  if (!result.ok) {
    return (
      <FaqHeadingWith>
        <ErrorState retryHref="/" />
      </FaqHeadingWith>
    )
  }
  if (result.data.length === 0) {
    const t = await getTranslations({ locale, namespace: 'home.faq' })
    return (
      <FaqHeadingWith>
        <EmptyState icon="help" body={t('emptyBody')} />
      </FaqHeadingWith>
    )
  }
  // Stitch: "Essential Practicalities" / "Everything You Need to Know" (FaqSection defaults) + FAQPage JSON-LD.
  return <FaqSection items={result.data} className="lg:col-span-7" />
}

/** The static 3-row "Ceylon Climate & Seasonality Matrix" card from Stitch. */
function ClimateMatrix() {
  const t = useTranslations('home.climate')
  return (
    <aside
      aria-labelledby="home-climate-title"
      className="flex flex-col gap-space-md rounded-2xl bg-surface-container p-space-lg lg:col-span-5"
    >
      <div className="flex items-center gap-space-xs">
        <Icon name="sunny" className="text-secondary" />
        <h3 id="home-climate-title" className="font-headline-sm text-headline-sm text-primary">
          {t('title')}
        </h3>
      </div>
      <p className="font-body-md text-body-md text-on-surface-variant">{t('intro')}</p>
      <ul className="flex flex-col gap-space-sm pt-2">
        {CLIMATE_REGIONS.map((key) => (
          <li key={key} className="flex flex-col gap-1 rounded-xl bg-surface p-space-md shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-lg text-label-lg font-bold text-primary">{t(`regions.${key}.name`)}</span>
              <span className="rounded-full bg-tertiary-fixed px-2 py-0.5 font-caption text-caption text-on-tertiary-fixed">
                {t(`regions.${key}.season`)}
              </span>
            </div>
            <p className="font-caption text-caption text-on-surface-variant">{t(`regions.${key}.body`)}</p>
          </li>
        ))}
      </ul>
    </aside>
  )
}

/** Section 11 — general FAQs (accordion, FAQPage JSON-LD) beside the climate & seasonality card. */
export function FaqClimateSection({ locale }: { locale: Locale }) {
  return (
    <section className="w-full bg-surface py-space-3xl">
      <Container>
        <div className="grid grid-cols-1 gap-gutter-lg lg:grid-cols-12">
          <Suspense
            fallback={
              <FaqHeadingWith>
                <FaqSkeleton />
              </FaqHeadingWith>
            }
          >
            <HomeFaqs locale={locale} />
          </Suspense>
          <ClimateMatrix />
        </div>
      </Container>
    </section>
  )
}
