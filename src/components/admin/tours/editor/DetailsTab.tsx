'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { CheckboxGroup } from '@/components/admin/kit/form/CheckboxGroup'
import { NumberField } from '@/components/admin/kit/form/NumberField'
import { SlugField } from '@/components/admin/kit/form/SlugField'
import { Switch } from '@/components/admin/kit/form/Switch'
import { TextArea } from '@/components/admin/kit/form/TextArea'
import { TextField } from '@/components/admin/kit/form/TextField'
import { IconPicker } from '@/components/admin/kit/IconPicker'
import { localeErrors, TranslatableText } from '@/components/admin/kit/LocaleTabs'
import { MarkdownEditor } from '@/components/admin/kit/MarkdownEditor'
import { ErrorPanel } from '@/components/admin/kit/Panels'
import { Icon } from '@/components/ui/Icon'
import { useAdminQuery } from '@/lib/admin/hooks'
import type { AdminLocale } from '@/lib/admin/translatable'
import { cn } from '@/lib/utils'
import { categoriesApi } from '../api'
import { EditorSection, FieldError, LocaleBadge, StringListEditor, TranslatedRepeater, TranslationPrompt } from './fields'
import {
  errorUnder,
  LIMITS,
  newFeature,
  newIncluded,
  newNotIncluded,
  newTerrain,
  SEASONS,
  tourReadiness,
  TRAVELLER_TYPES,
  type IconTextForm,
  type LList,
  type OverviewForm,
} from './model'
import { asL, type EditorTabProps } from './types'

/** Details tab: copy, route, lists and the classification sidebar (readiness, duration, flags, categories, audience, seasons). */
export function DetailsTab({ form, locale, errors, update, onJumpTab }: EditorTabProps) {
  const t = useTranslations('adminTours.editor.details')
  const tf = useTranslations('adminTours.editor.fields')
  const categories = useAdminQuery(['categories', 'admin'], (signal) => categoriesApi.list(signal))
  const englishDescription = form.description.en.trim()
  const readiness = tourReadiness(form)
  const requiredReadiness = readiness.filter((item) => !item.optional)
  const readinessDone = requiredReadiness.filter((item) => item.ok).length

  const overviewValue = (key: keyof OverviewForm) => ({
    en: form.overview.en[key],
    zh: form.overview.zh[key],
    de: form.overview.de[key],
  })
  const setOverview = (key: keyof OverviewForm, value: { en?: string; zh?: string; de?: string }) =>
    update(
      'overview',
      (prev) => ({
        en: { ...prev.en, [key]: value.en ?? '' },
        zh: { ...prev.zh, [key]: value.zh ?? '' },
        de: { ...prev.de, [key]: value.de ?? '' },
      }),
      [`overview.${locale}.${key}`],
    )

  const iconTextRepeater = (
    key: 'included' | 'notIncluded',
    create: () => IconTextForm,
  ) => (
    <TranslatedRepeater<IconTextForm>
      locale={locale}
      value={form[key]}
      onChange={(value) => update(key, value, [`${key}.${locale}`])}
      label={tf(key)}
      addLabel={t(key === 'included' ? 'addIncluded' : 'addNotIncluded')}
      max={LIMITS.included.max}
      createItem={create}
      collapsible={false}
      error={errors[`${key}.${locale}`] ?? errors[key]}
      itemLabel={(item, i, en) => item.text || en?.text || t('itemN', { n: i + 1 })}
      renderItem={(item, { update: set, index }, en) => (
        <div className="grid gap-3 sm:grid-cols-[13rem_minmax(0,1fr)]">
          <IconPicker
            label={tf('icon')}
            value={item.icon}
            clearable={false}
            onChange={(icon) => icon && set({ icon })}
            error={errors[`${key}.${locale}.${index}.icon`]}
          />
          <TextArea
            label={tf('text')}
            rows={2}
            value={item.text}
            maxLength={LIMITS.included.text}
            lang={locale}
            placeholder={locale !== 'en' ? en?.text : undefined}
            onChange={(e) => set({ text: e.target.value })}
            error={errors[`${key}.${locale}.${index}.text`]}
          />
        </div>
      )}
    />
  )

  return (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-5">
        <EditorSection title={t('basics')} description={t('basicsHint')}>
          <TranslatableText
            label={tf('title')}
            locale={locale}
            required
            value={form.title}
            onChange={(v) => update('title', asL(v), [`title.${locale}`])}
            maxLength={LIMITS.title}
            counter
            error={localeErrors(errors, 'title')}
          />
          <SlugField
            value={form.slug}
            onChange={(slug) => update('slug', slug)}
            source={form.title.en}
            prefix="/tours/"
            required
            error={errors.slug}
          />
          <TranslatableText
            label={tf('summary')}
            locale={locale}
            required
            multiline={4}
            value={form.summary}
            onChange={(v) => update('summary', asL(v), [`summary.${locale}`])}
            maxLength={LIMITS.summary}
            counter
            hint={t('summaryHint')}
            error={localeErrors(errors, 'summary')}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <TranslatableText
              label={tf('cardTag')}
              locale={locale}
              value={form.cardTag}
              onChange={(v) => update('cardTag', asL(v), [`cardTag.${locale}`])}
              maxLength={LIMITS.cardTag}
              counter
              hint={t('cardTagHint')}
              error={localeErrors(errors, 'cardTag')}
            />
            <TranslatableText
              label={tf('routeSummary')}
              locale={locale}
              value={form.routeSummary}
              onChange={(v) => update('routeSummary', asL(v), [`routeSummary.${locale}`])}
              maxLength={LIMITS.routeSummary}
              counter
              hint={t('routeSummaryHint')}
              error={localeErrors(errors, 'routeSummary')}
            />
          </div>
        </EditorSection>

        <EditorSection title={tf('description')} description={t('descriptionHint')}>
          <MarkdownEditor
            key={locale}
            label={
              <span className="inline-flex items-center gap-1.5">
                {tf('description')}
                <LocaleBadge locale={locale} />
              </span>
            }
            value={form.description[locale]}
            onChange={(text) => update('description', (prev) => ({ ...prev, [locale]: text }), [`description.${locale}`])}
            maxLength={LIMITS.description}
            rows={12}
            lang={locale}
            folder="tours"
            placeholder={
              locale !== 'en' && englishDescription
                ? t('englishPlaceholder', { text: englishDescription.slice(0, 220) })
                : undefined
            }
            required={locale === 'en'}
            error={localeErrors(errors, 'description')[locale]}
          />
        </EditorSection>

        <EditorSection title={t('overview')} description={t('overviewHint')}>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <TranslatableText
              label={tf('kicker')}
              locale={locale}
              value={overviewValue('kicker')}
              onChange={(v) => setOverview('kicker', v)}
              maxLength={LIMITS.overview.kicker}
              counter
              error={errors[`overview.${locale}.kicker`]}
            />
            <TranslatableText
              label={tf('heading')}
              locale={locale}
              value={overviewValue('heading')}
              onChange={(v) => setOverview('heading', v)}
              maxLength={LIMITS.overview.heading}
              counter
              error={errors[`overview.${locale}.heading`]}
            />
          </div>
          <TranslatableText
            label={tf('quote')}
            locale={locale}
            multiline={3}
            value={overviewValue('quote')}
            onChange={(v) => setOverview('quote', v)}
            maxLength={LIMITS.overview.quote}
            counter
            error={errors[`overview.${locale}.quote`]}
          />
        </EditorSection>

        <EditorSection title={t('routeAndHighlights')}>
          <StringListEditor
            label={tf('route')}
            listLabel={tf('route')}
            items={form.route}
            onChange={(route) => update('route', route)}
            max={LIMITS.route.max}
            maxLength={LIMITS.route.length}
            addPlaceholder={t('routePlaceholder')}
            hint={t('routeHint')}
            error={errorUnder(errors, 'route')}
          />
          <LocaleStringList
            locale={locale}
            label={tf('highlights')}
            value={form.highlights}
            onChange={(value) => update('highlights', value, [`highlights.${locale}`])}
            max={LIMITS.highlights.max}
            maxLength={LIMITS.highlights.length}
            hint={t('highlightsHint')}
            error={errorUnder(errors, `highlights.${locale}`)}
          />
          <LocaleStringList
            locale={locale}
            label={tf('badges')}
            value={form.badges}
            onChange={(value) => update('badges', value, [`badges.${locale}`])}
            max={LIMITS.badges.max}
            maxLength={LIMITS.badges.length}
            hint={t('badgesHint')}
            error={errorUnder(errors, `badges.${locale}`)}
          />
        </EditorSection>

        <EditorSection title={tf('keyFeatures')} description={t('keyFeaturesHint')}>
          <TranslatedRepeater
            locale={locale}
            value={form.keyFeatures}
            onChange={(value) => update('keyFeatures', value, [`keyFeatures.${locale}`])}
            label={tf('keyFeatures')}
            addLabel={t('addFeature')}
            max={LIMITS.keyFeatures.max}
            createItem={newFeature}
            defaultCollapsed={form.keyFeatures[locale].length > 3}
            itemLabel={(item, i, en) => item.title || en?.title || t('itemN', { n: i + 1 })}
            renderItem={(item, { update: set, index }, en) => (
              <div className="grid gap-3 sm:grid-cols-[13rem_minmax(0,1fr)]">
                <IconPicker
                  label={tf('icon')}
                  value={item.icon}
                  clearable={false}
                  onChange={(icon) => icon && set({ icon })}
                  error={errors[`keyFeatures.${locale}.${index}.icon`]}
                />
                <TextField
                  label={tf('featureTitle')}
                  value={item.title}
                  maxLength={LIMITS.keyFeatures.title}
                  lang={locale}
                  placeholder={locale !== 'en' ? en?.title : undefined}
                  onChange={(e) => set({ title: e.target.value })}
                  error={errors[`keyFeatures.${locale}.${index}.title`]}
                />
                <TextArea
                  label={tf('text')}
                  rows={2}
                  value={item.text}
                  maxLength={LIMITS.keyFeatures.text}
                  lang={locale}
                  placeholder={locale !== 'en' ? en?.text : undefined}
                  onChange={(e) => set({ text: e.target.value })}
                  error={errors[`keyFeatures.${locale}.${index}.text`]}
                  fieldClassName="sm:col-span-2"
                />
              </div>
            )}
          />
        </EditorSection>

        <EditorSection title={t('inclusions')} description={t('inclusionsHint')}>
          {iconTextRepeater('included', newIncluded)}
          <div className="border-t border-surface-container" />
          {iconTextRepeater('notIncluded', newNotIncluded)}
        </EditorSection>

        <EditorSection title={tf('terrains')} description={t('terrainsHint')}>
          <TranslatedRepeater
            locale={locale}
            value={form.terrains}
            onChange={(value) => update('terrains', value, [`terrains.${locale}`])}
            label={tf('terrains')}
            addLabel={t('addTerrain')}
            max={LIMITS.terrains.max}
            createItem={newTerrain}
            itemLabel={(item, i, en) => item.label || en?.label || t('itemN', { n: i + 1 })}
            renderItem={(item, { update: set, index }, en) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label={tf('terrainLabel')}
                  value={item.label}
                  maxLength={LIMITS.terrains.label}
                  lang={locale}
                  placeholder={locale !== 'en' ? en?.label : t('terrainLabelPlaceholder')}
                  onChange={(e) => set({ label: e.target.value })}
                  error={errors[`terrains.${locale}.${index}.label`]}
                />
                <TextField
                  label={tf('terrainPlace')}
                  value={item.place}
                  maxLength={LIMITS.terrains.place}
                  lang={locale}
                  placeholder={locale !== 'en' ? en?.place : t('terrainPlacePlaceholder')}
                  onChange={(e) => set({ place: e.target.value })}
                  error={errors[`terrains.${locale}.${index}.place`]}
                />
                <TextArea
                  label={tf('terrainNote')}
                  rows={2}
                  value={item.note}
                  maxLength={LIMITS.terrains.note}
                  lang={locale}
                  placeholder={locale !== 'en' ? en?.note : undefined}
                  onChange={(e) => set({ note: e.target.value })}
                  error={errors[`terrains.${locale}.${index}.note`]}
                  fieldClassName="sm:col-span-2"
                />
              </div>
            )}
          />
        </EditorSection>
      </div>

      <aside className="flex min-w-0 flex-col gap-5" aria-label={t('sidebar')}>
        <EditorSection
          title={t('readiness.title')}
          aside={
            <span className="rounded-full bg-surface-container px-2.5 py-0.5 font-body-md text-[12px] font-semibold tabular-nums text-on-surface-variant">
              {t('readiness.summary', { done: readinessDone, total: requiredReadiness.length })}
            </span>
          }
        >
          <ul className="flex flex-col gap-1">
            {readiness.map((item) => {
              const iconName = item.ok ? 'check_circle' : item.optional ? 'translate' : 'warning'
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    disabled={!onJumpTab}
                    onClick={() => onJumpTab?.(item.tab)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left font-body-md text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      onJumpTab && 'hover:bg-surface-container-low',
                      item.ok ? 'text-on-surface' : 'text-on-surface-variant',
                    )}
                  >
                    <Icon
                      name={iconName}
                      className={cn(
                        'shrink-0 text-[16px]',
                        item.ok ? 'text-tertiary' : item.optional ? 'text-on-surface-variant' : 'text-secondary',
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">{t(`readiness.items.${item.key}`)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </EditorSection>

        <EditorSection title={t('duration')}>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={tf('durationDays')}
              value={form.durationDays}
              onChange={(v) => {
                update('durationDays', v)
                if (v !== null && v >= 1 && form.durationNights === null) {
                  update('durationNights', Math.max(0, v - 1))
                }
              }}
              min={LIMITS.duration.min}
              max={LIMITS.duration.max}
              required
              error={errors.durationDays}
            />
            <NumberField
              label={tf('durationNights')}
              value={form.durationNights}
              onChange={(v) => update('durationNights', v)}
              min={0}
              max={LIMITS.duration.max}
              required
              error={errors.durationNights}
            />
          </div>
          {form.durationDays !== null && form.days.length > 0 && form.days.length !== form.durationDays && (
            <p className="flex items-start gap-1.5 font-caption text-caption text-on-surface-variant">
              <Icon name="warning" className="mt-px shrink-0 text-[15px] text-secondary" />
              {t('durationMismatch', { days: form.days.length, duration: form.durationDays })}
            </p>
          )}
        </EditorSection>

        <EditorSection title={t('visibility')}>
          <Switch
            checked={form.isFeatured}
            onCheckedChange={(v) => update('isFeatured', v)}
            label={tf('isFeatured')}
            description={t('featuredHint')}
          />
          <Switch
            checked={form.isMostPopular}
            onCheckedChange={(v) => update('isMostPopular', v)}
            label={tf('isMostPopular')}
            description={t('mostPopularHint')}
          />
        </EditorSection>

        <EditorSection
          title={tf('categories')}
          aside={
            <Button href="/admin/tours/categories" variant="link" size="sm" className="text-[13px]">
              {t('manageCategories')}
            </Button>
          }
        >
          {categories.error && !categories.data ? (
            <ErrorPanel error={categories.error} onRetry={() => void categories.refetch()} variant="inline" className="py-4" />
          ) : !categories.data ? (
            <div className="flex flex-col gap-2" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className="h-5 w-3/4 animate-pulse rounded bg-surface-container-high/80" />
              ))}
            </div>
          ) : (
            <CheckboxGroup
              legend={tf('categories')}
              hideLegend
              columns={1}
              options={categories.data.map((c) => ({
                value: c.id,
                label: c.name.en ?? c.slug,
                disabled: !form.categoryIds.includes(c.id) && form.categoryIds.length >= LIMITS.categories,
              }))}
              value={form.categoryIds}
              onChange={(ids) => update('categoryIds', ids)}
              error={errorUnder(errors, 'categoryIds')}
              hint={t('categoriesHint', { max: LIMITS.categories })}
            />
          )}
        </EditorSection>

        <EditorSection title={tf('travellerTypes')}>
          <CheckboxGroup
            legend={tf('travellerTypes')}
            hideLegend
            columns={2}
            options={TRAVELLER_TYPES.map((type) => ({ value: type, label: t(`travellerType.${type}`) }))}
            value={form.travellerTypes}
            onChange={(v) => update('travellerTypes', v)}
            error={errorUnder(errors, 'travellerTypes')}
          />
        </EditorSection>

        <EditorSection title={tf('seasons')}>
          <CheckboxGroup
            legend={tf('seasons')}
            hideLegend
            columns={1}
            options={SEASONS.map((season) => ({ value: season, label: t(`season.${season}`) }))}
            value={form.seasons}
            onChange={(v) => update('seasons', v)}
            error={errorUnder(errors, 'seasons')}
            hint={t('seasonsHint')}
          />
        </EditorSection>
      </aside>
    </div>
  )
}

/** A per-locale string list: English list editor, or the translation prompt / translated list for 中文 and DE. */
function LocaleStringList({
  locale,
  label,
  value,
  onChange,
  max,
  maxLength,
  hint,
  error,
}: {
  locale: AdminLocale
  label: string
  value: LList<string>
  onChange: (value: LList<string>) => void
  max: number
  maxLength: number
  hint?: string
  error?: string
}) {
  const items = value[locale]
  const set = (next: string[]) => onChange({ ...value, [locale]: next })
  if (locale !== 'en' && items.length === 0 && value.en.length > 0) {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="inline-flex items-center gap-1.5 font-body-md text-[13px] font-semibold text-on-surface">
          {label}
          <LocaleBadge locale={locale} />
        </p>
        <TranslationPrompt locale={locale} count={value.en.length} onCopy={() => set([...value.en])} onStartEmpty={() => set([''])} />
        <FieldError message={error} />
      </div>
    )
  }
  return (
    <StringListEditor
      key={locale}
      label={label}
      listLabel={label}
      labelAside={<LocaleBadge locale={locale} />}
      items={items}
      onChange={set}
      max={max}
      maxLength={maxLength}
      placeholders={locale === 'en' ? undefined : value.en}
      hint={hint}
      error={error}
      lang={locale}
    />
  )
}
