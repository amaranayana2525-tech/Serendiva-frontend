import { useTranslations } from 'next-intl'
import type { PublicSettings } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { SmartImage } from '@/components/ui/SmartImage'
import { guideName, pageImage } from './guide'

const MOMENTS = [
  { key: 'zoology', slot: 'about-field-zoology-yala', tone: 'text-tertiary', offset: false },
  { key: 'architecture', slot: 'about-living-architecture-galle', tone: 'text-secondary', offset: true },
  { key: 'agrarian', slot: 'about-agrarian-heritage-tea', tone: 'text-primary', offset: false },
] as const

/** Stitch "Editorial Narrative & Candid Gallery": story with drop cap + pull quote, three candid moments. */
export function AboutStory({ settings }: { settings: PublicSettings | null }) {
  const t = useTranslations('about.story')
  const name = guideName(settings)
  return (
    <section id="biography" className="w-full scroll-mt-20 bg-surface py-space-3xl">
      <div className="mx-auto max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
        <div className="grid grid-cols-1 items-start gap-gutter-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-lg lg:col-span-7">
            <div className="flex items-center gap-space-xs font-label-md text-label-md font-semibold uppercase tracking-widest text-secondary">
              <span>{t('eyebrow')}</span>
              <span aria-hidden="true">—</span>
              <span>{t('chapter')}</span>
            </div>
            <h2 className="font-headline-xl text-headline-xl text-primary">{t('title')}</h2>
            <div className="flex flex-col gap-space-md font-body-lg text-body-lg text-on-surface-variant">
              <p className="first-letter:float-left first-letter:mr-space-sm first-letter:font-headline-xl first-letter:text-6xl first-letter:font-bold first-letter:leading-none first-letter:text-primary">
                {t('p1')}
              </p>
              <p>{t('p2')}</p>
              <p>{t('p3')}</p>
            </div>

            {t.has('quote') && (
              <figure className="relative my-space-md overflow-hidden rounded-xl bg-surface-container-low p-space-xl shadow-sm">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-2 -top-4 select-none text-primary/10"
                >
                  <Icon name="format_quote" className="text-8xl" />
                </div>
                <blockquote className="relative z-10 font-headline-md text-headline-md italic leading-relaxed text-primary">
                  {t('quote')}
                </blockquote>
                {name && (
                  <figcaption className="relative z-10 mt-space-md flex items-center gap-space-sm">
                    <span aria-hidden="true" className="h-0.5 w-8 bg-secondary" />
                    <span className="font-label-lg text-label-lg font-semibold uppercase tracking-wider text-primary">
                      {name}
                    </span>
                  </figcaption>
                )}
              </figure>
            )}

            <p className="font-body-lg text-body-lg text-on-surface-variant">{t('p4')}</p>
          </div>

          <div className="flex flex-col gap-space-lg lg:col-span-5">
            {MOMENTS.map((moment, index) => (
              <Reveal key={moment.key} delay={index * 0.08}>
                <figure
                  className={cn(
                    'group relative overflow-hidden rounded-xl bg-surface-container shadow-lg',
                    moment.offset && '-mt-4 lg:ml-6',
                  )}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <SmartImage
                      image={pageImage(settings, moment.slot)}
                      fill
                      sizes="(min-width: 1440px) 520px, (min-width: 1024px) 38vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <figcaption className="bg-surface-container-low p-space-md">
                    <span
                      className={cn(
                        'block font-label-md text-label-md font-semibold uppercase tracking-wider',
                        moment.tone,
                      )}
                    >
                      {t(`moments.${moment.key}.label`)}
                    </span>
                    <span className="mt-1 block font-body-md text-body-md text-on-surface-variant">
                      {t(`moments.${moment.key}.text`)}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
