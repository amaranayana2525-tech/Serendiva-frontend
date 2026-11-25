import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'
import { GuideSection } from './GuideSection'

const em = (chunks: ReactNode) => <em className="italic">{chunks}</em>
const strong = (chunks: ReactNode) => <strong>{chunks}</strong>

/** Section 03 — Cultural decorum & temple etiquette (Stitch "Etiquette Mosaic" + pull quote). */
export function EtiquetteChapter({ id, icon }: { id: string; icon: string }) {
  const t = useTranslations('travelGuide.etiquette')
  const cards = [
    { key: 'attire', icon: 'checkroom', iconTone: 'text-primary', titleTone: 'text-primary', body: t('attire.body') },
    {
      key: 'footwear',
      icon: 'do_not_step',
      iconTone: 'text-primary',
      titleTone: 'text-primary',
      body: t.rich('footwear.body', { em }),
      tip: t('footwear.tip'),
    },
    {
      key: 'photography',
      icon: 'no_photography',
      iconTone: 'text-secondary',
      titleTone: 'text-on-surface',
      body: t.rich('photography.body', { strong }),
    },
    {
      key: 'tattoos',
      icon: 'sentiment_very_dissatisfied',
      iconTone: 'text-secondary',
      titleTone: 'text-on-surface',
      body: t('tattoos.body'),
    },
  ] as const

  return (
    <GuideSection id={id} icon={icon} eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')}>
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
        {cards.map((card) => (
          <div key={card.key} className="flex gap-space-md rounded-xl bg-surface-container-low p-space-lg shadow-sm">
            <Icon name={card.icon} className={cn('shrink-0 text-[28px]', card.iconTone)} />
            <div className="flex flex-col gap-1">
              <h3 className={cn('font-headline-sm text-headline-sm', card.titleTone)}>{t(`${card.key}.title`)}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">{card.body}</p>
              {'tip' in card && (
                <span className="mt-1 font-caption text-caption font-semibold text-secondary">{card.tip}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {t.has('quote') && (
        <figure className="flex items-start gap-space-md rounded-xl bg-surface-container p-space-lg">
          <Icon name="format_quote" className="shrink-0 text-[32px] text-primary" />
          <div className="flex flex-col">
            <blockquote className="font-headline-md text-headline-md italic leading-snug text-primary">
              <p>{t('quote')}</p>
            </blockquote>
            <figcaption className="mt-space-xs font-label-md text-label-md uppercase tracking-widest text-secondary">
              {t('quoteAuthor')}
            </figcaption>
          </div>
        </figure>
      )}
    </GuideSection>
  )
}
