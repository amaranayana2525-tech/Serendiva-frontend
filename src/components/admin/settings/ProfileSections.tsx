'use client'

import { useTranslations } from 'next-intl'
import { NumberField } from '@/components/admin/kit/form/NumberField'
import { TagInput } from '@/components/admin/kit/form/TagInput'
import { TextField } from '@/components/admin/kit/form/TextField'
import { TranslatableText } from '@/components/admin/kit/LocaleTabs'
import { ImageField } from '@/components/admin/kit/media/ImageField'
import { compactOptional, compactRequired, localeErrors, toEditable, type AdminLocale } from '@/lib/admin/translatable'
import type { AdminMediaRef, AdminSettings } from '@/lib/api/types'
import { filledLocales, SettingsCard, useSettingForm, type SectionProps } from './SettingsForm'
import { refOf, settingsApi } from './settingsApi'

type Rec = Record<AdminLocale, string>

// ------------------------------------------------------------------------------------------------ guide

interface GuideForm {
  name: string
  title: Rec
  licenseNumber: string
  operatorLicense: string
  yearsGuiding: number | null
  languages: string[]
  portrait: AdminMediaRef | null
  candid: AdminMediaRef | null
  candidCaption: Rec
  introVideoUrl: string
}

const guideFrom = (s: AdminSettings): GuideForm => {
  const g = s.guide
  return {
    name: g?.name ?? '',
    title: toEditable(g?.title),
    licenseNumber: g?.licenseNumber ?? '',
    operatorLicense: g?.operatorLicense ?? '',
    yearsGuiding: g?.yearsGuiding ?? null,
    languages: [...(g?.languages ?? [])],
    portrait: refOf(s, g?.portraitId),
    candid: refOf(s, g?.candidId),
    candidCaption: toEditable(g?.candidCaption ?? null),
    introVideoUrl: g?.introVideoUrl ?? '',
  }
}

/** The guide: name, title per locale, licences, years, languages, portrait + candid photo, caption, intro video. */
export function GuideSection({ settings, onSaved, onDirtyChange }: SectionProps) {
  const t = useTranslations('adminLibrary.settings')
  const tg = useTranslations('adminLibrary.settings.guide')
  const f = useSettingForm<GuideForm>({
    id: 'settings-guide',
    settings,
    fromSettings: guideFrom,
    successMessage: tg('saved'),
    onSaved,
    onDirtyChange,
    validate: (form): Record<string, string> => (form.yearsGuiding === null ? { yearsGuiding: t('required') } : {}),
    save: (form) =>
      settingsApi.guide({
        name: form.name.trim(),
        title: compactRequired(form.title, ''),
        licenseNumber: form.licenseNumber.trim(),
        operatorLicense: form.operatorLicense.trim(),
        yearsGuiding: form.yearsGuiding ?? 0,
        languages: form.languages,
        portraitId: form.portrait?.id ?? null,
        candidId: form.candid?.id ?? null,
        candidCaption: compactOptional(form.candidCaption),
        ...(form.introVideoUrl.trim() ? { introVideoUrl: form.introVideoUrl.trim() } : {}),
      }),
  })
  const { form, update, errors, locale } = f
  return (
    <SettingsCard
      id="settings-guide"
      title={tg('title')}
      description={tg('description')}
      icon="badge"
      dirty={f.dirty}
      saving={f.saving}
      onSubmit={f.submit}
      onDiscard={f.discard}
      locale={{
        value: locale,
        onChange: f.setLocale,
        filled: filledLocales(form.title, form.candidCaption),
        errors: f.errorLocales,
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label={tg('fields.name')}
          required
          value={form.name}
          maxLength={120}
          error={errors.name}
          onChange={(e) => update({ name: e.target.value })}
        />
        <TranslatableText
          label={tg('fields.title')}
          locale={locale}
          value={form.title}
          onChange={(v) => update({ title: { ...form.title, ...v } })}
          required
          maxLength={160}
          error={localeErrors(errors, 'title')}
        />
        <TextField
          label={tg('fields.licenseNumber')}
          hint={tg('fields.licenseNumberHint')}
          value={form.licenseNumber}
          maxLength={60}
          error={errors.licenseNumber}
          onChange={(e) => update({ licenseNumber: e.target.value })}
        />
        <TextField
          label={tg('fields.operatorLicense')}
          hint={tg('fields.operatorLicenseHint')}
          value={form.operatorLicense}
          maxLength={60}
          error={errors.operatorLicense}
          onChange={(e) => update({ operatorLicense: e.target.value })}
        />
        <NumberField
          label={tg('fields.yearsGuiding')}
          min={0}
          max={80}
          required
          unit={tg('fields.yearsUnit')}
          value={form.yearsGuiding}
          error={errors.yearsGuiding}
          onChange={(v) => update({ yearsGuiding: v })}
        />
        <TagInput
          label={tg('fields.languages')}
          hint={tg('fields.languagesHint')}
          value={form.languages}
          onChange={(v) => update({ languages: v })}
          max={10}
          maxLength={40}
          error={errors.languages ?? Object.entries(errors).find(([k]) => k.startsWith('languages.'))?.[1]}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ImageField
          label={tg('fields.portrait')}
          hint={tg('fields.portraitHint')}
          aspect="portrait"
          folder="settings"
          value={form.portrait}
          error={errors.portraitId}
          onChange={(v) => update({ portrait: v })}
        />
        <div className="flex flex-col gap-4">
          <ImageField
            label={tg('fields.candid')}
            hint={tg('fields.candidHint')}
            aspect="landscape"
            folder="settings"
            value={form.candid}
            error={errors.candidId}
            onChange={(v) => update({ candid: v })}
          />
          <TranslatableText
            label={tg('fields.candidCaption')}
            locale={locale}
            value={form.candidCaption}
            onChange={(v) => update({ candidCaption: { ...form.candidCaption, ...v } })}
            maxLength={120}
            counter
            error={localeErrors(errors, 'candidCaption')}
          />
        </div>
      </div>
      <TextField
        label={tg('fields.introVideoUrl')}
        hint={tg('fields.introVideoUrlHint')}
        type="url"
        inputMode="url"
        icon="smart_display"
        value={form.introVideoUrl}
        maxLength={300}
        error={errors.introVideoUrl}
        placeholder={tg('fields.introVideoUrlPlaceholder')}
        onChange={(e) => update({ introVideoUrl: e.target.value })}
      />
    </SettingsCard>
  )
}

// ------------------------------------------------------------------------------------------------ seo

interface SeoForm {
  siteName: string
  defaultTitle: Rec
  defaultDescription: Rec
  ogImage: AdminMediaRef | null
}

const seoFrom = (s: AdminSettings): SeoForm => ({
  siteName: s.seo?.siteName ?? '',
  defaultTitle: toEditable(s.seo?.defaultTitle),
  defaultDescription: toEditable(s.seo?.defaultDescription),
  ogImage: refOf(s, s.seo?.ogImageId),
})

/** SEO defaults: site name, default title/description per locale, social sharing image. */
export function SeoSection({ settings, onSaved, onDirtyChange }: SectionProps) {
  const ts = useTranslations('adminLibrary.settings.seo')
  const f = useSettingForm<SeoForm>({
    id: 'settings-seo',
    settings,
    fromSettings: seoFrom,
    successMessage: ts('saved'),
    onSaved,
    onDirtyChange,
    save: (form) =>
      settingsApi.seo({
        siteName: form.siteName.trim(),
        defaultTitle: compactRequired(form.defaultTitle, ''),
        defaultDescription: compactRequired(form.defaultDescription, ''),
        ogImageId: form.ogImage?.id ?? null,
      }),
  })
  const { form, update, errors, locale } = f
  const snippetTitle = form.defaultTitle[locale] || form.defaultTitle.en || form.siteName
  const snippetText = form.defaultDescription[locale] || form.defaultDescription.en
  return (
    <SettingsCard
      id="settings-seo"
      title={ts('title')}
      description={ts('description')}
      icon="travel_explore"
      dirty={f.dirty}
      saving={f.saving}
      onSubmit={f.submit}
      onDiscard={f.discard}
      locale={{
        value: locale,
        onChange: f.setLocale,
        filled: filledLocales(form.defaultTitle, form.defaultDescription),
        errors: f.errorLocales,
      }}
    >
      <TextField
        label={ts('fields.siteName')}
        required
        value={form.siteName}
        maxLength={60}
        counter
        error={errors.siteName}
        onChange={(e) => update({ siteName: e.target.value })}
      />
      <TranslatableText
        label={ts('fields.defaultTitle')}
        locale={locale}
        value={form.defaultTitle}
        onChange={(v) => update({ defaultTitle: { ...form.defaultTitle, ...v } })}
        required
        maxLength={70}
        counter
        error={localeErrors(errors, 'defaultTitle')}
      />
      <TranslatableText
        label={ts('fields.defaultDescription')}
        locale={locale}
        value={form.defaultDescription}
        onChange={(v) => update({ defaultDescription: { ...form.defaultDescription, ...v } })}
        required
        multiline={3}
        maxLength={170}
        counter
        error={localeErrors(errors, 'defaultDescription')}
      />
      <div className="rounded-lg border border-surface-container-high p-3" role="group" aria-label={ts('previewLabel')}>
        <p className="mb-1 font-caption text-[11px] uppercase tracking-wider text-on-surface-variant">
          {ts('previewLabel')}
        </p>
        <p className="line-clamp-1 font-body-md text-[17px] leading-6 text-primary">{snippetTitle}</p>
        <p className="line-clamp-2 font-body-md text-[13px] leading-5 text-on-surface-variant">{snippetText}</p>
      </div>
      <ImageField
        label={ts('fields.ogImage')}
        hint={ts('fields.ogImageHint')}
        aspect="video"
        folder="settings"
        value={form.ogImage}
        error={errors.ogImageId}
        onChange={(v) => update({ ogImage: v })}
      />
    </SettingsCard>
  )
}
