import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'

export interface InquirySidebarCardProps {
  /** Defaults to "Tailored Blueprint". */
  eyebrow?: ReactNode
  /** Defaults to "Bespoke Inquiry for This Tour". */
  title?: ReactNode
  intro?: ReactNode
  /** The form (TourInquiryForm / DestinationInquiryForm). */
  children: ReactNode
  /** Show the four reassurance ticks under the form (default true). */
  showChecks?: boolean
  /** Heading level (h2 when the card is a top-level landmark of the aside). */
  headingLevel?: 'h2' | 'h3'
  id?: string
  className?: string
}

/**
 * Sticky teal-header inquiry card from the tour/destination detail pages. The page positions it
 * (`lg:col-span-4 lg:sticky lg:top-36`); the form body is passed as children. `scroll-mt-40` clears the sticky
 * header + tour sub-nav when the site-wide "Inquire" buttons jump to it (#tour-inquiry).
 */
export function InquirySidebarCard({
  eyebrow,
  title,
  intro,
  children,
  showChecks = true,
  headingLevel: Heading = 'h2',
  id,
  className,
}: InquirySidebarCardProps) {
  const t = useTranslations('common.inquiryCard')
  const checks = [t('checks.tailored'), t('checks.response'), t('checks.licensed'), t('checks.noFee')]
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn('scroll-mt-40 overflow-hidden rounded-xl bg-surface-container shadow-xl', className)}
    >
      <div className="bg-primary p-space-md text-on-primary">
        <span className="mb-1 block font-label-md text-label-md uppercase tracking-widest text-primary-fixed">
          {eyebrow ?? t('eyebrow')}
        </span>
        <Heading id={id ? `${id}-title` : undefined} className="font-headline-sm text-headline-sm font-semibold">
          {title ?? t('title')}
        </Heading>
        <p className="mt-1 font-caption text-caption text-primary-fixed-dim">{intro ?? t('intro')}</p>
      </div>
      <div className="flex flex-col gap-space-md p-space-lg">
        {children}
        {showChecks && (
          <ul className="flex flex-col gap-1 pt-space-sm font-caption text-caption text-on-surface-variant">
            {checks.map((c) => (
              <li key={c} className="flex items-start gap-2">
                <Icon name="check" className="shrink-0 text-sm text-tertiary" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
