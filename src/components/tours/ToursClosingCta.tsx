import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { ApiImage } from '@/lib/api/types'
import { contactHref } from '@/lib/prefill'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'

/**
 * Stitch "FINAL INSPIRING CTA BANNER" of /tours. Like the export, the section sits in the page's flex column with
 * `mx-auto` and no width, so the card shrinks to its `max-w-2xl` content (≈752px) on desktop.
 * Photo: CMS slot `tours-cta-tea-valley-mist`.
 */
export function ToursClosingCta({ image }: { image: ApiImage | null }) {
  const t = useTranslations('tours.cta')
  return (
    <section
      aria-labelledby="tours-cta-title"
      className="mx-auto max-w-[1440px] px-margin pb-space-3xl md:px-margin-md lg:px-margin-lg"
    >
      <div className="relative overflow-hidden rounded-xl shadow-2xl">
        <SmartImage image={image} alt="" fill sizes="(min-width: 768px) 760px, 100vw" className="object-cover" />
        <div className="flex min-h-[420px] w-full items-center justify-center p-space-xl">
          <div className="absolute inset-0 bg-primary/75 backdrop-blur-[2px]" />
          <div className="relative z-10 flex max-w-2xl flex-col items-center gap-space-md text-center">
            <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-secondary-fixed">
              {t('eyebrow')}
            </span>
            <h2
              id="tours-cta-title"
              className="font-display-lg text-display-lg text-on-primary max-[389px]:text-display-lg-mobile"
            >
              {t('title')}
            </h2>
            <p className="max-w-lg font-body-lg text-body-lg font-light text-surface-container-low">{t('text')}</p>
            <div className="mt-space-sm flex w-full flex-col items-center gap-space-md sm:w-auto sm:flex-row">
              <Link
                href={contactHref({ source: 'tours-cta' })}
                className="inline-flex w-full items-center justify-center rounded-lg bg-secondary px-space-xl py-space-sm text-center font-label-lg text-label-lg font-semibold uppercase tracking-wider text-on-secondary shadow-lg transition-all hover:bg-on-secondary-fixed-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-primary coarse:min-h-11 sm:w-auto"
              >
                {t('plan')}
              </Link>
              <WhatsAppLink className="flex w-full items-center justify-center gap-2 rounded-lg bg-surface-container-lowest/15 px-space-xl py-space-sm font-label-lg text-label-lg font-semibold uppercase tracking-wider text-on-primary backdrop-blur-md transition-all hover:bg-surface-container-lowest/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-primary coarse:min-h-11 sm:w-auto">
                <Icon name="chat" className="text-sm" />
                <span>{t('whatsapp')}</span>
              </WhatsAppLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
