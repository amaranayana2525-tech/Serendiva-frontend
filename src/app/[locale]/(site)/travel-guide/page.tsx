import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AdviceCard } from '@/components/blog/AdviceCard'
import { ScopedMessages } from '@/components/blog/ScopedMessages'
import { Container } from '@/components/ui/Container'
import { BestTimeChapter } from '@/components/travel-guide/BestTimeChapter'
import { GUIDE_CHAPTERS, GUIDE_CHAPTER_IDS, type GuideNavItem } from '@/components/travel-guide/chapters'
import { ConnectivityChapter } from '@/components/travel-guide/ConnectivityChapter'
import { EtiquetteChapter } from '@/components/travel-guide/EtiquetteChapter'
import { FestivalsChapter } from '@/components/travel-guide/FestivalsChapter'
import { GettingAroundChapter } from '@/components/travel-guide/GettingAroundChapter'
import { GuideCta } from '@/components/travel-guide/GuideCta'
import { GuideFaq } from '@/components/travel-guide/GuideFaq'
import { GuideCuratorCard, GuideCuratorCardSkeleton, GuideHero } from '@/components/travel-guide/GuideHero'
import { GuideMobileNav, GuideNav } from '@/components/travel-guide/GuideNav'
import { GuideProvider } from '@/components/travel-guide/GuideProvider'
import { GuideSearch } from '@/components/travel-guide/GuideSearch'
import { GuideSeasonMatrix, GuideSeasonMatrixSkeleton } from '@/components/travel-guide/GuideSeasonMatrix'
import { HealthChapter } from '@/components/travel-guide/HealthChapter'
import { MoneyChapter } from '@/components/travel-guide/MoneyChapter'
import { PackingCards, PackingCardsSkeleton, PackingChapter } from '@/components/travel-guide/PackingChapter'
import { SafetyChapter } from '@/components/travel-guide/SafetyChapter'
import { VisaChapter } from '@/components/travel-guide/VisaChapter'
import type { Locale } from '@/i18n/routing'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata({ params }: PageProps<'/[locale]/travel-guide'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'travelGuide.meta' })
  return buildMetadata({
    locale: locale as Locale,
    path: '/travel-guide',
    title: t('title'),
    description: t('description'),
  })
}

const chapter = (key: (typeof GUIDE_CHAPTERS)[number]['key']) => {
  const found = GUIDE_CHAPTERS.find((c) => c.key === key)
  if (!found) throw new Error(`Unknown travel-guide chapter "${key}"`)
  return { id: found.id, icon: found.icon }
}

export default async function TravelGuidePage({ params }: PageProps<'/[locale]/travel-guide'>) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'travelGuide' })
  const tn = await getTranslations({ locale, namespace: 'common.nav' })

  const navItems: GuideNavItem[] = GUIDE_CHAPTERS.map((c) => ({
    id: c.id,
    label: t(`nav.items.${c.key}`),
    shortLabel: t(`nav.short.${c.key}`),
  }))

  return (
    <ScopedMessages paths={['travelGuide.hero']}>
      <GuideProvider ids={GUIDE_CHAPTER_IDS}>
        <GuideHero
          search={<GuideSearch />}
          curator={
            <Suspense fallback={<GuideCuratorCardSkeleton />}>
              <GuideCuratorCard locale={locale} />
            </Suspense>
          }
        />

        <div className="relative w-full">
          <GuideMobileNav items={navItems} navLabel={t('nav.mobileLabel')} />
          <Container className="py-space-2xl">
            <div className="grid grid-cols-1 items-start gap-gutter-lg xl:grid-cols-12">
              <aside className="no-scrollbar flex max-w-xl flex-col gap-space-lg self-start xl:sticky xl:top-24 xl:col-span-3 xl:-m-2 xl:max-h-[calc(100vh-7rem)] xl:max-w-none xl:overflow-y-auto xl:p-2 [&>*]:shrink-0">
                <div className="hidden xl:block">
                  <GuideNav
                    items={navItems}
                    title={t('nav.title')}
                    countLabel={t('nav.count', { count: navItems.length })}
                    navLabel={t('nav.label')}
                  />
                </div>
                <AdviceCard
                  title={t('advice.title')}
                  body={t('advice.body')}
                  cta={t('advice.cta')}
                  page={tn('travelGuide')}
                />
              </aside>

              <div className="flex min-w-0 flex-col gap-space-3xl xl:col-span-9">
                <VisaChapter {...chapter('visa')} />
                <BestTimeChapter
                  {...chapter('bestTime')}
                  matrix={
                    <Suspense fallback={<GuideSeasonMatrixSkeleton />}>
                      <GuideSeasonMatrix locale={locale} />
                    </Suspense>
                  }
                />
                <EtiquetteChapter {...chapter('etiquette')} />
                <PackingChapter
                  {...chapter('packing')}
                  cards={
                    <Suspense fallback={<PackingCardsSkeleton />}>
                      <PackingCards locale={locale} />
                    </Suspense>
                  }
                />
                <GettingAroundChapter {...chapter('gettingAround')} />
                <MoneyChapter {...chapter('money')} />
                <HealthChapter {...chapter('health')} />
                <ConnectivityChapter {...chapter('connectivity')} />
                <FestivalsChapter {...chapter('festivals')} />
                <SafetyChapter {...chapter('safety')} />
                <GuideFaq locale={locale} />
              </div>
            </div>
          </Container>
        </div>

        <GuideCta />
      </GuideProvider>
    </ScopedMessages>
  )
}
