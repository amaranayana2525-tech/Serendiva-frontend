import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { listEntries, loose } from '@/lib/page-content/lists'

const PILLARS = [
  { key: 'integrity', icon: 'verified', tagIcon: 'shield', tone: 'text-secondary' },
  { key: 'pacing', icon: 'hourglass_empty', tagIcon: 'schedule', tone: 'text-tertiary' },
  { key: 'safety', icon: 'security', tagIcon: 'lock', tone: 'text-primary' },
  { key: 'fluency', icon: 'auto_stories', tagIcon: 'school', tone: 'text-secondary' },
] as const

/** Stitch "Four Guiding Pillars Grid". */
export function AboutPillars() {
  const t = useTranslations('about.pillars')
  const tl = loose(t)
  const pillars = listEntries(tl.raw('items'), PILLARS)
  return (
    <section className="w-full bg-surface py-space-3xl">
      <div className="mx-auto max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
        <div className="mb-space-2xl flex flex-col justify-between gap-space-md md:flex-row md:items-end">
          <div className="flex max-w-xl flex-col gap-space-xs">
            <span className="font-label-md text-label-md font-semibold uppercase tracking-widest text-secondary">
              {t('eyebrow')}
            </span>
            <h2 className="font-headline-xl text-headline-xl text-primary">{t('title')}</h2>
          </div>
          <p className="max-w-md font-body-md text-body-md text-on-surface-variant">{t('intro')}</p>
        </div>
        <ul className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ key, meta: pillar, icon }, index) => (
            <Reveal as="li" key={key} delay={index * 0.08} className="flex">
              <div className="flex w-full flex-col justify-between rounded-xl bg-surface-container-low p-space-xl shadow-sm transition-shadow hover:shadow-md">
                <div className="flex flex-col gap-space-md">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-surface-container text-primary">
                    {icon && <Icon name={icon} className="text-3xl" />}
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary">{tl(`items.${key}.title`)}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">{tl(`items.${key}.body`)}</p>
                </div>
                <div
                  className={cn(
                    'mt-space-lg flex items-center gap-1 pt-space-md font-label-md text-label-md font-semibold uppercase tracking-wider',
                    pillar.tone,
                  )}
                >
                  <span>{tl(`items.${key}.tag`)}</span>
                  <Icon name={pillar.tagIcon} className="text-sm" />
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
