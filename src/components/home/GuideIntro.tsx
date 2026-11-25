import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { PublicSettings } from '@/lib/api/types'
import { initialsOf } from '@/lib/utils'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { SmartImage } from '@/components/ui/SmartImage'
import { listEntries, loose } from '@/lib/page-content/lists'

const PILLARS = [
  { key: 'private', icon: 'schedule', tone: 'text-secondary' },
  { key: 'access', icon: 'key', tone: 'text-tertiary' },
  { key: 'fleet', icon: 'airline_seat_recline_extra', tone: 'text-primary' },
] as const

/** Section 3 — "Meet your guide": portrait + candid card + monogram, welcome quote, story, 3 pillars, link to /about. */
export function GuideIntro({ settings }: { settings: PublicSettings | null }) {
  const t = useTranslations('home.guide')
  const tl = loose(t)
  const pillars = listEntries(tl.raw('pillars'), PILLARS)
  const guide = settings?.guide
  const name = guide?.name || t('defaultName')
  const years = guide?.yearsGuiding

  return (
    <section className="w-full overflow-hidden py-space-3xl">
      <Container>
        <div className="grid grid-cols-1 items-center gap-gutter-lg lg:grid-cols-12">
          <div className="relative lg:col-span-5">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-xl">
              <SmartImage
                image={guide?.portrait}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="h-full w-full object-cover"
              />
            </div>
            <figure className="absolute -bottom-8 -right-4 w-48 overflow-hidden rounded-xl bg-surface p-1 shadow-2xl sm:-right-8 sm:w-56">
              <div className="relative h-36 w-full overflow-hidden rounded-lg">
                <SmartImage
                  image={guide?.candid}
                  fill
                  sizes="224px"
                  className="h-full w-full rounded-lg object-cover"
                />
              </div>
              {guide?.candidCaption && (
                <figcaption className="bg-surface p-2 text-center">
                  <span className="font-caption text-caption font-medium text-on-surface-variant">
                    {guide.candidCaption}
                  </span>
                </figcaption>
              )}
            </figure>
            <div
              aria-hidden="true"
              className="absolute -left-4 -top-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg"
            >
              <span className="font-headline-sm text-headline-sm">{initialsOf(name)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-space-lg lg:col-span-7 lg:pl-space-md">
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-lg text-label-lg font-semibold uppercase tracking-widest text-secondary">
                {t('eyebrow')}
              </span>
              <h2 className="font-headline-xl text-headline-xl text-primary">
                {t('titleLead')} <br />
                <span className="font-normal italic">{t('titleAccent')}</span>
              </h2>
            </div>
            <p className="font-body-xl text-body-xl font-light leading-relaxed text-on-surface">
              {years ? t('lead', { name, years }) : t('leadNoYears', { name })}
            </p>
            <p className="font-body-lg text-body-lg text-on-surface-variant">{t('body')}</p>
            <ul className="grid grid-cols-1 gap-space-md pt-space-xs md:grid-cols-3">
              {pillars.map(({ key, meta: p, icon }, i) => (
                <Reveal as="li" key={key} delay={i * 0.08} className="flex">
                  <div className="flex w-full flex-col gap-space-xs rounded-xl bg-surface-container-low p-space-md">
                    {icon && <Icon name={icon} className={`text-2xl ${p.tone}`} />}
                    <h3 className="font-headline-sm text-headline-sm text-primary">{tl(`pillars.${key}.title`)}</h3>
                    <p className="font-caption text-caption text-on-surface-variant">{tl(`pillars.${key}.body`)}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
            <div>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-space-xl py-space-sm font-label-lg text-label-lg uppercase tracking-wider text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 coarse:min-h-11"
              >
                <span>{t('cta')}</span>
                <Icon name="north_east" className="text-sm" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
