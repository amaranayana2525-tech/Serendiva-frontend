import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'
import { GuideSection } from './GuideSection'

const em = (chunks: ReactNode) => <em className="italic">{chunks}</em>

const FESTIVALS = [
  { key: 'duruthu', tagTone: 'text-on-surface-variant' },
  { key: 'shivaratri', tagTone: 'text-on-surface-variant' },
  { key: 'avurudu', tagTone: 'font-bold text-secondary' },
  { key: 'vesak', tagTone: 'font-bold text-primary' },
  { key: 'esala', tagTone: 'font-bold text-secondary' },
  { key: 'sripada', tagTone: 'text-on-surface-variant' },
] as const

/** Section 09 — Month-by-month festival calendar. */
export function FestivalsChapter({ id, icon }: { id: string; icon: string }) {
  const t = useTranslations('travelGuide.festivals')
  return (
    <GuideSection id={id} icon={icon} eyebrow={t('eyebrow')} title={t('title')} intro={t.rich('intro', { em })}>
      <ol className="grid grid-cols-1 gap-space-md md:grid-cols-2 lg:grid-cols-3">
        {FESTIVALS.map((f) => (
          <li key={f.key} className="flex flex-col gap-1.5 rounded-xl bg-surface-container-low p-space-md shadow-sm">
            <div className="flex items-center justify-between gap-space-sm">
              <span className="font-label-md text-label-md font-semibold uppercase tracking-wider text-secondary">
                {t(`items.${f.key}.month`)}
              </span>
              <span className={cn('font-caption text-caption', f.tagTone)}>{t(`items.${f.key}.tag`)}</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-primary">{t(`items.${f.key}.title`)}</h3>
            <span className="font-caption text-caption italic text-on-surface-variant">
              {t(`items.${f.key}.place`)}
            </span>
            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
              {t.rich(`items.${f.key}.body`, { em })}
            </p>
          </li>
        ))}
      </ol>
      <p className="flex items-start gap-1.5 font-caption text-caption text-on-surface-variant">
        <Icon name="calendar_month" className="mt-px shrink-0 text-[14px] text-secondary" />
        {t('note')}
      </p>
    </GuideSection>
  )
}
