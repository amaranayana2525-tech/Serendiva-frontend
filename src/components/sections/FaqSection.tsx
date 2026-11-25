import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import type { FaqItem } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { faqPageJsonLd } from '@/components/seo/jsonld'
import { JsonLd } from '@/components/seo/JsonLdScript'
import { Accordion, type AccordionProps } from '@/components/ui/Accordion'
import { SectionHeading } from '@/components/ui/SectionHeading'

export interface FaqSectionProps {
  items: FaqItem[]
  /** Defaults: "Essential Practicalities" / "Everything You Need to Know" (home). Pass null to hide the heading. */
  eyebrow?: ReactNode
  title?: ReactNode | null
  intro?: ReactNode
  /** Heading alignment ('left' = home, 'center' = tours/destinations FAQ blocks). */
  align?: 'left' | 'center'
  /** 'xl' (home) or 'lg' (tour detail) heading size. */
  headingSize?: 'xl' | 'lg'
  /** Open the first question initially (default true, like Stitch). */
  openFirst?: boolean
  /** Emit FAQPage JSON-LD (default true — disable when the same FAQs appear twice on a page). */
  jsonLd?: boolean
  /** Restyle the accordion items (e.g. the tour-detail white cards). */
  accordionClassNames?: Pick<AccordionProps, 'itemClassName' | 'buttonClassName' | 'panelClassName' | 'iconClassName'>
  id?: string
  className?: string
}

const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

/** Heading + accessible accordion of API FAQs + FAQPage structured data. Renders nothing for an empty list. */
export function FaqSection({
  items,
  eyebrow,
  title,
  intro,
  align = 'left',
  headingSize = 'xl',
  openFirst = true,
  jsonLd = true,
  accordionClassNames,
  id,
  className,
}: FaqSectionProps) {
  const t = useTranslations('common.faq')
  if (items.length === 0) return null
  return (
    <div id={id} className={cn('flex flex-col gap-space-lg', className)}>
      {title !== null && (
        <SectionHeading
          align={align}
          size={headingSize}
          eyebrow={eyebrow ?? t('eyebrow')}
          title={title ?? t('title')}
          intro={intro}
          className={align === 'center' ? 'mb-space-lg' : undefined}
        />
      )}
      <Accordion
        defaultOpen={openFirst && items[0] ? [items[0].id] : []}
        items={items.map((f) => ({
          id: f.id,
          title: f.question,
          content: paragraphs(f.answer).map((p, i) => (
            <p key={i} className={i > 0 ? 'mt-space-sm' : undefined}>
              {p}
            </p>
          )),
        }))}
        {...accordionClassNames}
      />
      {jsonLd && <JsonLd data={faqPageJsonLd(items)} />}
    </div>
  )
}
