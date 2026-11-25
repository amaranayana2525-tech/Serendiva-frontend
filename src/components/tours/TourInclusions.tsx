import { useTranslations } from 'next-intl'
import type { TourDetail } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'

/** Stitch "SECTION C: INCLUDED VS NOT INCLUDED COMPARATIVE MODULE". */
export function TourInclusions({ tour }: { tour: Pick<TourDetail, 'included' | 'notIncluded'> }) {
  const t = useTranslations('tourDetail.inclusions')
  const both = tour.included.length > 0 && tour.notIncluded.length > 0
  return (
    <section id="inclusions" aria-labelledby="inclusions-title" className="flex scroll-mt-36 flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <span className="font-label-lg text-label-lg uppercase tracking-widest text-secondary">{t('eyebrow')}</span>
        <h2 id="inclusions-title" className="font-headline-lg text-headline-lg text-primary">
          {t('title')}
        </h2>
      </div>
      <div className={cn('grid grid-cols-1 gap-space-md', both && 'md:grid-cols-2')}>
        {tour.included.length > 0 && (
          <div className="flex flex-col gap-space-md rounded-xl bg-surface-container p-space-lg shadow-sm">
            <div className="flex items-center gap-space-sm text-tertiary">
              <Icon name="check_circle" className="text-2xl" />
              <h3 id="included-title" className="font-headline-sm text-headline-sm text-primary">
                {t('included')}
              </h3>
            </div>
            <ul aria-labelledby="included-title" className="flex flex-col gap-space-sm text-body-md text-on-surface">
              {tour.included.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Icon name={item.icon} className="mt-0.5 shrink-0 text-lg text-tertiary" />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {tour.notIncluded.length > 0 && (
          <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-high p-space-lg shadow-sm">
            <div className="flex items-center gap-space-sm text-outline">
              <Icon name="cancel" className="text-2xl" />
              <h3 id="not-included-title" className="font-headline-sm text-headline-sm text-primary">
                {t('notIncluded')}
              </h3>
            </div>
            <ul
              aria-labelledby="not-included-title"
              className="flex flex-col gap-space-sm text-body-md text-on-surface-variant"
            >
              {tour.notIncluded.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Icon name={item.icon} className="mt-0.5 shrink-0 text-lg text-outline" />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
