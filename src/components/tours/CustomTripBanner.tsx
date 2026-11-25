import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { contactHref } from '@/lib/prefill'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { Icon } from '@/components/ui/Icon'

/** Stitch "MID-PAGE TAILOR-MADE BESPOKE BANNER": custom route pitch + inquiry / WhatsApp CTAs. */
export function CustomTripBanner() {
  const t = useTranslations('tours.custom')
  return (
    <section className="mx-auto max-w-[1440px] px-margin py-space-xl md:px-margin-md lg:px-margin-lg">
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-xl shadow-lg md:p-space-2xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-primary-fixed/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-secondary-fixed/20 blur-3xl"
        />
        <div className="relative z-10 grid grid-cols-1 items-center gap-gutter lg:grid-cols-12">
          <div className="flex flex-col gap-space-md lg:col-span-8">
            <div className="flex items-center gap-space-sm text-secondary">
              <Icon name="design_services" />
              <span className="font-label-md text-label-md font-semibold uppercase tracking-widest">
                {t('eyebrow')}
              </span>
            </div>
            <h2 className="font-headline-xl text-headline-xl font-normal leading-tight text-primary">{t('title')}</h2>
            <p className="max-w-2xl font-body-lg text-body-lg text-on-surface-variant">{t('text')}</p>
          </div>
          <div className="flex flex-col items-start gap-space-md lg:col-span-4 lg:items-end">
            <Link
              href={contactHref({ source: 'tours-custom-trip' })}
              className="inline-flex w-full items-center justify-center gap-space-sm rounded-lg bg-secondary px-space-xl py-3.5 font-label-lg text-label-lg font-semibold uppercase tracking-wider text-on-secondary shadow-lg transition-all hover:bg-on-secondary-fixed-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:w-auto"
            >
              <Icon name="edit_note" className="text-lg" />
              <span>{t('build')}</span>
            </Link>
            <WhatsAppLink className="inline-flex w-full items-center justify-center gap-space-sm rounded-lg bg-surface px-space-xl py-3.5 font-label-lg text-label-lg font-semibold uppercase tracking-wider text-primary shadow-sm transition-all hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:w-auto">
              <Icon name="chat" className="text-lg text-tertiary" />
              <span>{t('whatsapp')}</span>
            </WhatsAppLink>
          </div>
        </div>
      </div>
    </section>
  )
}
