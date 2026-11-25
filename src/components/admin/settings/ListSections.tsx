'use client'

import { useTranslations } from 'next-intl'
import { SelectField } from '@/components/admin/kit/form/SelectField'
import { TextField } from '@/components/admin/kit/form/TextField'
import { IconPicker } from '@/components/admin/kit/IconPicker'
import { TranslatableText } from '@/components/admin/kit/LocaleTabs'
import { GalleryField, type GalleryFieldItem } from '@/components/admin/kit/media/GalleryField'
import { ImageField } from '@/components/admin/kit/media/ImageField'
import { Repeater } from '@/components/admin/kit/Repeater'
import { Icon } from '@/components/ui/Icon'
import { compactOptional, compactRequired, localeErrors, toEditable, type AdminLocale } from '@/lib/admin/translatable'
import type { AdminMediaRef, AdminSettings } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { filledLocales, SettingsCard, useSettingForm, type SectionProps } from './SettingsForm'
import { refOf, settingsApi } from './settingsApi'

type Rec = Record<AdminLocale, string>
const blank = (): Rec => ({ en: '', zh: '', de: '' })

/** Errors of item `index` with the `index.` prefix removed (`{ '2.label.en': … }` → `{ 'label.en': … }`). */
function itemErrors(errors: Record<string, string>, index: number): Record<string, string> {
  const prefix = `${index}.`
  return Object.fromEntries(
    Object.entries(errors).flatMap(([k, v]) => (k.startsWith(prefix) ? [[k.slice(prefix.length), v]] : [])),
  )
}
/** "Fix the highlighted fields" marker for collapsed repeater items. */
function ItemErrorDot({ errors, index }: { errors: Record<string, string>; index: number }) {
  const t = useTranslations('adminLibrary.settings')
  if (!Object.keys(itemErrors(errors, index)).length) return null
  return <Icon name="error" className="shrink-0 text-[18px] text-error" label={t('itemHasErrors')} />
}

// ------------------------------------------------------------------------------------------------ counters

interface CounterItem {
  value: string
  label: Rec
}
interface CountersForm {
  items: CounterItem[]
}

const countersFrom = (s: AdminSettings): CountersForm => ({
  items: (s.counters ?? []).map((c) => ({ value: c.value, label: toEditable(c.label) })),
})

/** Animated trust counters (≤ 8): value + label per locale. */
export function CountersSection({ settings, onSaved, onDirtyChange }: SectionProps) {
  const tc = useTranslations('adminLibrary.settings.counters')
  const f = useSettingForm<CountersForm>({
    id: 'settings-counters',
    settings,
    fromSettings: countersFrom,
    successMessage: tc('saved'),
    onSaved,
    onDirtyChange,
    save: (form) =>
      settingsApi.counters(form.items.map((c) => ({ value: c.value.trim(), label: compactRequired(c.label, '') }))),
  })
  const { form, errors, locale } = f
  return (
    <SettingsCard
      id="settings-counters"
      title={tc('title')}
      description={tc('description')}
      icon="leaderboard"
      dirty={f.dirty}
      saving={f.saving}
      onSubmit={f.submit}
      onDiscard={f.discard}
      locale={{
        value: locale,
        onChange: f.setLocale,
        filled: filledLocales(...form.items.map((c) => c.label)),
        errors: f.errorLocales,
      }}
    >
      <Repeater<CounterItem>
        label={tc('listLabel')}
        items={form.items}
        onChange={(items) => {
          if (items.length !== form.items.length) f.resetErrors()
          f.setForm({ items })
        }}
        createItem={() => ({ value: '', label: blank() })}
        itemLabel={(c, i) => [c.value, c.label.en].filter(Boolean).join(' · ') || tc('itemN', { n: i + 1 })}
        headerExtra={(_, i) => <ItemErrorDot errors={errors} index={i} />}
        addLabel={tc('add')}
        max={8}
        renderItem={(item, h) => {
          const e = itemErrors(errors, h.index)
          return (
            <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
              <TextField
                label={tc('value')}
                hint={tc('valueHint')}
                required
                value={item.value}
                maxLength={20}
                error={e.value}
                onChange={(ev) => h.update({ value: ev.target.value })}
              />
              <TranslatableText
                label={tc('labelField')}
                locale={locale}
                value={item.label}
                onChange={(v) => h.update({ label: { ...item.label, ...v } })}
                required
                maxLength={80}
                counter
                error={localeErrors(e, 'label')}
              />
            </div>
          )
        }}
      />
    </SettingsCard>
  )
}

// ------------------------------------------------------------------------------------------------ trust badges

type Tone = 'green' | 'cinnamon' | 'gold'
interface BadgeItem {
  icon: string
  title: Rec
  subtitle: Rec
  tone: Tone
}
interface BadgesForm {
  items: BadgeItem[]
}

const badgesFrom = (s: AdminSettings): BadgesForm => ({
  items: (s.trustBadges ?? []).map((b) => ({
    icon: b.icon,
    title: toEditable(b.title),
    subtitle: toEditable(b.subtitle),
    tone: b.tone,
  })),
})

const TONE_CLASS: Record<Tone, string> = {
  green: 'bg-tertiary-fixed/70 text-on-tertiary-fixed-variant',
  cinnamon: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  gold: 'bg-[rgba(201,162,75,0.22)] text-on-surface',
}

/** Trust badges (≤ 4): icon, title, subtitle per locale, colour tone. */
export function TrustBadgesSection({ settings, onSaved, onDirtyChange }: SectionProps) {
  const tb = useTranslations('adminLibrary.settings.trustBadges')
  const f = useSettingForm<BadgesForm>({
    id: 'settings-trustBadges',
    settings,
    fromSettings: badgesFrom,
    successMessage: tb('saved'),
    onSaved,
    onDirtyChange,
    validate: (form) =>
      Object.fromEntries(form.items.flatMap((b, i) => (b.icon ? [] : [[`${i}.icon`, tb('iconRequired')]]))),
    save: (form) =>
      settingsApi.trustBadges(
        form.items.map((b) => ({
          icon: b.icon,
          title: compactRequired(b.title, ''),
          subtitle: compactRequired(b.subtitle, ''),
          tone: b.tone,
        })),
      ),
  })
  const { form, errors, locale } = f
  return (
    <SettingsCard
      id="settings-trustBadges"
      title={tb('title')}
      description={tb('description')}
      icon="verified"
      dirty={f.dirty}
      saving={f.saving}
      onSubmit={f.submit}
      onDiscard={f.discard}
      locale={{
        value: locale,
        onChange: f.setLocale,
        filled: filledLocales(...form.items.flatMap((b) => [b.title, b.subtitle])),
        errors: f.errorLocales,
      }}
    >
      <Repeater<BadgeItem>
        label={tb('listLabel')}
        items={form.items}
        onChange={(items) => {
          if (items.length !== form.items.length) f.resetErrors()
          f.setForm({ items })
        }}
        createItem={() => ({ icon: 'verified_user', title: blank(), subtitle: blank(), tone: 'green' })}
        itemLabel={(b, i) => b.title.en || tb('itemN', { n: i + 1 })}
        headerExtra={(b, i) => (
          <>
            <ItemErrorDot errors={errors} index={i} />
            <span
              className={cn(
                'hidden h-7 w-7 shrink-0 items-center justify-center rounded-full sm:flex',
                TONE_CLASS[b.tone],
              )}
            >
              {b.icon && <Icon name={b.icon} className="text-[16px]" />}
            </span>
          </>
        )}
        addLabel={tb('add')}
        max={4}
        renderItem={(item, h) => {
          const e = itemErrors(errors, h.index)
          return (
            <div className="grid gap-3 md:grid-cols-2">
              <IconPicker
                label={tb('icon')}
                required
                clearable={false}
                value={item.icon}
                error={e.icon}
                onChange={(v) => h.update({ icon: v ?? '' })}
              />
              <SelectField<Tone>
                label={tb('tone')}
                value={item.tone}
                onValueChange={(v) => v && h.update({ tone: v })}
                options={(['green', 'cinnamon', 'gold'] as const).map((tone) => ({
                  value: tone,
                  label: tb(`tones.${tone}`),
                }))}
              />
              <TranslatableText
                label={tb('titleField')}
                locale={locale}
                value={item.title}
                onChange={(v) => h.update({ title: { ...item.title, ...v } })}
                required
                maxLength={80}
                error={localeErrors(e, 'title')}
              />
              <TranslatableText
                label={tb('subtitle')}
                locale={locale}
                value={item.subtitle}
                onChange={(v) => h.update({ subtitle: { ...item.subtitle, ...v } })}
                required
                maxLength={80}
                error={localeErrors(e, 'subtitle')}
              />
            </div>
          )
        }}
      />
    </SettingsCard>
  )
}

// ------------------------------------------------------------------------------------------------ hero slides

interface SlideItem {
  image: AdminMediaRef | null
  alt: Rec
}
interface SlidesForm {
  items: SlideItem[]
}

const slidesFrom = (s: AdminSettings): SlidesForm => ({
  items: (s.heroSlides ?? []).map((sl) => ({ image: refOf(s, sl.imageId), alt: toEditable(sl.alt ?? null) })),
})

/** Home hero slides (≤ 6, reorderable): image + alt per locale. */
export function HeroSlidesSection({ settings, onSaved, onDirtyChange }: SectionProps) {
  const th = useTranslations('adminLibrary.settings.heroSlides')
  const f = useSettingForm<SlidesForm>({
    id: 'settings-heroSlides',
    settings,
    fromSettings: slidesFrom,
    successMessage: th('saved'),
    onSaved,
    onDirtyChange,
    validate: (form) =>
      Object.fromEntries(form.items.flatMap((sl, i) => (sl.image ? [] : [[`${i}.imageId`, th('imageRequired')]]))),
    save: (form) =>
      settingsApi.heroSlides(form.items.map((sl) => ({ imageId: sl.image?.id ?? '', alt: compactOptional(sl.alt) }))),
  })
  const { form, errors, locale } = f
  return (
    <SettingsCard
      id="settings-heroSlides"
      title={th('title')}
      description={th('description')}
      icon="slideshow"
      dirty={f.dirty}
      saving={f.saving}
      onSubmit={f.submit}
      onDiscard={f.discard}
      locale={{
        value: locale,
        onChange: f.setLocale,
        filled: filledLocales(...form.items.map((s) => s.alt)),
        errors: f.errorLocales,
      }}
    >
      <Repeater<SlideItem>
        label={th('listLabel')}
        items={form.items}
        onChange={(items) => {
          if (items.length !== form.items.length) f.resetErrors()
          f.setForm({ items })
        }}
        createItem={() => ({ image: null, alt: blank() })}
        itemLabel={(sl, i) => sl.alt.en || sl.image?.alt || th('itemN', { n: i + 1 })}
        headerExtra={(sl, i) => (
          <>
            <ItemErrorDot errors={errors} index={i} />
            {sl.image && (
              // eslint-disable-next-line @next/next/no-img-element -- tiny preview of an API thumbnail
              <img
                src={sl.image.thumbUrl ?? sl.image.url}
                alt=""
                className="hidden h-8 w-12 shrink-0 rounded object-cover sm:block"
              />
            )}
          </>
        )}
        addLabel={th('add')}
        max={6}
        renderItem={(item, h) => {
          const e = itemErrors(errors, h.index)
          return (
            <div className="grid gap-3 lg:grid-cols-2">
              <ImageField
                label={th('image')}
                required
                aspect="video"
                folder="settings"
                value={item.image}
                error={e.imageId}
                onChange={(v) => h.update({ image: v })}
              />
              <TranslatableText
                label={th('alt')}
                hint={th('altHint')}
                locale={locale}
                value={item.alt}
                onChange={(v) => h.update({ alt: { ...item.alt, ...v } })}
                multiline={2}
                maxLength={200}
                counter
                error={localeErrors(e, 'alt')}
              />
            </div>
          )
        }}
      />
    </SettingsCard>
  )
}

// ------------------------------------------------------------------------------------------------ corporate clients

interface ClientItem {
  name: string
  logo: AdminMediaRef | null
}
interface ClientsForm {
  items: ClientItem[]
}

const clientsFrom = (s: AdminSettings): ClientsForm => ({
  items: (s.corporateClients ?? []).map((c) => ({ name: c.name, logo: refOf(s, c.logoId) })),
})

/** Corporate clients strip (≤ 20): name + optional logo. */
export function CorporateClientsSection({ settings, onSaved, onDirtyChange }: SectionProps) {
  const tc = useTranslations('adminLibrary.settings.corporateClients')
  const f = useSettingForm<ClientsForm>({
    id: 'settings-corporateClients',
    settings,
    fromSettings: clientsFrom,
    successMessage: tc('saved'),
    onSaved,
    onDirtyChange,
    save: (form) =>
      settingsApi.corporateClients(form.items.map((c) => ({ name: c.name.trim(), logoId: c.logo?.id ?? null }))),
  })
  const { form, errors } = f
  return (
    <SettingsCard
      id="settings-corporateClients"
      title={tc('title')}
      description={tc('description')}
      icon="business_center"
      dirty={f.dirty}
      saving={f.saving}
      onSubmit={f.submit}
      onDiscard={f.discard}
    >
      <Repeater<ClientItem>
        label={tc('listLabel')}
        items={form.items}
        onChange={(items) => {
          if (items.length !== form.items.length) f.resetErrors()
          f.setForm({ items })
        }}
        createItem={() => ({ name: '', logo: null })}
        itemLabel={(c, i) => c.name || tc('itemN', { n: i + 1 })}
        headerExtra={(_, i) => <ItemErrorDot errors={errors} index={i} />}
        addLabel={tc('add')}
        max={20}
        defaultCollapsed
        renderItem={(item, h) => {
          const e = itemErrors(errors, h.index)
          return (
            <div className="grid gap-3 lg:grid-cols-2">
              <TextField
                label={tc('name')}
                required
                value={item.name}
                maxLength={80}
                error={e.name}
                onChange={(ev) => h.update({ name: ev.target.value })}
              />
              <ImageField
                label={tc('logo')}
                hint={tc('logoHint')}
                aspect="landscape"
                folder="settings"
                value={item.logo}
                error={e.logoId}
                onChange={(v) => h.update({ logo: v })}
              />
            </div>
          )
        }}
      />
    </SettingsCard>
  )
}

// ------------------------------------------------------------------------------------------------ instagram feed

interface FeedForm {
  items: GalleryFieldItem[]
}

const feedFrom = (s: AdminSettings): FeedForm => ({
  items: (s.instagramFeed ?? []).flatMap((id) => {
    const media = refOf(s, id)
    return media ? [{ mediaId: id, media, caption: null }] : []
  }),
})

/** Instagram strip (≤ 12 images, reorderable). */
export function InstagramFeedSection({ settings, onSaved, onDirtyChange }: SectionProps) {
  const ti = useTranslations('adminLibrary.settings.instagramFeed')
  const f = useSettingForm<FeedForm>({
    id: 'settings-instagramFeed',
    settings,
    fromSettings: feedFrom,
    successMessage: ti('saved'),
    onSaved,
    onDirtyChange,
    save: (form) => settingsApi.instagramFeed(form.items.map((i) => i.mediaId)),
  })
  const firstError = Object.values(f.errors)[0]
  return (
    <SettingsCard
      id="settings-instagramFeed"
      title={ti('title')}
      description={ti('description')}
      icon="photo_camera"
      dirty={f.dirty}
      saving={f.saving}
      onSubmit={f.submit}
      onDiscard={f.discard}
    >
      <GalleryField
        label={ti('listLabel')}
        value={f.form.items}
        onChange={(items) => {
          f.resetErrors()
          f.setForm({ items })
        }}
        captions={false}
        max={12}
        folder="settings"
        hint={ti('hint')}
        error={firstError}
      />
    </SettingsCard>
  )
}
