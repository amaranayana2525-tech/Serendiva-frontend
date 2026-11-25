import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { buildMetadata } from '@/lib/seo'
import { QuizContactBanner } from '@/components/quiz/QuizContactBanner'
import { QuizHero } from '@/components/quiz/QuizHero'
import { QuizProcess } from '@/components/quiz/QuizProcess'
import { QuizWizardSection } from '@/components/quiz/QuizWizardSection'
import { QuizWizardSkeleton } from '@/components/quiz/QuizWizardSkeleton'

export async function generateMetadata({ params }: PageProps<'/[locale]/trip-quiz'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'quiz.meta' })
  return buildMetadata({
    locale: locale as Locale,
    path: '/trip-quiz',
    title: t('title'),
    description: t('description'),
  })
}

/** /trip-quiz — Stitch "Ceylon Trip Finder · Route Quiz". */
export default async function TripQuizPage({ params }: PageProps<'/[locale]/trip-quiz'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  return (
    <>
      <QuizHero />
      <Suspense fallback={<QuizWizardSkeleton />}>
        <QuizWizardSection locale={locale as Locale} />
      </Suspense>
      <QuizProcess locale={locale as Locale} />
      <QuizContactBanner />
    </>
  )
}
