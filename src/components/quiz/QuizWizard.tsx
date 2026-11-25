'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import type { TourCard } from '@/lib/api/types'
import {
  EMPTY_ANSWERS,
  MAX_PASSIONS,
  TOTAL_STEPS,
  isQuestionAnswered,
  isStepReachable,
  questionOfStep,
  rankTours,
  togglePassion,
  type Passion,
  type QuizAnswers,
  type QuizQuestion,
  type QuizStep,
  type QuizStepNumber,
} from '@/lib/quiz'
import { Icon } from '@/components/ui/Icon'
import { QUIZ_IDS, type QuizGuide, type QuizImages } from './quiz-config'
import { DurationOptions, PartyOptions, PassionOptions, QuizQuestionHeader, SeasonOptions } from './QuizQuestions'
import { QuizResults } from './QuizResults'
import { QuizStepper } from './QuizStepper'
import { useQuizUrlState } from './useQuizUrlState'

export interface QuizWizardProps {
  /** Every published tour (from getAllTours on the server). */
  tours: TourCard[]
  /** settings.pageImages slots used by the quiz (missing slots render the sand placeholder). */
  images: QuizImages
  guide: QuizGuide | null
}

type FocusTarget = 'question' | 'result'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Scrolls `scrollId` into view when it is off-screen, then focuses `focusId` without jumping. */
function revealAndFocus(focusId: string, scrollId: string) {
  const focusEl = document.getElementById(focusId)
  const scrollEl = document.getElementById(scrollId) ?? focusEl
  if (!focusEl || !scrollEl) return
  const { top } = scrollEl.getBoundingClientRect()
  if (top < 80 || top > window.innerHeight * 0.5) {
    scrollEl.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  }
  focusEl.focus({ preventScroll: true })
}

const PRIMARY_BUTTON =
  'inline-flex items-center gap-space-sm bg-primary hover:bg-primary-container text-on-primary px-space-xl py-space-md rounded-lg font-label-lg text-label-lg transition-all shadow-md hover:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
const ACCENT_BUTTON =
  'inline-flex items-center gap-space-sm bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary px-space-xl py-space-md rounded-lg font-label-lg text-label-lg transition-all shadow-[0_4px_16px_rgba(156,68,30,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
const BACK_BUTTON =
  'inline-flex items-center gap-space-xs rounded text-primary font-label-lg text-label-lg hover:text-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface'

/**
 * The Trip Finder: one question per screen (radio/checkbox groups), progress stepper, results.
 * State is kept in the URL hash (see useQuizUrlState); focus moves to each new question / the result heading and a
 * polite live region announces the progress.
 */
export function QuizWizard({ tours, images, guide }: QuizWizardProps) {
  const t = useTranslations('quiz')
  const { state, commit } = useQuizUrlState()
  const { step, answers } = state
  const [errorFor, setErrorFor] = useState<QuizQuestion | null>(null)
  const [limitHit, setLimitHit] = useState(false)
  const pendingFocus = useRef<FocusTarget | null>(null)

  const matches = useMemo(() => (step === 'result' ? rankTours(tours, answers) : []), [step, tours, answers])

  // Move focus after a user-initiated step change (never on first load / hash restore).
  useEffect(() => {
    const target = pendingFocus.current
    if (!target) return
    pendingFocus.current = null
    if (target === 'result') revealAndFocus(QUIZ_IDS.result, QUIZ_IDS.result)
    else revealAndFocus(QUIZ_IDS.heading, QUIZ_IDS.stepper)
  }, [step])

  const goTo = (next: QuizStep, nextAnswers: QuizAnswers = answers) => {
    if (!isStepReachable(next, nextAnswers)) return
    setErrorFor(null)
    setLimitHit(false)
    pendingFocus.current = next === 'result' ? 'result' : 'question'
    commit({ step: next, answers: nextAnswers }, 'push')
  }

  const update = (nextAnswers: QuizAnswers) => {
    setErrorFor(null)
    commit({ step, answers: nextAnswers }, 'replace')
  }

  const togglePassionAnswer = (passion: Passion) => {
    const next = togglePassion(answers.passions, passion)
    const refused = next.length === answers.passions.length && !answers.passions.includes(passion)
    setLimitHit(refused)
    if (!refused) update({ ...answers, passions: next })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (step === 'result') return
    const question = questionOfStep(step)
    if (!isQuestionAnswered(question, answers)) {
      setErrorFor(question)
      event.currentTarget.querySelector<HTMLInputElement>('input')?.focus()
      return
    }
    goTo(step === TOTAL_STEPS ? 'result' : ((step + 1) as QuizStepNumber))
  }

  const announcement =
    step === 'result'
      ? matches[0]
        ? t('results.announce', { tour: matches[0].tour.title })
        : t('results.title')
      : t('stepper.stepTitle', {
          step,
          total: TOTAL_STEPS,
          name: t(`stepper.steps.${questionOfStep(step)}.name`),
        })

  return (
    <div data-quiz-step={step}>
      <p id={QUIZ_IDS.live} className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      {step === 'result' ? (
        <QuizResults
          matches={matches}
          answers={answers}
          images={images}
          guide={guide}
          onRetake={() => goTo(1, EMPTY_ANSWERS)}
          onAdjust={() => goTo(TOTAL_STEPS)}
        />
      ) : (
        <section
          aria-label={t('stepper.regionLabel')}
          className="px-margin pb-space-2xl md:px-margin-md lg:px-margin-lg"
        >
          <div className="mx-auto max-w-[1180px]">
            <QuizStepper step={step} answers={answers} onSelectStep={(n) => n !== step && goTo(n)} />
            <QuestionForm
              step={step}
              answers={answers}
              images={images}
              error={errorFor === questionOfStep(step)}
              limitHit={limitHit && answers.passions.length >= MAX_PASSIONS}
              onSubmit={handleSubmit}
              onBack={() => step > 1 && goTo((step - 1) as QuizStepNumber)}
              onParty={(party) => update({ ...answers, party })}
              onDuration={(duration) => update({ ...answers, duration })}
              onPassion={togglePassionAnswer}
              onSeason={(season) => update({ ...answers, season })}
            />
          </div>
        </section>
      )}
    </div>
  )
}

interface QuestionFormProps {
  step: QuizStepNumber
  answers: QuizAnswers
  images: QuizImages
  error: boolean
  limitHit: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onBack: () => void
  onParty: (value: NonNullable<QuizAnswers['party']>) => void
  onDuration: (value: NonNullable<QuizAnswers['duration']>) => void
  onPassion: (value: Passion) => void
  onSeason: (value: NonNullable<QuizAnswers['season']>) => void
}

function QuestionForm({
  step,
  answers,
  images,
  error,
  limitHit,
  onSubmit,
  onBack,
  onParty,
  onDuration,
  onPassion,
  onSeason,
}: QuestionFormProps) {
  const t = useTranslations('quiz')
  const question = questionOfStep(step)
  const describedBy = [QUIZ_IDS.intro, error ? QUIZ_IDS.error : null].filter(Boolean).join(' ')

  const counter =
    question === 'passions' ? (
      <span
        role="status"
        className="rounded-full bg-secondary-fixed px-space-sm py-0.5 font-label-md text-label-md text-on-secondary-fixed"
      >
        {t('questions.passions.counter', { count: answers.passions.length, max: MAX_PASSIONS })}
      </span>
    ) : undefined

  return (
    <form noValidate onSubmit={onSubmit} data-testid={`quiz-step-${step}`}>
      <QuizQuestionHeader
        number={t(`questions.${question}.number`)}
        title={t(`questions.${question}.title`)}
        intro={t(`questions.${question}.intro`)}
        aside={counter}
      />

      {limitHit && (
        <p
          role="status"
          className="-mt-space-sm mb-space-md flex items-center gap-space-xs font-body-md text-body-md text-secondary"
        >
          <Icon name="info" className="shrink-0 text-base" />
          {t('questions.passions.limit', { max: MAX_PASSIONS })}
        </p>
      )}

      <fieldset aria-labelledby={QUIZ_IDS.heading} aria-describedby={describedBy} className="min-w-0">
        {question === 'party' && <PartyOptions value={answers.party} onSelect={onParty} images={images} />}
        {question === 'duration' && <DurationOptions value={answers.duration} onSelect={onDuration} />}
        {question === 'passions' && <PassionOptions value={answers.passions} onToggle={onPassion} images={images} />}
        {question === 'season' && <SeasonOptions value={answers.season} onSelect={onSeason} />}
      </fieldset>

      {error && (
        <p
          id={QUIZ_IDS.error}
          role="alert"
          className="mt-space-md flex items-center gap-space-xs font-body-md text-body-md font-medium text-error"
        >
          <Icon name="error" className="shrink-0 text-base" />
          {t(`questions.${question}.error`)}
        </p>
      )}

      <div
        className={
          step === 1 ? 'mt-space-xl flex justify-end' : 'mt-space-xl flex items-center justify-between gap-space-md'
        }
      >
        {step > 1 && (
          <button type="button" onClick={onBack} className={BACK_BUTTON}>
            <Icon name="arrow_back" className="text-base" />
            <span>{t('nav.back')}</span>
          </button>
        )}
        {question === 'season' ? (
          <button type="submit" className={ACCENT_BUTTON} data-testid="quiz-continue">
            <Icon name="magic_button" className="text-base" />
            <span>{t('nav.generate')}</span>
          </button>
        ) : (
          <button type="submit" className={PRIMARY_BUTTON} data-testid="quiz-continue">
            <span>{t(`nav.continue.${question}`)}</span>
            <Icon name="arrow_forward" className="text-base" />
          </button>
        )}
      </div>
    </form>
  )
}
