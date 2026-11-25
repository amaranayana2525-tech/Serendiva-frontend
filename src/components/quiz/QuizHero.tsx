import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { QUIZ_TRUST_BADGES } from './quiz-config'

/** Stitch "Quiz intro" — badge, h1, intro and the trust line. Static copy (quiz.hero). */
export function QuizHero() {
  const t = useTranslations('quiz.hero')
  return (
    <section className="relative overflow-hidden px-margin pb-space-lg pt-space-xl md:px-margin-md lg:px-margin-lg">
      <div className="mx-auto flex max-w-[1080px] flex-col items-center text-center">
        <div className="mb-space-md inline-flex items-center gap-space-xs rounded-full bg-tertiary/10 px-space-md py-space-xs text-tertiary shadow-sm">
          {/* h-5 / h-6 reproduce the icon-font line boxes of the Stitch export (20px / 24px). */}
          <Icon name="explore" className="h-5 text-sm" />
          <span className="font-label-md text-label-md uppercase tracking-widest">{t('badge')}</span>
        </div>
        <h1 className="max-w-3xl font-headline-xl text-headline-xl tracking-tight text-primary md:text-display-lg">
          {t('title')}
        </h1>
        <p className="mt-space-sm max-w-2xl font-body-xl text-body-xl font-light text-on-surface-variant">
          {t('intro')}
        </p>
        <ul
          aria-label={t('trustLabel')}
          className="mt-space-lg flex flex-wrap items-center justify-center gap-space-lg pt-space-sm text-on-surface-variant"
        >
          {QUIZ_TRUST_BADGES.map((badge) => (
            <li key={badge.key} className="flex items-center gap-space-xs">
              <Icon name={badge.icon} className="h-6 text-base text-secondary" />
              <span className="font-caption text-caption font-medium tracking-wide">{t(`trust.${badge.key}`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
