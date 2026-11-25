'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { QUIZ_QUESTIONS, TOTAL_STEPS, isStepReachable, type QuizAnswers, type QuizStepNumber } from '@/lib/quiz'
import { QUIZ_IDS } from './quiz-config'

export interface QuizStepperProps {
  step: QuizStepNumber
  answers: QuizAnswers
  onSelectStep: (step: QuizStepNumber) => void
}

/** Stitch "Stepper Indicator Card": current step, hint, progress track and (sm+) clickable step navigation. */
export function QuizStepper({ step, answers, onSelectStep }: QuizStepperProps) {
  const t = useTranslations('quiz.stepper')
  const name = t(`steps.${QUIZ_QUESTIONS[step - 1]}.name`)

  return (
    <div
      id={QUIZ_IDS.stepper}
      className="mb-space-xl scroll-mt-24 rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg"
    >
      <div className="mb-space-md flex flex-col justify-between gap-space-md md:flex-row md:items-center">
        <div className="flex items-center gap-space-sm">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-label-md text-label-md font-bold text-on-primary"
          >
            {step}
          </span>
          <span className="font-label-lg text-label-lg font-semibold uppercase tracking-wider text-primary">
            {t('stepTitle', { step, total: TOTAL_STEPS, name })}
          </span>
        </div>
        <span className="font-caption text-caption text-on-surface-variant">{t('hint')}</span>
      </div>

      <div
        role="progressbar"
        aria-label={t('progressLabel')}
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-valuenow={step}
        aria-valuetext={t('progressValue', { step, total: TOTAL_STEPS })}
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest"
      >
        <div
          className="h-full rounded-full bg-secondary transition-all duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <nav aria-label={t('navLabel')}>
        <ol className="mt-space-sm hidden grid-cols-4 gap-space-sm text-center sm:grid">
          {QUIZ_QUESTIONS.map((question, index) => {
            const number = (index + 1) as QuizStepNumber
            const current = number === step
            const reachable = isStepReachable(number, answers)
            return (
              <li key={question} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onSelectStep(number)}
                  disabled={!reachable}
                  aria-current={current ? 'step' : undefined}
                  title={reachable ? undefined : t('stepUnavailable')}
                  className={cn(
                    'w-full rounded py-1 text-left transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low coarse:min-h-11',
                    current ? 'opacity-100' : 'opacity-40',
                    reachable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed',
                    current && 'hover:opacity-100',
                  )}
                >
                  <span className="block font-caption text-caption font-bold uppercase text-primary">
                    {number}. {t(`steps.${question}.short`)}
                  </span>
                  <span className="block truncate font-caption text-caption text-on-surface-variant">
                    {t(`steps.${question}.sub`)}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>
    </div>
  )
}
