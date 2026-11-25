import { useTranslations } from 'next-intl'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { Link } from '@/i18n/navigation'
import { contactHref } from '@/lib/prefill'

const buttonBase =
  'flex items-center justify-center gap-space-xs rounded-xl px-space-lg py-space-md text-center font-label-lg text-label-lg uppercase tracking-wider shadow-md transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-high'

/** "Have Specific Queries Unaddressed in This Digest?" consultation split (WhatsApp + inquiry). */
export function GuideCta() {
  const t = useTranslations('travelGuide.cta')
  const tn = useTranslations('common.nav')
  return (
    <section aria-labelledby="guide-cta-title" className="mt-space-2xl w-full bg-surface-container-high py-space-3xl">
      <Container>
        <div className="grid grid-cols-1 items-center gap-gutter-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-sm lg:col-span-7">
            <div className="flex items-center gap-space-xs font-label-md text-label-md uppercase tracking-[0.2em] text-secondary">
              <Icon name="support_agent" className="text-[18px]" />
              <span>{t('eyebrow')}</span>
            </div>
            <h2
              id="guide-cta-title"
              className="font-headline-xl text-headline-xl font-medium tracking-tight text-primary"
            >
              {t('title')}
            </h2>
            <p className="max-w-xl font-body-xl text-body-xl font-light text-on-surface-variant">{t('body')}</p>
          </div>
          <div className="flex flex-col justify-end gap-space-md sm:flex-row lg:col-span-5">
            <WhatsAppLink
              page={tn('travelGuide')}
              className={`${buttonBase} bg-tertiary-container text-on-tertiary hover:bg-tertiary`}
            >
              <Icon name="forum" className="text-[20px]" />
              {t('whatsapp')}
            </WhatsAppLink>
            <Link
              href={contactHref({ source: 'travel-guide' })}
              className={`${buttonBase} bg-secondary text-on-secondary hover:bg-[#a64a22]`}
            >
              <Icon name="explore" className="text-[20px]" />
              {t('plan')}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
