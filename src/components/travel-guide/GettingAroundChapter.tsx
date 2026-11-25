import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { GuideSection } from './GuideSection'

/** Section 05 — Getting around: chauffeur-guide customs and the hill-country railway. */
export function GettingAroundChapter({ id, icon }: { id: string; icon: string }) {
  const t = useTranslations('travelGuide.gettingAround')
  return (
    <GuideSection id={id} icon={icon} eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')}>
      <div className="rounded-xl bg-surface-container p-space-lg shadow-sm">
        <h3 className="mb-space-sm font-headline-sm text-headline-sm text-primary">{t('customs.title')}</h3>
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <h4 className="font-label-lg text-label-lg font-semibold uppercase text-secondary">
              {t('customs.quartersLabel')}
            </h4>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('customs.quartersBody')}</p>
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="font-label-lg text-label-lg font-semibold uppercase text-secondary">
              {t('customs.diningLabel')}
            </h4>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('customs.diningBody')}</p>
          </div>
        </div>
      </div>
      <div className="flex items-start gap-space-md rounded-xl bg-surface-container-low p-space-md">
        <Icon name="train" className="mt-0.5 shrink-0 text-[24px] text-primary" />
        <div className="flex flex-col">
          <h3 className="font-label-lg text-label-lg font-semibold uppercase tracking-wider text-primary">
            {t('train.title')}
          </h3>
          <p className="mt-0.5 font-body-md text-body-md text-on-surface-variant">{t('train.body')}</p>
        </div>
      </div>
    </GuideSection>
  )
}
