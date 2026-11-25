import { useTranslations } from 'next-intl'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { Link } from '@/i18n/navigation'
import { contactHref } from '@/lib/prefill'

const TRUST = [
  { key: 'trustOne', icon: 'verified_user' },
  { key: 'trustTwo', icon: 'hotel' },
  { key: 'trustThree', icon: 'support_agent' },
] as const

/** "From Story to Itinerary" closing CTA of the journal (inquiry + WhatsApp + trust line). */
export function JournalFinalCta() {
  const t = useTranslations('blog.finalCta')
  const tn = useTranslations('common.nav')
  return (
    <section aria-labelledby="journal-cta-title" className="w-full bg-surface-container-high/60 py-space-2xl">
      <Container className="flex flex-col items-center text-center">
        <span className="font-label-md text-label-md font-semibold uppercase tracking-[0.25em] text-secondary">
          {t('eyebrow')}
        </span>
        <h2
          id="journal-cta-title"
          className="mt-space-xs max-w-3xl font-display-lg text-display-lg-mobile text-primary md:text-display-lg"
        >
          {t('title')}
        </h2>
        <p className="mt-space-sm max-w-2xl font-body-xl text-body-xl leading-relaxed text-on-surface-variant">
          {t('body')}
        </p>
        <div className="mt-space-lg flex w-full flex-col items-stretch gap-space-md sm:w-auto sm:flex-row sm:items-center">
          <Link
            href={contactHref({ source: 'blog' })}
            className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-space-xl py-space-md font-label-lg text-label-lg uppercase tracking-widest text-on-secondary shadow-lg transition-all duration-300 hover:scale-105 hover:bg-secondary-container hover:text-on-secondary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95"
          >
            <Icon name="map" className="text-[20px]" />
            <span>{t('plan')}</span>
          </Link>
          <WhatsAppLink
            page={tn('blog')}
            className="flex items-center justify-center gap-2 rounded-xl bg-surface-container-lowest px-space-xl py-space-md font-label-lg text-label-lg uppercase tracking-widest text-primary shadow-md transition-all duration-300 hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Icon name="chat" className="text-[20px] text-tertiary-container" />
            <span>{t('whatsapp')}</span>
          </WhatsAppLink>
        </div>
        <ul className="mt-space-xl flex flex-col flex-wrap items-center justify-center gap-space-md font-caption text-caption text-on-surface-variant sm:flex-row sm:gap-space-lg">
          {TRUST.map((item) => (
            <li key={item.key} className="flex items-center gap-1.5">
              <Icon name={item.icon} className="text-[18px] text-primary" />
              {t(item.key)}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
