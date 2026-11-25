import { getTranslations } from 'next-intl/server'
import { getFaqs } from '@/lib/api/public'
import type { FaqItem, Locale } from '@/lib/api/types'
import { faqPageJsonLd } from '@/components/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLdScript'
import { Accordion } from '@/components/ui/Accordion'

const QUESTIONS = ['poya', 'sigiriya', 'flights', 'plugs'] as const

/**
 * "Frequently Consulted Practicalities" accordion (one panel open at a time, as in Stitch) + FAQPage JSON-LD.
 * The questions come from the FAQ admin (scope `travelGuide`); the original copy in messages is only the
 * fallback while the API is unreachable. No FAQs → no section.
 */
export async function GuideFaq({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'travelGuide.faq' })
  const items: FaqItem[] = await getFaqs(locale, { scope: 'travelGuide' }).catch(() =>
    QUESTIONS.map((key) => ({
      id: key,
      question: t(`items.${key}.question`),
      answer: t(`items.${key}.answer`),
    })),
  )
  if (items.length === 0) return null
  return (
    <section aria-labelledby="guide-faq-title" className="mt-space-lg flex flex-col gap-space-md">
      <div className="flex flex-col">
        <span className="font-label-md text-label-md font-semibold uppercase tracking-widest text-secondary">
          {t('eyebrow')}
        </span>
        <h2 id="guide-faq-title" className="font-headline-lg text-headline-lg text-primary">
          {t('title')}
        </h2>
      </div>
      <Accordion
        multiple={false}
        className="gap-space-xs"
        items={items.map((item) => ({ id: item.id, title: item.question, content: <p>{item.answer}</p> }))}
      />
      <JsonLd data={faqPageJsonLd(items)} />
    </section>
  )
}
