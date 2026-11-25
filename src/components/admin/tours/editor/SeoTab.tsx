'use client'

import { useTranslations } from 'next-intl'
import { localeErrors, TranslatableText } from '@/components/admin/kit/LocaleTabs'
import { Icon } from '@/components/ui/Icon'
import type { AdminLocale } from '@/lib/admin/translatable'
import { EditorSection, LocaleBadge } from './fields'
import { LIMITS, type L, type TourForm } from './model'
import { asL, type EditorTabProps } from './types'

const pick = (value: L, locale: AdminLocale) => value[locale].trim() || value.en.trim()

/** What the site will use for <title> / meta description (same fallbacks as the API's tour detail `seo`). */
export function effectiveSeo(form: TourForm, locale: AdminLocale) {
  const ownTitle = pick(form.seoTitle, locale)
  const ownDescription = pick(form.seoDescription, locale)
  const tourTitle = pick(form.title, locale)
  const fallbackTitle = tourTitle
    ? `${tourTitle} · ${form.durationNights ?? 0} Nights / ${form.durationDays ?? 0} Days`
    : ''
  const fallbackDescription = pick(form.summary, locale).slice(0, 160)
  return {
    title: ownTitle || fallbackTitle,
    description: ownDescription || fallbackDescription,
    fallbackTitle,
    fallbackDescription,
    titleIsFallback: !ownTitle,
    descriptionIsFallback: !ownDescription,
  }
}

/** SEO tab: per-locale title/description with counters and a search-result preview. */
export function SeoTab({ form, locale, errors, update }: EditorTabProps) {
  const t = useTranslations('adminTours.editor.seo')
  const tf = useTranslations('adminTours.editor.fields')
  const seo = effectiveSeo(form, locale)
  const crumbs = ['serendiva.lk', ...(locale === 'en' ? [] : [locale]), 'tours', form.slug || '…']
  return (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
      <EditorSection title={t('title')} description={t('description')}>
        <TranslatableText
          label={tf('seoTitle')}
          locale={locale}
          value={form.seoTitle}
          onChange={(v) => update('seoTitle', asL(v), [`seoTitle.${locale}`])}
          maxLength={LIMITS.seoTitle}
          counter
          placeholder={seo.fallbackTitle || undefined}
          hint={seo.fallbackTitle ? t('titleFallback', { text: seo.fallbackTitle }) : t('titleFallbackEmpty')}
          error={localeErrors(errors, 'seoTitle')}
        />
        <TranslatableText
          label={tf('seoDescription')}
          locale={locale}
          multiline={3}
          value={form.seoDescription}
          onChange={(v) => update('seoDescription', asL(v), [`seoDescription.${locale}`])}
          maxLength={LIMITS.seoDescription}
          counter
          placeholder={seo.fallbackDescription || undefined}
          hint={t('descriptionFallback')}
          error={localeErrors(errors, 'seoDescription')}
        />
      </EditorSection>

      <EditorSection
        title={t('preview')}
        description={t('previewHint')}
        aside={<LocaleBadge locale={locale} />}
      >
        <figure
          aria-label={t('preview')}
          className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-4 font-['Arial',sans-serif]"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary font-headline-sm text-[14px] font-semibold text-on-primary">
              S
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[14px] leading-5 text-on-surface">Serendiva</span>
              <span className="truncate text-[12px] leading-4 text-on-surface-variant">{crumbs.join(' › ')}</span>
            </span>
          </div>
          <p className="mt-2 line-clamp-2 break-words text-[20px] leading-[26px] text-[#1a0dab]" lang={locale}>
            {seo.title ? `${seo.title} · Serendiva` : <span className="italic text-outline">{t('noTitle')}</span>}
          </p>
          <p className="mt-1 line-clamp-3 break-words text-[14px] leading-[22px] text-[#4d5156]" lang={locale}>
            {seo.description || <span className="italic text-outline">{t('noDescription')}</span>}
          </p>
        </figure>
        <ul className="flex flex-col gap-1.5 font-caption text-caption text-on-surface-variant">
          <li className="flex items-start gap-1.5">
            <Icon name={seo.titleIsFallback ? 'info' : 'check_circle'} className="mt-px text-[15px] text-primary" />
            {seo.titleIsFallback ? t('usingTitleFallback') : t('usingOwnTitle')}
          </li>
          <li className="flex items-start gap-1.5">
            <Icon name={seo.descriptionIsFallback ? 'info' : 'check_circle'} className="mt-px text-[15px] text-primary" />
            {seo.descriptionIsFallback ? t('usingDescriptionFallback') : t('usingOwnDescription')}
          </li>
        </ul>
      </EditorSection>
    </div>
  )
}
