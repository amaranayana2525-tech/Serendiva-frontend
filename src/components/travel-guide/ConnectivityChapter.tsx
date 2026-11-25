import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { GuideSection } from './GuideSection'

/** Section 08 — SIM cards, eSIM and Wi-Fi. */
export function ConnectivityChapter({ id, icon }: { id: string; icon: string }) {
  const t = useTranslations('travelGuide.connectivity')
  const cards = [
    { key: 'sim', icon: 'sim_card' },
    { key: 'wifi', icon: 'cottage' },
  ] as const
  return (
    <GuideSection id={id} icon={icon} eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')}>
      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
        {cards.map((card) => (
          <div key={card.key} className="flex flex-col gap-1 rounded-xl bg-surface-container-low p-space-md shadow-sm">
            <div className="flex items-center gap-2">
              <Icon name={card.icon} className="shrink-0 text-primary" />
              <h3 className="font-headline-sm text-headline-sm text-primary">{t(`${card.key}.title`)}</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">{t(`${card.key}.body`)}</p>
          </div>
        ))}
      </div>
    </GuideSection>
  )
}
