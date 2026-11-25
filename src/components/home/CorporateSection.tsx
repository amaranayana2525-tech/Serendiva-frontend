import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { PublicSettings } from '@/lib/api/types'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'
import { listEntries, loose } from '@/lib/page-content/lists'

const FEATURES = [
  { key: 'estates', icon: 'villa' },
  { key: 'fleet', icon: 'directions_bus' },
  { key: 'liaison', icon: 'support_agent' },
] as const

/** Section 8 — corporate retreats & delegations (teal band): copy, 3 features, CTA → /corporate, photo + SLTDA seal. */
export function CorporateSection({ settings }: { settings: PublicSettings | null }) {
  const t = useTranslations('home.corporate')
  const tl = loose(t)
  const features = listEntries(tl.raw('features'), FEATURES)
  return (
    <section className="w-full bg-primary py-space-3xl text-on-primary">
      <Container>
        <div className="grid grid-cols-1 items-center gap-gutter-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-lg lg:col-span-6">
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-lg text-label-lg font-semibold uppercase tracking-widest text-secondary-fixed">
                {t('eyebrow')}
              </span>
              <h2 className="font-headline-xl text-headline-xl text-surface">{t('title')}</h2>
            </div>
            <p className="font-body-xl text-body-xl font-light text-surface-container">{t('intro')}</p>
            <ul className="flex flex-col gap-space-md">
              {features.map(({ key, icon }) => (
                <li key={key} className="flex items-start gap-space-sm">
                  {icon && <Icon name={icon} className="shrink-0 text-2xl text-secondary-fixed" />}
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-surface">{tl(`features.${key}.title`)}</h3>
                    <p className="font-body-md text-body-md text-surface-container-high/85">
                      {tl(`features.${key}.body`)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div>
              <Link
                href="/corporate"
                className="inline-flex items-center gap-2 rounded-xl bg-secondary px-space-xl py-space-sm font-label-lg text-label-lg uppercase tracking-wider text-on-secondary shadow-lg transition-colors hover:bg-on-secondary-fixed-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-primary coarse:min-h-11"
              >
                <span>{t('cta')}</span>
                <Icon name="assignment" className="text-sm" />
              </Link>
            </div>
          </div>
          <div className="relative lg:col-span-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-2xl">
              <SmartImage
                image={settings?.pageImages['corp-home-veranda-meeting']}
                fill
                sizes="(min-width: 1440px) 640px, (min-width: 1024px) 50vw, 100vw"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden items-center gap-3 rounded-xl bg-surface p-space-md text-primary shadow-xl sm:flex">
              <Icon name="verified" className="text-3xl text-secondary" />
              <div className="flex flex-col">
                <span className="font-label-lg text-label-lg font-bold">{t('sealTitle')}</span>
                <span className="font-caption text-caption text-on-surface-variant">{t('sealBody')}</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
