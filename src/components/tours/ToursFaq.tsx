import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { getFaqs } from '@/lib/api/public'
import type { FaqItem } from '@/lib/api/types'
import { faqPageJsonLd } from '@/components/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLdScript'
import { Container } from '@/components/ui/Container'
import { ErrorState } from '@/components/ui/ErrorState'
import { Icon } from '@/components/ui/Icon'

/** Stitch icons in display order; further questions keep the same rhythm. */
const FAQ_ICONS = [{ icon: 'tune' }, { icon: 'directions_car' }, { icon: 'confirmation_number' }, { icon: 'handshake' }]

const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

/**
 * "Clarifications & Assurances" FAQ grid of the tours page (open cards, as in Stitch — not an accordion).
 * Content: the CMS "booking" FAQ scope (planning, vehicles, permits, confirmation). Renders nothing when empty.
 */
export async function ToursFaq({ locale }: { locale: Locale }) {
  let items: FaqItem[]
  try {
    items = await getFaqs(locale, { scope: 'booking' })
  } catch {
    return (
      <Container className="py-space-2xl">
        <ErrorState retryHref="/tours" />
      </Container>
    )
  }
  if (items.length === 0) return null

  const t = await getTranslations({ locale, namespace: 'tours.faq' })
  return (
    <section
      aria-labelledby="tours-faq-title"
      className="mx-auto max-w-[1440px] px-margin py-space-2xl md:px-margin-md lg:px-margin-lg"
    >
      <div className="mx-auto mb-space-2xl max-w-2xl text-center">
        <span className="font-label-md text-label-md font-semibold uppercase tracking-widest text-secondary">
          {t('eyebrow')}
        </span>
        <h2 id="tours-faq-title" className="mt-space-xs font-headline-lg text-headline-lg text-primary">
          {t('title')}
        </h2>
        <p className="mt-space-sm font-body-md text-body-md text-on-surface-variant">{t('intro')}</p>
      </div>
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
        {items.map((faq, index) => (
          <div
            key={faq.id}
            className="flex flex-col gap-space-sm rounded-xl bg-surface-container-lowest p-space-lg shadow-sm"
          >
            <div className="flex items-center gap-space-sm text-primary">
              <Icon name={FAQ_ICONS[index % FAQ_ICONS.length]?.icon ?? 'help'} className="text-secondary" />
              <h3 className="font-headline-sm text-headline-sm">{faq.question}</h3>
            </div>
            {paragraphs(faq.answer).map((p, i) => (
              <p key={i} className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
                {p}
              </p>
            ))}
          </div>
        ))}
      </div>
      <JsonLd data={faqPageJsonLd(items)} />
    </section>
  )
}
