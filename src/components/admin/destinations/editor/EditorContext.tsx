'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { Icon } from '@/components/ui/Icon'
import { hasContent, type AdminLocale } from '@/lib/admin/translatable'
import type { AdminMediaRef, AdminRegion } from '@/lib/api/types'
import type { DestinationForm, FieldErrors, LocalizedFields, LocalizedKey, LocalizedValues } from '../lib/destinationForm'

export interface EditorContextValue {
  form: DestinationForm
  setForm: (updater: (prev: DestinationForm) => DestinationForm) => void
  /** Locale edited by every translatable field (form-wide LocaleTabs). */
  locale: AdminLocale
  errors: FieldErrors
  /** Media previews for `imageId`s inside experiences / stays (from `mediaRefs` + picks made in this session). */
  refs: Record<string, AdminMediaRef>
  addRef: (ref: AdminMediaRef) => void
  /** Bumped after a failed save: list editors remount expanded so every error is visible. */
  epoch: number
  regions: AdminRegion[] | undefined
}

const Ctx = createContext<EditorContextValue | null>(null)

export function EditorProvider({ value, children }: { value: EditorContextValue; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Editor state + small setters used by every tab. */
export function useEditor() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useEditor must be used inside <EditorProvider>')
  const { form, setForm, locale, errors } = ctx
  const set = <K extends keyof DestinationForm>(key: K, value: DestinationForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))
  const localized: LocalizedFields = form
  /** Value of a translatable field in the active locale. */
  const get = <K extends LocalizedKey>(key: K): LocalizedValues[K] => localized[key][locale]
  /** Replaces a translatable field's value for the active locale. */
  const setLocal = <K extends LocalizedKey>(key: K, value: LocalizedValues[K]) =>
    setForm((prev) => {
      const field: LocalizedFields[K] = prev[key]
      return { ...prev, [key]: { ...field, [locale]: value } }
    })
  /** English value (placeholders while translating). */
  const en = <K extends LocalizedKey>(key: K): LocalizedValues[K] => localized[key].en
  const err = (path: string): string | undefined => errors[path]
  /** True when any error path starts with the prefix (collapsed repeater items). */
  const hasErrorUnder = (prefix: string) => Object.keys(errors).some((p) => p === prefix || p.startsWith(`${prefix}.`))
  return { ...ctx, set, get, setLocal, en, err, hasErrorUnder }
}

/**
 * Shown above a per-language list/block while translating: when this language has nothing yet but English does,
 * offers to copy the English entries (icons, images and order included) so only the text needs translating.
 */
export function TranslateFromEnglish<K extends LocalizedKey>({ field, what }: { field: K; what: string }) {
  const t = useTranslations('adminContent.editor.translate')
  const tl = useTranslations('admin.kit.locales')
  const { form, locale, setForm } = useEditor()
  if (locale === 'en') return null
  const localized: LocalizedFields = form
  const current = localized[field][locale]
  const english = localized[field].en
  if (hasContent(current) || !hasContent(english)) return null
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-primary-fixed bg-primary-fixed/20 px-3 py-2.5 sm:flex-row sm:items-center">
      <Icon name="translate" className="hidden text-[20px] text-primary sm:block" />
      <p className="flex-1 font-body-md text-body-md text-on-surface">
        {t('missing', { what, language: tl(`${locale}.name`) })}
      </p>
      <Button
        size="sm"
        icon="content_copy"
        onClick={() =>
          setForm((prev) => {
            const value: LocalizedFields[K] = prev[field]
            return { ...prev, [field]: { ...value, [locale]: structuredClone(value.en) } }
          })
        }
      >
        {t('copy')}
      </Button>
    </div>
  )
}
