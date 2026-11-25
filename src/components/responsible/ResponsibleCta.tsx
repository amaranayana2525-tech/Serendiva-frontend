import { useTranslations } from 'next-intl'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { Link } from '@/i18n/navigation'
import { contactHref } from '@/lib/prefill'

const button =
  'inline-flex w-full items-center justify-center gap-space-xs rounded-xl px-space-xl py-space-md text-center font-label-lg text-label-lg uppercase tracking-widest transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-auto'

/** "A Gentler Way to Wander" warm-sand closing banner (inquiry + WhatsApp). */
export function ResponsibleCta() {
  const t = useTranslations('responsible.cta')
  const tn = useTranslations('common.nav')
  return (
    <section
      aria-labelledby="responsible-cta-title"
      className="w-full bg-[#f7f1e6] py-space-3xl shadow-[0_-1px_12px_rgba(0,0,0,0.02)]"
    >
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-space-md text-center">
          <span className="font-label-md text-label-md font-semibold uppercase tracking-[0.22em] text-secondary">
            {t('eyebrow')}
          </span>
          <h2 id="responsible-cta-title" className="font-headline-xl text-headline-xl tracking-tight text-primary">
            {t('title')}
          </h2>
          <p className="max-w-xl font-body-lg text-body-lg font-light leading-relaxed text-on-surface-variant">
            {t('body')}
          </p>
          <div className="mt-space-md flex w-full flex-col items-center gap-space-md sm:w-auto sm:flex-row">
            <Link
              href={contactHref({ source: 'responsible-travel' })}
              className={`${button} bg-secondary text-on-secondary shadow-[0_16px_36px_-12px_rgba(156,68,30,0.28)] hover:bg-[#863715]`}
            >
              <Icon name="calendar_month" className="text-[18px]" />
              <span>{t('plan')}</span>
            </Link>
            <WhatsAppLink
              page={tn('responsible')}
              className={`${button} bg-tertiary-container text-on-tertiary shadow-[0_16px_36px_-12px_rgba(44,78,35,0.2)] hover:bg-tertiary`}
            >
              <Icon name="chat" className="text-[18px]" />
              <span>{t('whatsapp')}</span>
            </WhatsAppLink>
          </div>
          <ul className="mt-space-sm flex flex-col items-center gap-space-xs font-caption text-caption text-on-surface-variant sm:flex-row sm:gap-space-md">
            <li className="flex items-center gap-1">
              <Icon name="check" className="text-[14px] text-tertiary" />
              {t('checkOne')}
            </li>
            <li aria-hidden="true" className="hidden opacity-30 sm:block">
              •
            </li>
            <li className="flex items-center gap-1">
              <Icon name="check" className="text-[14px] text-tertiary" />
              {t('checkTwo')}
            </li>
          </ul>
        </div>
      </Container>
    </section>
  )
}
