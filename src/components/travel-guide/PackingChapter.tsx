import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Skeleton } from '@/components/ui/Skeleton'
import { SmartImage } from '@/components/ui/SmartImage'
import { getSettings } from '@/lib/api/public'
import type { ApiImage, Locale } from '@/lib/api/types'
import { GuideSection } from './GuideSection'

/** Packing zones → CMS page-image slot (settings.pageImages) for the card photo. */
const ZONES = [
  { key: 'coastal', image: 'travel-guide-south-coast' },
  { key: 'highlands', image: 'travel-guide-tea-country' },
  { key: 'triangle', image: 'travel-guide-sigiriya' },
] as const
const ITEMS = ['one', 'two', 'three', 'four'] as const

/** Section 04 — What to pack. `cards` = <PackingCards/> inside Suspense (photos come from the CMS). */
export function PackingChapter({ id, icon, cards }: { id: string; icon: string; cards: ReactNode }) {
  const t = useTranslations('travelGuide.packing')
  return (
    <GuideSection id={id} icon={icon} eyebrow={t('eyebrow')} title={t('title')} intro={t('intro')}>
      {cards}
    </GuideSection>
  )
}

/** The three microclimate cards. Photos degrade to the sand placeholder when the settings call fails. */
export async function PackingCards({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'travelGuide.packing' })
  let images: Record<string, ApiImage> = {}
  try {
    images = (await getSettings(locale)).pageImages
  } catch {
    images = {}
  }
  return (
    <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
      {ZONES.map((zone) => (
        <div
          key={zone.key}
          className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-sm"
        >
          <div className="relative h-32 overflow-hidden rounded-lg">
            <SmartImage
              image={images[zone.image] ?? null}
              fill
              sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 100vw"
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-2 left-2 rounded bg-surface/90 px-2 py-0.5 font-label-md text-[10px] font-bold uppercase text-primary backdrop-blur">
              {t(`${zone.key}.badge`)}
            </span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-primary">{t(`${zone.key}.title`)}</h3>
          <ul className="flex flex-col gap-1.5 font-body-md text-body-md text-on-surface-variant">
            {ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                {t(`${zone.key}.items.${item}`)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function PackingCardsSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 gap-space-md md:grid-cols-3">
      {ZONES.map((zone) => (
        <div key={zone.key} className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      ))}
    </div>
  )
}
