import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { getFaqs } from '@/lib/api/public'
import type { FaqItem, Locale } from '@/lib/api/types'
import { FaqSection } from '@/components/sections/FaqSection'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

/** Heading + list wrapper shared by the loaded, empty and error states. */
function FaqFrame({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section
      aria-labelledby="booking-faq-title"
      className="mx-auto w-full max-w-4xl px-margin pb-space-3xl md:px-margin-md lg:px-margin-lg"
    >
      <div className="mb-space-xl text-center">
        <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">{eyebrow}</span>
        <h2 id="booking-faq-title" className="mt-space-xs font-headline-xl text-headline-xl text-primary">
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

/** "Bespoke Planning FAQ" — booking-scope FAQs from the API in the Stitch white cards (+ FAQPage JSON-LD). */
export async function BookingFaq({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'contact.faq' })
  let items: FaqItem[] | null
  try {
    items = await getFaqs(locale, { scope: 'booking' })
  } catch {
    items = null
  }
  const body: ReactNode =
    items === null ? (
      <ErrorState />
    ) : items.length === 0 ? (
      <EmptyState icon="help" />
    ) : (
      <FaqSection
        items={items}
        title={null}
        openFirst={false}
        accordionClassNames={{
          itemClassName: 'mb-space-sm rounded-xl bg-surface-container-lowest shadow-sm',
          buttonClassName: 'p-space-lg font-semibold',
          iconClassName: 'text-primary',
          panelClassName: 'mx-space-lg -mt-space-sm border-t border-surface-container px-0 pb-space-lg pt-space-sm',
        }}
      />
    )
  return (
    <FaqFrame eyebrow={t('eyebrow')} title={t('title')}>
      {body}
    </FaqFrame>
  )
}

export function BookingFaqSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto flex w-full max-w-4xl flex-col gap-space-md px-margin pb-space-3xl md:px-margin-md lg:px-margin-lg"
    >
      <Skeleton className="mx-auto h-4 w-40" />
      <Skeleton className="mx-auto mb-space-lg h-10 w-72" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  )
}
