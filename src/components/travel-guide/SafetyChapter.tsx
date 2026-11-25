import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'
import { GuideSection } from './GuideSection'

const TIPS = [
  { key: 'sea', icon: 'waves', tone: 'text-primary' },
  { key: 'roads', icon: 'local_taxi', tone: 'text-primary' },
  { key: 'scams', icon: 'diamond', tone: 'text-secondary' },
  { key: 'wildlife', icon: 'forest', tone: 'text-tertiary-container' },
] as const

const HOTLINES = [
  { key: 'ambulance', number: '1990', icon: 'ambulance', tone: 'bg-error-container text-on-error-container' },
  { key: 'tourism', number: '1912', icon: 'local_police', tone: 'bg-primary-container text-on-primary-container' },
  { key: 'police', number: '119', icon: 'emergency', tone: 'bg-secondary-fixed text-on-secondary-fixed' },
  { key: 'fire', number: '110', icon: 'local_fire_department', tone: 'bg-tertiary-fixed text-on-tertiary-fixed' },
] as const

/** Section 10 — Safety & emergency numbers. Rendered with id="safety" (the footer links /travel-guide#safety). */
export function SafetyChapter({ id, icon }: { id: string; icon: string }) {
  const t = useTranslations('travelGuide.safety')
  return (
    <GuideSection id={id} icon={icon} eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')}>
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
        {TIPS.map((tip) => (
          <div key={tip.key} className="flex gap-space-md rounded-xl bg-surface-container-low p-space-lg shadow-sm">
            <Icon name={tip.icon} className={cn('shrink-0 text-[28px]', tip.tone)} />
            <div className="flex flex-col gap-1">
              <h3 className="font-headline-sm text-headline-sm text-primary">{t(`tips.${tip.key}.title`)}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">{t(`tips.${tip.key}.body`)}</p>
            </div>
          </div>
        ))}
      </div>
      <h3 className="mt-space-sm font-label-md text-label-md font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
        {t('hotlinesTitle')}
      </h3>
      <ul className="grid grid-cols-1 gap-space-md md:grid-cols-2">
        {HOTLINES.map((line) => (
          <li key={line.key}>
            <a
              href={`tel:${line.number}`}
              className="flex h-full items-center gap-space-md rounded-xl bg-surface-container-low p-space-md shadow-sm transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', line.tone)}>
                <Icon name={line.icon} className="text-[26px]" />
              </span>
              <span className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  {t(`hotlines.${line.key}.title`)}
                </span>
                <span className="font-caption text-caption text-on-surface-variant">
                  {t(`hotlines.${line.key}.body`)}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </GuideSection>
  )
}
