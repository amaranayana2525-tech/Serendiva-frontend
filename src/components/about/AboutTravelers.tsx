import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { listEntries, loose } from '@/lib/page-content/lists'

const TRAVELERS = [
  { key: 'heritage', icon: 'temple_buddhist', badge: 'bg-secondary/10 text-secondary', tone: 'text-secondary' },
  { key: 'families', icon: 'family_restroom', badge: 'bg-tertiary/10 text-tertiary', tone: 'text-tertiary' },
  { key: 'solitary', icon: 'photo_camera', badge: 'bg-primary/10 text-primary', tone: 'text-primary' },
] as const

/** Stitch "Travelers I Love to Guide". */
export function AboutTravelers() {
  const t = useTranslations('about.travelers')
  const tl = loose(t)
  const travelers = listEntries(tl.raw('items'), TRAVELERS)
  return (
    <section className="w-full bg-surface-container-low py-space-3xl">
      <div className="mx-auto max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
        <div className="mx-auto mb-space-2xl flex max-w-2xl flex-col gap-space-xs text-center">
          <span className="font-label-md text-label-md font-semibold uppercase tracking-widest text-secondary">
            {t('eyebrow')}
          </span>
          <h2 className="font-headline-xl text-headline-xl text-primary">{t('title')}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">{t('intro')}</p>
        </div>
        <ul className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          {travelers.map(({ key, meta: item, icon }, index) => (
            <Reveal as="li" key={key} delay={index * 0.08} className="flex">
              <div className="flex w-full flex-col gap-space-md rounded-xl bg-surface p-space-xl shadow-md">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', item.badge)}>
                  {icon && <Icon name={icon} className="text-2xl" />}
                </div>
                <h3 className="font-headline-sm text-headline-sm text-primary">{tl(`items.${key}.title`)}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{tl(`items.${key}.body`)}</p>
                <div
                  className={cn(
                    'mt-auto flex items-center gap-1 pt-space-md font-label-md text-label-md font-semibold uppercase tracking-wider',
                    item.tone,
                  )}
                >
                  <span>{tl(`items.${key}.tag`)}</span>
                  <Icon name="arrow_forward" className="text-xs" />
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
