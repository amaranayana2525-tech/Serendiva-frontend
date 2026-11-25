import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { getPathname } from '@/i18n/navigation'
import { getCategories } from '@/lib/api/public'
import type { Locale, PartyType, PublicSettings } from '@/lib/api/types'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { Icon } from '@/components/ui/Icon'
import { HeroSlider } from './HeroSlider'
import { QuickInquiryBarSkeleton } from './HomeSkeletons'
import { loadSection } from './loadSection'
import { QuickInquiryBar, type QuickInquiryOption, type QuickInquiryPartyOption } from './QuickInquiryBar'
import { formatWindowMonth, upcomingTravelWindows } from './travelWindows'

/**
 * Party choices of the Stitch "Private Party Size" select → /contact `party` (the wizard then asks the real guest
 * counts — no invented numbers are sent).
 */
const PARTY_PRESETS: readonly { party: Extract<PartyType, 'couple' | 'family' | 'group' | 'solo'> }[] = [
  { party: 'couple' },
  { party: 'family' },
  { party: 'group' },
  { party: 'solo' },
]

/** Quick-inquiry bar with its options (categories come from the API; month windows are computed per request). */
async function HeroInquiry({ locale, today }: { locale: Locale; today: Date }) {
  const t = await getTranslations({ locale, namespace: 'home.hero.inquiry' })
  const categories = await loadSection('categories', () => getCategories(locale))

  const focusOptions: QuickInquiryOption[] = [
    ...(categories.ok ? categories.data.map((c) => ({ value: c.slug, label: c.shortName || c.name })) : []),
    { value: '', label: t('focusOpen') },
  ]

  // Values are what /contact understands (the window's month range 'YYYY-MM/YYYY-MM', or 'flexible'), so the
  // inquiry wizard pre-selects exactly this window; the labels stay human.
  const windowOptions: QuickInquiryOption[] = upcomingTravelWindows(today).map((w) => {
    const window = t('window', { start: formatWindowMonth(w.start, locale), end: formatWindowMonth(w.end, locale) })
    return {
      // the whole window ("2027-02/2027-04"): the wizard shows exactly this range
      value: `${w.start.toISOString().slice(0, 7)}/${w.end.toISOString().slice(0, 7)}`,
      label: w.note ? t('windowWithNote', { window, note: t(`notes.${w.note}`) }) : window,
    }
  })
  windowOptions.push({ value: 'flexible', label: t('flexible') })

  const partyOptions: QuickInquiryPartyOption[] = PARTY_PRESETS.map((p) => ({ ...p, label: t(`parties.${p.party}`) }))

  return (
    <QuickInquiryBar
      action={getPathname({ locale, href: '/contact' })}
      focusOptions={focusOptions}
      windowOptions={windowOptions}
      partyOptions={partyOptions}
      labels={{
        form: t('label'),
        focus: t('focus'),
        month: t('month'),
        party: t('party'),
        submit: t('submit'),
        submitHint: t('submitHint'),
      }}
    />
  )
}

export interface HomeHeroProps {
  locale: Locale
  settings: PublicSettings | null
  /** "Now" for the travel-month windows (passed in so rendering stays pure). */
  today: Date
}

/** Section 1 — full-screen photo slider under the transparent header, copy, CTAs and the quick-inquiry bar. */
export async function HomeHero({ locale, settings, today }: HomeHeroProps) {
  const t = await getTranslations({ locale, namespace: 'home.hero' })
  return (
    <HeroSlider
      slides={settings?.heroSlides ?? []}
      pickerLabel={t('slidePicker')}
      inquiry={
        <Suspense fallback={<QuickInquiryBarSkeleton />}>
          <HeroInquiry locale={locale} today={today} />
        </Suspense>
      }
      scrollCue={
        <a
          href="#trust-strip"
          className="tap-target relative hidden items-center gap-2 rounded font-label-md text-label-md uppercase tracking-widest text-surface/75 hover:text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface sm:flex"
        >
          <span>{t('scrollCue')}</span>
          <Icon name="keyboard_arrow_down" className="animate-bounce text-sm motion-reduce:animate-none" />
        </a>
      }
    >
      <div className="mx-auto my-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center px-margin md:px-margin-md lg:px-margin-lg">
        <div className="flex max-w-3xl flex-col gap-space-md">
          <div className="inline-flex w-fit items-center gap-space-xs rounded-full bg-surface/15 px-space-md py-1.5 backdrop-blur-md">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-secondary-container motion-safe:animate-pulse"
            />
            <span className="font-label-md text-label-md uppercase tracking-widest text-surface">
              {settings?.guide.title || t('eyebrow')}
            </span>
          </div>
          <h1 className="font-display-lg font-headline-xl text-display-lg-mobile tracking-tight text-surface md:text-display-lg">
            {t('titleLead')} <br className="hidden sm:inline" />
            <span className="font-normal italic text-secondary-fixed">{t('titleAccent')}</span>
          </h1>
          <p className="max-w-2xl font-body-xl text-body-lg font-light text-surface/90 md:text-body-xl">{t('intro')}</p>
          <div className="flex flex-wrap items-center gap-space-md pt-space-sm">
            <a
              href="#featured-tours"
              className="inline-flex items-center justify-center rounded-full bg-secondary px-space-xl py-4 font-label-lg text-label-lg text-on-secondary shadow-[0_8px_24px_rgba(156,68,30,0.35)] transition-all hover:-translate-y-0.5 hover:bg-on-secondary-fixed-variant hover:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-primary motion-reduce:hover:translate-y-0"
            >
              {t('explore')}
            </a>
            <WhatsAppLink className="inline-flex items-center gap-space-xs rounded-full bg-surface/20 px-space-lg py-4 font-label-lg text-label-lg text-surface backdrop-blur-md transition-all hover:bg-surface/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface">
              <Icon name="chat" className="text-[20px] text-tertiary-fixed" />
              <span>{t('whatsapp')}</span>
            </WhatsAppLink>
          </div>
        </div>
      </div>
    </HeroSlider>
  )
}
