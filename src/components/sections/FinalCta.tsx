import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { ApiImage, ContactSettings } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { WhatsAppLink } from '@/components/layout/WhatsAppLink'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import { SmartImage } from '@/components/ui/SmartImage'

export interface FinalCtaProps {
  /** settings.contact — shows the WhatsApp number and response time. */
  contact?: Pick<ContactSettings, 'whatsappDisplay' | 'phone' | 'responseTime'> | null
  /** Background photo (teal 85% scrim on top). */
  image?: ApiImage | null
  eyebrow?: ReactNode
  title?: ReactNode
  /** Replaces the default body (WhatsApp line + response time). */
  body?: ReactNode
  /** Where "Send Bespoke Inquiry" points (default /contact). */
  inquiryHref?: string
  className?: string
}

/**
 * Home final CTA banner ("Let’s Plan Your Unforgettable Sri Lanka Journey."). Fixes the Stitch stacking bug
 * (the -z-10 background now stays inside the section thanks to `isolate`).
 */
export function FinalCta({ contact, image, eyebrow, title, body, inquiryHref = '/contact', className }: FinalCtaProps) {
  const t = useTranslations('common.finalCta')
  const number = contact?.whatsappDisplay || contact?.phone
  return (
    <section className={cn('relative isolate w-full overflow-hidden py-space-3xl', className)}>
      <div className="absolute inset-0 -z-10 h-full w-full bg-primary">
        {image && <SmartImage image={image} alt="" fill sizes="100vw" className="object-cover" />}
        <div className="absolute inset-0 bg-primary/85 backdrop-blur-[2px]" />
      </div>
      <Container className="flex flex-col items-center gap-space-lg text-center text-surface">
        <div className="inline-flex items-center gap-2 rounded-full bg-surface/20 px-space-md py-1 font-label-md text-label-md uppercase tracking-widest text-secondary-fixed">
          <span>{eyebrow ?? t('eyebrow')}</span>
        </div>
        <h2 className="max-w-3xl font-display-lg text-display-lg-mobile md:text-display-lg">{title ?? t('title')}</h2>
        <p className="max-w-2xl font-body-xl text-body-xl font-light text-surface/90">
          {body ?? (
            <>
              {number && (
                <>
                  {t('whatsappLine')} <strong className="font-semibold text-secondary-fixed">{number}</strong>
                  <br />
                </>
              )}
              {t('responseLine', { time: contact?.responseTime || t('responseDefault') })}
            </>
          )}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-space-md pt-space-xs">
          <WhatsAppLink className="inline-flex transform items-center gap-2 rounded-xl bg-tertiary-container px-space-xl py-4 font-label-lg text-label-lg uppercase tracking-wider text-on-tertiary shadow-xl transition-all hover:scale-105 hover:bg-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-primary">
            <Icon name="chat" className="text-[20px]" />
            <span>{t('whatsapp')}</span>
          </WhatsAppLink>
          <Link
            href={inquiryHref}
            className="inline-flex items-center gap-2 rounded-xl bg-secondary px-space-xl py-4 font-label-lg text-label-lg uppercase tracking-wider text-on-secondary shadow-xl transition-all hover:bg-on-secondary-fixed-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            <Icon name="calendar_today" className="text-[20px]" />
            <span>{t('inquiry')}</span>
          </Link>
        </div>
      </Container>
    </section>
  )
}
