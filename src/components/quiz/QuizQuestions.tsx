'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'
import {
  DURATION_OPTIONS,
  MAX_PASSIONS,
  PARTY_OPTIONS,
  PASSION_OPTIONS,
  SEASON_OPTIONS,
  type DurationBand,
  type Passion,
  type QuizParty,
  type QuizSeason,
} from '@/lib/quiz'
import { QuizChoiceCard, QuizChoiceIndicator } from './QuizChoiceCard'
import { QUIZ_IDS, QUIZ_PARTY_IMAGES, QUIZ_PASSION_IMAGES, type QuizImages } from './quiz-config'

const CARD =
  'cursor-pointer group bg-surface-container rounded-xl transition-all duration-300 shadow-sm hover:shadow-md'
const RANGE = 'font-label-md text-label-md uppercase tracking-wider text-secondary font-semibold'
// Stitch classes kept verbatim (incl. the overridden `text-base` / `text-xs`) so cards render exactly like the export.
const OPTION_TITLE = 'block font-headline-sm text-headline-sm text-primary'
const OPTION_TEXT = 'block font-body-md text-body-md text-on-surface-variant mt-space-xs'

const optionIds = (group: string, value: string) => ({
  title: `quiz-${group}-${value}-title`,
  desc: `quiz-${group}-${value}-desc`,
  tag: `quiz-${group}-${value}-tag`,
})

// ------------------------------------------------------------------------------------------------ header

export interface QuizQuestionHeaderProps {
  number: string
  title: string
  intro: string
  /** Extra element on the right of the question number (passions counter). */
  aside?: ReactNode
}

/** "Question 0n" + h2 (focused on step change) + intro. */
export function QuizQuestionHeader({ number, title, intro, aside }: QuizQuestionHeaderProps) {
  return (
    <div className="mb-space-lg text-center md:text-left">
      {aside ? (
        <div className="flex items-center justify-between gap-space-sm">
          <span className="font-label-md text-label-md font-bold uppercase tracking-widest text-secondary">
            {number}
          </span>
          {aside}
        </div>
      ) : (
        <span className="font-label-md text-label-md font-bold uppercase tracking-widest text-secondary">{number}</span>
      )}
      <h2
        id={QUIZ_IDS.heading}
        tabIndex={-1}
        className="mt-space-xs scroll-mt-28 font-headline-lg text-headline-lg text-primary focus:outline-none"
      >
        {title}
      </h2>
      <p id={QUIZ_IDS.intro} className="font-body-md text-body-md text-on-surface-variant">
        {intro}
      </p>
    </div>
  )
}

// ------------------------------------------------------------------------------------------------ 1 · party

export function PartyOptions({
  value,
  onSelect,
  images,
}: {
  value: QuizParty | null
  onSelect: (party: QuizParty) => void
  images: QuizImages
}) {
  const t = useTranslations('quiz.party')
  return (
    <div className="grid grid-cols-1 gap-space-md md:grid-cols-2 lg:grid-cols-3">
      {PARTY_OPTIONS.map((party) => {
        const ids = optionIds('party', party)
        const checked = value === party
        const image = images[QUIZ_PARTY_IMAGES[party]]
        const common = {
          type: 'radio' as const,
          name: 'party',
          value: party,
          checked,
          onChange: () => onSelect(party),
          labelledBy: ids.title,
          testId: `quiz-option-${party}`,
        }

        if (party === 'corporate') {
          return (
            <QuizChoiceCard
              key={party}
              {...common}
              describedBy={`${ids.tag} ${ids.desc}`}
              className={`${CARD} p-space-lg md:col-span-2 lg:col-span-2`}
            >
              <span className="flex flex-col items-center gap-space-md sm:flex-row">
                <span className="relative block h-44 w-full shrink-0 overflow-hidden rounded-lg sm:w-1/2">
                  <SmartImage
                    image={image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
                </span>
                <span className="flex w-full flex-col justify-between">
                  <span className="block">
                    <span
                      id={ids.tag}
                      className="mb-1 inline-flex items-center gap-1 font-label-md text-label-md font-semibold uppercase text-tertiary"
                    >
                      <Icon name="workspace_premium" className="text-sm" /> {t('corporate.eyebrow')}
                    </span>
                    <span id={ids.title} className={OPTION_TITLE}>
                      {t('corporate.title')}
                    </span>
                    <span id={ids.desc} className={OPTION_TEXT}>
                      {t('corporate.description')}
                    </span>
                  </span>
                  <span className="mt-space-md flex items-center justify-end">
                    <QuizChoiceIndicator type="radio" checked={checked} className="h-8 text-2xl" />
                  </span>
                </span>
              </span>
            </QuizChoiceCard>
          )
        }

        const tag = party === 'couple' ? t('couple.tag') : null
        return (
          <QuizChoiceCard
            key={party}
            {...common}
            describedBy={tag ? `${ids.tag} ${ids.desc}` : ids.desc}
            className={`${CARD} p-space-lg`}
          >
            <span className="relative mb-space-md block h-44 w-full overflow-hidden rounded-lg">
              <SmartImage
                image={image}
                alt=""
                fill
                sizes="(min-width: 1024px) 340px, (min-width: 768px) 45vw, 90vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
              {tag && (
                <span
                  id={ids.tag}
                  className="absolute bottom-3 left-3 rounded-full bg-surface/90 px-space-sm py-0.5 font-label-md text-label-md font-semibold text-primary backdrop-blur-sm"
                >
                  {tag}
                </span>
              )}
            </span>
            <span className="flex items-start justify-between">
              <span className="block">
                <span id={ids.title} className={OPTION_TITLE}>
                  {t(`${party}.title`)}
                </span>
                <span id={ids.desc} className={OPTION_TEXT}>
                  {t(`${party}.description`)}
                </span>
              </span>
              <QuizChoiceIndicator type="radio" checked={checked} className="h-8 text-2xl" />
            </span>
          </QuizChoiceCard>
        )
      })}
    </div>
  )
}

// ------------------------------------------------------------------------------------------------ 2 · duration

export function DurationOptions({
  value,
  onSelect,
}: {
  value: DurationBand | null
  onSelect: (band: DurationBand) => void
}) {
  const t = useTranslations('quiz.duration')
  return (
    <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
      {DURATION_OPTIONS.map((band) => {
        const ids = optionIds('duration', band)
        const checked = value === band
        const recommended = band === 'balanced'
        return (
          <QuizChoiceCard
            key={band}
            type="radio"
            name="duration"
            value={band}
            checked={checked}
            onChange={() => onSelect(band)}
            labelledBy={ids.title}
            describedBy={`${ids.tag} ${ids.desc}`}
            className={`${CARD} p-space-lg`}
            testId={`quiz-option-${band}`}
          >
            <span className="flex items-start justify-between">
              <span className="block">
                <span id={ids.tag} className="flex flex-wrap items-center gap-space-xs">
                  <span className={RANGE}>{t(`${band}.range`)}</span>
                  {recommended && (
                    <span className="rounded-full bg-tertiary-fixed px-2 py-0.5 font-label-md text-label-md font-bold text-on-tertiary-fixed">
                      {t('balanced.tag')}
                    </span>
                  )}
                </span>
                <span id={ids.title} className={`${OPTION_TITLE} mt-1`}>
                  {t(`${band}.title`)}
                </span>
                <span id={ids.desc} className={OPTION_TEXT}>
                  {t(`${band}.description`)}
                </span>
                <span className="mt-space-md flex flex-wrap gap-2">
                  <span className="rounded bg-surface px-space-sm py-0.5 font-caption text-caption text-primary">
                    {t(`${band}.chip1`)}
                  </span>
                  <span className="rounded bg-surface px-space-sm py-0.5 font-caption text-caption text-primary">
                    {t(`${band}.chip2`)}
                  </span>
                </span>
              </span>
              <QuizChoiceIndicator type="radio" checked={checked} className="h-8 text-2xl" />
            </span>
          </QuizChoiceCard>
        )
      })}
    </div>
  )
}

// ------------------------------------------------------------------------------------------------ 3 · passions

export function PassionOptions({
  value,
  onToggle,
  images,
}: {
  value: Passion[]
  onToggle: (passion: Passion) => void
  images: QuizImages
}) {
  const t = useTranslations('quiz.passions')
  const full = value.length >= MAX_PASSIONS
  return (
    <div className="grid grid-cols-1 gap-space-md md:grid-cols-2 lg:grid-cols-3">
      {PASSION_OPTIONS.map((passion) => {
        const ids = optionIds('passion', passion)
        const checked = value.includes(passion)
        return (
          <QuizChoiceCard
            key={passion}
            type="checkbox"
            name="passions"
            value={passion}
            checked={checked}
            onChange={() => onToggle(passion)}
            labelledBy={ids.title}
            describedBy={ids.desc}
            unavailable={full && !checked}
            className={`${CARD} p-space-md`}
            testId={`quiz-option-${passion}`}
          >
            <span className="relative mb-space-sm block h-36 w-full overflow-hidden rounded-lg">
              <SmartImage
                image={images[QUIZ_PASSION_IMAGES[passion]]}
                alt=""
                fill
                sizes="(min-width: 1024px) 360px, (min-width: 768px) 45vw, 90vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </span>
            <span className="flex items-start justify-between gap-space-xs">
              <span className="block">
                <span id={ids.title} className="block font-headline-sm text-base text-headline-sm text-primary">
                  {t(`${passion}.title`)}
                </span>
                <span id={ids.desc} className="mt-1 block font-body-md text-body-md text-xs text-on-surface-variant">
                  {t(`${passion}.description`)}
                </span>
              </span>
              <QuizChoiceIndicator type="checkbox" checked={checked} className="h-7 text-xl" />
            </span>
          </QuizChoiceCard>
        )
      })}
    </div>
  )
}

// ------------------------------------------------------------------------------------------------ 4 · season

export function SeasonOptions({
  value,
  onSelect,
}: {
  value: QuizSeason | null
  onSelect: (season: QuizSeason) => void
}) {
  const t = useTranslations('quiz.season')
  return (
    <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
      {SEASON_OPTIONS.map((season) => {
        const ids = optionIds('season', season)
        const checked = value === season
        const peak = season === 'nov-apr'
        return (
          <QuizChoiceCard
            key={season}
            type="radio"
            name="season"
            value={season}
            checked={checked}
            onChange={() => onSelect(season)}
            labelledBy={ids.title}
            describedBy={`${ids.tag} ${ids.desc}`}
            className={`${CARD} p-space-lg`}
            testId={`quiz-option-${season}`}
          >
            <span className="flex items-start justify-between">
              <span className="block">
                <span id={ids.tag} className="flex flex-wrap items-center gap-space-xs">
                  <span className={RANGE}>{t(`${season}.range`)}</span>
                  {peak && (
                    <span className="rounded bg-surface px-2 py-0.5 font-caption text-caption text-primary">
                      {t('nov-apr.tag')}
                    </span>
                  )}
                </span>
                <span id={ids.title} className={`${OPTION_TITLE} mt-1`}>
                  {t(`${season}.title`)}
                </span>
                <span id={ids.desc} className={OPTION_TEXT}>
                  {t(`${season}.description`)}
                </span>
              </span>
              <QuizChoiceIndicator type="radio" checked={checked} className="h-8 text-2xl" />
            </span>
          </QuizChoiceCard>
        )
      })}
    </div>
  )
}
