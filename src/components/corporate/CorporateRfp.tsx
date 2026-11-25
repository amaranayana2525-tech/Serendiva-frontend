import { useTranslations } from 'next-intl'
import type { ContactSettings } from '@/lib/api/types'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { ClientMessages } from '@/i18n/ClientMessages'
import { CorporateProposalForm } from './CorporateProposalForm'

export interface CorporateRfpProps {
  contact: ContactSettings | null
  guideName: string | null
  exampleYear: number
}

const linkClass =
  'tap-target relative rounded font-semibold text-on-surface transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'

/** "Corporate RFP & Proposal Request": intro + direct logistics desk (settings) + the proposal form. */
export function CorporateRfp({ contact, guideName, exampleYear }: CorporateRfpProps) {
  const t = useTranslations('corporate.rfp')
  return (
    <section
      id="rfp-section"
      aria-labelledby="rfp-title"
      className="w-full scroll-mt-20 bg-surface-container-low py-space-3xl"
    >
      <Container>
        <div className="grid grid-cols-1 gap-gutter-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-lg lg:col-span-4">
            <div>
              <span className="mb-space-xs block font-label-md text-label-md font-bold uppercase tracking-widest text-secondary">
                {t('eyebrow')}
              </span>
              <h2 id="rfp-title" className="font-headline-xl text-headline-xl text-primary">
                {t('title')}
              </h2>
              <p className="mt-space-sm font-body-md text-body-md text-on-surface-variant">{t('intro')}</p>
            </div>

            <div className="flex flex-col gap-space-md rounded-2xl bg-surface p-space-xl shadow-sm">
              <div className="flex items-center gap-space-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon name="support_agent" className="text-2xl" />
                </div>
                <div>
                  <h3 className="block font-headline-sm text-headline-sm text-primary">{t('desk.title')}</h3>
                  <span className="font-caption text-caption text-tertiary">
                    {guideName ? t('desk.subtitle', { name: guideName }) : t('desk.subtitleFallback')}
                  </span>
                </div>
              </div>
              {contact && (
                <ul className="flex flex-col gap-space-xs pt-space-xs font-body-md text-body-md text-on-surface-variant">
                  <li className="flex items-center gap-space-sm">
                    <Icon name="call" className="shrink-0 text-base text-primary" />
                    <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} className={linkClass}>
                      {contact.phone}
                    </a>
                  </li>
                  <li className="flex items-center gap-space-sm">
                    <Icon name="mail" className="shrink-0 text-base text-primary" />
                    <a href={`mailto:${contact.email}`} className={`${linkClass} break-all`}>
                      {contact.email}
                    </a>
                  </li>
                  <li className="flex items-center gap-space-sm">
                    <Icon name="chat" className="shrink-0 text-base text-primary" />
                    <WhatsAppLink corporate className={linkClass}>
                      {t('desk.whatsapp', { number: contact.whatsappDisplay })}
                    </WhatsAppLink>
                  </li>
                </ul>
              )}
              <div className="rounded-xl bg-surface-container p-space-sm font-caption text-caption text-on-surface-variant">
                {t('desk.note')}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-surface p-space-xl shadow-sm md:p-space-2xl lg:col-span-8">
            <ClientMessages namespaces={['corporate']}>
              <CorporateProposalForm exampleYear={exampleYear} />
            </ClientMessages>
          </div>
        </div>
      </Container>
    </section>
  )
}
