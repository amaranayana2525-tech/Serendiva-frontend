import { Fragment } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { DestinationDetail, PublicSettings } from '@/lib/api/types'
import { contactHref } from '@/lib/prefill'
import { cn } from '@/lib/utils'
import { FaqSection } from '@/components/sections/FaqSection'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'
import { splitExperienceMeta } from './content'
import { DestinationMapClient } from './DestinationMapClient'

/*
 * Content blocks of the destination detail template (Stitch "Ella" screen). Each block renders nothing when
 * the CMS left it empty, so lighter destinations degrade gracefully.
 */

/** Stitch colour rhythms for icons/labels inside repeated blocks. */
const FACT_TONES = ['text-primary', 'text-primary', 'text-tertiary', 'text-secondary'] as const
const CUISINE_TONES = ['text-secondary', 'text-tertiary', 'text-primary'] as const
const STAY_TONES = ['text-secondary', 'text-primary', 'text-tertiary'] as const
const NOTE_TONES = ['text-secondary', 'text-primary', 'text-tertiary'] as const

const SOFT_SHADOW = 'shadow-[0_16px_36px_-12px_rgba(43,43,43,0.08),0_4px_12px_-4px_rgba(43,43,43,0.04)]'

// ------------------------------------------------------------------------------------------------ quick facts

export function QuickFactsBar({ name, facts }: { name: string; facts: DestinationDetail['quickFacts'] }) {
  const t = useTranslations('destinationDetail.facts')
  if (facts.length === 0) return null
  return (
    <section
      aria-label={t('label', { name })}
      className="relative z-20 mx-auto -mt-10 w-full max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg"
    >
      <div className={cn('rounded-xl bg-surface-container-lowest p-space-lg md:p-space-xl', SOFT_SHADOW)}>
        <ul className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact, i) => (
            <li key={`${fact.label}-${i}`} className="flex items-start gap-space-md">
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-container',
                  FACT_TONES[i % FACT_TONES.length],
                )}
              >
                <Icon name={fact.icon} className="text-2xl" />
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  {fact.label}
                </span>
                <span className="mt-0.5 font-headline-sm text-headline-sm text-on-surface">{fact.value}</span>
                {fact.note && (
                  <span className="mt-1 font-caption text-caption text-on-surface-variant">{fact.note}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ guide note

export function GuideNote({
  note,
  guide,
}: {
  note: DestinationDetail['guideNote']
  guide: PublicSettings['guide'] | null
}) {
  const t = useTranslations('destinationDetail.guide')
  if (!note) return null
  return (
    <section
      aria-labelledby="guide-note-title"
      className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-xl shadow-sm md:p-space-2xl"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 -mr-12 -mt-12 h-48 w-48 rounded-full bg-surface-container-high/60 blur-2xl"
      />
      {guide && (
        <div className="mb-space-lg flex flex-col items-start justify-between gap-space-md sm:flex-row sm:items-center">
          <div className="flex items-center gap-space-md">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full shadow-md">
              <SmartImage
                image={guide.portrait}
                alt={guide.name}
                fill
                sizes="64px"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm font-bold text-primary">{guide.name}</span>
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                {guide.title}
              </span>
            </div>
          </div>
          {guide.yearsGuiding > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-surface px-space-md py-1 shadow-sm">
              <Icon name="verified_user" className="text-sm text-secondary" />
              <span className="font-label-md text-label-md font-semibold text-on-surface">
                {t('years', { years: guide.yearsGuiding })}
              </span>
            </div>
          )}
        </div>
      )}
      <h2 id="guide-note-title" className="mb-space-md font-headline-md text-headline-md font-medium text-on-surface">
        {note.heading}
      </h2>
      <div className="space-y-space-md font-body-lg text-body-lg font-light leading-relaxed text-on-surface-variant">
        {note.paragraphs.map((p, i) => (
          <p key={i}>{t('quote', { text: p })}</p>
        ))}
      </div>
      {note.perks.length > 0 && (
        <ul
          aria-label={t('perksLabel')}
          className="mt-space-lg flex flex-wrap items-center justify-between gap-space-md border-t border-outline-variant/30 pt-space-md"
        >
          {note.perks.map((perk) => (
            <li key={perk.label} className="flex items-center gap-space-sm font-label-md text-label-md text-primary">
              <Icon name={perk.icon} className="text-lg" />
              <span>{perk.label}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ experiences

export function ExperiencesSection({
  destination: d,
  intro,
}: {
  destination: Pick<DestinationDetail, 'name' | 'slug' | 'experiences'>
  /** Paragraphs introducing the experiences (rest of the description); falls back to the Stitch copy. */
  intro: string[]
}) {
  const t = useTranslations('destinationDetail.experiences')
  if (d.experiences.length === 0) return null
  // Stitch: three wide feature cards, then the remaining experiences as a two-column bento.
  const featured = d.experiences.slice(0, 3)
  const bento = d.experiences.slice(3)
  const introParagraphs = intro.length > 0 ? intro : [t('intro')]
  return (
    <section aria-labelledby="experiences-title" className="flex flex-col gap-space-xl">
      <div className="flex flex-col">
        <span className="font-label-lg text-label-lg uppercase tracking-widest text-secondary">{t('eyebrow')}</span>
        <h2 id="experiences-title" className="mt-1 font-headline-xl text-headline-xl font-semibold text-primary">
          {t('title', { name: d.name })}
        </h2>
        {introParagraphs.map((p, i) => (
          <p key={i} className="mt-2 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
            {p}
          </p>
        ))}
      </div>

      {featured.map((e, i) => {
        const meta = splitExperienceMeta(e.meta)
        return (
          <article
            key={`${e.title}-${i}`}
            className="group flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-md md:flex-row"
          >
            <div className="relative h-64 overflow-hidden md:h-auto md:w-5/12">
              <SmartImage
                image={e.image}
                fill
                sizes="(min-width: 1024px) 27vw, (min-width: 768px) 40vw, 100vw"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {e.kicker && (
                <div className="absolute left-space-md top-space-md rounded-full bg-surface/90 px-space-md py-1 font-label-md text-label-md font-semibold uppercase tracking-wider text-primary shadow-sm backdrop-blur-md">
                  {e.kicker}
                </div>
              )}
            </div>
            <div className="flex flex-col justify-between p-space-lg md:w-7/12 md:p-space-xl">
              <div>
                {meta.length > 0 && (
                  <div className="mb-space-xs flex flex-wrap items-center gap-x-space-md gap-y-1 font-caption text-caption font-semibold uppercase tracking-wider text-secondary">
                    {meta.map((m, j) => (
                      <Fragment key={j}>
                        {j > 0 && <span aria-hidden="true">•</span>}
                        <span>{m}</span>
                      </Fragment>
                    ))}
                  </div>
                )}
                <h3 className="mb-space-sm font-headline-md text-headline-md font-semibold text-on-surface">
                  {e.title}
                </h3>
                <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">{e.text}</p>
              </div>
              <div className="mt-space-md flex flex-wrap items-center justify-between gap-x-space-sm gap-y-1 border-t border-surface-container pt-space-sm">
                {e.tagLabel ? (
                  <span className="flex items-center gap-1 font-caption text-caption font-semibold text-tertiary">
                    <Icon name={e.tagIcon || 'spa'} className="text-sm" /> {e.tagLabel}
                  </span>
                ) : (
                  <span />
                )}
                <span className="shrink-0 font-label-md text-label-md font-medium text-primary">{t('curated')}</span>
              </div>
            </div>
          </article>
        )
      })}

      {bento.length > 0 && (
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
          {bento.map((e, i) => (
            <article
              key={`${e.title}-${i}`}
              className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-sm"
            >
              <div>
                <div className="relative mb-space-md h-44 w-full overflow-hidden rounded-lg">
                  <SmartImage
                    image={e.image}
                    fill
                    sizes="(min-width: 1024px) 28vw, (min-width: 768px) 45vw, 100vw"
                    className="h-full w-full object-cover"
                  />
                </div>
                {e.kicker && (
                  <div className="mb-1 flex items-center gap-2 font-caption text-caption font-semibold uppercase text-secondary">
                    <span>{e.kicker}</span>
                  </div>
                )}
                <h3 className="mb-space-xs font-headline-sm text-headline-sm font-semibold text-on-surface">
                  {e.title}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{e.text}</p>
              </div>
              <div className="mt-space-md flex flex-wrap items-center justify-between gap-x-space-sm gap-y-1 border-t border-surface-container pt-space-sm">
                <span className="font-caption text-caption text-on-surface-variant">{e.tagLabel}</span>
                <Link
                  href={contactHref({
                    destination: d.slug,
                    interests: [e.title.slice(0, 60)],
                    source: 'destination-experience',
                  })}
                  aria-label={t('inquire', { title: e.title })}
                  className="tap-target relative rounded-full p-1 text-primary transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Icon name="arrow_forward" className="text-base" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ gastronomy

export function CuisineBlock({ cuisine }: { cuisine: DestinationDetail['cuisine'] }) {
  const t = useTranslations('destinationDetail.cuisine')
  if (!cuisine || (cuisine.items.length === 0 && !cuisine.intro)) return null
  return (
    <section
      aria-labelledby="cuisine-title"
      className="rounded-xl bg-surface-container p-space-xl shadow-sm md:p-space-2xl"
    >
      <div className="mb-space-xs flex items-center gap-space-sm font-label-md text-label-md font-semibold uppercase tracking-wider text-secondary">
        <Icon name="restaurant" className="text-lg" />
        <span>{t('eyebrow')}</span>
      </div>
      <h2 id="cuisine-title" className="mb-space-md font-headline-lg text-headline-lg font-medium text-primary">
        {cuisine.heading}
      </h2>
      {cuisine.intro && (
        <p className="mb-space-lg font-body-lg text-body-lg font-light leading-relaxed text-on-surface-variant">
          {cuisine.intro}
        </p>
      )}
      {cuisine.items.length > 0 && (
        <ul className="grid grid-cols-1 gap-space-md md:grid-cols-3">
          {cuisine.items.map((item, i) => (
            <li key={`${item.title}-${i}`} className="rounded-lg bg-surface p-space-md shadow-sm">
              <Icon name={item.icon} className={cn('mb-space-xs text-2xl', CUISINE_TONES[i % CUISINE_TONES.length])} />
              <h3 className="mb-1 font-headline-sm text-headline-sm font-semibold text-on-surface">{item.title}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">{item.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ stays

export function StaysSection({ name, stays }: { name: string; stays: DestinationDetail['stays'] }) {
  const t = useTranslations('destinationDetail.stays')
  if (stays.length === 0) return null
  return (
    <section aria-labelledby="stays-title" className="flex flex-col gap-space-xl">
      <div className="flex flex-col">
        <span className="font-label-lg text-label-lg uppercase tracking-widest text-secondary">{t('eyebrow')}</span>
        <h2 id="stays-title" className="mt-1 font-headline-xl text-headline-xl font-semibold text-primary">
          {t('title', { name })}
        </h2>
        <p className="mt-2 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">{t('intro')}</p>
      </div>
      <div className="space-y-space-lg">
        {stays.map((stay, i) => {
          const tone = STAY_TONES[i % STAY_TONES.length]
          return (
            <article
              key={`${stay.title}-${i}`}
              className="flex flex-col items-center gap-space-lg rounded-xl bg-surface-container-lowest p-space-lg shadow-sm md:flex-row md:p-space-xl"
            >
              <div className="relative h-56 w-full shrink-0 overflow-hidden rounded-lg md:w-5/12">
                <SmartImage
                  image={stay.image}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 40vw, 100vw"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex w-full flex-col md:w-7/12">
                <div className="mb-1 flex items-center gap-2">
                  <Icon name={stay.icon || 'grade'} className={cn('text-sm', tone)} />
                  <span className={cn('font-label-md text-label-md font-semibold uppercase tracking-wider', tone)}>
                    {stay.category}
                  </span>
                </div>
                <h3 className="mb-space-xs font-headline-md text-headline-md font-semibold text-on-surface">
                  {stay.title}
                </h3>
                <p className="mb-space-md font-body-md text-body-md leading-relaxed text-on-surface-variant">
                  {stay.text}
                </p>
                {stay.features.length > 0 && (
                  <ul className="flex flex-wrap items-center gap-x-space-md gap-y-1 font-caption text-caption font-medium text-on-surface-variant">
                    {stay.features.map((f) => (
                      <li key={f} className="flex items-center gap-1">
                        <Icon name="check_circle" className="text-sm text-tertiary" /> {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ field notes

export function FieldNotes({ name, notes }: { name: string; notes: DestinationDetail['fieldNotes'] }) {
  const t = useTranslations('destinationDetail.fieldNotes')
  if (notes.length === 0) return null
  return (
    <section aria-labelledby="field-notes-title" className="rounded-xl bg-surface-container-high p-space-xl shadow-sm">
      <div className="mb-space-md flex items-center gap-space-sm text-primary">
        <Icon name="edit_note" className="text-2xl" />
        <h2 id="field-notes-title" className="font-headline-sm text-headline-sm font-semibold">
          {t('title', { name })}
        </h2>
      </div>
      <ul className="grid grid-cols-1 gap-space-md md:grid-cols-3">
        {notes.map((note, i) => (
          <li key={`${note.title}-${i}`} className="rounded-lg bg-surface p-space-md shadow-sm">
            <h3
              className={cn(
                'mb-1 flex items-center gap-2 font-label-md text-label-md font-semibold',
                NOTE_TONES[i % NOTE_TONES.length],
              )}
            >
              <Icon name={note.icon} className="text-sm" /> {note.title}
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('quote', { text: note.text })}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ map

export function DestinationMapSection({
  destination: d,
}: {
  destination: Pick<DestinationDetail, 'name' | 'latitude' | 'longitude' | 'mapPoints'>
}) {
  const t = useTranslations('destinationDetail.map')
  const centre = d.latitude !== null && d.longitude !== null ? { lat: d.latitude, lng: d.longitude } : null
  if (!centre && d.mapPoints.length === 0) return null
  return (
    <section aria-labelledby="map-title" className="flex flex-col gap-space-md">
      <div className="flex items-center justify-between gap-space-md">
        <div>
          <span className="font-label-lg text-label-lg uppercase tracking-widest text-secondary">{t('eyebrow')}</span>
          <h2 id="map-title" className="font-headline-md text-headline-md font-semibold text-primary">
            {d.name.includes('&') ? t('titleCompound', { name: d.name }) : t('title', { name: d.name })}
          </h2>
        </div>
        <span className="hidden text-right font-caption text-caption text-on-surface-variant sm:block">
          {t('zone')}
        </span>
      </div>
      <DestinationMapClient name={d.name} centre={centre} points={d.mapPoints} />
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ FAQ

export function DestinationFaqs({ name, faqs }: { name: string; faqs: DestinationDetail['faqs'] }) {
  const t = useTranslations('destinationDetail.faq')
  if (faqs.length === 0) return null
  return (
    <FaqSection
      items={faqs}
      eyebrow={t('eyebrow')}
      title={t('title', { name })}
      headingSize="lg"
      openFirst={false}
      accordionClassNames={{
        itemClassName: 'rounded-xl bg-surface-container-lowest shadow-sm',
        buttonClassName: 'px-space-lg py-space-md font-headline-sm text-[18px] font-semibold text-primary',
        iconClassName: 'text-primary',
        panelClassName: 'px-space-lg pb-space-md',
      }}
    />
  )
}
