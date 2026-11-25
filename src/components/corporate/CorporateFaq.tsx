import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { getFaqs } from '@/lib/api/public'
import type { FaqItem, Locale } from '@/lib/api/types'
import { FaqSection } from '@/components/sections/FaqSection'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

/** "Frequently Addressed Inquiries" — corporate-scope FAQs from the API (first one open, like Stitch) + FAQPage JSON-LD. */
export async function CorporateFaq({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'corporate.faq' })
  const items: FaqItem[] | null = await getFaqs(locale, { scope: 'corporate' }).catch(() => null)
  const body: ReactNode =
    items === null ? (
      <ErrorState />
    ) : items.length === 0 ? (
      <EmptyState icon="help" />
    ) : (
      <FaqSection
        items={items}
        title={null}
        accordionClassNames={{
          itemClassName: 'mb-space-sm rounded-2xl bg-surface-container-low shadow-none',
          buttonClassName: 'p-space-lg transition-colors hover:text-secondary',
          iconClassName: 'text-current',
          panelClassName: 'px-space-lg pb-space-lg',
        }}
      />
    )

  return (
    <section aria-labelledby="corporate-faq-title" className="w-full bg-surface py-space-3xl">
      <div className="mx-auto max-w-[1000px] px-margin md:px-margin-md">
        <div className="mb-space-2xl text-center">
          <span className="mb-space-xs block font-label-md text-label-md font-bold uppercase tracking-widest text-secondary">
            {t('eyebrow')}
          </span>
          <h2 id="corporate-faq-title" className="font-headline-xl text-headline-xl text-primary">
            {t('title')}
          </h2>
        </div>
        {body}
      </div>
    </section>
  )
}

export function CorporateFaqSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto flex w-full max-w-[1000px] flex-col gap-space-md px-margin py-space-3xl md:px-margin-md"
    >
      <Skeleton className="mx-auto h-4 w-56" />
      <Skeleton className="mx-auto mb-space-xl h-10 w-96 max-w-full" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
      ))}
    </div>
  )
}
