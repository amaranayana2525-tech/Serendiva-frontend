import { useTranslations } from 'next-intl'
import type { PublicSettings } from '@/lib/api/types'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'
import { guideName, pageImage, shortLicence } from './guide'
import { PageBreadcrumb } from './PageBreadcrumb'

interface AboutHeroProps {
  settings: PublicSettings | null
}

/** Stitch "Top Breadcrumb & Hero Area": asymmetric split, portrait with floating seal, trust metrics bar. */
export function AboutHero({ settings }: AboutHeroProps) {
  const t = useTranslations('about')
  const tc = useTranslations('common')
  const guide = settings?.guide
  const name = guideName(settings)
  const years = guide?.yearsGuiding ?? 0
  const licence = guide?.licenseNumber
  const languages = guide?.languages ?? []
  const summary = settings?.reviewSummary
  const portrait = pageImage(settings, 'guide-portrait-sigiriya', guide?.portrait)
  const number = settings?.contact.whatsappDisplay

  const metrics = [
    {
      icon: 'history_edu',
      value: years > 0 ? t('metrics.years', { years }) : null,
      caption: t('metrics.yearsCaption'),
    },
    { icon: 'verified', value: licence ? `#${shortLicence(licence)}` : null, caption: t('metrics.licenceCaption') },
    {
      icon: 'translate',
      value: languages.length > 0 ? t('metrics.languages', { count: languages.length }) : null,
      caption: languages.join(' • '),
    },
    summary && summary.count > 0
      ? {
          icon: 'hotel_class',
          value: t('metrics.rating', { rating: summary.average.toFixed(1) }),
          caption: t('metrics.ratingCaption', { count: summary.count }),
          accent: true,
        }
      : {
          icon: 'hotel_class',
          value: t('metrics.ratingFallback'),
          caption: t('metrics.ratingFallbackCaption'),
          accent: true,
        },
  ].filter((m) => m.value)

  return (
    <section className="relative w-full overflow-hidden bg-surface-container-low">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent"
      />
      <div className="relative mx-auto max-w-[1440px] px-margin pb-space-3xl pt-space-xl md:px-margin-md lg:px-margin-lg">
        <PageBreadcrumb
          className="mb-space-lg text-on-surface-variant"
          linkClassName="font-label-md text-label-md uppercase tracking-widest"
          currentClassName="font-label-md text-label-md uppercase tracking-widest"
          items={[
            { label: t('breadcrumb.home'), href: '/' },
            { label: name ? t('breadcrumb.current', { name }) : tc('nav.about') },
          ]}
        />

        <div className="grid grid-cols-1 items-center gap-gutter-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-md lg:col-span-7">
            <div className="inline-flex w-fit items-center gap-space-xs rounded-full bg-tertiary/10 px-space-md py-1 text-tertiary">
              <Icon name="spa" className="text-sm" />
              <span className="font-label-md text-label-md font-semibold uppercase tracking-wider">
                {t('hero.eyebrow')}
              </span>
            </div>
            <h1 className="font-display-lg text-display-lg-mobile tracking-tight text-primary lg:text-display-lg">
              {t('hero.title')}
            </h1>
            <p className="max-w-2xl font-body-xl text-body-xl text-on-surface-variant">
              {name
                ? t.rich('hero.intro', {
                    name,
                    strong: (chunks) => <strong className="font-medium text-on-surface">{chunks}</strong>,
                  })
                : t('hero.introNoName')}
            </p>

            <div className="flex flex-wrap items-center gap-space-md pt-space-sm">
              <a
                href="#biography"
                className="flex items-center gap-space-xs rounded-lg bg-primary px-space-xl py-3.5 font-label-lg text-label-lg text-on-primary shadow-[0_4px_16px_rgba(0,52,65,0.2)] transition-all hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span>{t('hero.readStory')}</span>
                <Icon name="arrow_downward" className="text-sm" />
              </a>
              <WhatsAppLink
                page={tc('nav.about')}
                className="flex items-center gap-space-xs rounded-lg bg-surface-container px-space-lg py-3.5 font-label-lg text-label-lg text-primary transition-all hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Icon name="chat" className="text-base text-tertiary" />
                <span>{number ? t('hero.whatsapp', { number }) : t('hero.whatsappNoNumber')}</span>
              </WhatsAppLink>
            </div>

            {licence && (
              <div className="mt-space-sm flex items-center gap-space-sm text-on-surface-variant">
                <Icon name="verified_user" className="shrink-0 text-base text-secondary" />
                <span className="font-label-md text-label-md uppercase tracking-wider">
                  {t('hero.licence', { title: guide?.title ?? '', licence })}
                </span>
              </div>
            )}
          </div>

          <div className="relative lg:col-span-5">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-surface-container-highest shadow-2xl">
              <SmartImage
                image={portrait}
                fill
                priority
                sizes="(min-width: 1440px) 520px, (min-width: 1024px) 38vw, 100vw"
                className="object-cover object-top"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent"
              />
              <div className="absolute bottom-space-md left-space-md right-space-md flex items-center justify-between gap-space-sm rounded-lg bg-surface/95 p-space-md shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-space-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tertiary/15 text-tertiary">
                    <Icon name="workspace_premium" className="text-xl" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-bold uppercase tracking-wider text-primary">
                      {t('hero.sealTitle')}
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant">{t('hero.sealSubtitle')}</span>
                  </div>
                </div>
                {years > 0 && (
                  <span className="shrink-0 font-headline-sm text-headline-sm font-bold text-secondary">
                    {t('hero.sealYears', { years })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {metrics.length > 0 && (
          <ul
            aria-label={t('metrics.label')}
            className="mt-space-2xl grid grid-cols-1 gap-gutter rounded-xl bg-surface p-space-lg shadow-md sm:grid-cols-2 lg:grid-cols-4"
          >
            {metrics.map((m) => (
              <li key={m.icon} className="flex items-center gap-space-md">
                <div
                  className={
                    m.accent
                      ? 'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container text-secondary'
                      : 'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary'
                  }
                >
                  <Icon name={m.icon} className="text-2xl" />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span
                    className={
                      m.accent
                        ? 'font-headline-sm text-headline-sm font-bold text-secondary'
                        : 'font-headline-sm text-headline-sm font-bold text-primary'
                    }
                  >
                    {m.value}
                  </span>
                  <span className="truncate font-caption text-caption text-on-surface-variant" title={m.caption}>
                    {m.caption}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
