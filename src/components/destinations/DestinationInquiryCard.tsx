import { useTranslations } from 'next-intl'
import type { DestinationDetail, PublicSettings } from '@/lib/api/types'
import { Icon } from '@/components/ui/Icon'
import type { MonthOption } from './content'
import { DestinationInquiryForm } from './DestinationInquiryForm'

export interface DestinationInquiryCardProps {
  destination: Pick<DestinationDetail, 'slug' | 'name' | 'interests'>
  guide: PublicSettings['guide'] | null
  months: MonthOption[]
}

/**
 * Sticky "Include <name> in My Journey" card of the destination template. Local variant of
 * sections/InquirySidebarCard: the Stitch destination card is white with an inline header and its own trust list
 * (the shared card has the tour page's teal header).
 */
export function DestinationInquiryCard({ destination: d, guide, months }: DestinationInquiryCardProps) {
  const t = useTranslations('destinationDetail.inquiry')
  const license = guide?.operatorLicense
  const trust = [
    { icon: 'directions_car', text: t('trust.chauffeur') },
    { icon: 'confirmation_number', text: t('trust.tickets') },
    { icon: 'verified', text: license ? t('trust.licensed', { license }) : t('trust.licensedNoNumber') },
    { icon: 'draw', text: t('trust.noObligation') },
  ]
  return (
    <section
      id="include-in-journey"
      aria-labelledby="include-in-journey-title"
      className="flex scroll-mt-28 flex-col gap-space-lg rounded-xl bg-surface-container-lowest p-space-lg shadow-[0_16px_36px_-12px_rgba(43,43,43,0.08),0_4px_12px_-4px_rgba(43,43,43,0.04)] md:p-space-xl"
    >
      <div className="flex flex-col border-b border-surface-container pb-space-sm">
        <span className="font-label-md text-label-md font-semibold uppercase tracking-widest text-secondary">
          {t('eyebrow')}
        </span>
        <h2 id="include-in-journey-title" className="mt-1 font-headline-md text-headline-md font-semibold text-primary">
          {t('title', { name: d.name })}
        </h2>
        <p className="mt-1 font-caption text-caption text-on-surface-variant">
          {guide?.name ? t('intro', { guide: guide.name }) : t('introNoGuide')}
        </p>
      </div>

      <DestinationInquiryForm
        destinationSlug={d.slug}
        destinationName={d.name}
        interests={d.interests}
        months={months}
      />

      <ul
        aria-label={t('trustLabel')}
        className="flex flex-col gap-space-sm border-t border-surface-container pt-space-md"
      >
        {trust.map((item) => (
          <li key={item.icon} className="flex items-center gap-space-sm">
            <Icon name={item.icon} className="text-lg text-tertiary" />
            <span className="font-caption text-caption text-on-surface-variant">{item.text}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
