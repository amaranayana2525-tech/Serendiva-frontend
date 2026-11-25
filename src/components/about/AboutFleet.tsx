import { useTranslations } from 'next-intl'
import type { PublicSettings } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { SmartImage } from '@/components/ui/SmartImage'
import { pageImage } from './guide'

const VEHICLES = [
  {
    key: 'prado',
    slot: 'fleet-land-cruiser-prado',
    badge: 'bg-primary text-on-primary',
    features: ['prado.features.ac', 'prado.features.seats', 'prado.features.coldBox', 'prado.features.clearance'],
    idealIcon: 'terrain',
  },
  {
    key: 'hiace',
    slot: 'fleet-hiace-vip',
    badge: 'bg-secondary text-on-secondary',
    features: ['hiace.features.chairs', 'hiace.features.wifi', 'hiace.features.luggage', 'hiace.features.venting'],
    idealIcon: 'airline_seat_recline_extra',
  },
] as const

const INCLUSIONS = [
  { key: 'wifi', icon: 'wifi', tone: 'text-primary' },
  { key: 'flasks', icon: 'local_cafe', tone: 'text-secondary' },
  { key: 'gear', icon: 'umbrella', tone: 'text-tertiary' },
  { key: 'sanitization', icon: 'sanitizer', tone: 'text-primary' },
] as const

/** Stitch "The Serendiva Private Fleet" — vehicle photos come from settings.pageImages (fleet-*). */
export function AboutFleet({ settings }: { settings: PublicSettings | null }) {
  const t = useTranslations('about.fleet')
  return (
    <section className="w-full bg-surface py-space-3xl">
      <div className="mx-auto max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
        <div className="mb-space-2xl flex max-w-2xl flex-col gap-space-xs">
          <span className="font-label-md text-label-md font-semibold uppercase tracking-widest text-secondary">
            {t('eyebrow')}
          </span>
          <h2 className="font-headline-xl text-headline-xl text-primary">{t('title')}</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">{t('intro')}</p>
        </div>

        <div className="grid grid-cols-1 gap-gutter-lg lg:grid-cols-2">
          {VEHICLES.map((vehicle, index) => (
            <Reveal key={vehicle.key} delay={index * 0.08} className="flex">
              <article className="flex w-full flex-col justify-between overflow-hidden rounded-2xl bg-surface-container-low shadow-md">
                <div>
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-container">
                    <SmartImage
                      image={pageImage(settings, vehicle.slot)}
                      fill
                      sizes="(min-width: 1440px) 640px, (min-width: 1024px) 45vw, 100vw"
                      className="object-cover"
                    />
                    <div
                      className={cn(
                        'absolute right-space-md top-space-md rounded-full px-space-md py-1 font-label-md text-label-md uppercase tracking-wider',
                        vehicle.badge,
                      )}
                    >
                      {t(`${vehicle.key}.capacity`)}
                    </div>
                  </div>
                  <div className="p-space-xl">
                    <div className="mb-space-sm flex flex-wrap items-center justify-between gap-x-space-md gap-y-1">
                      <h3 className="font-headline-md text-headline-md text-primary">{t(`${vehicle.key}.name`)}</h3>
                      <span className="font-label-md text-label-md font-bold uppercase text-secondary">
                        {t(`${vehicle.key}.tag`)}
                      </span>
                    </div>
                    <p className="mb-space-md font-body-md text-body-md text-on-surface-variant">
                      {t(`${vehicle.key}.body`)}
                    </p>
                    <ul className="grid grid-cols-2 gap-space-sm pt-space-xs">
                      {vehicle.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-space-xs text-on-surface-variant">
                          <Icon name="check" className="shrink-0 text-sm text-tertiary" />
                          <span className="font-caption text-caption">{t(feature)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-space-sm px-space-xl pb-space-lg pt-space-sm font-caption text-caption text-on-surface-variant">
                  <span>{t(`${vehicle.key}.ideal`)}</span>
                  <Icon name={vehicle.idealIcon} className="shrink-0 text-base text-primary" />
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <ul className="mt-space-xl grid grid-cols-2 gap-gutter rounded-xl bg-surface-container p-space-lg text-center md:grid-cols-4">
          {INCLUSIONS.map((item) => (
            <li key={item.key} className="flex flex-col items-center gap-1">
              <Icon name={item.icon} className={cn('text-2xl', item.tone)} />
              <span className="font-label-md text-label-md font-semibold text-primary">
                {t(`inclusions.${item.key}.title`)}
              </span>
              <span className="font-caption text-caption text-on-surface-variant">
                {t(`inclusions.${item.key}.body`)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
