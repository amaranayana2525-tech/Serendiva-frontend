import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { TourCard as TourCardDto } from '@/lib/api/types'
import { TourCard } from '@/components/cards/TourCard'
import { Icon } from '@/components/ui/Icon'

/** Stitch "YOU MAY ALSO LIKE (RELATED EXPEDITIONS)" band with compact tour cards. */
export function RelatedTours({ tours, totalTours }: { tours: TourCardDto[]; totalTours?: number }) {
  const t = useTranslations('tourDetail.related')
  if (tours.length === 0) return null
  return (
    <section aria-labelledby="related-title" className="w-full bg-surface-container-low py-space-3xl">
      <div className="mx-auto max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
        <div className="mb-space-xl flex flex-col justify-between gap-space-sm md:flex-row md:items-end">
          <div>
            <span className="font-label-lg text-label-lg uppercase tracking-widest text-secondary">{t('eyebrow')}</span>
            <h2 id="related-title" className="font-headline-lg text-headline-lg text-primary">
              {t('title')}
            </h2>
          </div>
          <Link
            href="/tours"
            className="tap-target relative flex w-fit items-center gap-1 rounded font-label-lg text-label-lg text-primary underline transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <span>{totalTours ? t('exploreAllCount', { count: totalTours }) : t('exploreAll')}</span>
            <Icon name="east" className="text-sm" />
          </Link>
        </div>
        <ul className="grid grid-cols-1 gap-space-lg md:grid-cols-3">
          {tours.map((tour, index) => (
            <li key={tour.id} className="flex">
              <TourCard tour={tour} index={index} variant="compact" className="w-full" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
