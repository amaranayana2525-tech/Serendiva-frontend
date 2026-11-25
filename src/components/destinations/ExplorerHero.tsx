import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { DestinationBreadcrumbs } from './DestinationBreadcrumbs'

export interface ExplorerHeroProps {
  /** Operator licence from the CMS settings (null when settings are unavailable). */
  license: string | null
  /** The island map card (rendered inside its own <Suspense>). */
  children: ReactNode
}

/** /destinations hero: breadcrumb + kicker, H1 + intro, accredited-host card, then the map canvas. */
export function ExplorerHero({ license, children }: ExplorerHeroProps) {
  const t = useTranslations('destinations.hero')
  const tc = useTranslations('common.nav')
  return (
    <section className="relative w-full overflow-hidden bg-surface-container-low px-margin pb-space-3xl pt-space-xl md:px-margin-md lg:px-margin-lg">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-10 h-96 w-96 rounded-full bg-primary-fixed/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-1/2 h-80 w-80 rounded-full bg-secondary-fixed/20 blur-3xl"
      />
      <div className="mx-auto flex max-w-[1440px] flex-col gap-space-xl">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <DestinationBreadcrumbs
            variant="slash"
            items={[{ label: tc('home'), href: '/' }, { label: tc('destinations') }]}
          />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary-container/10 px-space-md py-1 font-label-md text-label-md uppercase tracking-widest text-tertiary">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-tertiary" />
            {t('kicker')}
          </span>
        </div>

        <div className="grid grid-cols-1 items-end gap-gutter-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-md lg:col-span-8">
            <h1 className="font-headline-xl text-headline-xl font-semibold tracking-tight text-primary lg:text-display-lg">
              {t('title')}
            </h1>
            <p className="max-w-3xl font-body-xl text-body-xl text-on-surface-variant">{t('intro')}</p>
          </div>
          <div className="flex flex-col items-start justify-end gap-space-sm sm:flex-row lg:col-span-4 lg:flex-col lg:items-end">
            <div className="max-w-sm rounded-xl bg-surface p-space-md shadow-sm">
              <div className="flex items-center gap-space-sm">
                <Icon name="shield_person" filled className="text-secondary" />
                <span className="font-label-md text-label-md font-semibold uppercase tracking-wider text-primary">
                  {t('hostTitle')}
                </span>
              </div>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                {license ? t('hostBody', { license }) : t('hostBodyNoLicense')}
              </p>
            </div>
          </div>
        </div>

        {children}
      </div>
    </section>
  )
}
