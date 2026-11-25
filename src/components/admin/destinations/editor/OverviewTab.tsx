'use client'

import { useTranslations } from 'next-intl'
import { Card } from '@/components/admin/kit/Card'
import { localeErrors, TranslatableText } from '@/components/admin/kit/LocaleTabs'
import { MarkdownEditor } from '@/components/admin/kit/MarkdownEditor'
import { NumberField } from '@/components/admin/kit/form/NumberField'
import { SelectField } from '@/components/admin/kit/form/SelectField'
import { SlugField } from '@/components/admin/kit/form/SlugField'
import { LIMITS } from '../lib/destinationForm'
import { StringListField } from '../ui/StringListField'
import { TranslateFromEnglish, useEditor } from './EditorContext'

/** Overview tab: names, slug, region, headline/tagline/summary, description (markdown), card labels, curations, location. */
export function OverviewTab() {
  const t = useTranslations('adminContent.editor')
  const tl = useTranslations('admin.kit.locales')
  const { form, locale, errors, set, get, setLocal, en, err, regions } = useEditor()
  const text = (key: 'name' | 'headline' | 'tagline' | 'summary' | 'metaLabel' | 'badge' | 'bestTimeLabel') => ({
    value: form[key],
    onChange: (v: Partial<Record<'en' | 'zh' | 'de', string>>) => set(key, { ...form[key], ...v }),
    locale,
    error: localeErrors(errors, key),
  })
  const regionOptions = (regions ?? []).map((r) => ({ value: r.id, label: r.name.en ?? r.slug }))
  const englishDescription = en('description')

  return (
    <div className="flex flex-col gap-5">
      <Card title={t('sections.basics')} icon="badge">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TranslatableText label={t('fields.name')} required maxLength={LIMITS.name} counter {...text('name')} />
          <SlugField
            value={form.slug}
            onChange={(slug) => set('slug', slug)}
            source={form.name.en ?? ''}
            prefix="/destinations/"
            required
            error={err('slug')}
          />
          <SelectField
            label={t('fields.region')}
            value={form.regionId}
            onValueChange={(v) => set('regionId', v)}
            options={regionOptions}
            placeholder={t('fields.noRegion')}
            hint={t('hints.region')}
            error={err('regionId')}
          />
          <TranslatableText
            label={t('fields.badge')}
            maxLength={LIMITS.badge}
            hint={t('hints.badge')}
            {...text('badge')}
          />
          <TranslatableText
            label={t('fields.headline')}
            maxLength={LIMITS.headline}
            counter
            hint={t('hints.headline')}
            className="md:col-span-2"
            {...text('headline')}
          />
          <TranslatableText
            label={t('fields.tagline')}
            maxLength={LIMITS.tagline}
            counter
            hint={t('hints.tagline')}
            className="md:col-span-2"
            {...text('tagline')}
          />
          <TranslatableText
            label={t('fields.summary')}
            required
            multiline={4}
            maxLength={LIMITS.summary}
            counter
            hint={t('hints.summary')}
            className="md:col-span-2"
            {...text('summary')}
          />
        </div>
      </Card>

      <Card title={t('sections.description')} icon="article" description={t('sectionHints.description')}>
        <MarkdownEditor
          key={locale}
          label={
            <span className="inline-flex items-center gap-1.5">
              {t('fields.description')}
              <span className="rounded bg-surface-container px-1.5 py-px font-body-md text-[11px] font-semibold text-on-surface-variant">
                {tl(`${locale}.short`)}
              </span>
            </span>
          }
          value={get('description')}
          onChange={(v) => setLocal('description', v)}
          maxLength={LIMITS.description}
          rows={12}
          defaultMode="split"
          folder="destinations"
          lang={locale}
          placeholder={locale !== 'en' && englishDescription ? tl('placeholderFromEnglish', { text: englishDescription.slice(0, 160) }) : undefined}
          error={err(`description.${locale}`)}
        />
      </Card>

      <Card title={t('sections.labels')} icon="sell" description={t('sectionHints.labels')}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TranslatableText label={t('fields.metaLabel')} maxLength={LIMITS.metaLabel} hint={t('hints.metaLabel')} {...text('metaLabel')} />
          <TranslatableText
            label={t('fields.bestTimeLabel')}
            maxLength={LIMITS.bestTimeLabel}
            hint={t('hints.bestTimeLabel')}
            {...text('bestTimeLabel')}
          />
        </div>
      </Card>

      <Card title={t('sections.curations')} icon="checklist" description={t('sectionHints.curations')}>
        <div className="flex flex-col gap-3">
          <TranslateFromEnglish field="curations" what={t('sections.curations')} />
          <StringListField
            key={locale}
            label={t('fields.curations')}
            itemLabel={t('fields.curation')}
            addLabel={t('add.curation')}
            values={get('curations')}
            onChange={(v) => setLocal('curations', v)}
            max={LIMITS.curations}
            maxLength={LIMITS.curation}
            placeholders={locale === 'en' ? undefined : en('curations')}
            errorAt={(i) => err(`curations.${locale}.${i}`)}
            lang={locale}
          />
        </div>
      </Card>

      <Card title={t('sections.location')} icon="my_location" description={t('sectionHints.location')}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumberField
            label={t('fields.latitude')}
            value={form.latitude}
            onChange={(v) => set('latitude', v)}
            decimal
            min={-90}
            max={90}
            placeholder="6.8667"
            error={err('latitude')}
          />
          <NumberField
            label={t('fields.longitude')}
            value={form.longitude}
            onChange={(v) => set('longitude', v)}
            decimal
            min={-180}
            max={180}
            placeholder="81.0466"
            error={err('longitude')}
          />
          <NumberField
            label={t('fields.elevation')}
            value={form.elevation}
            onChange={(v) => set('elevation', v)}
            min={-500}
            max={9000}
            step={10}
            unit={t('units.metres')}
            error={err('elevation')}
          />
        </div>
      </Card>
    </div>
  )
}
