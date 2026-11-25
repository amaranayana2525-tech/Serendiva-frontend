'use client'

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { Card } from '@/components/admin/kit/Card'
import { LocaleTabs } from '@/components/admin/kit/LocaleTabs'
import { Icon } from '@/components/ui/Icon'
import { useAdminMutation } from '@/lib/admin/hooks'
import { ADMIN_LOCALES, localeFromPath, type AdminLocale } from '@/lib/admin/translatable'
import { useUnsavedChanges } from '@/lib/admin/unsaved'
import type { AdminSettings } from '@/lib/api/types'

/** Props every settings section receives from the screen. */
export interface SectionProps {
  settings: AdminSettings
  /** The PUT response (all settings) — the screen refreshes its copy. */
  onSaved: (settings: AdminSettings) => void
  onDirtyChange: (dirty: boolean) => void
}

export interface SettingFormOptions<F> {
  /** Unique id (DOM id prefix, used to focus the first invalid control). */
  id: string
  /** Form values from the stored settings (also used after a save). */
  fromSettings: (settings: AdminSettings) => F
  settings: AdminSettings
  /** Sends the PUT; resolves with all settings. */
  save: (form: F) => Promise<AdminSettings>
  /** Client-side checks the API can't express nicely (e.g. empty number fields). `{ path: message }`. */
  validate?: (form: F) => Record<string, string>
  successMessage: string
  onSaved: (settings: AdminSettings) => void
  onDirtyChange: (dirty: boolean) => void
}

/**
 * State for one settings form: values, dirty tracking (+ unsaved-changes guard), save with toast, API validation
 * errors by path (switching to the locale of the first error and focusing it), discard.
 */
export function useSettingForm<F>({
  id,
  fromSettings,
  settings,
  save,
  validate,
  successMessage,
  onSaved,
  onDirtyChange,
}: SettingFormOptions<F>) {
  const [form, setForm] = useState<F>(() => fromSettings(settings))
  const [baseline, setBaseline] = useState(() => JSON.stringify(fromSettings(settings)))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [locale, setLocale] = useState<AdminLocale>('en')
  const [focusTick, setFocusTick] = useState(0)
  const dirty = JSON.stringify(form) !== baseline

  const showErrors = (found: Record<string, string>) => {
    setErrors(found)
    const first = Object.keys(found)[0]
    const loc = first ? localeFromPath(first) : undefined
    if (loc) setLocale(loc)
    if (first) setFocusTick((n) => n + 1)
  }

  const mutation = useAdminMutation((values: F) => save(values), {
    successToast: successMessage,
    onError: (err) => showErrors(err.fieldErrors),
    onSuccess: (result) => {
      const next = fromSettings(result)
      setForm(next)
      setBaseline(JSON.stringify(next))
      setErrors({})
      onSaved(result)
    },
  })
  useUnsavedChanges(dirty && !mutation.pending)

  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

  useEffect(() => {
    if (!focusTick) return
    const el = document.querySelector<HTMLElement>(`#${id} [aria-invalid="true"]`)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    el?.focus({ preventScroll: true })
  }, [focusTick, id])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validate?.(form) ?? {}
    if (Object.keys(found).length) {
      showErrors(found)
      return
    }
    void mutation.mutate(form)
  }

  /** Removes errors at `path` and below. */
  const clearError = (path: string) => {
    if (!Object.keys(errors).some((k) => k === path || k.startsWith(`${path}.`))) return
    setErrors((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => !(k === path || k.startsWith(`${path}.`)))),
    )
  }

  const update = (patch: Partial<F>) => {
    setForm((f) => ({ ...f, ...patch }))
    for (const key of Object.keys(patch)) clearError(key)
  }

  const resetErrors = () => setErrors({})

  const discard = () => {
    setForm(JSON.parse(baseline) as F)
    setErrors({})
  }

  const errorLocales = Object.fromEntries(
    ADMIN_LOCALES.map((l) => [l, Object.keys(errors).some((p) => localeFromPath(p) === l)]),
  ) as Record<AdminLocale, boolean>

  return {
    form,
    setForm,
    update,
    errors,
    clearError,
    resetErrors,
    dirty,
    saving: mutation.pending,
    submit,
    discard,
    locale,
    setLocale,
    errorLocales,
  }
}

export interface SettingsCardProps {
  id: string
  title: ReactNode
  description?: ReactNode
  icon: string
  dirty: boolean
  saving: boolean
  onSubmit: (e: FormEvent) => void
  onDiscard: () => void
  /** Locale switch for sections with translatable fields. */
  locale?: {
    value: AdminLocale
    onChange: (l: AdminLocale) => void
    filled: Partial<Record<AdminLocale, boolean>>
    errors: Partial<Record<AdminLocale, boolean>>
  }
  saveLabel?: string
  children: ReactNode
}

/** White card with the section's form, an optional locale switch and its own Save / Discard footer. */
export function SettingsCard({
  id,
  title,
  description,
  icon,
  dirty,
  saving,
  onSubmit,
  onDiscard,
  locale,
  saveLabel,
  children,
}: SettingsCardProps) {
  const t = useTranslations('adminLibrary.settings')
  return (
    <Card
      id={id}
      title={title}
      description={description}
      icon={icon}
      className="min-w-0"
      actions={
        locale ? (
          <LocaleTabs
            value={locale.value}
            onChange={locale.onChange}
            filled={locale.filled}
            errors={locale.errors}
            size="sm"
          />
        ) : undefined
      }
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        {children}
        <div className="sticky bottom-0 z-10 -mx-4 -mb-4 flex flex-wrap items-center gap-2 rounded-b-xl border-t border-surface-container bg-surface-container-lowest/95 px-4 py-3 backdrop-blur md:-mx-5 md:-mb-5 md:px-5">
          <span className="mr-auto flex items-center gap-1.5 font-caption text-caption" aria-live="polite">
            {dirty ? (
              <>
                <Icon name="fiber_manual_record" filled className="text-[10px] text-secondary" />
                <span className="text-secondary">{t('unsaved')}</span>
              </>
            ) : (
              <>
                <Icon name="check_circle" className="text-[16px] text-tertiary-container" />
                <span className="text-on-surface-variant">{t('upToDate')}</span>
              </>
            )}
          </span>
          {dirty && (
            <Button variant="ghost" onClick={onDiscard} disabled={saving}>
              {t('discard')}
            </Button>
          )}
          <Button type="submit" variant="primary" icon="check" loading={saving} disabled={!dirty}>
            {saveLabel ?? t('save')}
          </Button>
        </div>
      </form>
    </Card>
  )
}

/** `{ en: true, … }` for the LocaleTabs dots from several `Record<locale, string>` values. */
export function filledLocales(...values: Record<AdminLocale, string>[]): Record<AdminLocale, boolean> {
  return Object.fromEntries(ADMIN_LOCALES.map((l) => [l, values.some((v) => v[l].trim() !== '')])) as Record<
    AdminLocale,
    boolean
  >
}
