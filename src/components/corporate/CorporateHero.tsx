import { useTranslations } from 'next-intl'
import type { ApiImage } from '@/lib/api/types'
import { StitchBreadcrumbs } from '@/components/contact/StitchBreadcrumbs'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'
import { listEntries, loose } from '@/lib/page-content/lists'

const STATS = [{ key: 'delegations' }, { key: 'punctuality' }, { key: 'clients' }] as const

/**
 * Teal corporate hero (Stitch "editorial asymmetry & dual bleed"): breadcrumb, pill, h1, dual CTAs, track-record
 * strip and the boardroom photo (settings.pageImages['corp-hero-boardroom-tea-estate']) with a floating card.
 * It slides under the fixed header (-mt-20 pt-36) exactly like the export.
 */
export function CorporateHero({ image }: { image: ApiImage | null }) {
  const t = useTranslations('corporate')
  const tl = loose(t)
  const stats = listEntries(tl.raw('hero.stats'), STATS)
  return (
    <section
      aria-labelledby="corporate-title"
      className="relative -mt-20 w-full overflow-hidden bg-primary-container py-space-3xl pt-36 text-on-primary"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-15 mix-blend-screen [background-image:radial-gradient(#9acee1_1px,transparent_1px)] [background-size:24px_24px]"
      />
      <div className="relative z-10 mx-auto max-w-[1440px] px-margin md:px-margin-md lg:px-margin-lg">
        <StitchBreadcrumbs
          separator="chevron"
          items={[{ label: t('breadcrumb.home'), href: '/' }, { label: t('breadcrumb.current') }]}
          className="mb-space-md font-caption text-caption uppercase tracking-wider text-on-primary-container"
          linkClassName="hover:text-on-primary"
          currentClassName="text-primary-fixed"
        />
        <div className="grid grid-cols-1 items-center gap-gutter-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-md lg:col-span-7">
            <div className="inline-flex w-fit items-center gap-space-xs rounded-full bg-primary/40 px-space-md py-space-xs backdrop-blur-md">
              <Icon name="verified_user" className="text-sm text-tertiary-fixed" />
              <span className="font-label-md text-label-md uppercase tracking-widest text-primary-fixed">
                {t('hero.pill')}
              </span>
            </div>
            <h1
              id="corporate-title"
              className="font-headline-xl text-headline-xl tracking-tight text-surface md:text-display-lg"
            >
              {t('hero.title')}
            </h1>
            <p className="max-w-2xl font-body-xl text-body-xl leading-relaxed text-on-primary-container">
              {t('hero.intro')}
            </p>
            <div className="flex flex-wrap items-center gap-space-md pt-space-sm">
              <a
                href="#rfp-section"
                className="inline-flex transform items-center justify-center gap-space-sm rounded-xl bg-secondary px-space-xl py-space-md font-label-lg text-label-lg text-on-secondary shadow-xl transition-all hover:-translate-y-0.5 hover:bg-on-secondary-fixed-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-primary-container"
              >
                <span>{t('hero.ctaProposal')}</span>
                <Icon name="arrow_forward" className="text-sm" />
              </a>
              <WhatsAppLink
                corporate
                className="inline-flex items-center justify-center gap-space-sm rounded-xl bg-surface-container-lowest/10 px-space-xl py-space-md font-label-lg text-label-lg text-on-primary backdrop-blur-md transition-all hover:bg-surface-container-lowest/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface"
              >
                <Icon name="description" className="text-sm" />
                <span>{t('hero.ctaDeck')}</span>
              </WhatsAppLink>
            </div>
            <ul
              aria-label={t('hero.statsLabel')}
              className="mt-space-lg grid grid-cols-1 gap-space-md rounded-2xl bg-primary/30 p-space-lg pt-space-xl backdrop-blur-sm sm:grid-cols-3"
            >
              {stats.map(({ key }) => (
                <li key={key} className="flex flex-col">
                  <span className="font-headline-lg text-headline-lg font-bold text-secondary-fixed">
                    {tl(`hero.stats.${key}.value`)}
                  </span>
                  <span className="font-caption text-caption uppercase tracking-wider text-on-primary-container">
                    {tl(`hero.stats.${key}.label`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative lg:col-span-5">
            <div className="relative h-[520px] w-full overflow-hidden rounded-2xl shadow-2xl">
              <SmartImage
                image={image}
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent opacity-80"
              />
              <div className="absolute bottom-space-lg left-space-lg right-space-lg rounded-xl bg-surface/95 p-space-md text-on-surface shadow-xl backdrop-blur-md">
                <div className="mb-space-xs flex items-center gap-space-sm">
                  <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-tertiary" />
                  <span className="font-label-md text-label-md uppercase tracking-wider text-tertiary">
                    {t('hero.card.status')}
                  </span>
                </div>
                <p className="mb-1 font-headline-sm text-headline-sm text-primary">{t('hero.card.title')}</p>
                <p className="font-caption text-caption text-on-surface-variant">{t('hero.card.body')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
