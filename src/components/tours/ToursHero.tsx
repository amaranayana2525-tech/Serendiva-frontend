import { useTranslations } from 'next-intl'
import type { ApiImage } from '@/lib/api/types'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'
import { listEntries, loose } from '@/lib/page-content/lists'

const STATS = [
  { key: 'private', icon: 'verified_user', tone: 'text-primary' },
  { key: 'guide', icon: 'directions_car', tone: 'text-secondary' },
  { key: 'pacing', icon: 'schedule', tone: 'text-tertiary' },
] as const

/**
 * /tours hero (Stitch "HERO SECTION WITH ASYMMETRIC OVERLAP"): full-bleed photo with teal scrims, breadcrumb, kicker,
 * the page h1, and the quick-stats card overlapping the bottom edge. The photo is the CMS slot `tours-hero-nine-arches`.
 */
export function ToursHero({ image }: { image: ApiImage | null }) {
  const t = useTranslations('tours')
  const tl = loose(t)
  const stats = listEntries(tl.raw('stats'), STATS)
  const tc = useTranslations('common')
  return (
    <section className="relative w-full overflow-hidden bg-surface pb-space-2xl">
      {/* min-h instead of Stitch's fixed h-[520px]/h-[620px] so long translations can never be clipped at the top. */}
      <div className="relative flex min-h-[520px] w-full flex-col justify-end lg:min-h-[620px]">
        <div className="absolute inset-0">
          <SmartImage image={image} fill priority sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />
          <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
        </div>
        <div className="relative mx-auto w-full max-w-[1440px] px-margin pb-space-xl pt-space-3xl md:px-margin-md lg:px-margin-lg">
          <Breadcrumbs tone="light" items={[{ label: tc('nav.home'), href: '/' }, { label: t('breadcrumb') }]} />
          <div className="max-w-3xl">
            <span className="mb-space-sm inline-block rounded-full bg-primary-container/80 px-space-md py-1 font-label-md text-label-md uppercase tracking-[0.2em] text-secondary-fixed backdrop-blur-md">
              {t('hero.eyebrow')}
            </span>
            <h1 className="font-display-lg text-display-lg leading-tight text-on-primary drop-shadow-sm">
              {t('hero.title')}
            </h1>
            <p className="mt-space-sm max-w-2xl font-body-xl text-body-xl font-light text-surface-container-low">
              {t('hero.intro')}
            </p>
          </div>
        </div>
      </div>

      {/* Quick stats floating banner */}
      <div className="relative z-20 mx-auto -mt-10 max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
        <h2 className="sr-only">{t('stats.label')}</h2>
        <ul className="grid grid-cols-1 gap-gutter rounded-xl bg-surface-container-lowest p-space-lg shadow-xl md:grid-cols-3">
          {stats.map(({ key, meta: stat, icon }) => (
            <li key={key} className="flex items-center gap-space-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-container">
                {icon && <Icon name={icon} filled className={`text-2xl ${stat.tone}`} />}
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-primary">{tl(`stats.${key}.title`)}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{tl(`stats.${key}.text`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
