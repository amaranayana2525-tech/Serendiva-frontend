import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { PublicSettings } from '@/lib/api/types'
import { contactHref } from '@/lib/prefill'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { Icon } from '@/components/ui/Icon'
import { guideName } from './guide'

/** Stitch "Warm Personal Call to Action (Closing Section)". */
export function AboutCta({ settings }: { settings: PublicSettings | null }) {
  const t = useTranslations('about.cta')
  const tc = useTranslations('common')
  const name = guideName(settings).split(' ')[0] || tc('header.meetGuide')
  const number = settings?.contact.whatsappDisplay
  const year = new Date().getFullYear()
  return (
    <section className="relative w-full overflow-hidden bg-primary py-space-3xl text-on-primary">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary-container opacity-50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-secondary/20 opacity-50 blur-3xl"
      />
      <div className="relative z-10 mx-auto flex max-w-[1440px] flex-col items-center px-margin text-center md:px-margin-md lg:px-margin-lg">
        <div className="mb-space-md flex h-16 w-16 items-center justify-center rounded-full bg-surface/10">
          <Icon name="handshake" className="text-3xl text-secondary-fixed" />
        </div>
        <span className="mb-space-xs font-label-lg text-label-lg font-semibold uppercase tracking-widest text-secondary-fixed">
          {t('eyebrow')}
        </span>
        <h2 className="mb-space-md max-w-3xl font-display-lg text-display-lg-mobile lg:text-display-lg">
          {t('title')}
        </h2>
        <p className="mb-space-xl max-w-2xl font-body-xl text-body-xl text-on-primary-container">{t('body')}</p>
        <div className="flex w-full flex-col items-center gap-space-md sm:w-auto sm:flex-row">
          <Link
            href={contactHref({ source: 'about' })}
            className="flex w-full items-center justify-center gap-space-xs rounded-lg bg-secondary px-space-2xl py-4 font-label-lg text-label-lg font-semibold text-on-secondary shadow-[0_4px_20px_rgba(156,68,30,0.35)] transition-all hover:bg-on-secondary-fixed-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:w-auto"
          >
            <span>{t('plan')}</span>
            <Icon name="arrow_forward" className="text-sm" />
          </Link>
          <WhatsAppLink
            page={tc('nav.about')}
            className="flex w-full items-center justify-center gap-space-xs rounded-lg bg-surface/10 px-space-xl py-4 font-label-lg text-label-lg text-on-primary transition-all hover:bg-surface/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:w-auto"
          >
            <Icon name="chat" className="text-lg text-tertiary-fixed" />
            <span>{number ? t('whatsapp', { name, number }) : t('whatsappNoNumber', { name })}</span>
          </WhatsAppLink>
        </div>
        <ul className="mt-space-xl flex flex-wrap items-center justify-center gap-space-lg font-caption text-caption text-on-primary-container">
          <li className="flex items-center gap-1">
            <Icon name="timer" className="text-xs" />
            {t('response')}
          </li>
          <li className="flex items-center gap-1">
            <Icon name="shield" className="text-xs" />
            {t('noAgents')}
          </li>
          <li className="flex items-center gap-1">
            <Icon name="event_available" className="text-xs" />
            {t('season', { year: String(year), nextYear: String(year + 1) })}
          </li>
        </ul>
      </div>
    </section>
  )
}
