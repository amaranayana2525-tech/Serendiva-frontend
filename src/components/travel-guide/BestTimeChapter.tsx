import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { GuideSection } from './GuideSection'
import { RainfallChart } from './RainfallChart'

const MONSOONS = [
  { key: 'southwest', labelTone: 'text-secondary' },
  { key: 'northeast', labelTone: 'text-tertiary-container' },
] as const

/** Section 02 — Best time / the two monsoons. `matrix` = the CMS-driven region calendar (in its own Suspense). */
export function BestTimeChapter({ id, icon, matrix }: { id: string; icon: string; matrix: ReactNode }) {
  const t = useTranslations('travelGuide.bestTime')
  return (
    <GuideSection id={id} icon={icon} eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')}>
      <div className="my-space-xs grid grid-cols-1 gap-space-md md:grid-cols-2">
        {MONSOONS.map((m) => (
          <div
            key={m.key}
            className="relative flex flex-col gap-space-sm overflow-hidden rounded-xl bg-surface-container p-space-lg shadow-sm"
          >
            <div className="flex items-center justify-between gap-space-sm">
              <span className={`font-label-md text-label-md font-semibold uppercase tracking-widest ${m.labelTone}`}>
                {t(`${m.key}.label`)}
              </span>
              <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 font-caption text-caption text-on-surface">
                {t(`${m.key}.months`)}
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-primary">{t(`${m.key}.title`)}</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">{t(`${m.key}.body`)}</p>
            <div className="mt-space-sm flex flex-col gap-1 border-t border-on-surface/10 pt-space-sm font-caption text-caption">
              <span className="font-semibold uppercase tracking-wider text-primary">{t('recommendationLabel')}</span>
              <span className="text-on-surface-variant">{t(`${m.key}.recommendation`)}</span>
            </div>
          </div>
        ))}
      </div>
      <RainfallChart />
      {matrix}
    </GuideSection>
  )
}
