import { useTranslations } from 'next-intl'
import type { GuideSettings, TourDetail } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { Markdown } from '@/components/ui/Markdown'
import { SmartImage } from '@/components/ui/SmartImage'

/** Icon tile colours of the four key-feature cards (Stitch order). */
const FEATURE_TONES = ['text-primary', 'text-tertiary', 'text-secondary', 'text-primary-container'] as const

export interface TourOverviewProps {
  tour: Pick<TourDetail, 'title' | 'overview' | 'description' | 'keyFeatures'>
  /** settings.guide — the "Curated by" card. */
  guide: GuideSettings | null
}

/** Stitch "SECTION A: TOUR OVERVIEW": philosophy heading, guide quote card, markdown description, key features. */
export function TourOverview({ tour, guide }: TourOverviewProps) {
  const t = useTranslations('tourDetail.overview')
  const overview = tour.overview
  const quote = overview?.quote?.trim()
  return (
    <section id="overview" aria-labelledby="overview-title" className="flex scroll-mt-36 flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <span className="font-label-lg text-label-lg uppercase tracking-widest text-secondary">
          {overview?.kicker || t('kicker')}
        </span>
        <h2 id="overview-title" className="font-headline-lg text-headline-lg text-primary">
          {overview?.heading || tour.title}
        </h2>
      </div>

      {(quote || guide) && (
        <figure className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-lg">
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-8 -right-8 text-primary opacity-10">
            <Icon name="temple_buddhist" className="text-[160px]" />
          </div>
          {quote && (
            <blockquote className="relative mb-space-md font-body-xl text-body-xl leading-relaxed text-on-surface">
              <p>{t('quote', { text: quote })}</p>
            </blockquote>
          )}
          {guide && (
            <figcaption className="relative flex items-center gap-space-md">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface-container-high">
                <SmartImage image={guide.portrait} alt="" fill sizes="48px" className="object-cover" />
              </div>
              <div>
                <div className="font-headline-sm text-headline-sm text-primary">
                  {t('curatedBy', { name: guide.name })}
                </div>
                <div className="font-caption text-caption text-on-surface-variant">
                  {t('guideMeta', { title: guide.title, years: guide.yearsGuiding })}
                </div>
              </div>
            </figcaption>
          )}
        </figure>
      )}

      {tour.description.trim() && (
        <Markdown shiftHeadings className="leading-relaxed [&_strong]:font-medium [&_strong]:text-primary">
          {tour.description}
        </Markdown>
      )}

      {tour.keyFeatures.length > 0 && (
        <ul aria-label={t('featuresLabel')} className="grid grid-cols-1 gap-space-md pt-space-xs sm:grid-cols-2">
          {tour.keyFeatures.map((feature, i) => (
            <li
              key={`${feature.title}-${i}`}
              className="flex items-start gap-space-md rounded-xl bg-surface-container p-space-md shadow-sm"
            >
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface',
                  FEATURE_TONES[i % FEATURE_TONES.length],
                )}
              >
                <Icon name={feature.icon} className="text-2xl" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-headline-sm text-headline-sm font-bold text-primary">{feature.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{feature.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
