'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { controlClass } from '@/components/admin/kit/form/FieldShell'
import { NumberField } from '@/components/admin/kit/form/NumberField'
import { Switch } from '@/components/admin/kit/form/Switch'
import { TextField } from '@/components/admin/kit/form/TextField'
import { localeErrors, TranslatableText } from '@/components/admin/kit/LocaleTabs'
import { Repeater } from '@/components/admin/kit/Repeater'
import { Icon } from '@/components/ui/Icon'
import { toast } from '@/lib/admin/toast'
import { cn } from '@/lib/utils'
import { EditorSection, TranslatedRepeater } from './fields'
import { buildRemainingDays, LIMITS, newDay, newDetail, newStop, type DayForm, type LabelValueForm, type StopForm } from './model'
import { asL, type EditorTabProps } from './types'

/** "7.1808, 79.8841" / "7.1808 79.8841" / "(7.18,79.88)" → { lat, lng } (null when it doesn't look like a pair). */
export function parseLatLng(text: string): { lat: number; lng: number } | null {
  const match = /(-?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)/.exec(text.trim())
  if (!match) return null
  const lat = Number.parseFloat(match[1])
  const lng = Number.parseFloat(match[2])
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { lat, lng }
}

/**
 * Itinerary tab: days with drag-to-reorder (day numbers follow the order), add / duplicate / remove, collapsible day
 * editors with details and map stops. `expandToken` re-mounts the list expanded (used to reveal validation errors).
 */
export function ItineraryTab({ form, locale, errors, update, expandToken }: EditorTabProps & { expandToken: number }) {
  const t = useTranslations('adminTours.editor.itinerary')
  const tf = useTranslations('adminTours.editor.fields')
  const days = form.days
  const mismatch = form.durationDays !== null && days.length > 0 && days.length !== form.durationDays

  const updateDay = (index: number, patch: Partial<DayForm>) => {
    const clear = Object.keys(patch).map((k) => `days.${index}.${k}`)
    update('days', (prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)), clear)
  }

  return (
    <EditorSection
      title={t('title')}
      description={t('description')}
      aside={
        <span className="rounded-full bg-surface-container px-2.5 py-1 font-body-md text-[13px] font-semibold tabular-nums text-on-surface-variant">
          {t('dayCount', { count: days.length })}
        </span>
      }
    >
      {mismatch && (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-xl border border-secondary/30 bg-secondary-fixed/40 px-4 py-3 sm:flex-row sm:items-center"
        >
          <Icon name="warning" className="hidden text-[22px] text-secondary sm:block" />
          <p className="min-w-0 flex-1 font-body-md text-body-md text-on-surface">
            {t('mismatch', { days: days.length, duration: form.durationDays ?? 0 })}
          </p>
          <Button
            size="sm"
            icon="sync"
            onClick={() => {
              update('durationDays', days.length)
              update('durationNights', Math.max(0, days.length - 1))
            }}
          >
            {t('syncDuration', { count: days.length })}
          </Button>
        </div>
      )}
      {form.durationDays !== null && form.durationDays >= LIMITS.duration.min && form.durationDays <= LIMITS.days && days.length < form.durationDays && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-container-low px-4 py-2.5">
          <span className="font-caption text-caption text-on-surface-variant">
            {t('dayCount', { count: days.length })}
          </span>
          <Button
            size="sm"
            variant="secondary"
            icon="playlist_add"
            onClick={() => update('days', buildRemainingDays(days, form.durationDays!), ['days'])}
          >
            {days.length === 0
              ? t('generateDays', { count: form.durationDays })
              : t('addRemainingDays', { count: form.durationDays - days.length })}
          </Button>
        </div>
      )}
      {errors.days && (
        <p data-field-error="" className="flex items-start gap-1 font-caption text-caption text-error">
          <Icon name="error" className="mt-px text-[14px]" />
          {errors.days}
        </p>
      )}

      <Repeater<DayForm>
        key={`days-${expandToken}`}
        items={days}
        onChange={(next) => update('days', next, ['days'])}
        createItem={newDay}
        label={t('days')}
        addLabel={t('addDay')}
        max={LIMITS.days}
        defaultCollapsed={expandToken === 0 && days.length > 3}
        emptyText={t('empty')}
        itemLabel={(day) => day.title[locale].trim() || day.title.en.trim() || t('untitled')}
        headerExtra={(day) => (
          <span className="hidden items-center gap-1 md:inline-flex">
            {day.isHighlight && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(201,162,75,0.22)] px-2 py-0.5 font-body-md text-[12px] font-medium text-on-surface">
                <Icon name="star" filled className="text-[13px]" />
                {t('highlightBadge')}
              </span>
            )}
            {day.stops.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 font-body-md text-[12px] text-on-surface-variant">
                <Icon name="location_on" className="text-[13px]" />
                {day.stops.length}
              </span>
            )}
          </span>
        )}
        renderItem={(day, { index }) => (
          <DayEditor
            day={day}
            index={index}
            locale={locale}
            errors={errors}
            onChange={(patch) => updateDay(index, patch)}
            labels={{ tf, t }}
          />
        )}
      />
    </EditorSection>
  )
}

type Translator = ReturnType<typeof useTranslations<'adminTours.editor.itinerary'>>
type FieldTranslator = ReturnType<typeof useTranslations<'adminTours.editor.fields'>>

function DayEditor({
  day,
  index,
  locale,
  errors,
  onChange,
  labels: { t, tf },
}: {
  day: DayForm
  index: number
  locale: EditorTabProps['locale']
  errors: Record<string, string>
  onChange: (patch: Partial<DayForm>) => void
  labels: { t: Translator; tf: FieldTranslator }
}) {
  const base = `days.${index}`
  return (
    <div className="flex flex-col gap-4">
      <TranslatableText
        label={tf('dayTitle')}
        locale={locale}
        required
        value={day.title}
        onChange={(v) => onChange({ title: asL(v) })}
        maxLength={LIMITS.day.title}
        counter
        error={localeErrors(errors, `${base}.title`)}
      />
      <TranslatableText
        label={tf('dayDescription')}
        locale={locale}
        multiline={5}
        value={day.description}
        onChange={(v) => onChange({ description: asL(v) })}
        maxLength={LIMITS.day.description}
        hint={t('descriptionHint')}
        error={localeErrors(errors, `${base}.description`)}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <TranslatableText
          label={tf('drivingTime')}
          locale={locale}
          value={day.drivingTime}
          onChange={(v) => onChange({ drivingTime: asL(v) })}
          maxLength={LIMITS.day.drivingTime}
          placeholder={t('drivingTimePlaceholder')}
          error={localeErrors(errors, `${base}.drivingTime`)}
        />
        <TranslatableText
          label={tf('meals')}
          locale={locale}
          value={day.meals}
          onChange={(v) => onChange({ meals: asL(v) })}
          maxLength={LIMITS.day.meals}
          placeholder={t('mealsPlaceholder')}
          error={localeErrors(errors, `${base}.meals`)}
        />
        <TranslatableText
          label={tf('overnightArea')}
          locale={locale}
          value={day.overnightArea}
          onChange={(v) => onChange({ overnightArea: asL(v) })}
          maxLength={LIMITS.day.overnightArea}
          placeholder={t('overnightPlaceholder')}
          error={localeErrors(errors, `${base}.overnightArea`)}
        />
      </div>
      <Switch
        checked={day.isHighlight}
        onCheckedChange={(isHighlight) => onChange({ isHighlight })}
        label={tf('isHighlight')}
        description={t('highlightHint')}
      />

      <div className="rounded-xl bg-surface-container-low p-3 md:p-4">
        <TranslatedRepeater<LabelValueForm>
          locale={locale}
          value={day.details}
          onChange={(details) => onChange({ details })}
          label={tf('details')}
          addLabel={t('addDetail')}
          max={LIMITS.details.max}
          createItem={newDetail}
          collapsible={false}
          emptyText={t('detailsEmpty')}
          error={errors[`${base}.details.${locale}`] ?? errors[`${base}.details`]}
          itemLabel={(item, i, en) => item.label || en?.label || t('detailN', { n: i + 1 })}
          renderItem={(item, { update: set, index: di }, en) => (
            <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <TextField
                label={tf('detailLabel')}
                value={item.label}
                maxLength={LIMITS.details.label}
                lang={locale}
                placeholder={locale !== 'en' ? en?.label : t('detailLabelPlaceholder')}
                onChange={(e) => set({ label: e.target.value })}
                error={errors[`${base}.details.${locale}.${di}.label`]}
              />
              <TextField
                label={tf('detailValue')}
                value={item.value}
                maxLength={LIMITS.details.value}
                lang={locale}
                placeholder={locale !== 'en' ? en?.value : t('detailValuePlaceholder')}
                onChange={(e) => set({ value: e.target.value })}
                error={errors[`${base}.details.${locale}.${di}.value`]}
              />
            </div>
          )}
        />
      </div>

      <div className="rounded-xl bg-surface-container-low p-3 md:p-4">
        <Repeater<StopForm>
          items={day.stops}
          onChange={(stops) => onChange({ stops })}
          createItem={newStop}
          label={tf('stops')}
          addLabel={t('addStop')}
          max={LIMITS.stops.max}
          collapsible={false}
          duplicateItem={null}
          emptyText={t('stopsEmpty')}
          error={errors[`${base}.stops`]}
          itemLabel={(stop, i) => stop.name || t('stopN', { n: i + 1 })}
          renderItem={(stop, { update: set, index: si }) => (
            <StopEditor
              stop={stop}
              onChange={set}
              errors={{
                name: errors[`${base}.stops.${si}.name`],
                lat: errors[`${base}.stops.${si}.lat`],
                lng: errors[`${base}.stops.${si}.lng`],
              }}
              labels={{ t, tf }}
            />
          )}
        />
        <p className="mt-2 font-caption text-caption text-on-surface-variant">{t('stopsHint')}</p>
      </div>
    </div>
  )
}

function StopEditor({
  stop,
  onChange,
  errors,
  labels: { t, tf },
}: {
  stop: StopForm
  onChange: (patch: Partial<StopForm>) => void
  errors: { name?: string; lat?: string; lng?: string }
  labels: { t: Translator; tf: FieldTranslator }
}) {
  const [paste, setPaste] = useState('')
  const [pasteError, setPasteError] = useState(false)
  const apply = (text: string) => {
    const parsed = parseLatLng(text)
    if (parsed) {
      onChange(parsed)
      setPaste('')
      setPasteError(false)
      toast.success(t('coordsApplied', { lat: parsed.lat, lng: parsed.lng }))
      return true
    }
    setPasteError(Boolean(text.trim()))
    return false
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
      <TextField
        label={tf('stopName')}
        value={stop.name}
        maxLength={LIMITS.stops.name}
        required
        placeholder={t('stopNamePlaceholder')}
        onChange={(e) => onChange({ name: e.target.value })}
        error={errors.name}
      />
      <NumberField
        label={tf('lat')}
        value={stop.lat}
        onChange={(lat) => onChange({ lat })}
        decimal
        min={-90}
        max={90}
        required
        placeholder="7.2906"
        error={errors.lat}
      />
      <NumberField
        label={tf('lng')}
        value={stop.lng}
        onChange={(lng) => onChange({ lng })}
        decimal
        min={-180}
        max={180}
        required
        placeholder="80.6337"
        error={errors.lng}
      />
      <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2 xl:col-span-1">
        <label className="font-body-md text-[13px] font-semibold text-on-surface">
          <span className="inline-flex items-center gap-1">
            <Icon name="content_paste" className="text-[15px] text-on-surface-variant" />
            {tf('pasteCoords')}
          </span>
          <input
            value={paste}
            inputMode="decimal"
            placeholder={t('pastePlaceholder')}
            aria-invalid={pasteError || undefined}
            onChange={(e) => {
              setPaste(e.target.value)
              setPasteError(false)
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData('text')
              if (apply(text)) e.preventDefault()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                apply(paste)
              }
            }}
            onBlur={() => paste.trim() && apply(paste)}
            className={cn(controlClass, 'mt-1.5 font-normal', pasteError && 'border-error')}
          />
        </label>
        {pasteError && <p className="font-caption text-caption text-error">{t('pasteInvalid')}</p>}
      </div>
    </div>
  )
}
