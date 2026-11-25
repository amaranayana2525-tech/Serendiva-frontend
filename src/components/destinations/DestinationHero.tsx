import { useTranslations } from 'next-intl'
import type { DestinationDetail } from '@/lib/api/types'
import { SmartImage } from '@/components/ui/SmartImage'
import { DestinationBreadcrumbs, type DestinationCrumb } from './DestinationBreadcrumbs'
import { HeroGallery } from './HeroGallery'

export interface DestinationHeroProps {
  destination: DestinationDetail
  /** First description paragraph (plain text). */
  lead: string
}

/** Full-bleed photo hero under the header: breadcrumb, elevation pill, H1, lead, thumbnail strip. */
export function DestinationHero({ destination: d, lead }: DestinationHeroProps) {
  const t = useTranslations('destinationDetail.hero')
  const tc = useTranslations('common.nav')
  const crumbs: DestinationCrumb[] = [
    { label: tc('home'), href: '/' },
    { label: tc('destinations'), href: '/destinations' },
    ...(d.region
      ? [{ label: d.region.name, href: { pathname: '/destinations', query: { region: d.region.slug } } }]
      : []),
    { label: d.name },
  ]
  const pill =
    d.metaLabel ??
    (d.region && d.elevation !== null
      ? t('elevation', { region: d.region.name, elevation: d.elevation.toLocaleString('en-US') })
      : d.region?.name)

  return (
    <section className="relative -mt-20 w-full overflow-hidden bg-primary">
      <div className="absolute inset-0 z-0">
        <div className="relative h-full w-full scale-105 transform duration-1000 motion-safe:transition-transform">
          <SmartImage
            image={d.cover}
            alt=""
            fill
            priority
            sizes="100vw"
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/65 to-primary/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[720px] max-w-[1440px] flex-col justify-end px-margin pb-28 pt-36 md:px-margin-md md:pb-36 md:pt-44 lg:px-margin-lg">
        <DestinationBreadcrumbs variant="hero" items={crumbs} className="mb-space-md" />

        {pill && (
          <div className="mb-space-md inline-flex w-fit items-center gap-space-sm rounded-full bg-surface-container/20 px-space-md py-1.5 shadow-sm backdrop-blur-md">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-secondary-container motion-safe:animate-pulse"
            />
            <span className="font-label-md text-label-md uppercase tracking-widest text-surface">{pill}</span>
          </div>
        )}

        <div className="max-w-4xl">
          <h1 className="mb-space-md font-display-lg font-headline-xl text-display-lg-mobile leading-tight tracking-tight text-on-primary md:text-display-lg">
            {d.headline || d.name}
          </h1>
          <p className="max-w-3xl font-body-xl text-body-lg font-light leading-relaxed text-surface-container-low md:text-body-xl">
            {lead}
          </p>
        </div>

        <HeroGallery name={d.name} items={d.gallery} />
      </div>
    </section>
  )
}
