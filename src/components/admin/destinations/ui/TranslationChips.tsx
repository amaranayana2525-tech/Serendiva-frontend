'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export interface TranslationChipsProps {
  /** `translations` from the API (English always exists). */
  translations: { zh: boolean; de: boolean }
  className?: string
}

/** EN · 中文 · DE pills — filled when the record has that translation (screen readers get a sentence). */
export function TranslationChips({ translations, className }: TranslationChipsProps) {
  const t = useTranslations('admin.kit.locales')
  const tc = useTranslations('adminContent.common')
  const items = [
    { locale: 'en', has: true },
    { locale: 'zh', has: translations.zh },
    { locale: 'de', has: translations.de },
  ] as const
  const summary = items
    .map((i) => `${t(`${i.locale}.name`)}: ${i.has ? tc('translated') : tc('notTranslated')}`)
    .join(', ')
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className="sr-only">{summary}</span>
      {items.map((i) => (
        <span
          key={i.locale}
          aria-hidden="true"
          title={`${t(`${i.locale}.name`)} — ${i.has ? tc('translated') : tc('notTranslated')}`}
          className={cn(
            'inline-flex h-5 min-w-[1.75rem] items-center justify-center rounded px-1 font-body-md text-[11px] font-semibold leading-none',
            i.has
              ? 'bg-primary-fixed/60 text-on-primary-fixed-variant'
              : 'border border-dashed border-outline-variant text-outline',
          )}
        >
          {t(`${i.locale}.short`)}
        </span>
      ))}
    </span>
  )
}
