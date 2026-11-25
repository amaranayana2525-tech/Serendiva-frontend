'use client'

import { Fragment } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { TourCard as TourCardDto } from '@/lib/api/types'
import { contactHref } from '@/lib/prefill'
import { toContactPrefill, type MatchReason, type QuizAnswers, type QuizMatch } from '@/lib/quiz'
import { waLink } from '@/lib/whatsapp'
import { TourCard } from '@/components/cards/TourCard'
import { useSiteContact } from '@/components/layout/SiteSettingsProvider'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'
import {
  PASSION_REASON_ICONS,
  QUIZ_IDS,
  QUIZ_RESULT_IMAGE,
  REASON_ICONS,
  type QuizGuide,
  type QuizImages,
} from './quiz-config'

const LABEL = 'font-label-md text-label-md uppercase tracking-wider text-on-surface-variant block font-semibold'

export interface QuizResultsProps {
  matches: QuizMatch[]
  answers: QuizAnswers
  images: QuizImages
  guide: QuizGuide | null
  onRetake: () => void
  onAdjust: () => void
}

/** Localised texts derived from the answers (summary chips, sentence, prefill labels). */
function useAnswerLabels(answers: QuizAnswers) {
  const t = useTranslations('quiz')
  const format = useFormatter()
  const { party, duration, season, passions } = answers
  const passionShorts = passions.map((p) => t(`passions.${p}.short`))
  return {
    chips: [
      party ? t(`summary.party.${party}`) : null,
      duration ? t(`summary.duration.${duration}`) : null,
      passions.length ? t('summary.passions', { count: passions.length }) : null,
      season ? t(`summary.season.${season}`) : null,
    ].filter((c): c is string => Boolean(c)),
    sentence: format.list(
      [
        party ? t(`summary.partyPhrase.${party}`) : null,
        duration ? t('summary.durationPhrase', { range: t(`summary.durationRange.${duration}`) }) : null,
        ...passionShorts,
      ].filter((c): c is string => Boolean(c)),
      { type: 'conjunction' },
    ),
    party: party ? t(`summary.party.${party}`) : '',
    duration: duration ? t(`summary.durationRange.${duration}`) : '',
    season: season ? t(`summary.seasonPrefill.${season}`) : '',
    passions: format.list(passionShorts, { type: 'conjunction' }),
  }
}

function useReasonText() {
  const t = useTranslations('quiz')
  return (reason: MatchReason): string => {
    switch (reason.kind) {
      case 'passion':
        return t(reason.strength === 'full' ? 'reasons.passionFull' : 'reasons.passionPartial', {
          passion: t(`passions.${reason.passion}.short`),
        })
      case 'party': {
        const party = t(`reasons.partyNames.${reason.party}`)
        if (reason.fit === 'specialist') return t('reasons.partySpecialist', { party })
        if (reason.fit === 'adapted') return t('reasons.partyAdapted', { party })
        return t('reasons.partyListed', { party })
      }
      case 'duration':
        return t(reason.fit === 'exact' ? 'reasons.durationExact' : 'reasons.durationAdjustable', {
          days: reason.days,
          range: t(`summary.durationRange.${reason.band}`),
        })
      case 'season': {
        const season = t(`summary.seasonPrefill.${reason.season}`)
        if (reason.fit === 'yearRound') return t('reasons.seasonYearRound')
        if (reason.fit === 'flexible') return t('reasons.seasonFlexible')
        if (reason.fit === 'partial') return t('reasons.seasonPartial', { season })
        return t('reasons.seasonIdeal', { season })
      }
      case 'popular':
        return t('reasons.popular')
    }
  }
}

const reasonIcon = (reason: MatchReason) =>
  reason.kind === 'passion' ? PASSION_REASON_ICONS[reason.passion].icon : REASON_ICONS[reason.kind].icon

/** Result screen: top match (Stitch "route blueprint" card), pre-filled inquiry CTA card, two alternatives. */
export function QuizResults({ matches, answers, images, guide, onRetake, onAdjust }: QuizResultsProps) {
  const t = useTranslations('quiz.results')
  const tc = useTranslations('common')
  const labels = useAnswerLabels(answers)
  const reasonText = useReasonText()
  const contact = useSiteContact()
  const [top, ...alternatives] = matches

  const prefillFor = (tour: TourCardDto | null) =>
    contactHref(
      toContactPrefill(answers, tour, {
        message: tour
          ? t('contactMessage', {
              tour: tour.title,
              party: labels.party,
              duration: labels.duration,
              season: labels.season,
              passions: labels.passions,
            })
          : undefined,
      }),
    )

  const whatsappHref = waLink(
    contact.whatsapp,
    top
      ? t('whatsappMessage', {
          tour: top.tour.title,
          party: labels.party,
          duration: labels.duration,
          season: labels.season,
        })
      : undefined,
  )

  return (
    <section
      aria-labelledby={QUIZ_IDS.result}
      className="bg-surface-container-low px-margin py-space-2xl md:px-margin-md lg:px-margin-lg"
      data-testid="quiz-results"
    >
      <div className="mx-auto max-w-[1240px]">
        {/* Result header */}
        <div className="mx-auto mb-space-xl max-w-2xl text-center">
          {top && (
            <div className="mb-space-sm inline-flex items-center gap-space-xs rounded-full bg-tertiary-fixed px-space-md py-space-xs text-on-tertiary-fixed shadow-sm">
              <Icon name="stars" className="text-sm" />
              <span className="font-label-md text-label-md font-bold uppercase tracking-wider">
                {t('badge', { percent: top.percent })}
              </span>
            </div>
          )}
          <h2
            id={QUIZ_IDS.result}
            tabIndex={-1}
            className="scroll-mt-28 font-headline-xl text-headline-xl text-primary focus:outline-none"
          >
            {t('title')}
          </h2>
          <p className="mt-space-xs font-body-lg text-body-lg text-on-surface-variant">
            {t('intro', { summary: labels.sentence })}
          </p>
        </div>

        {!top ? (
          <EmptyState
            icon="route"
            title={t('empty.title')}
            body={t('empty.body')}
            action={
              <>
                <Link
                  href={prefillFor(null)}
                  className="inline-flex items-center gap-space-xs rounded-lg bg-secondary px-space-lg py-space-sm font-label-lg text-label-lg text-on-secondary shadow-[0_4px_16px_rgba(156,68,30,0.2)] transition-all hover:bg-on-secondary-fixed-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 coarse:min-h-11"
                >
                  <Icon name="send" className="text-base" />
                  {t('empty.cta')}
                </Link>
                <RetakeButton onClick={onRetake} label={t('cta.retake')} />
              </>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-gutter-lg lg:grid-cols-12">
              {/* Left: matched route */}
              <div className="flex min-w-0 flex-col gap-space-lg lg:col-span-7">
                <article
                  aria-labelledby="quiz-top-match-title"
                  className="overflow-hidden rounded-xl bg-surface shadow-md"
                  data-testid="quiz-top-match"
                >
                  <div className="relative h-72 w-full">
                    <SmartImage
                      image={top.tour.cover ?? images[QUIZ_RESULT_IMAGE]}
                      fill
                      sizes="(min-width: 1280px) 720px, (min-width: 1024px) 58vw, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2 pr-4">
                      {top.tour.cardTag && (
                        <span className="rounded bg-secondary px-space-sm py-1 font-label-md text-label-md font-semibold uppercase tracking-wider text-on-secondary">
                          {top.tour.cardTag}
                        </span>
                      )}
                      <span className="rounded bg-surface/90 px-space-sm py-1 font-label-md text-label-md font-bold text-primary backdrop-blur-md">
                        {tc('cards.duration', { nights: top.tour.durationNights, days: top.tour.durationDays })}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 text-on-primary">
                      <span className="mb-1 block font-label-md text-label-md uppercase tracking-widest text-on-primary-container">
                        <span className="sr-only">{t('topLabel')} · </span>
                        {t('tailored')}
                      </span>
                      <h3 id="quiz-top-match-title" className="font-headline-lg text-headline-lg text-on-primary">
                        {top.tour.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-col gap-space-md p-space-lg">
                    {top.tour.route.length > 0 && (
                      <div>
                        <span className={`${LABEL} mb-2`}>{t('trajectory')}</span>
                        <ol className="flex flex-wrap items-center gap-1.5 font-body-md text-body-md text-primary">
                          {top.tour.route.map((stop, i) => (
                            <Fragment key={`${stop}-${i}`}>
                              {i > 0 && (
                                <li aria-hidden="true" className="flex items-center">
                                  <Icon name="arrow_forward" className="text-xs text-outline" />
                                </li>
                              )}
                              <li className="rounded bg-surface-container px-2.5 py-1 font-medium">{stop}</li>
                            </Fragment>
                          ))}
                        </ol>
                      </div>
                    )}

                    {top.reasons.length > 0 && (
                      <div className="pt-space-sm">
                        <span className={`${LABEL} mb-3`}>{t('why')}</span>
                        <ul className="grid grid-cols-1 gap-space-sm sm:grid-cols-2" data-testid="quiz-match-reasons">
                          {top.reasons.map((reason, i) => (
                            <li key={i} className="flex items-start gap-space-xs">
                              <Icon name={reasonIcon(reason)} className="mt-0.5 shrink-0 text-lg text-secondary" />
                              <span className="font-body-md text-body-md text-on-surface">{reasonText(reason)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {top.tour.highlights.length > 0 && (
                      <div className="pt-space-sm">
                        <span className={`${LABEL} mb-3`}>{t('privileges')}</span>
                        <ul className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
                          {top.tour.highlights.slice(0, 4).map((highlight) => (
                            <li key={highlight} className="flex items-start gap-space-xs">
                              <Icon name="check_circle" className="mt-0.5 shrink-0 text-lg text-tertiary" />
                              <span className="font-body-md text-body-md text-on-surface">{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {guide && <GuideSpotlight guide={guide} />}

                    <Link
                      href={`/tours/${top.tour.slug}`}
                      className="tap-target relative inline-flex w-fit items-center gap-1 rounded font-label-lg text-label-lg text-primary transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {t('viewItinerary')}
                      <span className="sr-only">: {top.tour.title}</span>
                      <Icon name="arrow_forward" className="text-base" />
                    </Link>
                  </div>
                </article>

                {/* Pull-quote monograph */}
                <figure className="flex flex-col gap-space-xs rounded-xl border-l-4 border-secondary bg-surface p-space-lg shadow-sm">
                  <span className="font-label-md text-label-md font-bold uppercase tracking-wider text-secondary">
                    {t('quote.eyebrow')}
                  </span>
                  <blockquote className="font-headline-sm text-headline-sm italic text-primary">
                    <p>{t('quote.text')}</p>
                  </blockquote>
                  {guide && (
                    <figcaption className="font-caption text-caption font-medium text-on-surface-variant">
                      {t('quote.attribution', { name: guide.name, title: guide.title })}
                    </figcaption>
                  )}
                </figure>
              </div>

              {/* Right: pre-filled inquiry dispatch */}
              <div className="flex flex-col lg:col-span-5">
                <div className="sticky top-24 rounded-xl bg-surface p-space-lg shadow-md md:p-space-xl">
                  <div className="mb-space-md">
                    <span className="font-label-md text-label-md font-bold uppercase tracking-widest text-secondary">
                      {t('cta.eyebrow')}
                    </span>
                    <h3 className="font-headline-md text-headline-md text-primary">{t('cta.title')}</h3>
                    <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{t('cta.intro')}</p>
                  </div>

                  <div className="mb-space-md rounded-lg bg-surface-container p-space-sm">
                    <span
                      id="quiz-profile-label"
                      className="mb-1 block font-caption text-caption font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                      {t('cta.profile')}
                    </span>
                    <ul aria-labelledby="quiz-profile-label" className="flex flex-wrap gap-1.5">
                      {labels.chips.map((chip) => (
                        <li
                          key={chip}
                          className="rounded bg-surface px-2 py-0.5 font-caption text-caption font-medium text-primary"
                        >
                          {chip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="font-body-md text-body-md text-on-surface-variant">{t('cta.note')}</p>

                  <div className="mt-space-md flex flex-col gap-space-xs">
                    <Link
                      href={prefillFor(top.tour)}
                      data-testid="quiz-plan-journey"
                      className="flex w-full items-center justify-center gap-space-xs rounded-lg bg-secondary px-space-lg py-space-md text-center font-label-lg text-label-lg text-on-secondary shadow-[0_4px_16px_rgba(156,68,30,0.2)] transition-all hover:bg-on-secondary-fixed-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <Icon name="send" className="text-base" />
                      {t('cta.plan')}
                    </Link>
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-space-xs rounded-lg bg-tertiary-container px-space-lg py-space-md text-center font-label-lg text-label-lg text-on-tertiary transition-all hover:bg-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <Icon name="chat" className="text-base" />
                      {t('cta.whatsapp')}
                      <span className="sr-only"> {tc('a11y.opensInNewTab')}</span>
                    </a>
                  </div>

                  <div className="mt-space-xs flex flex-col gap-1 pt-space-xs text-center">
                    <div className="flex items-center justify-center gap-space-xs text-on-surface-variant">
                      <Icon name="lock" className="text-sm text-tertiary" />
                      <span className="font-caption text-caption">{t('cta.reassurance')}</span>
                    </div>
                    <span className="font-caption text-caption text-on-surface-variant">{t('cta.privacy')}</span>
                  </div>

                  <div className="mt-space-md flex flex-wrap items-center justify-center gap-x-space-lg gap-y-space-xs border-t border-outline-variant/40 pt-space-md">
                    <RetakeButton onClick={onRetake} label={t('cta.retake')} />
                    <button
                      type="button"
                      onClick={onAdjust}
                      className="tap-target relative inline-flex items-center gap-space-xs rounded font-label-lg text-label-lg text-primary transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <Icon name="tune" className="text-base" />
                      {t('cta.adjust')}
                    </button>
                  </div>

                  {answers.party === 'corporate' && (
                    <p className="mt-space-md text-center font-caption text-caption text-on-surface-variant">
                      {t('cta.corporateNote')}{' '}
                      <Link
                        href="/corporate"
                        className="rounded font-semibold text-primary underline-offset-2 hover:text-secondary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {t('cta.corporateLink')}
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {alternatives.length > 0 && (
              <div className="mt-space-2xl" data-testid="quiz-alternatives">
                <div className="mb-space-lg flex flex-col gap-space-xs text-center md:text-left">
                  <span className="font-label-md text-label-md font-bold uppercase tracking-widest text-secondary">
                    {t('alternatives.eyebrow')}
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-primary">{t('alternatives.title')}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">{t('alternatives.intro')}</p>
                </div>
                <ul className="grid grid-cols-1 gap-gutter-lg md:grid-cols-2">
                  {alternatives.map((match, i) => (
                    <li key={match.tour.id} className="flex min-w-0 flex-col gap-space-sm">
                      <div className="flex flex-wrap items-center gap-x-space-sm gap-y-1">
                        <span className="rounded-full bg-tertiary-fixed px-space-sm py-0.5 font-label-md text-label-md font-bold uppercase text-on-tertiary-fixed">
                          {t('alternatives.match', { percent: match.percent })}
                        </span>
                        {match.reasons.length > 0 && (
                          <span className="font-caption text-caption text-on-surface-variant">
                            {match.reasons.slice(0, 2).map(reasonText).join(' · ')}
                          </span>
                        )}
                      </div>
                      <TourCard tour={match.tour} index={i + 1} className="flex-1" />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function RetakeButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="quiz-retake"
      className="tap-target relative inline-flex items-center gap-space-xs rounded font-label-lg text-label-lg text-primary transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <Icon name="restart_alt" className="text-base" />
      {label}
    </button>
  )
}

/** "Dedicated Guide & Chauffeur Spotlight" — data from the CMS guide settings. */
function GuideSpotlight({ guide }: { guide: QuizGuide }) {
  const t = useTranslations('quiz.results.guide')
  return (
    <div className="mt-space-xs flex flex-col items-center gap-space-md rounded-xl bg-surface-container p-space-md sm:flex-row">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-primary">
        <SmartImage image={guide.portrait} alt="" fill sizes="64px" className="object-cover" />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <div className="flex items-center justify-center gap-space-xs sm:justify-start">
          <Link
            href="/about"
            className="rounded font-headline-sm text-headline-sm text-lg text-primary transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {guide.name}
          </Link>
          <Icon name="verified" label={t('verified')} className="text-base text-tertiary" />
        </div>
        <p className="font-caption text-caption text-on-surface-variant">
          {t('credentials', { title: guide.title, licence: guide.licenseNumber, years: guide.yearsGuiding })}
        </p>
        <p className="mt-1 font-caption text-caption font-semibold text-primary">{t('vehicle')}</p>
      </div>
    </div>
  )
}
