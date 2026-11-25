'use client'

import { useTranslations } from 'next-intl'
import { NumberField } from '@/components/admin/kit/form/NumberField'
import { TextField } from '@/components/admin/kit/form/TextField'
import { TranslatableText } from '@/components/admin/kit/LocaleTabs'
import { Icon } from '@/components/ui/Icon'
import { phoneDigits } from '@/lib/admin/format'
import { compactRequired, localeErrors, toEditable, type AdminLocale } from '@/lib/admin/translatable'
import type { AdminSettings } from '@/lib/api/types'
import { filledLocales, SettingsCard, useSettingForm, type SectionProps } from './SettingsForm'
import { settingsApi } from './settingsApi'

type Rec = Record<AdminLocale, string>

// ------------------------------------------------------------------------------------------------ contact

interface ContactForm {
  phone: string
  whatsapp: string
  whatsappDisplay: string
  email: string
  address: Rec
  serviceArea: Rec
  hours: Rec
  responseTime: Rec
  mapLat: number | null
  mapLng: number | null
}

const contactFrom = (s: AdminSettings): ContactForm => {
  const c = s.contact
  return {
    phone: c?.phone ?? '',
    whatsapp: c?.whatsapp ?? '',
    whatsappDisplay: c?.whatsappDisplay ?? '',
    email: c?.email ?? '',
    address: toEditable(c?.address),
    serviceArea: toEditable(c?.serviceArea),
    hours: toEditable(c?.hours),
    responseTime: toEditable(c?.responseTime),
    mapLat: c?.mapLat ?? null,
    mapLng: c?.mapLng ?? null,
  }
}

/** Contact: phone, WhatsApp (digits + display), email, address / service area / hours / response time per locale, map pin. */
export function ContactSection({ settings, onSaved, onDirtyChange }: SectionProps) {
  const t = useTranslations('adminLibrary.settings')
  const tc = useTranslations('adminLibrary.settings.contact')
  const f = useSettingForm<ContactForm>({
    id: 'settings-contact',
    settings,
    fromSettings: contactFrom,
    successMessage: tc('saved'),
    onSaved,
    onDirtyChange,
    validate: (form) => {
      const out: Record<string, string> = {}
      if (form.mapLat === null) out.mapLat = t('required')
      if (form.mapLng === null) out.mapLng = t('required')
      return out
    },
    save: (form) =>
      settingsApi.contact({
        phone: form.phone.trim(),
        whatsapp: form.whatsapp,
        whatsappDisplay: form.whatsappDisplay.trim(),
        email: form.email.trim(),
        address: compactRequired(form.address, ''),
        serviceArea: compactRequired(form.serviceArea, ''),
        hours: compactRequired(form.hours, ''),
        responseTime: compactRequired(form.responseTime, ''),
        mapLat: form.mapLat ?? 0,
        mapLng: form.mapLng ?? 0,
      }),
  })
  const { form, update, errors, locale } = f
  const text = (key: 'address' | 'serviceArea' | 'hours' | 'responseTime', max: number, rows?: number) => (
    <TranslatableText
      label={tc(`fields.${key}`)}
      locale={locale}
      value={form[key]}
      onChange={(v) => update({ [key]: { ...form[key], ...v } } as Partial<ContactForm>)}
      required
      maxLength={max}
      multiline={rows}
      error={localeErrors(errors, key)}
    />
  )
  const mapHref =
    form.mapLat !== null && form.mapLng !== null ? `https://www.google.com/maps?q=${form.mapLat},${form.mapLng}` : null
  return (
    <SettingsCard
      id="settings-contact"
      title={tc('title')}
      description={tc('description')}
      icon="contact_phone"
      dirty={f.dirty}
      saving={f.saving}
      onSubmit={f.submit}
      onDiscard={f.discard}
      locale={{
        value: locale,
        onChange: f.setLocale,
        filled: filledLocales(form.address, form.serviceArea, form.hours, form.responseTime),
        errors: f.errorLocales,
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label={tc('fields.phone')}
          type="tel"
          icon="call"
          value={form.phone}
          maxLength={40}
          error={errors.phone}
          placeholder={tc('placeholders.phone')}
          onChange={(e) => update({ phone: e.target.value })}
        />
        <TextField
          label={tc('fields.email')}
          type="email"
          icon="mail"
          required
          value={form.email}
          error={errors.email}
          onChange={(e) => update({ email: e.target.value })}
        />
        <TextField
          label={tc('fields.whatsapp')}
          hint={tc('fields.whatsappHint')}
          inputMode="numeric"
          icon="chat"
          required
          value={form.whatsapp}
          maxLength={20}
          error={errors.whatsapp}
          placeholder={tc('placeholders.whatsapp')}
          onChange={(e) => update({ whatsapp: phoneDigits(e.target.value) })}
          suffix={
            form.whatsapp.length >= 6 ? (
              <a
                href={`https://wa.me/${form.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={tc('testWhatsapp')}
                title={tc('testWhatsapp')}
              >
                <Icon name="open_in_new" className="text-[16px]" />
              </a>
            ) : undefined
          }
        />
        <TextField
          label={tc('fields.whatsappDisplay')}
          hint={tc('fields.whatsappDisplayHint')}
          value={form.whatsappDisplay}
          maxLength={40}
          error={errors.whatsappDisplay}
          placeholder={tc('placeholders.whatsappDisplay')}
          onChange={(e) => update({ whatsappDisplay: e.target.value })}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {text('address', 300, 2)}
        {text('serviceArea', 300, 2)}
        {text('hours', 200)}
        {text('responseTime', 200)}
      </div>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-body-md text-[13px] font-semibold text-on-surface">{tc('fields.map')}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label={tc('fields.mapLat')}
            decimal
            min={-90}
            max={90}
            required
            value={form.mapLat}
            error={errors.mapLat}
            onChange={(v) => update({ mapLat: v })}
          />
          <NumberField
            label={tc('fields.mapLng')}
            decimal
            min={-180}
            max={180}
            required
            value={form.mapLng}
            error={errors.mapLng}
            onChange={(v) => update({ mapLng: v })}
          />
        </div>
        {mapHref && (
          <a
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 self-start font-body-md text-body-md text-primary underline-offset-4 hover:text-secondary hover:underline"
          >
            <Icon name="map" className="text-[18px]" />
            {tc('checkMap')}
          </a>
        )}
      </fieldset>
    </SettingsCard>
  )
}

// ------------------------------------------------------------------------------------------------ social

const SOCIAL_KEYS = ['instagram', 'instagramHandle', 'facebook', 'tripadvisor', 'google', 'youtube'] as const
type SocialKey = (typeof SOCIAL_KEYS)[number]
type SocialForm = Record<SocialKey, string>

const socialFrom = (s: AdminSettings): SocialForm =>
  Object.fromEntries(SOCIAL_KEYS.map((k) => [k, s.social?.[k] ?? ''])) as SocialForm

const SOCIAL_ICONS: Record<SocialKey, string> = {
  instagram: 'photo_camera',
  instagramHandle: 'alternate_email',
  facebook: 'thumb_up',
  tripadvisor: 'travel_explore',
  google: 'star',
  youtube: 'smart_display',
}

/** Social links (empty = hidden on the site). */
export function SocialSection({ settings, onSaved, onDirtyChange }: SectionProps) {
  const ts = useTranslations('adminLibrary.settings.social')
  const f = useSettingForm<SocialForm>({
    id: 'settings-social',
    settings,
    fromSettings: socialFrom,
    successMessage: ts('saved'),
    onSaved,
    onDirtyChange,
    save: (form) =>
      settingsApi.social(
        Object.fromEntries(
          SOCIAL_KEYS.flatMap((k) => (form[k].trim() ? [[k, form[k].trim()]] : [])),
        ) as Partial<SocialForm>,
      ),
  })
  return (
    <SettingsCard
      id="settings-social"
      title={ts('title')}
      description={ts('description')}
      icon="share"
      dirty={f.dirty}
      saving={f.saving}
      onSubmit={f.submit}
      onDiscard={f.discard}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {SOCIAL_KEYS.map((key) => (
          <TextField
            key={key}
            label={ts(`fields.${key}`)}
            hint={key === 'instagramHandle' ? ts('handleHint') : undefined}
            type={key === 'instagramHandle' ? 'text' : 'url'}
            inputMode={key === 'instagramHandle' ? 'text' : 'url'}
            icon={SOCIAL_ICONS[key]}
            value={f.form[key]}
            maxLength={key === 'instagramHandle' ? 60 : 300}
            error={f.errors[key]}
            placeholder={key === 'instagramHandle' ? ts('placeholders.handle') : ts('placeholders.url')}
            onChange={(e) => f.update({ [key]: e.target.value } as Partial<SocialForm>)}
          />
        ))}
      </div>
    </SettingsCard>
  )
}
