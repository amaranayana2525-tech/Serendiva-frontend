import { Suspense, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { getFaqs } from '@/lib/api/public'
import type { FaqItem, Locale } from '@/lib/api/types'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Reveal } from '@/components/ui/Reveal'
import { Skeleton, TextSkeleton } from '@/components/ui/Skeleton'
import { QUIZ_PROCESS_STEPS } from './quiz-config'
import { listEntries, loose } from '@/lib/page-content/lists'

/** How many FAQs the Stitch snippet shows. */
const FAQ_COUNT = 3

/** "The Bespoke Process" — three numbered cards + the FAQ snippet (FAQs from the API, booking scope). */
export function QuizProcess({ locale }: { locale: Locale }) {
  const t = useTranslations('quiz.process')
  const tl = loose(t)
  const steps = listEntries(tl.raw('steps'), QUIZ_PROCESS_STEPS)
  return (
    <section className="bg-surface px-margin py-space-3xl md:px-margin-md lg:px-margin-lg">
      <div className="mx-auto max-w-[1240px]">
        <div className="mx-auto mb-space-2xl max-w-2xl text-center">
          <span className="font-label-md text-label-md font-bold uppercase tracking-widest text-secondary">
            {t('eyebrow')}
          </span>
          <h2 className="mt-space-xs font-headline-xl text-headline-xl text-primary">{t('title')}</h2>
          <p className="mt-space-xs font-body-lg text-body-lg text-on-surface-variant">{t('intro')}</p>
        </div>

        <ol className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          {steps.map(({ key, meta: step }, index) => (
            <Reveal as="li" key={key} delay={index * 0.08} className="flex">
              <div className="relative flex w-full flex-col justify-between rounded-xl bg-surface-container p-space-lg shadow-sm">
                <div>
                  <div
                    aria-hidden="true"
                    className={`mb-space-md flex h-12 w-12 items-center justify-center rounded-full font-headline-sm text-headline-sm font-bold ${step.tone}`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <h3 className="mb-space-xs font-headline-sm text-headline-sm text-primary">
                    {tl(`steps.${key}.title`)}
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">{tl(`steps.${key}.body`)}</p>
                </div>
                <div className="mt-space-lg pt-space-md">
                  <span className="font-caption text-caption font-semibold uppercase tracking-wider text-secondary">
                    {tl(`steps.${key}.turnaround`)}
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>

        <Suspense fallback={<QuizFaqSkeleton />}>
          <QuizFaq locale={locale} />
        </Suspense>
      </div>
    </section>
  )
}

function FaqShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto mt-space-3xl max-w-3xl rounded-xl bg-surface-container-low p-space-lg shadow-sm md:p-space-xl">
      <h3 className="mb-space-md text-center font-headline-md text-headline-md text-primary">{title}</h3>
      {children}
    </div>
  )
}

/** Stitch "Common Route Atelier Inquiries" — first booking FAQs from the CMS, shown open. */
async function QuizFaq({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'quiz.faq' })
  let items: FaqItem[]
  try {
    items = (await getFaqs(locale, { scope: 'booking' })).slice(0, FAQ_COUNT)
  } catch (error) {
    console.error('[trip-quiz] faqs unavailable:', error instanceof Error ? error.message : error)
    return (
      <FaqShell title={t('title')}>
        <ErrorState className="bg-surface" />
      </FaqShell>
    )
  }
  if (items.length === 0) {
    return (
      <FaqShell title={t('title')}>
        <EmptyState className="bg-surface" />
      </FaqShell>
    )
  }
  return (
    <FaqShell title={t('title')}>
      <div className="flex flex-col gap-space-md">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg bg-surface p-space-md shadow-sm">
            <h4 className="font-headline-sm text-base text-headline-sm font-semibold text-primary">{item.question}</h4>
            {item.answer
              .split(/\n{2,}/)
              .map((p) => p.trim())
              .filter(Boolean)
              .map((paragraph, i) => (
                <p key={i} className="mt-1 font-body-md text-body-md text-on-surface-variant">
                  {paragraph}
                </p>
              ))}
          </div>
        ))}
      </div>
    </FaqShell>
  )
}

function QuizFaqSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto mt-space-3xl flex max-w-3xl flex-col gap-space-md rounded-xl bg-surface-container-low p-space-lg md:p-space-xl"
    >
      <Skeleton className="mx-auto h-8 w-2/3" />
      {Array.from({ length: FAQ_COUNT }, (_, i) => (
        <div key={i} className="flex flex-col gap-space-sm rounded-lg bg-surface p-space-md">
          <Skeleton className="h-5 w-3/4" />
          <TextSkeleton lines={2} />
        </div>
      ))}
    </div>
  )
}
