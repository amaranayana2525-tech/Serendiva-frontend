'use client'

import { useTranslations } from 'next-intl'
import { Card } from '@/components/admin/kit/Card'
import { localeErrors, TranslatableText } from '@/components/admin/kit/LocaleTabs'
import { pickLocale } from '@/lib/admin/translatable'
import { LIMITS } from '../lib/destinationForm'
import { useEditor } from './EditorContext'

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text)

/** SEO tab: title + description per language with counters and a search-result preview. */
export function SeoTab() {
  const t = useTranslations('adminContent.editor')
  const { form, locale, errors, set } = useEditor()
  const title = pickLocale(form.seoTitle, locale) || pickLocale(form.name, locale) || t('seo.untitled')
  const description = pickLocale(form.seoDescription, locale) || pickLocale(form.summary, locale) || ''
  const path = `${locale === 'en' ? '' : `/${locale}`}/destinations/${form.slug || '…'}`

  return (
    <Card title={t('sections.seo')} icon="travel_explore" description={t('sectionHints.seo')}>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="flex flex-col gap-4">
          <TranslatableText
            label={t('fields.seoTitle')}
            value={form.seoTitle}
            onChange={(v) => set('seoTitle', { ...form.seoTitle, ...v })}
            locale={locale}
            maxLength={LIMITS.seoTitle}
            counter
            hint={t('hints.seoTitle')}
            error={localeErrors(errors, 'seoTitle')}
          />
          <TranslatableText
            label={t('fields.seoDescription')}
            value={form.seoDescription}
            onChange={(v) => set('seoDescription', { ...form.seoDescription, ...v })}
            locale={locale}
            multiline={3}
            maxLength={LIMITS.seoDescription}
            counter
            hint={t('hints.seoDescription')}
            error={localeErrors(errors, 'seoDescription')}
          />
        </div>
        <figure className="flex flex-col gap-2">
          <figcaption className="font-body-md text-[13px] font-semibold text-on-surface">{t('seo.preview')}</figcaption>
          <div className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-4" lang={locale}>
            <p className="truncate font-body-md text-[12px] text-on-surface-variant">serendiva.lk{path}</p>
            <p className="mt-1 font-body-md text-[18px] leading-6 text-primary">{clip(title, 65)}</p>
            <p className="mt-1 font-body-md text-[13px] leading-5 text-on-surface-variant">
              {description ? clip(description, 160) : <span className="italic text-outline">{t('seo.noDescription')}</span>}
            </p>
          </div>
          <p className="font-caption text-caption text-on-surface-variant">{t('seo.fallback')}</p>
        </figure>
      </div>
    </Card>
  )
}
