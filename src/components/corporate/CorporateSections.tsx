import { useTranslations } from 'next-intl'
import type { ApiImage } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { SmartImage } from '@/components/ui/SmartImage'
import { listEntries, loose } from '@/lib/page-content/lists'
import { CORPORATE_BLUEPRINT_IMAGES, CORPORATE_SERVICE_IMAGES, itemSlot } from '@/lib/page-content/slots'

/* Static marketing sections of /corporate (copy in messages/en/corporate.json, photos from settings.pageImages). */

type PageImages = Record<string, ApiImage>

const eyebrowClass = 'mb-space-xs block font-label-md text-label-md font-bold uppercase tracking-widest text-secondary'
const h2Class = 'font-headline-xl text-headline-xl text-primary'

// ------------------------------------------------------------------------------------------------ services

// Photos: settings.pageImages via CORPORATE_SERVICE_IMAGES (new items get their own slot).
const SERVICES = [
  { key: 'board', icon: 'lock' },
  { key: 'incentive', icon: 'flight_takeoff' },
  { key: 'cohesion', icon: 'explore' },
  { key: 'diplomatic', icon: 'security' },
  { key: 'academic', icon: 'school' },
  { key: 'summit', icon: 'event_seat' },
] as const

/** "Bespoke Solutions for Discerning Organizations" — six service pillars. */
export function CorporateServices({ images }: { images: PageImages }) {
  const t = useTranslations('corporate.services')
  const tl = loose(t)
  const items = listEntries(tl.raw('items'), SERVICES)
  return (
    <section aria-labelledby="corporate-services-title" className="w-full bg-surface py-space-3xl">
      <Container>
        <div className="mb-space-2xl flex flex-col justify-between gap-space-md md:flex-row md:items-end">
          <div>
            <span className={eyebrowClass}>{t('eyebrow')}</span>
            <h2 id="corporate-services-title" className={h2Class}>
              {t('title')}
            </h2>
          </div>
          <p className="max-w-md font-body-md text-body-md text-on-surface-variant">{t('intro')}</p>
        </div>
        <ul className="grid grid-cols-1 gap-gutter-lg md:grid-cols-2 lg:grid-cols-3">
          {items.map(({ key, icon }, index) => (
            <Reveal
              as="li"
              key={key}
              delay={(index % 3) * 0.08}
              className="group flex flex-col overflow-hidden rounded-2xl bg-surface-container-low shadow-sm transition-all duration-300 hover:shadow-xl"
            >
              <div className="relative h-60 w-full overflow-hidden">
                <SmartImage
                  image={images[itemSlot(CORPORATE_SERVICE_IMAGES, key)]}
                  fill
                  sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-space-md top-space-md rounded-full bg-surface/90 px-space-md py-space-xs font-label-md text-label-md uppercase tracking-wider text-primary backdrop-blur-sm">
                  {tl(`items.${key}.badge`)}
                </span>
              </div>
              <div className="flex flex-grow flex-col justify-between p-space-xl">
                <div>
                  <h3 className="mb-space-sm font-headline-md text-headline-md text-primary">
                    {tl(`items.${key}.title`)}
                  </h3>
                  <p className="mb-space-md font-body-md text-body-md text-on-surface-variant">
                    {tl(`items.${key}.body`)}
                  </p>
                </div>
                <div className="flex items-center gap-space-xs font-label-md text-label-md uppercase tracking-wider text-secondary">
                  <span>{tl(`items.${key}.footer`)}</span>
                  {icon && <Icon name={icon} className="text-sm" />}
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ process

const PROCESS = [
  { key: 'discovery', icon: 'cognition' },
  { key: 'blueprint', icon: 'architecture' },
  { key: 'inspection', icon: 'assignment_turned_in' },
  { key: 'execution', icon: 'flag' },
] as const

/** "How I Orchestrate Corporate Expeditions" — four phases. */
export function CorporateProcess() {
  const t = useTranslations('corporate.process')
  const tl = loose(t)
  const steps = listEntries(tl.raw('steps'), PROCESS)
  return (
    <section aria-labelledby="corporate-process-title" className="w-full bg-surface-container-low py-space-3xl">
      <Container>
        <div className="mb-space-2xl max-w-2xl">
          <span className={eyebrowClass}>{t('eyebrow')}</span>
          <h2 id="corporate-process-title" className={h2Class}>
            {t('title')}
          </h2>
          <p className="mt-space-sm font-body-md text-body-md text-on-surface-variant">{t('intro')}</p>
        </div>
        <ol className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ key, icon }, index) => (
            <Reveal
              as="li"
              key={key}
              delay={index * 0.08}
              className="relative flex flex-col justify-between rounded-2xl bg-surface p-space-xl shadow-sm"
            >
              <div>
                <div className="mb-space-md flex items-center justify-between">
                  <span aria-hidden="true" className="font-headline-lg text-headline-lg font-bold text-primary">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-primary">
                    {icon && <Icon name={icon} className="text-xl" />}
                  </div>
                </div>
                <h3 className="mb-space-xs font-headline-sm text-headline-sm text-primary">
                  {tl(`steps.${key}.title`)}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{tl(`steps.${key}.body`)}</p>
              </div>
              <span className="mt-space-lg block font-caption text-caption uppercase tracking-wider text-secondary">
                {tl(`steps.${key}.phase`)}
              </span>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ governance

const PILLARS = [
  { key: 'fleet', icon: 'directions_car' },
  { key: 'licensing', icon: 'policy' },
  { key: 'transparency', icon: 'fact_check' },
  { key: 'discretion', icon: 'visibility_off' },
  { key: 'contact', icon: 'person_pin' },
] as const

/** "Why Global Organizations Entrust Me With Their People" — insurance card + five governance pillars. */
export function CorporateGovernance({ licence, guideName }: { licence: string | null; guideName: string | null }) {
  const t = useTranslations('corporate.governance')
  const tl = loose(t)
  const pillars = listEntries(tl.raw('pillars'), PILLARS)
  const values = { licence: licence ?? t('licenceFallback'), name: guideName ?? t('nameFallback') }
  return (
    <section aria-labelledby="corporate-governance-title" className="w-full bg-surface py-space-3xl">
      <Container>
        <div className="grid grid-cols-1 items-center gap-gutter-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-md lg:col-span-5">
            <span className="font-label-md text-label-md font-bold uppercase tracking-widest text-secondary">
              {t('eyebrow')}
            </span>
            <h2 id="corporate-governance-title" className={h2Class}>
              {t('title')}
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">{t('intro')}</p>
            <div className="mt-space-sm flex items-center gap-space-md rounded-2xl bg-surface-container p-space-lg">
              <Icon name="verified" className="shrink-0 text-3xl text-primary" />
              <div>
                <p className="font-headline-sm text-headline-sm text-primary">{t('insuredTitle')}</p>
                <p className="font-caption text-caption text-on-surface-variant">{t('insuredBody')}</p>
              </div>
            </div>
          </div>
          <ul className="flex flex-col gap-space-md lg:col-span-7">
            {pillars.map(({ key, icon }) => (
              <li
                key={key}
                className="flex items-start gap-space-md rounded-xl bg-surface-container-low p-space-lg transition-all hover:bg-surface-container"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                  {icon && <Icon name={icon} className="text-xl" />}
                </div>
                <div>
                  <h3 className="mb-1 font-headline-sm text-headline-sm text-primary">
                    {tl(`pillars.${key}.title`, values)}
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {tl(`pillars.${key}.body`, values)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ blueprints

// Photos: settings.pageImages via CORPORATE_BLUEPRINT_IMAGES.
const BLUEPRINTS = [
  { key: 'hill', nights: 3, badge: 'bg-primary text-on-primary' },
  { key: 'coastal', nights: 4, badge: 'bg-secondary text-on-secondary' },
  { key: 'cultural', nights: 5, badge: 'bg-tertiary text-on-tertiary' },
] as const
const POINTS = ['one', 'two', 'three'] as const

/** "Curated Expedition Blueprints" — three sample programs, each linking to the RFP form. */
export function CorporateBlueprints({ images }: { images: PageImages }) {
  const t = useTranslations('corporate.blueprints')
  const tl = loose(t)
  const blueprints = listEntries(tl.raw('items'), BLUEPRINTS)
  const tc = useTranslations('common')
  return (
    <section aria-labelledby="corporate-blueprints-title" className="w-full bg-surface-container-low py-space-3xl">
      <Container>
        <div className="mb-space-2xl flex flex-col justify-between gap-space-md md:flex-row md:items-end">
          <div>
            <span className={eyebrowClass}>{t('eyebrow')}</span>
            <h2 id="corporate-blueprints-title" className={h2Class}>
              {t('title')}
            </h2>
          </div>
          <p className="max-w-md font-body-md text-body-md text-on-surface-variant">{t('intro')}</p>
        </div>
        <ul className="grid grid-cols-1 gap-gutter-lg lg:grid-cols-3">
          {blueprints.map(({ key, meta: item }, index) => (
            <Reveal
              as="li"
              key={key}
              delay={index * 0.08}
              className="flex flex-col overflow-hidden rounded-2xl bg-surface shadow-sm transition-all hover:shadow-xl"
            >
              <div className="relative h-64 w-full">
                <SmartImage
                  image={images[itemSlot(CORPORATE_BLUEPRINT_IMAGES, key)]}
                  fill
                  sizes="(min-width: 1024px) 400px, 100vw"
                  className="object-cover"
                />
                <div
                  className={cn(
                    'absolute right-space-md top-space-md rounded-full px-space-md py-space-xs font-label-md text-label-md',
                    item.badge,
                  )}
                >
                  {tc('cards.duration', { nights: item.nights, days: item.nights + 1 })}
                </div>
                <div className="absolute bottom-space-sm left-space-md rounded bg-surface/90 px-space-sm py-0.5 font-caption text-caption text-primary backdrop-blur-sm">
                  {t('idealFor', { group: tl(`items.${key}.group`) })}
                </div>
              </div>
              <div className="flex flex-grow flex-col justify-between p-space-xl">
                <div>
                  <h3 className="mb-space-xs font-headline-md text-headline-md text-primary">
                    {tl(`items.${key}.title`)}
                  </h3>
                  <p className="mb-space-md font-body-md text-body-md text-on-surface-variant">
                    {tl(`items.${key}.body`)}
                  </p>
                  <ul className="mb-space-lg flex flex-col gap-space-xs font-body-md text-body-md text-on-surface-variant">
                    {POINTS.map((point) => (
                      <li key={point} className="flex items-center gap-space-xs">
                        <Icon name="check_circle" className="shrink-0 text-sm text-tertiary" />
                        <span>{tl(`items.${key}.points.${point}`)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <a
                  href="#rfp-section"
                  className="flex w-full items-center justify-center rounded-xl bg-surface-container py-space-sm text-center font-label-lg text-label-lg text-primary transition-all hover:bg-primary hover:text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 coarse:min-h-11"
                >
                  {tl(`items.${key}.cta`)}
                </a>
              </div>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ testimonial

/** Executive testimonial on the teal card (portrait: settings.pageImages['corp-testimonial-portrait']). */
export function CorporateTestimonial({ portrait }: { portrait: ApiImage | null }) {
  const t = useTranslations('corporate.testimonial')
  const ta = useTranslations('common.a11y')
  // The admin can switch the testimonial off (Page content → Corporate); hidden sections have no messages.
  if (!t.has('quote')) return null
  return (
    <section className="w-full bg-surface py-space-3xl">
      <Container>
        <figure className="relative overflow-hidden rounded-3xl bg-primary px-space-lg py-space-2xl text-on-primary sm:p-space-2xl md:p-space-3xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-primary-container/30 blur-3xl"
          />
          <div className="relative z-10 max-w-4xl">
            <div className="mb-space-lg flex flex-wrap items-center gap-space-xs text-secondary-fixed">
              <span className="sr-only">{ta('rating', { rating: 5 })}</span>
              {Array.from({ length: 5 }, (_, i) => (
                <Icon key={i} name="star" filled className="text-xl" />
              ))}
              <span className="ml-2 font-label-md text-label-md uppercase tracking-widest text-on-primary-container">
                {t('badge')}
              </span>
            </div>
            <blockquote className="mb-space-xl font-headline-md text-headline-md italic leading-snug text-surface md:font-headline-lg md:text-headline-lg">
              {t('quote')}
            </blockquote>
            <figcaption className="flex items-center gap-space-md">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-surface-container">
                <SmartImage image={portrait} fill sizes="56px" className="object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm font-semibold text-surface">{t('author')}</span>
                <span className="font-caption text-caption text-on-primary-container">{t('role')}</span>
              </div>
            </figcaption>
          </div>
        </figure>
      </Container>
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ final CTA

/** "Ready to design an extraordinary journey for your leadership?" call-out bar. */
export function CorporateFinalCta() {
  const t = useTranslations('corporate.finalCta')
  return (
    <section aria-labelledby="corporate-final-cta" className="w-full bg-surface-container py-space-2xl">
      <Container className="flex flex-col items-center text-center">
        <h2 id="corporate-final-cta" className="mb-space-xs font-headline-md text-headline-md text-primary">
          {t('title')}
        </h2>
        <p className="mb-space-md max-w-xl font-body-md text-body-md text-on-surface-variant">{t('body')}</p>
        <div className="flex flex-wrap items-center justify-center gap-space-md">
          <a
            href="#rfp-section"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-space-xl py-space-sm font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 coarse:min-h-11"
          >
            {t('rfp')}
          </a>
          <WhatsAppLink
            corporate
            className="inline-flex items-center gap-space-xs rounded-lg bg-tertiary-container px-space-lg py-space-sm font-label-lg text-label-lg text-on-tertiary transition-colors hover:bg-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 coarse:min-h-11"
          >
            <Icon name="chat" className="text-base" />
            <span>{t('whatsapp')}</span>
          </WhatsAppLink>
        </div>
      </Container>
    </section>
  )
}
