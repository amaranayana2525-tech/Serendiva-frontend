import { getTranslations } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { Skeleton, TextSkeleton } from '@/components/ui/Skeleton'
import { SmartImage } from '@/components/ui/SmartImage'
import { getSettings } from '@/lib/api/public'
import type { Locale, PublicSettings } from '@/lib/api/types'

/** "My Personal Creed": guide portrait, quote, name/title and licence line from the CMS settings. */
export async function ResponsibleCreed({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'responsible.creed' })
  // Hidden by the admin (Page content) → no messages → render nothing.
  if (!t.has('quote')) return null
  let settings: PublicSettings | null
  try {
    settings = await getSettings(locale)
  } catch {
    settings = null
  }
  const guide = settings?.guide
  const portrait = settings ? (settings.pageImages['guide-portrait-cream-linen'] ?? settings.guide.portrait) : null

  return (
    <section aria-labelledby="creed-title" className="w-full bg-surface py-space-3xl">
      <Container>
        <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-xl shadow-[0_16px_36px_-12px_rgba(43,43,43,0.06)] lg:p-space-3xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-tertiary-fixed-dim/20 blur-3xl"
          />
          <div className="relative z-10 grid grid-cols-1 items-center gap-gutter-lg lg:grid-cols-12">
            <div className="flex justify-center lg:col-span-4 lg:justify-start">
              <div className="relative">
                <div className="relative h-48 w-48 overflow-hidden rounded-full shadow-[0_16px_36px_-12px_rgba(43,43,43,0.12)] lg:h-56 lg:w-56">
                  <SmartImage
                    image={portrait}
                    fill
                    sizes="(min-width: 1024px) 224px, 192px"
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 right-2 rounded-full bg-primary p-2 text-on-primary shadow-md">
                  <Icon name="format_quote" className="text-[20px]" />
                </div>
              </div>
            </div>
            <figure className="flex flex-col gap-space-md lg:col-span-8">
              <span
                id="creed-title"
                className="font-label-md text-label-md font-semibold uppercase tracking-[0.2em] text-secondary"
              >
                {t('eyebrow')}
              </span>
              <blockquote className="font-headline-lg text-headline-lg-mobile italic leading-snug text-primary lg:text-headline-lg">
                <p>{t('quote')}</p>
              </blockquote>
              {guide && (
                <figcaption className="mt-space-xs flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-primary">{guide.name}</span>
                  <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                    {guide.title}
                  </span>
                </figcaption>
              )}
              {guide && (
                <p className="max-w-xl font-body-md text-body-md text-on-surface-variant">
                  {t('bio', { years: guide.yearsGuiding })}
                </p>
              )}
            </figure>
          </div>
        </div>
      </Container>
    </section>
  )
}

export function ResponsibleCreedSkeleton() {
  return (
    <div aria-hidden="true" className="w-full py-space-3xl">
      <Container>
        <div className="grid grid-cols-1 items-center gap-gutter-lg rounded-xl bg-surface-container-low p-space-xl lg:grid-cols-12 lg:p-space-3xl">
          <Skeleton className="mx-auto h-48 w-48 rounded-full lg:col-span-4 lg:mx-0 lg:h-56 lg:w-56" />
          <div className="flex flex-col gap-space-md lg:col-span-8">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-10 w-full" />
            <TextSkeleton lines={2} />
          </div>
        </div>
      </Container>
    </div>
  )
}
