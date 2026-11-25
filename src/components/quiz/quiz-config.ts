import type { ApiImage, GuideSettings } from '@/lib/api/types'
import type { MatchReason, Passion, QuizParty } from '@/lib/quiz'

/** CMS page-image slots (settings.pageImages) used by the Trip Finder — editable in the admin. */
export const QUIZ_PARTY_IMAGES: Record<QuizParty, string> = {
  couple: 'quiz-couple-plunge-pool',
  solo: 'quiz-solo-sigiriya',
  family: 'quiz-family-minneriya',
  group: 'quiz-friends-galle-dinner',
  corporate: 'quiz-executive-bawa-pavilion',
}

export const QUIZ_PASSION_IMAGES: Record<Passion, string> = {
  citadels: 'quiz-interest-citadels',
  safari: 'quiz-interest-safari',
  tea: 'quiz-interest-tea-rail',
  coast: 'quiz-interest-beaches',
  trekking: 'quiz-interest-trekking',
  wellness: 'quiz-interest-ayurveda',
}

/** Fallback hero image of the result card when a tour has no cover yet. */
export const QUIZ_RESULT_IMAGE = 'quiz-result-tea-country'

export const QUIZ_IMAGE_SLOTS = [
  ...Object.values(QUIZ_PARTY_IMAGES),
  ...Object.values(QUIZ_PASSION_IMAGES),
  QUIZ_RESULT_IMAGE,
] as const

export type QuizImages = Partial<Record<string, ApiImage>>

/** Guide details shown in the result's "chauffeur-lecturer" spotlight. */
export type QuizGuide = Pick<GuideSettings, 'name' | 'title' | 'licenseNumber' | 'yearsGuiding' | 'portrait'>

/** Icons for the "why it matches" list (keys named `icon` so the sprite builder picks them up). */
export const PASSION_REASON_ICONS: Record<Passion, { icon: string }> = {
  citadels: { icon: 'account_balance' },
  safari: { icon: 'pets' },
  tea: { icon: 'emoji_food_beverage' },
  coast: { icon: 'beach_access' },
  trekking: { icon: 'hiking' },
  wellness: { icon: 'spa' },
}

export const REASON_ICONS: Record<Exclude<MatchReason['kind'], 'passion'>, { icon: string }> = {
  party: { icon: 'diversity_3' },
  duration: { icon: 'date_range' },
  season: { icon: 'wb_sunny' },
  popular: { icon: 'star' },
}

/** Hero trust line (Stitch order). */
export const QUIZ_TRUST_BADGES = [
  { key: 'guidance', icon: 'verified_user' },
  { key: 'stays', icon: 'hotel_class' },
  { key: 'commissions', icon: 'nest_eco_leaf' },
] as const

/** "How Dinesh refines your journey" step circles (Stitch colours). */
export const QUIZ_PROCESS_STEPS = [
  { key: 'analysis', tone: 'bg-primary text-on-primary' },
  { key: 'lockin', tone: 'bg-secondary text-on-secondary' },
  { key: 'portfolio', tone: 'bg-tertiary text-on-tertiary' },
] as const

/** DOM ids shared by the wizard (focus management, aria wiring, e2e tests). */
export const QUIZ_IDS = {
  stepper: 'quiz-stepper',
  heading: 'quiz-question-heading',
  intro: 'quiz-question-intro',
  error: 'quiz-question-error',
  result: 'quiz-result-heading',
  live: 'quiz-live-region',
} as const
