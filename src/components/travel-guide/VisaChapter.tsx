import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'
import { GuideSection } from './GuideSection'

/** Official Sri Lanka online arrival card (Department of Immigration & Emigration). */
const ARRIVAL_CARD_URL = 'https://eservices.immigration.gov.lk/emb/eEmbarkation/'

const FACTS = [
  { key: 'duration', tone: 'text-primary' },
  { key: 'passport', tone: 'text-secondary' },
  { key: 'processing', tone: 'text-tertiary' },
] as const

/** Section 01 — Visa & ETA. */
export function VisaChapter({ id, icon }: { id: string; icon: string }) {
  const t = useTranslations('travelGuide.visa')
  const tc = useTranslations('common.a11y')
  return (
    <GuideSection id={id} icon={icon} eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')}>
      <div className="my-space-xs grid grid-cols-1 gap-space-md md:grid-cols-3">
        {FACTS.map((fact) => (
          <div key={fact.key} className="rounded-xl bg-surface-container-low p-space-md shadow-sm">
            <span
              className={cn(
                'mb-1 block font-label-md text-label-md font-semibold uppercase tracking-widest',
                fact.tone,
              )}
            >
              {t(`facts.${fact.key}.label`)}
            </span>
            <span className="block font-headline-sm text-headline-sm text-on-surface">
              {t(`facts.${fact.key}.value`)}
            </span>
            <p className="mt-1 font-caption text-caption text-on-surface-variant">{t(`facts.${fact.key}.note`)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-space-md rounded-xl bg-surface-container-highest/60 p-space-lg">
        <Icon name="warning" className="mt-0.5 shrink-0 text-[24px] text-secondary" />
        <div className="flex flex-col gap-1">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t('caution.title')}</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {t.rich('caution.body', {
              hl: (chunks) => <span className="font-semibold text-primary">{chunks}</span>,
            })}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-space-md rounded-xl bg-surface-container-low p-space-md sm:flex-row sm:items-center">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Icon name="qr_code_scanner" className="text-[20px] text-primary" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-label-lg text-label-lg font-semibold uppercase tracking-wider text-primary">
              {t('arrivalCard.title')}
            </h3>
            <span className="font-body-md text-body-md text-on-surface-variant">{t('arrivalCard.body')}</span>
          </div>
        </div>
        <a
          href={ARRIVAL_CARD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="relative inline-flex shrink-0 items-center rounded-xl bg-primary px-space-md py-2 font-label-md text-label-md uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 coarse:min-h-11"
        >
          {t('arrivalCard.cta')}
          <span className="sr-only"> {tc('opensInNewTab')}</span>
        </a>
      </div>
      <p className="flex items-start gap-1.5 font-caption text-caption text-on-surface-variant">
        <Icon name="info" className="mt-px shrink-0 text-[14px] text-secondary" />
        {t('disclaimer')}
      </p>
    </GuideSection>
  )
}
