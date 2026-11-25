import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'
import { GuideSection } from './GuideSection'

const em = (chunks: ReactNode) => <em className="italic">{chunks}</em>
const HOSPITALS = ['asiri', 'lanka', 'suwasevana'] as const

/** Section 07 — Health, wildlife & culinary comfort (+ private hospitals with tap-to-call numbers). */
export function HealthChapter({ id, icon }: { id: string; icon: string }) {
  const t = useTranslations('travelGuide.health')
  const cards = [
    {
      key: 'water',
      icon: 'water_drop',
      iconTone: 'text-primary',
      titleTone: 'text-primary',
      body: t.rich('water.body', { em }),
    },
    {
      key: 'spice',
      icon: 'restaurant',
      iconTone: 'text-secondary',
      titleTone: 'text-on-surface',
      body: t('spice.body'),
    },
    {
      key: 'wildlife',
      icon: 'pets',
      iconTone: 'text-tertiary-container',
      titleTone: 'text-primary',
      body: t('wildlife.body'),
    },
  ] as const
  return (
    <GuideSection id={id} icon={icon} eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')}>
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.key} className="flex flex-col gap-1 rounded-xl bg-surface-container-low p-space-md shadow-sm">
            <Icon name={card.icon} className={cn('text-[24px]', card.iconTone)} />
            <h3 className={cn('font-headline-sm text-headline-sm', card.titleTone)}>{t(`${card.key}.title`)}</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">{card.body}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-surface-container-highest/70 p-space-md">
        <h3 className="mb-1 block font-label-md text-label-md font-semibold uppercase tracking-wider text-primary">
          {t('hospitals.title')}
        </h3>
        <ul className="grid grid-cols-1 gap-space-sm text-caption sm:grid-cols-2 lg:grid-cols-3">
          {HOSPITALS.map((key) => {
            const name = t(`hospitals.items.${key}.name`)
            const phone = t(`hospitals.items.${key}.phone`)
            return (
              <li key={key} className="rounded-lg bg-surface-container-lowest p-2">
                <span className="block font-semibold text-on-surface">{name}</span>
                <span className="text-on-surface-variant">
                  {t(`hospitals.items.${key}.address`)} •{' '}
                  <a
                    href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                    aria-label={t('hospitals.call', { name })}
                    className="whitespace-nowrap rounded underline-offset-2 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {phone}
                  </a>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </GuideSection>
  )
}
